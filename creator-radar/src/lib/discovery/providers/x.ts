// Authorized X API v2 adapter (app-only bearer token).
// Uses only documented public endpoints: recent search and tweet lookup.
// No scraping, no authenticated-session access, no engagement actions.

import type { NormalizedPost } from "@/lib/types";
import { isValidPostId, isValidXHandle, xPostUrl, xProfileUrl } from "../url-extract";
import { defaultRetryOptions, errorForStatus, ProviderError, withRetry, type RetryOptions } from "../http";
import { buildPhraseQueries } from "../query";
import type { HealthResult, RateLimitInfo, SearchPage, SearchProvider, SearchQuery } from "./types";

interface XUrlEntity {
  expanded_url?: string;
  unwound_url?: string;
}
interface XTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  lang?: string;
  entities?: { urls?: XUrlEntity[] };
  referenced_tweets?: Array<{ type: string; id: string }>;
}
interface XUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  url?: string;
  entities?: { url?: { urls?: XUrlEntity[] }; description?: { urls?: XUrlEntity[] } };
}
interface XSearchResponse {
  data?: XTweet[];
  includes?: { users?: XUser[] };
  meta?: { newest_id?: string; oldest_id?: string; result_count?: number; next_token?: string };
}
interface XLookupResponse {
  data?: Array<{ id: string }>;
}

export interface XProviderOptions {
  bearerToken: string | undefined;
  baseUrl?: string;
  fetch?: typeof fetch;
  retry?: Partial<RetryOptions>;
}

const TWEET_FIELDS = "created_at,author_id,entities,lang,referenced_tweets";
const USER_FIELDS = "username,name,url,entities,description";

function expandedUrls(entities: XUrlEntity[] | undefined): string[] {
  return (entities ?? [])
    .map((u) => u.unwound_url || u.expanded_url)
    .filter((u): u is string => typeof u === "string" && u.length < 500);
}

function clampResults(n: number): number {
  return Math.min(100, Math.max(10, Math.floor(n)));
}

export function normalizeXResponse(res: XSearchResponse): NormalizedPost[] {
  const users = new Map((res.includes?.users ?? []).map((u) => [u.id, u]));
  const posts: NormalizedPost[] = [];
  for (const t of res.data ?? []) {
    const u = t.author_id ? users.get(t.author_id) : undefined;
    if (!u || !isValidXHandle(u.username) || !isValidPostId(t.id) || !t.created_at) continue;
    posts.push({
      id: t.id,
      url: xPostUrl(u.username, t.id),
      text: String(t.text ?? "").slice(0, 4000),
      createdAt: new Date(t.created_at).toISOString(),
      lang: t.lang,
      isRetweet: (t.referenced_tweets ?? []).some((r) => r.type === "retweeted"),
      urls: expandedUrls(t.entities?.urls),
      author: {
        id: u.id,
        username: u.username,
        name: String(u.name ?? "").slice(0, 100),
        profileUrl: xProfileUrl(u.username),
        profileUrls: [...expandedUrls(u.entities?.url?.urls), ...expandedUrls(u.entities?.description?.urls)],
        description: u.description?.slice(0, 500),
      },
    });
  }
  return posts;
}

export class XProvider implements SearchProvider {
  readonly name = "x" as const;
  readonly isSimulated = false;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly retry: RetryOptions;
  lastRateLimit: RateLimitInfo = {};

  constructor(private readonly opts: XProviderOptions) {
    this.baseUrl = (opts.baseUrl ?? "https://api.x.com").replace(/\/$/, "");
    this.fetchImpl = opts.fetch ?? fetch;
    this.retry = { ...defaultRetryOptions, ...opts.retry };
  }

  buildQueries(terms: string[]): SearchQuery[] {
    return buildPhraseQueries(terms, "-is:retweet");
  }

  private async get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
    if (!this.opts.bearerToken) {
      throw new ProviderError("X_BEARER_TOKEN is not configured", "auth", false);
    }
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, v);

    return withRetry(async () => {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
          headers: { authorization: `Bearer ${this.opts.bearerToken}`, "user-agent": "creator-radar/1.0" },
          signal: AbortSignal.timeout(20_000),
        });
      } catch (err) {
        throw new ProviderError(`network error: ${err instanceof Error ? err.message : String(err)}`, "network", true);
      }
      const remaining = Number(res.headers.get("x-rate-limit-remaining"));
      const reset = Number(res.headers.get("x-rate-limit-reset"));
      this.lastRateLimit = {
        remaining: Number.isFinite(remaining) && res.headers.has("x-rate-limit-remaining") ? remaining : undefined,
        resetAt: Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000) : undefined,
      };
      const body = await res.text();
      const err = errorForStatus(res.status, res.headers, body);
      if (err) throw err;
      try {
        return JSON.parse(body) as T;
      } catch {
        throw new ProviderError("invalid JSON from X API", "server", true);
      }
    }, this.retry);
  }

  async search(q: SearchQuery, opts: { sinceId?: string; maxPages: number; maxResults: number }): Promise<SearchPage> {
    const posts: NormalizedPost[] = [];
    let newestId: string | undefined;
    let nextToken: string | undefined;
    let pages = 0;
    do {
      const res = await this.get<XSearchResponse>("/2/tweets/search/recent", {
        query: q.query,
        max_results: String(clampResults(opts.maxResults)),
        since_id: opts.sinceId,
        next_token: nextToken,
        "tweet.fields": TWEET_FIELDS,
        expansions: "author_id",
        "user.fields": USER_FIELDS,
      });
      if (pages === 0) newestId = res.meta?.newest_id;
      posts.push(...normalizeXResponse(res));
      nextToken = res.meta?.next_token;
      pages++;
    } while (nextToken && pages < opts.maxPages);
    return {
      posts,
      newestId: newestId && isValidPostId(newestId) ? newestId : undefined,
      truncated: Boolean(nextToken),
      rateLimit: this.lastRateLimit,
    };
  }

  async lookupAvailable(postIds: string[]): Promise<Set<string>> {
    const available = new Set<string>();
    const ids = postIds.filter(isValidPostId);
    for (let i = 0; i < ids.length; i += 100) {
      const res = await this.get<XLookupResponse>("/2/tweets", { ids: ids.slice(i, i + 100).join(",") });
      for (const t of res.data ?? []) available.add(t.id);
    }
    return available;
  }

  async healthCheck(): Promise<HealthResult> {
    if (!this.opts.bearerToken) {
      return { ok: false, configured: false, message: "X_BEARER_TOKEN is not set on the server." };
    }
    try {
      await this.get<XSearchResponse>("/2/tweets/search/recent", { query: "onlyfans -is:retweet", max_results: "10" });
      return { ok: true, configured: true, message: "Connected to the X API.", rateLimit: this.lastRateLimit };
    } catch (err) {
      return {
        ok: false,
        configured: true,
        message: err instanceof Error ? err.message : String(err),
        rateLimit: this.lastRateLimit,
      };
    }
  }
}
