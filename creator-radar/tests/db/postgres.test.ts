// Integration tests against a real Postgres with the production migrations.
// Skipped unless TEST_DATABASE_URL is set (see README → Testing).
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type postgres from "postgres";
import { PgRepository } from "@/lib/discovery/repository-pg";
import { runScan } from "@/lib/discovery/pipeline";
import { MockProvider } from "@/lib/discovery/providers/mock";
import { silentLogger } from "@/lib/log";
import type { DiscoveryInput } from "@/lib/discovery/repository";
import { classifyPost } from "@/lib/discovery/classify";
import { FakeProvider, post } from "../unit/helpers";
import { TEST_DB_URL, asRole, expectFailure, freshDatabase } from "./setup";

const OPERATOR = randomUUID();
const OUTSIDER = randomUUID();

function input(id: string, handle: string, slug: string, simulated = false, text = "I just launched my onlyfans today"): DiscoveryInput {
  return {
    isSimulated: simulated,
    scanRunId: null as unknown as string,
    discoveredAt: new Date(),
    searchTerm: "just launched my onlyfans",
    post: { id, url: `https://x.com/${handle}/status/${id}`, publishedAt: "2026-10-20T12:00:00Z", excerpt: text },
    creator: { handle, displayName: handle, xProfileUrl: `https://x.com/${handle}`, profileUrl: `https://onlyfans.com/${slug}`, slug },
    result: classifyPost({ text, publishedAt: "2026-10-20T12:00:00Z", evidence: "post" }),
    evidenceSource: "post",
  };
}

