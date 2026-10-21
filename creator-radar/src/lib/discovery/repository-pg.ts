import postgres from "postgres";
import { parseSettings } from "@/lib/settings";
import type { ProviderName, Settings } from "@/lib/types";
import {
  shouldPromote,
  type DiscoveryInput,
  type DiscoveryRepository,
  type ProviderHealthPatch,
  type RecordOutcome,
  type RunMetrics,
} from "./repository";

export type Sql = postgres.Sql;

let shared: Sql | null = null;

/** One pooled connection per server process. Uses the Supabase pooler-compatible mode. */
export function getSql(): Sql {
  if (shared) return shared;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  shared = postgres(url, {
    max: 5,
    prepare: false, // required for Supabase's transaction pooler (port 6543)
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
  });
  return shared;
}

export class PgRepository implements DiscoveryRepository {
  constructor(private readonly sql: Sql) {}

  async getSettings(): Promise<Settings> {
    const [row] = await this.sql`select * from public.settings where id = 1`;
    return parseSettings(row ? { ...row, minimum_confidence: Number(row.minimum_confidence) } : null);
  }

  async acquireLock(holder: string, ttlSeconds: number): Promise<boolean> {
    const [row] = await this.sql`select public.acquire_scan_lock(${holder}, ${ttlSeconds}) as ok`;
    return Boolean(row?.ok);
  }

  async releaseLock(holder: string): Promise<void> {
    await this.sql`select public.release_scan_lock(${holder})`;
  }

  async lastRunStartedAt(): Promise<Date | null> {
    const [row] = await this.sql`select max(started_at) as at from public.scan_runs`;
    return row?.at ? new Date(row.at) : null;
  }

  async createRun(input: { trigger: string; provider: ProviderName; isSimulated: boolean; triggeredBy?: string | null }): Promise<string> {
    // Called while holding the scan lock, so any older "running" run died without finishing.
    await this.sql`
      update public.scan_runs
      set status = 'failed', completed_at = now(), error_summary = 'Interrupted before completion (process exited or timed out)'
      where status = 'running'`;
    const [row] = await this.sql`
      insert into public.scan_runs (trigger, provider, is_simulated, triggered_by)
      values (${input.trigger}, ${input.provider}, ${input.isSimulated}, ${input.triggeredBy ?? null})
      returning id`;
    return row.id;
  }

  async finishRun(id: string, m: RunMetrics): Promise<void> {
    const summary = m.errors.length
      ? m.errors.slice(0, 3).map((e) => `${e.scope}: ${e.message}`).join(" | ").slice(0, 1000)
      : null;
    await this.sql`
      update public.scan_runs set
        status = ${m.status},
        completed_at = now(),
        records_examined = ${m.recordsExamined},
        new_profiles_found = ${m.newProfilesFound},
        new_events_recorded = ${m.newEventsRecorded},
        duplicates_skipped = ${m.duplicatesSkipped},
        excluded_count = ${m.excludedCount},
        errors = ${this.sql.json(m.errors.slice(0, 50))},
        error_summary = ${summary}
      where id = ${id}`;
  }

  async getCheckpoint(provider: ProviderName, key: string): Promise<string | null> {
    const [row] = await this.sql`
      select since_id from public.scan_checkpoints where provider = ${provider} and query_key = ${key}`;
    return row?.since_id ?? null;
  }

  async setCheckpoint(provider: ProviderName, key: string, query: string, sinceId: string): Promise<void> {
    // Never move a checkpoint backwards.
    await this.sql`
      insert into public.scan_checkpoints (provider, query_key, query, since_id)
      values (${provider}, ${key}, ${query}, ${sinceId})
      on conflict (provider, query_key) do update
        set since_id = excluded.since_id, query = excluded.query, updated_at = now()
        where public.scan_checkpoints.since_id::numeric < excluded.since_id::numeric`;
  }

  async isSuppressed(keyHashes: string[]): Promise<boolean> {
    if (!keyHashes.length) return false;
    const [row] = await this.sql`
      select exists (select 1 from public.suppressions where key_hash = any(${keyHashes})) as hit`;
    return Boolean(row?.hit);
  }

