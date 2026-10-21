// In-memory repository with the same semantics as PgRepository. Used by unit
// tests and kept honest by the shared contract suite in tests/db.

import { randomUUID } from "node:crypto";
import { DEFAULT_SETTINGS, type ProviderName, type Settings } from "@/lib/types";
import {
  shouldPromote,
  type DiscoveryInput,
  type DiscoveryRepository,
  type ProviderHealthPatch,
  type RecordOutcome,
  type RunMetrics,
} from "./repository";

export interface MemCreator {
  id: string;
  is_simulated: boolean;
  public_x_handle: string;
  public_display_name: string;
  advertised_profile_slug: string | null;
  launch_status: string;
  launch_confidence: number;
  first_seen_at: Date;
  last_seen_at: Date;
}
export interface MemEvent {
  id: string;
  creator_id: string;
  is_simulated: boolean;
  source_post_id: string;
  classification: string;
  discovered_at: Date;
  compliance_checked_at: Date | null;
}
export interface MemRun extends Partial<RunMetrics> {
  id: string;
  trigger: string;
  provider: ProviderName;
  is_simulated: boolean;
  started_at: Date;
  completed: boolean;
}

export class MemoryRepository implements DiscoveryRepository {
  settings: Settings = structuredClone(DEFAULT_SETTINGS);
  creators: MemCreator[] = [];
  events: MemEvent[] = [];
  runs: MemRun[] = [];
  checkpoints = new Map<string, string>();
  suppressions = new Set<string>();
  health = new Map<ProviderName, ProviderHealthPatch>();
  lock: { holder: string; expiresAt: number } | null = null;

  constructor(private readonly now: () => number = () => Date.now()) {}

  async getSettings() {
    return structuredClone(this.settings);
  }

  async acquireLock(holder: string, ttlSeconds: number) {
    if (this.lock && this.lock.expiresAt > this.now() && this.lock.holder !== holder) return false;
    this.lock = { holder, expiresAt: this.now() + ttlSeconds * 1000 };
    return true;
  }

  async releaseLock(holder: string) {
    if (this.lock?.holder === holder) this.lock = null;
  }

  async lastRunStartedAt() {
    const last = this.runs.at(-1);
    return last ? last.started_at : null;
  }

  async createRun(input: { trigger: string; provider: ProviderName; isSimulated: boolean }) {
    const id = randomUUID();
    this.runs.push({ id, trigger: input.trigger, provider: input.provider, is_simulated: input.isSimulated, started_at: new Date(this.now()), completed: false });
    return id;
  }

  async finishRun(id: string, metrics: RunMetrics) {
    const run = this.runs.find((r) => r.id === id);
    if (run) Object.assign(run, metrics, { completed: true });
  }

  async getCheckpoint(provider: ProviderName, key: string) {
    return this.checkpoints.get(`${provider}:${key}`) ?? null;
  }

  async setCheckpoint(provider: ProviderName, key: string, _query: string, sinceId: string) {
    const k = `${provider}:${key}`;
    const cur = this.checkpoints.get(k);
    if (!cur || BigInt(sinceId) > BigInt(cur)) this.checkpoints.set(k, sinceId);
  }

  async isSuppressed(keyHashes: string[]) {
    return keyHashes.some((k) => this.suppressions.has(k));
  }

  async recordDiscovery(input: DiscoveryInput, opts: { allowCreate: boolean }): Promise<RecordOutcome> {
    if (this.events.some((e) => e.is_simulated === input.isSimulated && e.source_post_id === input.post.id)) {
      return "duplicate";
    }
    const sameSide = this.creators.filter((c) => c.is_simulated === input.isSimulated);
    let creator =
      sameSide.find((c) => c.advertised_profile_slug === input.creator.slug) ??
      sameSide.find((c) => c.public_x_handle.toLowerCase() === input.creator.handle.toLowerCase());
    let outcome: RecordOutcome = "new_event";
    if (!creator) {
      if (!opts.allowCreate) return "not_created";
      creator = {
        id: randomUUID(),
        is_simulated: input.isSimulated,
        public_x_handle: input.creator.handle,
        public_display_name: input.creator.displayName,
        advertised_profile_slug: input.creator.slug,
        launch_status: input.result.classification,
        launch_confidence: input.result.confidence,
        first_seen_at: input.discoveredAt,
        last_seen_at: input.discoveredAt,
      };
      this.creators.push(creator);
      outcome = "new_creator";
    } else {
      if (input.discoveredAt > creator.last_seen_at) creator.last_seen_at = input.discoveredAt;
      creator.advertised_profile_slug ??= input.creator.slug;
      if (shouldPromote(creator, input.result)) {
        creator.launch_status = input.result.classification;
        creator.launch_confidence = input.result.confidence;
      }
    }
    this.events.push({
      id: randomUUID(),
      creator_id: creator.id,
      is_simulated: input.isSimulated,
      source_post_id: input.post.id,
      classification: input.result.classification,
      discovered_at: input.discoveredAt,
      compliance_checked_at: null,
    });
    return outcome;
  }

  async updateProviderHealth(provider: ProviderName, patch: ProviderHealthPatch) {
    this.health.set(provider, { ...this.health.get(provider), ...patch });
  }

  async postsForComplianceCheck(limit: number) {
    return this.events
      .filter((e) => !e.is_simulated && (!e.compliance_checked_at || e.compliance_checked_at.getTime() < this.now() - 86_400_000))
      .sort((a, b) => (a.compliance_checked_at?.getTime() ?? 0) - (b.compliance_checked_at?.getTime() ?? 0))
      .slice(0, limit)
      .map((e) => e.source_post_id);
  }

  async removePosts(postIds: string[]) {
    const before = this.events.length;
    this.events = this.events.filter((e) => e.is_simulated || !postIds.includes(e.source_post_id));
    this.deleteOrphans();
    return before - this.events.length;
  }

  async markComplianceChecked(postIds: string[]) {
    for (const e of this.events) if (!e.is_simulated && postIds.includes(e.source_post_id)) e.compliance_checked_at = new Date(this.now());
  }

  async purgeOlderThan(days: number) {
    const cutoff = this.now() - days * 86_400_000;
    const before = this.events.length;
    this.events = this.events.filter((e) => e.discovered_at.getTime() >= cutoff);
    this.deleteOrphans();
    return before - this.events.length;
  }

  /** Mirrors delete_creator(): removes a creator, its evidence, and optionally suppresses it. */
  deleteCreator(id: string, suppressHashes?: string[]) {
    this.creators = this.creators.filter((c) => c.id !== id);
    this.events = this.events.filter((e) => e.creator_id !== id);
    for (const h of suppressHashes ?? []) this.suppressions.add(h);
  }

  private deleteOrphans() {
    const live = new Set(this.events.map((e) => e.creator_id));
    this.creators = this.creators.filter((c) => live.has(c.id));
  }
}
