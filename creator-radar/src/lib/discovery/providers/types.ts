import type { NormalizedPost, ProviderName } from "@/lib/types";

export interface SearchQuery {
  /** Stable key for checkpointing; derived from the query text. */
  key: string;
  /** Provider-specific query string. */
  query: string;
  /** The configured terms this query covers. */
  terms: string[];
}

export interface RateLimitInfo {
  remaining?: number;
  resetAt?: Date;
}

export interface SearchPage {
  posts: NormalizedPost[];
  /** Newest post id seen for the query — the next checkpoint candidate. */
  newestId?: string;
  /** True if pagination stopped at the page cap before results ran out. */
  truncated: boolean;
  rateLimit?: RateLimitInfo;
}

export interface HealthResult {
  ok: boolean;
  configured: boolean;
  message: string;
  rateLimit?: RateLimitInfo;
}

export interface SearchProvider {
  readonly name: ProviderName;
  /** Simulated providers produce synthetic data that must never mix with real discoveries. */
  readonly isSimulated: boolean;
  buildQueries(terms: string[]): SearchQuery[];
  search(q: SearchQuery, opts: { sinceId?: string; maxPages: number; maxResults: number }): Promise<SearchPage>;
  /** Of the given post ids, which are still publicly available. Used to honour source deletions. */
  lookupAvailable?(postIds: string[]): Promise<Set<string>>;
  healthCheck(): Promise<HealthResult>;
}
