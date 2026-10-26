import { z } from "zod";

/**
 * Structured selection criteria derived from a natural-language request.
 * All fields are required (nullable where optional) so the schema works with
 * both Anthropic and OpenAI structured outputs. Values are clamped after parsing.
 */
export const CriteriaSchema = z.object({
  title: z.string().describe("Short evocative playlist title"),
  description: z.string().describe("One-sentence description of the vibe"),
  count: z.number().nullable().describe("Number of tracks requested, or null"),
  durationMinutes: z.number().nullable().describe("Target total length in minutes, or null"),
  moods: z.array(z.string()).describe("Mood words, e.g. intimate, atmospheric, romantic"),
  genres: z.array(z.string()).describe("Genres/subgenres that fit; may be empty"),
  avoidGenres: z.array(z.string()),
  contexts: z.array(z.string()).describe("Listening contexts, e.g. late-night drive, dinner"),
  energyStart: z.number().describe("0..1 energy at the start"),
  energyPeak: z.number().describe("0..1 highest energy"),
  energyEnd: z.number().describe("0..1 energy at the end"),
  seedTracks: z.array(z.object({ title: z.string(), artist: z.string().nullable() })).describe("Specific songs the user referenced"),
  seedArtists: z.array(z.string()),
  excludeArtists: z.array(z.string()),
  excludeSeedArtists: z.boolean().describe("True if the user asked not to repeat the seed's artist"),
  maxPerArtist: z.number().describe("Max tracks per artist, usually 2; 1 if variety requested"),
  discovery: z.number().describe("0 = only familiar music from the user's history, 1 = only new-to-user; default 0.35"),
  referencesCurrentTrack: z.boolean().describe("True if the user says 'this song'/'this track' without naming it"),
  searchQueries: z.array(z.string()).describe("3-6 YouTube Music search queries that would surface fitting songs (avoid bare genre labels)"),
  suggestedTracks: z
    .array(z.object({ title: z.string(), artist: z.string(), why: z.string() }))
    .describe("Real songs you are confident exist, fitting both the request and the user's taste. They will be verified."),
  avoid: z.array(z.string()).describe("Things to avoid, e.g. 'corny love ballads', 'wedding songs'"),
});

export type Criteria = z.infer<typeof CriteriaSchema>;

const clamp01 = (n: number, d: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d);