  async recordDiscovery(input: DiscoveryInput, opts: { allowCreate: boolean }): Promise<RecordOutcome> {
    const r = input.result;
    return this.sql.begin(async (tx) => {
      const [dup] = await tx`
        select 1 from public.discovery_events
        where is_simulated = ${input.isSimulated} and source_platform = 'x' and source_post_id = ${input.post.id}`;
      if (dup) return "duplicate" as const;

      let [creator] = await tx`
        select id, launch_confidence, advertised_profile_slug from public.creators
        where is_simulated = ${input.isSimulated} and advertised_profile_slug = ${input.creator.slug}
        for update`;
      if (!creator) {
        [creator] = await tx`
          select id, launch_confidence, advertised_profile_slug from public.creators
          where is_simulated = ${input.isSimulated} and lower(public_x_handle) = lower(${input.creator.handle})
          for update`;
      }

      let outcome: RecordOutcome = "new_event";
      if (!creator) {
        if (!opts.allowCreate) return "not_created" as const;
        [creator] = await tx`
          insert into public.creators (
            is_simulated, public_display_name, public_x_handle, public_x_profile_url,
            advertised_creator_profile_url, advertised_profile_slug,
            first_seen_at, last_seen_at, launch_status, launch_confidence, claimed_launch_date
          ) values (
            ${input.isSimulated}, ${input.creator.displayName}, ${input.creator.handle}, ${input.creator.xProfileUrl},
            ${input.creator.profileUrl}, ${input.creator.slug},
            ${input.discoveredAt}, ${input.discoveredAt}, ${r.classification}, ${r.confidence}, ${r.claimedLaunchDate}
          )
          returning id, launch_confidence, advertised_profile_slug`;
        outcome = "new_creator";
      } else {
        const promote = shouldPromote({ launch_confidence: Number(creator.launch_confidence) }, r);
        await tx`
          update public.creators set
            last_seen_at = greatest(last_seen_at, ${input.discoveredAt}),
            public_display_name = ${input.creator.displayName},
            advertised_creator_profile_url = coalesce(advertised_creator_profile_url, ${input.creator.profileUrl}),
            advertised_profile_slug = coalesce(advertised_profile_slug, ${input.creator.slug}),
            launch_status = case when ${promote} then ${r.classification}::public.launch_classification else launch_status end,
            launch_confidence = case when ${promote} then ${r.confidence} else launch_confidence end,
            claimed_launch_date = case when ${promote} then coalesce(${r.claimedLaunchDate}::date, claimed_launch_date) else claimed_launch_date end
          where id = ${creator.id}`;
      }

      const inserted = await tx`
        insert into public.discovery_events (
          creator_id, scan_run_id, is_simulated, source_platform, source_post_id, source_post_url,
          source_published_at, discovered_at, search_term, classification, confidence, explanation,
          classifier, matched_signals, claimed_launch_date, evidence_source, extracted_profile_url, post_excerpt
        ) values (
          ${creator.id}, ${input.scanRunId}, ${input.isSimulated}, 'x', ${input.post.id}, ${input.post.url},
          ${input.post.publishedAt}, ${input.discoveredAt}, ${input.searchTerm}, ${r.classification}, ${r.confidence},
          ${r.explanation.slice(0, 1000)}, ${r.classifier}, ${r.signals}, ${r.claimedLaunchDate},
          ${input.evidenceSource}, ${input.creator.profileUrl}, ${input.post.excerpt.slice(0, 500)}
        )
        on conflict do nothing
        returning id`;
      return inserted.length ? outcome : ("duplicate" as const);
    }) as Promise<RecordOutcome>;
  }

  async updateProviderHealth(provider: ProviderName, p: ProviderHealthPatch): Promise<void> {
    await this.sql`
      insert into public.provider_health (provider, last_success_at, last_error_at, last_error, rate_limit_remaining, rate_limit_reset_at, updated_at)
      values (
        ${provider},
        ${p.success ? new Date() : null},
        ${p.error ? new Date() : null},
        ${p.error?.slice(0, 500) ?? null},
        ${p.rateLimitRemaining ?? null},
        ${p.rateLimitResetAt ?? null},
        now()
      )
      on conflict (provider) do update set
        last_success_at = coalesce(excluded.last_success_at, public.provider_health.last_success_at),
        last_error_at = coalesce(excluded.last_error_at, public.provider_health.last_error_at),
        last_error = case when excluded.last_success_at is not null then null
                          else coalesce(excluded.last_error, public.provider_health.last_error) end,
        rate_limit_remaining = coalesce(excluded.rate_limit_remaining, public.provider_health.rate_limit_remaining),
        rate_limit_reset_at = coalesce(excluded.rate_limit_reset_at, public.provider_health.rate_limit_reset_at),
        updated_at = now()`;
  }

  async postsForComplianceCheck(limit: number): Promise<string[]> {
    const rows = await this.sql`
      select source_post_id from public.discovery_events
      where not is_simulated
        and (compliance_checked_at is null or compliance_checked_at < now() - interval '1 day')
      order by compliance_checked_at asc nulls first, discovered_at asc
      limit ${limit}`;
    return rows.map((r) => r.source_post_id as string);
  }

  async removePosts(postIds: string[]): Promise<number> {
    if (!postIds.length) return 0;
    return this.sql.begin(async (tx) => {
      const deleted = await tx`
        delete from public.discovery_events
        where not is_simulated and source_post_id = any(${postIds})
        returning creator_id`;
      await this.deleteOrphans(tx, false);
      return deleted.length;
    }) as Promise<number>;
  }

  async markComplianceChecked(postIds: string[]): Promise<void> {
    if (!postIds.length) return;
    await this.sql`
      update public.discovery_events set compliance_checked_at = now()
      where not is_simulated and source_post_id = any(${postIds})`;
  }

  async purgeOlderThan(days: number): Promise<number> {
    return this.sql.begin(async (tx) => {
      const deleted = await tx`
        delete from public.discovery_events
        where discovered_at < now() - make_interval(days => ${days})
        returning id`;
      await this.deleteOrphans(tx, null);
      await tx`delete from public.scan_runs where started_at < now() - make_interval(days => ${days})`;
      return deleted.length;
    }) as Promise<number>;
  }

  private async deleteOrphans(tx: postgres.TransactionSql, simulated: boolean | null) {
    await tx`
      delete from public.creators c
      where (${simulated}::boolean is null or c.is_simulated = ${simulated})
        and not exists (select 1 from public.discovery_events e where e.creator_id = c.id)`;
  }
}
