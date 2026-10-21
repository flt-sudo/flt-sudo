import { describe, expect, it } from "vitest";
import { XProvider, normalizeXResponse } from "@/lib/discovery/providers/x";
import { backoffDelay, ProviderError, withRetry, defaultRetryOptions } from "@/lib/discovery/http";
import { buildPhraseQueries, sanitizeTerms } from "@/lib/discovery/query";

const NOW = Date.parse("2026-10-20T12:00:00Z");

function searchBody(ids: string[], next?: string) {
  return {
    data: ids.map((id) => ({
      id,
      text: "I just launched my onlyfans https://t.co/xyz",
      author_id: "u1",
      created_at: "2026-10-20T11:00:00.000Z",
      entities: { urls: [{ url: "https://t.co/xyz", expanded_url: "https://onlyfans.com/fixture_a" }] },
    })),
    includes: {
      users: [{
        id: "u1",
        username: "fixture_a",
        name: "Fixture A",
        entities: { url: { urls: [{ expanded_url: "https://onlyfans.com/fixture_a" }] } },
      }],
    },
    meta: { newest_id: ids[0], next_token: next, result_count: ids.length },
  };
}

function scripted(responses: Array<() => Response>) {
  const calls: URL[] = [];
  const sleeps: number[] = [];
  const fetchImpl = (async (input: URL | RequestInfo) => {
    calls.push(new URL(String(input)));
    const next = responses.shift();
    if (!next) throw new Error("unexpected request");
    return next();
  }) as typeof fetch;
  return { calls, sleeps, fetchImpl };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => () =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function provider(fetchImpl: typeof fetch, sleeps: number[], maxRateLimitWaitMs = 30_000) {
  return new XProvider({
    bearerToken: "test-token",
    baseUrl: "https://api.example.test",
    fetch: fetchImpl,
    retry: { sleep: async (ms) => void sleeps.push(ms), now: () => NOW, random: () => 0, maxRateLimitWaitMs },
  });
}

const Q = { key: "k", query: '("just launched my onlyfans") -is:retweet', terms: ["just launched my onlyfans"] };

describe("XProvider", () => {
  it("sends the authorized recent-search request with expansions and since_id", async () => {
    const s = scripted([json(searchBody(["300", "299"]), 200, { "x-rate-limit-remaining": "449", "x-rate-limit-reset": String(NOW / 1000 + 900) })]);
    const page = await provider(s.fetchImpl, s.sleeps).search(Q, { sinceId: "100", maxPages: 2, maxResults: 50 });
    const url = s.calls[0];
    expect(url.pathname).toBe("/2/tweets/search/recent");
    expect(url.searchParams.get("since_id")).toBe("100");
    expect(url.searchParams.get("expansions")).toBe("author_id");
    expect(url.searchParams.get("max_results")).toBe("50");
    expect(page.newestId).toBe("300");
    expect(page.posts[0].urls).toEqual(["https://onlyfans.com/fixture_a"]);
    expect(page.posts[0].url).toBe("https://x.com/fixture_a/status/300");
    expect(page.rateLimit?.remaining).toBe(449);
  });

  it("follows pagination up to the page cap and reports truncation", async () => {
    const s = scripted([json(searchBody(["30"], "t1")), json(searchBody(["20"], "t2"))]);
    const page = await provider(s.fetchImpl, s.sleeps).search(Q, { maxPages: 2, maxResults: 10 });
    expect(s.calls[1].searchParams.get("next_token")).toBe("t1");
    expect(page.posts.map((p) => p.id)).toEqual(["30", "20"]);
    expect(page.newestId).toBe("30");
    expect(page.truncated).toBe(true);
  });

  it("waits for a short rate-limit window, then retries", async () => {
    const reset = String(NOW / 1000 + 10);
    const s = scripted([json({}, 429, { "x-rate-limit-reset": reset }), json(searchBody(["5"]))]);
    const page = await provider(s.fetchImpl, s.sleeps).search(Q, { maxPages: 1, maxResults: 10 });
    expect(page.posts).toHaveLength(1);
    expect(s.sleeps).toEqual([11_000]);
  });

  it("gives up with a rate_limited error when the window is too long", async () => {
    const reset = String(NOW / 1000 + 900);
    const s = scripted([json({}, 429, { "x-rate-limit-reset": reset })]);
    const err = await provider(s.fetchImpl, s.sleeps).search(Q, { maxPages: 1, maxResults: 10 }).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.kind).toBe("rate_limited");
    expect(err.resetAt.getTime()).toBe(NOW + 900_000);
    expect(s.sleeps).toEqual([]);
  });

  it("retries server errors with backoff but not auth errors", async () => {
    const s = scripted([json({}, 503), json({}, 502), json(searchBody(["9"]))]);
    await provider(s.fetchImpl, s.sleeps).search(Q, { maxPages: 1, maxResults: 10 });
    expect(s.sleeps).toEqual([500, 1000]);

    const a = scripted([json({ title: "Unauthorized" }, 401)]);
    const err = await provider(a.fetchImpl, a.sleeps).search(Q, { maxPages: 1, maxResults: 10 }).catch((e) => e);
    expect(err.kind).toBe("auth");
    expect(a.calls).toHaveLength(1);
  });

  it("fails clearly without a token", async () => {
    const p = new XProvider({ bearerToken: undefined });
    await expect(p.search(Q, { maxPages: 1, maxResults: 10 })).rejects.toThrow(/X_BEARER_TOKEN/);
    expect((await p.healthCheck()).configured).toBe(false);
  });

  it("looks up post availability in batches of 100", async () => {
    const ids = Array.from({ length: 150 }, (_, i) => String(i + 1));
    const s = scripted([json({ data: [{ id: "1" }, { id: "2" }] }), json({ data: [{ id: "150" }] })]);
    const available = await provider(s.fetchImpl, s.sleeps).lookupAvailable(ids);
    expect(s.calls).toHaveLength(2);
    expect(s.calls[0].searchParams.get("ids")!.split(",")).toHaveLength(100);
    expect([...available]).toEqual(["1", "2", "150"]);
  });
});