export function normalizeCriteria(c: Criteria): Criteria {
  const count = c.count == null ? null : Math.min(100, Math.max(1, Math.round(c.count)));
  const durationMinutes = c.durationMinutes == null ? null : Math.min(600, Math.max(5, Math.round(c.durationMinutes)));
  return {
    ...c,
    count,
    durationMinutes,
    energyStart: clamp01(c.energyStart, 0.4),
    energyPeak: clamp01(c.energyPeak, 0.6),
    energyEnd: clamp01(c.energyEnd, 0.4),
    discovery: clamp01(c.discovery, 0.35),
    maxPerArtist: Math.min(5, Math.max(1, Math.round(c.maxPerArtist || 2))),
    searchQueries: c.searchQueries.slice(0, 8),
    suggestedTracks: c.suggestedTracks.slice(0, 40),
    seedTracks: c.seedTracks.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// Rule-based fallback used when no LLM is configured. Deliberately simple and
// transparent; it never invents tracks (suggestedTracks stays empty).
// ---------------------------------------------------------------------------
const MOOD_WORDS = [
  "romantic", "intimate", "atmospheric", "expensive", "chill", "dreamy", "energetic", "upbeat", "melancholy", "sad",
  "happy", "dark", "moody", "sexy", "sultry", "warm", "uplifting", "calm", "relaxed", "focus", "party", "hype",
  "nostalgic", "night", "late-night", "driving", "workout", "slow", "smooth", "groovy",
];
const GENRE_WORDS = [
  "rnb", "r&b", "neo-soul", "soul", "jazz", "hip-hop", "rap", "trap", "house", "deep house", "techno", "electronic",
  "synthwave", "indie", "rock", "pop", "latin", "reggaeton", "afrobeats", "amapiano", "ambient", "lofi", "classical",
  "country", "funk", "disco", "dancehall", "bossa nova",
];
const HIGH = ["energetic", "upbeat", "party", "hype", "workout", "driving"];
const LOW = ["chill", "calm", "relaxed", "slow", "intimate", "sad", "melancholy", "dreamy"];

export function heuristicCriteria(request: string): Criteria {
  const text = request.toLowerCase();
  const moods = MOOD_WORDS.filter((w) => text.includes(w));
  const genres = GENRE_WORDS.filter((w) => new RegExp(`\\b${w.replace(/[&]/g, "\\&")}\\b`).test(text)).map((g) => (g === "r&b" ? "rnb" : g));
  const countM = text.match(/\b(\d{1,3})\s*(songs|tracks)\b/);
  const durM = text.match(/\b(\d{1,3})\s*-?\s*(minute|min)\b/) ?? text.match(/\b(\d(?:\.\d)?)\s*-?\s*hours?\b/);
  const durationMinutes = durM ? (/(hour)/.test(durM[0]) ? Math.round(Number(durM[1]) * 60) : Number(durM[1])) : null;
  const likeM = request.match(/(?:like|similar to|energy of|sounds like)\s+["“]?([^"”,]+?)["”]?(?:\s+by\s+([^,]+?))?(?:\s+without|\s+but|[,.]|$)/i);
  const seedTracks =
    likeM && !/^(this|that)\s+(song|track)/i.test(likeM[1]!.trim()) ? [{ title: likeM[1]!.trim(), artist: likeM[2]?.trim() ?? null }] : [];
  const noRepeat = /without (repeating|the same artist)|different artists|no repeats?/.test(text);
  const hi = moods.some((m) => HIGH.includes(m));
  const lo = moods.some((m) => LOW.includes(m));
  const peak = hi ? 0.85 : lo ? 0.45 : 0.6;
  const base = hi ? 0.6 : lo ? 0.3 : 0.45;
  const context = text.match(/\bfor (?:a |an |my )?([a-z \-]{3,40}?)(?:\s+in\s+([a-z ]+))?(?:[,.]|$)/);
  const discovery = /\bnew\b|discover|haven'?t heard|fresh/.test(text) ? 0.75 : /\bfavorites?\b|familiar|my usual/.test(text) ? 0.1 : 0.35;
  const keyTerms = [...moods, ...genres, ...(context ? [context[1]!.trim(), context[2]?.trim() ?? ""].filter(Boolean) : [])];
  const searchQueries = keyTerms.length ? [[...new Set(keyTerms.join(" ").split(/\s+/))].slice(0, 6).join(" "), ...genres.map((g) => `${g} ${moods[0] ?? ""}`.trim())] : [request.slice(0, 80)];
  const phrase = text.match(/(?:a|an|me a|me an)\s+(?:\d+(?:\.\d)?\s*-?\s*(?:minute|min|hour)s?\s+)?([a-z][a-z\- ]{2,40}?)\s+(?:playlist|mix)\b/);
  const titleWords = (context?.[0].replace(/^for (a |an |my )?/, "") ?? phrase?.[1] ?? moods.slice(0, 2).join(" ")) || "Mix";
  return normalizeCriteria({
    title: titleWords.replace(/[,.]$/, "").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60),
    description: request.slice(0, 200),
    count: countM ? Number(countM[1]) : null,
    durationMinutes,
    moods,
    genres,
    avoidGenres: [],
    contexts: context ? [context[1]!.trim(), ...(context[2] ? [context[2].trim()] : [])] : phrase ? [phrase[1]!.trim()] : [],
    energyStart: base,
    energyPeak: peak,
    energyEnd: Math.max(0.2, base - 0.1),
    seedTracks,
    seedArtists: [],
    excludeArtists: [],
    excludeSeedArtists: noRepeat,
    maxPerArtist: noRepeat ? 1 : 2,
    discovery,
    referencesCurrentTrack: /\bthis (song|track)\b/.test(text),
    searchQueries: [...new Set(searchQueries)].filter(Boolean),
    suggestedTracks: [],
    avoid: /not corny|no corny/.test(text) ? ["corny"] : [],
  });
}

export function criteriaSystemPrompt(): string {
  return [
    "You translate a person's music request into structured selection criteria for a playlist engine.",
    "The engine searches YouTube Music, verifies every track exists, and ranks with the person's real listening history, so:",
    "- Base suggestions on the provided taste profile (their actual top artists, recent listening and corrections), not on generic genre lists.",
    "- Mix familiar artists from the profile with adjacent artists they likely don't know yet, according to `discovery`.",
    "- Only list suggestedTracks you are confident are real released songs; never invent titles. 20-40 suggestions is ideal.",
    "- Search queries should be specific and descriptive (e.g. 'sultry slow jam 2010s', 'latin house sunset'), not single genre words.",
    "- Respect exclusions and corrections in the profile strictly.",
    "- Energy is 0..1 (0 = ambient/sleepy, 1 = peak-time club). Shape start/peak/end to the context.",
  ].join("\n");
}
