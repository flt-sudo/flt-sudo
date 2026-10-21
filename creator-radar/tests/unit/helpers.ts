import type { NormalizedPost } from "@/lib/types";
import type { SearchPage, SearchProvider, SearchQuery } from "@/lib/discovery/providers/types";
import { queryKey } from "@/lib/discovery/query";

export function post(id: string, handle: string, text: string, opts: Partial<NormalizedPost> & { link?: string; bioLink?: string } = {}): NormalizedPost {
  return {
    id,
    url: `https://x.com/${handle}/status/${id}`,
    text,
    createdAt: opts.createdAt ?? "2026-10-20T12:00:00.000Z",
    isRetweet: opts.isRetweet ?? false,
    urls: opts.link ? [opts.link] : [],
    author: {
      id: `u-${handle}`,
      username: handle,
      name: opts.author?.name ?? handle,
      profileUrl: `https://x.com/${handle}`,
      profileUrls: opts.bioLink ? [opts.bioLink] : [],
      description: opts.author?.description,
    },
  };
}

/** A provider that serves a fixed post list, honouring since_id, with optional failures. */
export class FakeProvider implements SearchProvider {
  readonly name: "x" | "mock";
  calls: Array<{ sinceId?: string }> = [];
  failNext: Error | null = null;

  constructor(
    public posts: NormalizedPost[],
    readonly isSimulated = false,
    public available: Set<string> | null = null,
  ) {
    this.name = isSimulated ? "mock" : "x";
  }

  buildQueries(terms: string[]): SearchQuery[] {
    return [{ key: queryKey("fake"), query: "fake", terms }];
  }

  async search(_q: SearchQuery, opts: { sinceId?: string }): Promise<SearchPage> {
    this.calls.push({ sinceId: opts.sinceId });
    if (this.failNext) {
      const e = this.failNext;
      this.failNext = null;
      throw e;
    }
    const since = opts.sinceId ? BigInt(opts.sinceId) : null;
    const posts = this.posts.filter((p) => since === null || BigInt(p.id) > since);
    const newest = posts.reduce<string | undefined>((max, p) => (!max || BigInt(p.id) > BigInt(max) ? p.id : max), undefined);
    return { posts, newestId: newest, truncated: false };
  }

  async lookupAvailable(ids: string[]) {
    return this.available ? new Set(ids.filter((i) => this.available!.has(i))) : new Set(ids);
  }

  async healthCheck() {
    return { ok: true, configured: true, message: "fake" };
  }
}
