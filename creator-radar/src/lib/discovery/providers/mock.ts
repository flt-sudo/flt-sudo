// Simulated provider for local development and demos. Generates synthetic,
// deterministic posts from fictional "sim_" accounts. Everything it returns is
// stored with is_simulated = true and is never mixed with live discoveries.

import { createHash } from "node:crypto";
import type { NormalizedPost } from "@/lib/types";
import { queryKey } from "../query";
import type { HealthResult, SearchPage, SearchProvider, SearchQuery } from "./types";

const NAMES = [
  "aurora", "juniper", "sable", "marlow", "indigo", "wren", "solstice", "ember", "lyric", "nova",
  "sienna", "harbor", "velvet", "quill", "clover", "maple", "saffron", "onyx", "willow", "zephyr",
  "briar", "coral", "dahlia", "fable", "garnet", "halcyon", "iris", "jade", "kestrel", "lumen",
];

type Template = { text: string; link: "post" | "bio" | "none" };

const TEMPLATES: Template[] = [
  { text: "I just launched my OnlyFans today!! be nice 🙈 {link}", link: "post" },
  { text: "ok I finally made an onlyfans… first post is up {link}", link: "post" },
  { text: "My OnlyFans is officially live ✨ {link}", link: "post" },
  { text: "just started my OF this morning, come say hi {link}", link: "post" },
  { text: "I’ve officially opened my new OnlyFans page today, link in bio", link: "bio" },
  { text: "new onlyfans account 💌 link in my bio", link: "bio" },
  { text: "day 1 of my onlyfans journey 🥹 {link}", link: "post" },
  { text: "20% off my OnlyFans this weekend only 🔥 {link}", link: "post" },
  { text: "new video just dropped on my onlyfans {link}", link: "post" },
  { text: "two years on onlyfans today, thank you all!! {link}", link: "post" },
  { text: "she just launched her onlyfans, go support @sim_friend {link}", link: "post" },
  { text: "my old account got banned so I just made a new onlyfans, backup account {link}", link: "post" },
  { text: "I just launched my onlyfans!! dm me", link: "none" },
  // Exercises the safety screen: must be excluded and never stored.
  { text: "just launched my onlyfans, I'm 17 lol {link}", link: "post" },
];

const BUCKET_MS = 60 * 60 * 1000;
const POSTS_PER_BUCKET = 2;
const INITIAL_BUCKETS = 24;

function h(...parts: Array<string | number>): number {
  return createHash("sha256").update(parts.join(":")).digest().readUInt32BE(0);
}

export function generateMockPost(bucket: number, i: number): NormalizedPost {
  const name = NAMES[h("name", bucket, i) % NAMES.length];
  const template = TEMPLATES[h("tpl", bucket, i) % TEMPLATES.length];
  const handle = `sim_${name}`;
  const slug = `sim_${name}`;
  const link = `https://onlyfans.com/${slug}`;
  const id = String(bucket * 1000 + i);
  const createdAt = new Date(bucket * BUCKET_MS + (i + 1) * 60_000).toISOString();
  return {
    id,
    url: `https://x.com/${handle}/status/${id}`,
    text: template.text.replace("{link}", template.link === "post" ? link : "").trim(),
    createdAt,
    isRetweet: false,
    urls: template.link === "post" ? [link] : [],
    author: {
      id: `sim-${name}`,
      username: handle,
      name: `${name[0].toUpperCase()}${name.slice(1)} (simulated)`,
      profileUrl: `https://x.com/${handle}`,
      profileUrls: template.link === "none" ? [] : [link],
      description: "Simulated account for Creator Radar demo data. 18+",
    },
  };
}

export class MockProvider implements SearchProvider {
  readonly name = "mock" as const;
  readonly isSimulated = true;

  constructor(private readonly now: () => number = () => Date.now()) {}

  buildQueries(terms: string[]): SearchQuery[] {
    const query = `simulated:${terms.join("|")}`;
    return [{ key: queryKey("simulated"), query, terms }];
  }

  async search(_q: SearchQuery, opts: { sinceId?: string; maxPages: number; maxResults: number }): Promise<SearchPage> {
    const current = Math.floor(this.now() / BUCKET_MS);
    const since = opts.sinceId ? BigInt(opts.sinceId) : null;
    const posts: NormalizedPost[] = [];
    for (let b = current - INITIAL_BUCKETS + 1; b <= current; b++) {
      for (let i = 0; i < POSTS_PER_BUCKET; i++) {
        const p = generateMockPost(b, i);
        if (since === null || BigInt(p.id) > since) posts.push(p);
      }
    }
    posts.sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));
    const limit = opts.maxPages * opts.maxResults;
    return {
      posts: posts.slice(0, limit),
      newestId: posts[0]?.id ?? opts.sinceId,
      truncated: posts.length > limit,
    };
  }

  async lookupAvailable(postIds: string[]): Promise<Set<string>> {
    return new Set(postIds);
  }

  async healthCheck(): Promise<HealthResult> {
    return { ok: true, configured: true, message: "Simulated provider — synthetic data only." };
  }
}