describe("normalizeXResponse", () => {
  it("drops posts with missing or malformed authors/ids", () => {
    const posts = normalizeXResponse({
      data: [
        { id: "1", text: "a", author_id: "nope", created_at: "2026-10-20T00:00:00Z" },
        { id: "x2", text: "b", author_id: "u1", created_at: "2026-10-20T00:00:00Z" },
        { id: "3", text: "c", author_id: "u2", created_at: "2026-10-20T00:00:00Z" },
      ],
      includes: { users: [{ id: "u1", username: "ok_user", name: "" }, { id: "u2", username: "bad user!", name: "" }] },
    });
    expect(posts).toEqual([]);
  });
});

describe("retry helpers", () => {
  it("backoff grows exponentially and is capped", () => {
    const o = { baseDelayMs: 1000, maxDelayMs: 8000, random: () => 1 };
    expect([0, 1, 2, 3, 4].map((a) => backoffDelay(a, o))).toEqual([1000, 2000, 4000, 8000, 8000]);
  });
  it("does not retry non-provider errors", async () => {
    let n = 0;
    await expect(withRetry(async () => { n++; throw new TypeError("bug"); }, { ...defaultRetryOptions, sleep: async () => {} })).rejects.toThrow("bug");
    expect(n).toBe(1);
  });
});

describe("query building", () => {
  it("sanitizes operator-entered terms", () => {
    expect(sanitizeTerms(['  "just launched" ', "OR (x)", "ab", "Just Launched"])).toEqual(["just launched", "OR x"]);
  });
  it("splits terms into queries under the length limit with stable keys", () => {
    const terms = Array.from({ length: 20 }, (_, i) => `just launched my onlyfans number ${i}`);
    const qs = buildPhraseQueries(terms, "-is:retweet", 200);
    expect(qs.length).toBeGreaterThan(1);
    for (const q of qs) expect(q.query.length).toBeLessThanOrEqual(200);
    expect(qs.flatMap((q) => q.terms)).toEqual(terms);
    expect(buildPhraseQueries(terms, "-is:retweet", 200)[0].key).toBe(qs[0].key);
  });
});
