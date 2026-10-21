import { createHash } from "node:crypto";
import type { ClassificationResult, EvidenceSource, ProviderName, ScanStatus, ScanTrigger, Settings } from "@/lib/types";

export interface DiscoveryInput {
  isSimulated: boolean;
  scanRunId: string;
  discoveredAt: Date;
  searchTerm: string | null;
  post: { id: string; url: string; publishedAt: string; excerpt: string };
  creator: { handle: string; displayName: string; xProfileUrl: string; profileUrl: string; slug: string };
  result: ClassificationResult;
  evidenceSource: EvidenceSource;
}

export type RecordOutcome = "new_creator" | "new_event" | "duplicate" | "not_created";

export interface RunMetrics {
  status: ScanStatus;
  recordsExamined: number;
  newProfilesFound: number;
  newEventsRecorded: number;
  duplicatesSkipped: number;
  excludedCount: number;
  errors: Array<{ scope: string; message: string }>;
}

export interface ProviderHealthPatch {
  success?: boolean;
  error?: string;
  rateLimitRemaining?: number;
  rateLimitResetAt?: Date;
}

/** Everything the scan pipeline needs from storage. Implemented for Postgres and in-memory. */
export interface DiscoveryRepository {
  getSettings(): Promise<Settings>;
  acquireLock(holder: string, ttlSeconds: number): Promise<boolean>;
  releaseLock(holder: string): Promise<void>;
  lastRunStartedAt(): Promise<Date | null>;
  createRun(input: { trigger: ScanTrigger; provider: ProviderName; isSimulated: boolean; triggeredBy?: string | null }): Promise<string>;
  finishRun(id: string, metrics: RunMetrics): Promise<void>;
  getCheckpoint(provider: ProviderName, key: string): Promise<string | null>;
  setCheckpoint(provider: ProviderName, key: string, query: string, sinceId: string): Promise<void>;
  isSuppressed(keyHashes: string[]): Promise<boolean>;
  recordDiscovery(input: DiscoveryInput, opts: { allowCreate: boolean }): Promise<RecordOutcome>;
  updateProviderHealth(provider: ProviderName, patch: ProviderHealthPatch): Promise<void>;
  /** Live post ids not checked against the source in the last 24 hours. */
  postsForComplianceCheck(limit: number): Promise<string[]>;
  removePosts(postIds: string[]): Promise<number>;
  markComplianceChecked(postIds: string[]): Promise<void>;
  purgeOlderThan(days: number): Promise<number>;
}

/** Same hashing as the delete_creator() SQL function. */
export function suppressionKeys(handle: string, slug: string | null): string[] {
  const keys = [`x:${handle.toLowerCase()}`];
  if (slug) keys.push(`of:${slug.toLowerCase()}`);
  return keys.map((k) => createHash("sha256").update(k, "utf8").digest("hex"));
}

/** Whether a new event should raise the creator's headline status. */
export function shouldPromote(
  current: { launch_confidence: number },
  next: ClassificationResult,
): boolean {
  return next.classification !== "existing_creator_promotion" && next.confidence > current.launch_confidence;
}