describe.skipIf(!TEST_DB_URL)("postgres", () => {
  let sql: postgres.Sql;
  let repo: PgRepository;

  beforeAll(async () => {
    sql = await freshDatabase("creator_radar_test");
    repo = new PgRepository(sql);
    await sql`insert into auth.users (id, email) values (${OPERATOR}, 'op@example.test'), (${OUTSIDER}, 'out@example.test')`;
    await sql`insert into public.operators (user_id) values (${OPERATOR})`;
  });
  afterAll(async () => {
    await sql?.end();
  });
  beforeEach(async () => {
    await sql`truncate public.creators, public.discovery_events, public.scan_runs, public.scan_checkpoints, public.scan_lock, public.suppressions, public.provider_health cascade`;
    await sql`update public.settings set provider_configuration = provider_configuration || '{"provider":"x"}'::jsonb, minimum_confidence = 0.4, auto_scan_enabled = true`;
  });

  describe("repository persistence", () => {
    it("reads default settings", async () => {
      const s = await repo.getSettings();
      expect(s.scan_interval_minutes).toBe(360);
      expect(s.search_terms).toContain("just launched my onlyfans");
      expect(s.minimum_confidence).toBe(0.4);
    });

    it("records discoveries, deduplicates posts and creators", async () => {
      expect(await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true })).toBe("new_creator");
      expect(await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true })).toBe("duplicate");
      expect(await repo.recordDiscovery(input("2", "FIXTURE_A", "other"), { allowCreate: true })).toBe("new_event");
      expect(await repo.recordDiscovery(input("3", "someone_else", "fixture_a"), { allowCreate: true })).toBe("new_event");
      expect(await repo.recordDiscovery(input("4", "fixture_b", "fixture_b"), { allowCreate: false })).toBe("not_created");
      const [{ n }] = await sql`select count(*)::int as n from public.creators`;
      const [{ e }] = await sql`select count(*)::int as e from public.discovery_events`;
      expect(n).toBe(1);
      expect(e).toBe(3);
    });

    it("keeps simulated and live records apart under the unique constraints", async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a", true), { allowCreate: true });
      expect(await repo.recordDiscovery(input("1", "fixture_a", "fixture_a", false), { allowCreate: true })).toBe("new_creator");
      const rows = await sql`select is_simulated from public.creators order by is_simulated`;
      expect(rows.map((r) => r.is_simulated)).toEqual([false, true]);
    });

    it("rejects malformed URLs at the database layer", async () => {
      await expect(sql`
        insert into public.creators (public_x_handle, public_x_profile_url, launch_status, launch_confidence)
        values ('ok', 'javascript:alert(1)', 'needs_review', 0.5)`).rejects.toThrow(/check constraint/);
    });

    it("never moves a checkpoint backwards", async () => {
      await repo.setCheckpoint("x", "k", "q", "500");
      await repo.setCheckpoint("x", "k", "q", "400");
      expect(await repo.getCheckpoint("x", "k")).toBe("500");
      await repo.setCheckpoint("x", "k", "q", "1000");
      expect(await repo.getCheckpoint("x", "k")).toBe("1000");
    });

    it("lease lock excludes concurrent holders and expires", async () => {
      expect(await repo.acquireLock("a", 60)).toBe(true);
      expect(await repo.acquireLock("b", 60)).toBe(false);
      expect(await repo.acquireLock("a", 60)).toBe(true);
      await sql`update public.scan_lock set expires_at = now() - interval '1 second'`;
      expect(await repo.acquireLock("b", 60)).toBe(true);
      await repo.releaseLock("b");
      expect(await repo.acquireLock("c", 60)).toBe(true);
    });

    it("concurrent scans: only one runs", async () => {
      const provider = new FakeProvider([post("10", "fixture_a", "I just launched my onlyfans", { link: "https://onlyfans.com/fixture_a" })]);
      const deps = { repo, providerFor: () => provider, llm: null, log: silentLogger, notify: async () => false };
      const results = await Promise.all([runScan(deps, { trigger: "manual" }), runScan(deps, { trigger: "manual" })]);
      expect(results.map((r) => r.status).sort()).toEqual(["locked", "succeeded"]);
      const [{ n }] = await sql`select count(*)::int as n from public.discovery_events`;
      expect(n).toBe(1);
    });

    it("full mock scan end-to-end is idempotent", async () => {
      await sql`update public.settings set provider_configuration = provider_configuration || '{"provider":"mock"}'::jsonb`;
      const now = Date.parse("2026-10-20T12:30:00Z");
      const mock = new MockProvider(() => now);
      const deps = { repo, providerFor: () => mock, llm: null, log: silentLogger, notify: async () => false };
      const first = await runScan(deps, { trigger: "manual" });
      expect(first.status).toBe("succeeded");
      const [{ c1 }] = await sql`select count(*)::int as c1 from public.creators where is_simulated`;
      expect(c1).toBeGreaterThan(0);
      await sql`delete from public.scan_checkpoints`;
      const second = await runScan(deps, { trigger: "manual" });
      if (!("runId" in second)) throw new Error("expected run");
      expect(second.newEventsRecorded).toBe(0);
      const [{ c2 }] = await sql`select count(*)::int as c2 from public.creators where is_simulated`;
      expect(c2).toBe(c1);
      const [run] = await sql`select * from public.scan_runs order by started_at desc limit 1`;
      expect(run.status).toBe("succeeded");
      expect(run.is_simulated).toBe(true);
      expect(run.duplicates_skipped).toBeGreaterThan(0);
      const [{ live }] = await sql`select count(*)::int as live from public.creators where not is_simulated`;
      expect(live).toBe(0);
    });

    it("removes deleted source posts and orphaned creators", async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true });
      await repo.recordDiscovery(input("2", "fixture_b", "fixture_b"), { allowCreate: true });
      expect((await repo.postsForComplianceCheck(10)).sort()).toEqual(["1", "2"]);
      await repo.markComplianceChecked(["2"]);
      expect(await repo.postsForComplianceCheck(10)).toEqual(["1"]);
      expect(await repo.removePosts(["1"])).toBe(1);
      const rows = await sql`select public_x_handle from public.creators`;
      expect(rows.map((r) => r.public_x_handle)).toEqual(["fixture_b"]);
    });

    it("purges by retention window", async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true });
      await sql`update public.discovery_events set discovered_at = now() - interval '100 days'`;
      expect(await repo.purgeOlderThan(90)).toBe(1);
      const [{ n }] = await sql`select count(*)::int as n from public.creators`;
      expect(n).toBe(0);
    });
  });

  describe("row-level security", () => {
    beforeEach(async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true });
    });

    it("anonymous users can read nothing", async () => {
      await asRole(sql, { role: "anon" }, async (tx) => {
        await expectFailure(tx, (sp) => sp`select * from public.creators`, /permission denied/);
        await expectFailure(tx, (sp) => sp`select * from public.settings`, /permission denied/);
      });
    });

    it("signed-in non-operators see no rows and cannot change anything", async () => {
      await asRole(sql, { role: "authenticated", sub: OUTSIDER }, async (tx) => {
        expect(await tx`select * from public.creators`).toHaveLength(0);
        expect(await tx`select * from public.discovery_events`).toHaveLength(0);
        expect(await tx`select * from public.creator_feed`).toHaveLength(0);
        expect(await tx`select * from public.settings`).toHaveLength(0);
        const upd = await tx`update public.creators set review_status = 'confirmed' returning id`;
        expect(upd).toHaveLength(0);
        await expectFailure(tx, (sp) => sp`select public.delete_creator(${randomUUID()}, true)`, /not authorized/);
        await expectFailure(tx, (sp) => sp`select public.purge_simulated_data()`, /not authorized/);
      });
    });

    it("operators can read, review, annotate and change settings", async () => {
      await asRole(sql, { role: "authenticated", sub: OPERATOR }, async (tx) => {
        const feed = await tx`select * from public.creator_feed`;
        expect(feed).toHaveLength(1);
        expect(feed[0].latest_source_post_url).toBe("https://x.com/fixture_a/status/1");
        const upd = await tx`update public.creators set review_status = 'confirmed' returning id`;
        expect(upd).toHaveLength(1);
        await tx`insert into public.review_notes (creator_id, note, status_change) values (${feed[0].id}, 'checked', 'confirmed')`;
        await expectFailure(tx, (sp) => sp`insert into public.review_notes (creator_id, author_id, note) values (${feed[0].id}, ${OUTSIDER}, 'spoofed')`, /row-level security/);
        const s = await tx`update public.settings set scan_interval_minutes = 120 returning scan_interval_minutes`;
        expect(s[0].scan_interval_minutes).toBe(120);
      });
    });

    it("operators cannot insert creators or touch pipeline-only tables", async () => {
      await asRole(sql, { role: "authenticated", sub: OPERATOR }, async (tx) => {
        await expectFailure(tx, (sp) => sp`
          insert into public.creators (public_x_handle, public_x_profile_url, launch_status, launch_confidence)
          values ('fake', 'https://x.com/fake', 'needs_review', 0.5)`, /row-level security/);
        expect(await tx`select * from public.suppressions`).toHaveLength(0);
        expect(await tx`select * from public.scan_checkpoints`).toHaveLength(0);
      });
    });

    it("operators cannot call the pipeline lock functions", async () => {
      await asRole(sql, { role: "authenticated", sub: OPERATOR }, async (tx) => {
        await expectFailure(tx, (sp) => sp`select public.acquire_scan_lock('x', 60)`, /permission denied/);
      });
    });
  });

  describe("record deletion", () => {
    it("delete_creator removes the creator and evidence and suppresses re-discovery", async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a"), { allowCreate: true });
      const [{ id }] = await sql`select id from public.creators`;
      await asRole(sql, { role: "authenticated", sub: OPERATOR }, async (tx) => {
        await tx`select public.delete_creator(${id}, true)`;
        expect(await tx`select * from public.creators`).toHaveLength(0);
        expect(await tx`select * from public.discovery_events`).toHaveLength(0);
      });
      // The rolled-back transaction above proves the RPC works for operators; apply it for real:
      await sql.begin(async (tx) => {
        await tx.unsafe("set local role authenticated");
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: OPERATOR })}, true)`;
        await tx`select public.delete_creator(${id}, true)`;
      });
      const provider = new FakeProvider([post("2", "fixture_a", "my onlyfans is live!", { link: "https://onlyfans.com/fixture_a" })]);
      const r = await runScan({ repo, providerFor: () => provider, llm: null, log: silentLogger, notify: async () => false }, { trigger: "manual" });
      if (!("runId" in r)) throw new Error("expected run");
      expect(r.excludedCount).toBe(1);
      const [{ n }] = await sql`select count(*)::int as n from public.creators`;
      expect(n).toBe(0);
      const [{ s }] = await sql`select count(*)::int as s from public.suppressions`;
      expect(s).toBe(2);
    });

    it("purge_simulated_data removes only simulated records", async () => {
      await repo.recordDiscovery(input("1", "fixture_a", "fixture_a", true), { allowCreate: true });
      await repo.recordDiscovery(input("2", "fixture_b", "fixture_b", false), { allowCreate: true });
      await sql.begin(async (tx) => {
        await tx.unsafe("set local role authenticated");
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: OPERATOR })}, true)`;
        await tx`select public.purge_simulated_data()`;
      });
      const rows = await sql`select public_x_handle, is_simulated from public.creators`;
      expect(rows).toEqual([{ public_x_handle: "fixture_b", is_simulated: false }]);
    });
  });
});
