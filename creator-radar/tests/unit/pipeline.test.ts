import { beforeEach, describe, expect, it, vi } from "vitest";
import { runScan, type ScanDeps } from "@/lib/discovery/pipeline";
import { MemoryRepository } from "@/lib/discovery/repository-memory";
import { suppressionKeys } from "@/lib/discovery/repository";
import { ProviderError } from "@/lib/discovery/http";
import { MockProvider } from "@/lib/discovery/providers/mock";
import { silentLogger } from "@/lib/log";
import type { LlmClassifier } from "@/lib/discovery/llm";
import { FakeProvider, post } from "./helpers";

const LAUNCH = "I just launched my onlyfans today!!";

function deps(repo: MemoryRepository, provider: FakeProvider | MockProvider, extra: Partial<ScanDeps> = {}): ScanDeps {
  return {
    repo,
    providerFor: () => provider,
    llm: null,
    log: silentLogger,
    notify: async () => false,
    ...extra,
  };
}

describe("runScan", () => {
  let repo: MemoryRepository;
  beforeEach(() => {
    repo = new MemoryRepository();
    repo.settings.provider_configuration.provider = "x";
  });

  it("persists new launches with evidence and counts metrics", async () => {
    const provider = new FakeProvider([
      post("101", "fixture_a", `${LAUNCH} onlyfans.com/fixture_a`, { link: "https://onlyfans.com/fixture_a" }),
      post("102", "fixture_b", "50% off my OnlyFans this weekend", { link: "https://onlyfans.com/fixture_b" }),
      post("103", "fixture_c", LAUNCH), // no profile link anywhere → not indexed
    ]);
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    expect(r.status).toBe("succeeded");
    if (!("runId" in r)) throw new Error("expected run");
    expect(r.recordsExamined).toBe(3);
    expect(r.newProfilesFound).toBe(1);
    expect(r.excludedCount).toBe(1);
    expect(repo.creators.map((c) => c.public_x_handle)).toEqual(["fixture_a"]);
    expect(repo.creators[0].launch_status).toBe("likely_new_launch");
  });

  it("is idempotent: re-processing the same posts adds nothing", async () => {
    const provider = new FakeProvider([post("201", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" })]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    // Simulate a lost checkpoint so the provider returns the same post again.
    repo.checkpoints.clear();
    const second = await runScan(deps(repo, provider), { trigger: "manual" });
    if (!("runId" in second)) throw new Error("expected run");
    expect(second.duplicatesSkipped).toBe(1);
    expect(second.newProfilesFound).toBe(0);
    expect(repo.creators).toHaveLength(1);
    expect(repo.events).toHaveLength(1);
  });

  it("deduplicates a creator across posts by profile slug and by handle", async () => {
    const provider = new FakeProvider([
      post("301", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" }),
      post("302", "fixture_a", "my onlyfans is finally live!!", { link: "https://onlyfans.com/fixture_a" }),
      post("303", "Fixture_A", "new onlyfans account, link in bio", { bioLink: "https://onlyfans.com/other_slug" }),
    ]);
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    if (!("runId" in r)) throw new Error("expected run");
    expect(repo.creators).toHaveLength(1);
    expect(repo.events).toHaveLength(3);
    expect(r.newProfilesFound).toBe(1);
    expect(r.newEventsRecorded).toBe(3);
  });

  it("checkpoints the newest id and passes it on the next run", async () => {
    const provider = new FakeProvider([post("401", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" })]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    provider.posts.push(post("402", "fixture_b", LAUNCH, { link: "https://onlyfans.com/fixture_b" }));
    await runScan(deps(repo, provider), { trigger: "manual" });
    expect(provider.calls.map((c) => c.sinceId)).toEqual([undefined, "401"]);
    expect([...repo.checkpoints.values()]).toEqual(["402"]);
  });

  it("does not advance the checkpoint when a post fails, and records a partial run", async () => {
    const provider = new FakeProvider([post("501", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" })]);
    const original = repo.recordDiscovery.bind(repo);
    vi.spyOn(repo, "recordDiscovery").mockRejectedValueOnce(new Error("db hiccup"));
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    expect(r.status).toBe("partial");
    expect(repo.checkpoints.size).toBe(0);
    vi.spyOn(repo, "recordDiscovery").mockImplementation(original);
    const retry = await runScan(deps(repo, provider), { trigger: "manual" });
    expect(retry.status).toBe("succeeded");
    expect(repo.creators).toHaveLength(1);
  });

  it("records a failed run on provider auth errors and keeps the checkpoint", async () => {
    const provider = new FakeProvider([]);
    provider.failNext = new ProviderError("authorization failed (401)", "auth", false);
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    expect(r.status).toBe("failed");
    expect(repo.health.get("x")?.error).toMatch(/401/);
    expect(repo.runs[0].errors?.[0].message).toMatch(/401/);
  });

  it("refuses to run while another scan holds the lock, and always releases its own", async () => {
    const provider = new FakeProvider([]);
    await repo.acquireLock("someone-else", 600);
    expect(await runScan(deps(repo, provider), { trigger: "manual" })).toEqual({ status: "locked" });
    await repo.releaseLock("someone-else");
    await runScan(deps(repo, provider), { trigger: "manual" });
    expect(repo.lock).toBeNull();
  });

  it("releases the lock even when the scan throws", async () => {
    vi.spyOn(repo, "createRun").mockRejectedValueOnce(new Error("db down"));
    await expect(runScan(deps(repo, new FakeProvider([])), { trigger: "manual" })).rejects.toThrow("db down");
    expect(repo.lock).toBeNull();
  });

  it("scheduled runs respect the enabled flag and the interval", async () => {
    const provider = new FakeProvider([]);
    let now = new Date("2026-10-20T00:00:00Z");
    const d = deps(repo, provider, { now: () => now });
    repo.settings.auto_scan_enabled = false;
    expect(await runScan(d, { trigger: "scheduled" })).toMatchObject({ status: "skipped" });
    repo.settings.auto_scan_enabled = true;
    repo.settings.scan_interval_minutes = 360;
    expect((await runScan(d, { trigger: "scheduled" })).status).toBe("succeeded");
    repo.runs[0].started_at = now;
    now = new Date("2026-10-20T03:00:00Z");
    expect(await runScan(d, { trigger: "scheduled" })).toMatchObject({ status: "skipped" });
    now = new Date("2026-10-20T06:00:00Z");
    expect((await runScan(d, { trigger: "scheduled" })).status).toBe("succeeded");
    // Manual scans ignore the interval.
    expect((await runScan(d, { trigger: "manual" })).status).toBe("succeeded");
  });

  it("drops posts with minor indicators without storing anything", async () => {
    const provider = new FakeProvider([
      post("601", "fixture_a", "just launched my onlyfans, I'm 17", { link: "https://onlyfans.com/fixture_a" }),
      post("602", "fixture_b", LAUNCH, { link: "https://onlyfans.com/fixture_b", author: { description: "16 yo" } as never }),
    ]);
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    if (!("runId" in r)) throw new Error("expected run");
    expect(r.excludedCount).toBe(2);
    expect(repo.creators).toHaveLength(0);
    expect(repo.events).toHaveLength(0);
  });

  it("skips retweets", async () => {
    const provider = new FakeProvider([post("651", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a", isRetweet: true })]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    expect(repo.creators).toHaveLength(0);
  });

  it("does not re-index a deleted, suppressed creator", async () => {
    const provider = new FakeProvider([post("701", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" })]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    const c = repo.creators[0];
    repo.deleteCreator(c.id, suppressionKeys(c.public_x_handle, c.advertised_profile_slug));
    expect(repo.events).toHaveLength(0);
    provider.posts.push(post("702", "fixture_a", "my onlyfans is live!", { link: "https://onlyfans.com/fixture_a" }));
    repo.checkpoints.clear();
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    if (!("runId" in r)) throw new Error("expected run");
    expect(repo.creators).toHaveLength(0);
    expect(r.excludedCount).toBe(2);
  });

  it("removes evidence for source posts that were deleted", async () => {
    const provider = new FakeProvider([
      post("801", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" }),
      post("802", "fixture_b", LAUNCH, { link: "https://onlyfans.com/fixture_b" }),
    ]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    // Checked within the last day → not re-checked yet.
    provider.available = new Set(["802"]);
    await runScan(deps(repo, provider), { trigger: "manual" });
    expect(repo.events).toHaveLength(2);
    for (const e of repo.events) e.compliance_checked_at = new Date(Date.now() - 2 * 86_400_000);
    await runScan(deps(repo, provider), { trigger: "manual" });
    expect(repo.events.map((e) => e.source_post_id)).toEqual(["802"]);
    expect(repo.creators.map((c) => c.public_x_handle)).toEqual(["fixture_b"]);
  });

  it("only creates creators above the minimum confidence (needs_review always queued)", async () => {
    repo.settings.minimum_confidence = 0.99;
    const provider = new FakeProvider([
      post("901", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" }),
      post("902", "fixture_b", "she just launched her onlyfans, go support @fixture_c", { link: "https://onlyfans.com/fixture_c" }),
    ]);
    const r = await runScan(deps(repo, provider), { trigger: "manual" });
    if (!("runId" in r)) throw new Error("expected run");
    expect(repo.creators.map((c) => c.launch_status)).toEqual(["needs_review"]);
  });

  it("calls the LLM only for uncertain posts and when enabled", async () => {
    const refine = vi.fn<LlmClassifier["refine"]>(async ({ rules }) => ({ ...rules, classifier: "rules+llm" }));
    const provider = new FakeProvider([
      post("1001", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" }),
      post("1002", "fixture_b", "new onlyfans account, link in bio", { bioLink: "https://onlyfans.com/fixture_b" }),
    ]);
    await runScan(deps(repo, provider, { llm: { refine } }), { trigger: "manual" });
    expect(refine).not.toHaveBeenCalled();
    repo.settings.provider_configuration.llm_enabled = true;
    repo.checkpoints.clear();
    repo.events = [];
    repo.creators = [];
    await runScan(deps(repo, provider, { llm: { refine } }), { trigger: "manual" });
    expect(refine).toHaveBeenCalledTimes(1);
    expect(refine.mock.calls[0][0].text).toContain("new onlyfans account");
  });
});

describe("mock vs live separation", () => {
  it("never merges simulated creators with live ones, even with identical handles", async () => {
    const repo = new MemoryRepository();
    const same = [post("1101", "fixture_a", LAUNCH, { link: "https://onlyfans.com/fixture_a" })];
    repo.settings.provider_configuration.provider = "mock";
    await runScan(deps(repo, new FakeProvider(same, true)), { trigger: "manual" });
    repo.settings.provider_configuration.provider = "x";
    await runScan(deps(repo, new FakeProvider(same, false)), { trigger: "manual" });
    expect(repo.creators).toHaveLength(2);
    expect(repo.creators.map((c) => c.is_simulated).sort()).toEqual([false, true]);
    expect(repo.events.map((e) => e.is_simulated).sort()).toEqual([false, true]);
    expect(repo.runs.map((r) => r.is_simulated)).toEqual([true, false]);
  });

  it("the mock provider only produces simulated, deterministic, checkpointable data", async () => {
    const now = Date.parse("2026-10-20T12:30:00Z");
    const mock = new MockProvider(() => now);
    expect(mock.isSimulated).toBe(true);
    const [q] = mock.buildQueries(["just launched my onlyfans"]);
    const first = await mock.search(q, { maxPages: 2, maxResults: 50 });
    const again = await mock.search(q, { maxPages: 2, maxResults: 50 });
    expect(first.posts.map((p) => p.id)).toEqual(again.posts.map((p) => p.id));
    expect(first.posts.every((p) => p.author.username.startsWith("sim_"))).toBe(true);
    const after = await mock.search(q, { sinceId: first.newestId, maxPages: 2, maxResults: 50 });
    expect(after.posts).toHaveLength(0);

    const repo = new MemoryRepository(() => now);
    const r = await runScan(deps(repo, mock, { now: () => new Date(now) }), { trigger: "manual" });
    if (!("runId" in r)) throw new Error("expected run");
    expect(r.isSimulated).toBe(true);
    expect(r.newProfilesFound).toBeGreaterThan(0);
    expect(repo.creators.every((c) => c.is_simulated)).toBe(true);
  });
});
