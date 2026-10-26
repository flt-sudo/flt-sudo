import { z } from "zod";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { getTracks, upsertTracks } from "../ingest/tracks.js";
import { LlmError, type LlmProvider } from "../llm/types.js";
import { artistAffinity } from "../profile/observed.js";
import { getProfile, profileForPrompt, type TasteProfile } from "../profile/profile.js";
import type { MusicProvider, Track } from "../providers/music/types.js";
import { uuid } from "../security/crypto.js";
import { trackLinks } from "../playback/links.js";
import { type Annotation, ensureAnnotations } from "./annotate.js";
import { type Criteria, CriteriaSchema, criteriaSystemPrompt, heuristicCriteria, normalizeCriteria } from "./criteria.js";
import { energyCurve, sequence } from "./sequence.js";

export interface EngineDeps {
  db: DB;
  provider: MusicProvider;
  llm: LlmProvider | null;
  timezone?: string;
  /** Optional tag lookup (mock catalog) used for heuristic annotations without an LLM. */
  tagSource?: (videoId: string) => string[];
}

export interface Recommendation {
  videoId: string;
  title: string;
  artists: string[];
  album: string | null;
  durationS: number | null;
  familiar: boolean;
  userPlays: number;
  sources: string[];
  reason: string;
  energy: number | null;
  moods: string[];
  annotationSource: string | null;
  url: string;
}

export interface EngineResult {
  playlistId: string | null;
  title: string;
  description: string;
  tracks: Recommendation[];
  totalDurationS: number;
  criteria: Criteria;
  explanation: string;
  notes: string[];
  usedModel: string | null;
}

interface Cand {
  track: Track;
  sources: Set<string>;
  llmWhy?: string;
}

const NOISE = /\s*[([](?:[^)\]]*(?:remaster|live|version|edit|feat\.?|ft\.|official|video|audio|lyrics?|visuali[sz]er|mono|stereo|deluxe|bonus)[^)\]]*)[)\]]/gi;
export function dedupeKey(title: string, artist: string): string {
  const t = title.replace(NOISE, "").replace(/\s+-\s+.*(remaster|live|version|edit).*$/i, "");
  return `${artist}|${t}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9|]+/g, "");
}

function similar(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
  const x = n(a);
  const y = n(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
}

const PickSchema = z.object({
  picks: z.array(z.object({ videoId: z.string(), reason: z.string() })),
  explanation: z.string().describe("2-4 sentences on how the selection fits the request and the person's taste"),
});

export class PlaylistEngine {
  constructor(private deps: EngineDeps) {}

  async parseRequest(request: string, profile: TasteProfile): Promise<{ criteria: Criteria; usedModel: string | null; notes: string[] }> {
    const notes: string[] = [];
    const llm = this.deps.llm;
    if (llm?.isModel) {
      try {
        const c = await llm.generateJson({
          name: "playlist_criteria",
          system: criteriaSystemPrompt(),
          prompt: `TASTE PROFILE\n${profileForPrompt(profile)}\n\nREQUEST\n${request}`,
          schema: CriteriaSchema,
        });
        return { criteria: normalizeCriteria(c), usedModel: llm.model, notes };
      } catch (err) {
        notes.push(`AI interpretation unavailable (${err instanceof LlmError ? err.type : "error"}); used rule-based parsing.`);
      }
    } else {
      notes.push("No LLM configured: request parsed with simple rules, and no AI song suggestions were used.");
    }
    return { criteria: heuristicCriteria(request), usedModel: null, notes };
  }

  /** Core pipeline shared by recommend_tracks and generate_playlist. */
  async run(request: string, opts: { defaultCount: number; persist: boolean; overrides?: Partial<Criteria> }): Promise<EngineResult> {
    const { db, provider, llm } = this.deps;
    const profile = await getProfile(db, { timezone: this.deps.timezone });
    const parsed = await this.parseRequest(request, profile);
    const criteria: Criteria = normalizeCriteria({ ...parsed.criteria, ...opts.overrides } as Criteria);
    const notes = [...parsed.notes];
    const corrections = profile.corrections;
    const excludeArtists = new Set(
      [...criteria.excludeArtists, ...corrections.filter((c) => c.kind === "exclude_artist").map((c) => c.value)].map((a) => a.toLowerCase()),
    );
    const boost = new Set(corrections.filter((c) => c.kind === "boost_artist").map((c) => c.value.toLowerCase()));
    const avoidGenres = new Set([...criteria.avoidGenres, ...corrections.filter((c) => c.kind === "avoid_genre").map((c) => c.value)].map((g) => g.toLowerCase()));
    const preferGenres = corrections.filter((c) => c.kind === "prefer_genre").map((c) => c.value.toLowerCase());

    // --- user history context -------------------------------------------------
    const playCounts = new Map<string, number>();
    for (const r of await db.selectFrom("plays").select(["video_id"]).execute()) playCounts.set(r.video_id, (playCounts.get(r.video_id) ?? 0) + 1);
    const known = new Set<string>(playCounts.keys());
    for (const r of await db.selectFrom("library_items").select("video_id").execute()) known.add(r.video_id);
    for (const r of await db.selectFrom("playlist_tracks").innerJoin("playlists", "playlists.id", "playlist_tracks.playlist_id").select("playlist_tracks.video_id").where("playlists.origin", "=", "ytm").execute()) known.add(r.video_id);
    const disliked = new Set((await db.selectFrom("feedback").select(["video_id", "rating"]).execute()).filter((f) => f.rating < 0).map((f) => f.video_id));
    const affinity = await artistAffinity(db);

    const cands = new Map<string, Cand>();
    const add = (t: Track, source: string, why?: string) => {
      if (!t.videoId) return;
      const c = cands.get(t.videoId) ?? { track: t, sources: new Set<string>() };
      c.sources.add(source);
      if (why && !c.llmWhy) c.llmWhy = why;
      cands.set(t.videoId, c);
    };
    const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        notes.push(`${label} failed: ${(err as Error).message}`);
        return fallback;
      }
    };

    // --- seeds --------------------------------------------------------------
    const seeds: Track[] = [];
    if (criteria.referencesCurrentTrack && !criteria.seedTracks.length) {
      const recent = profile.observed.recentHistory[0];
      if (recent) {
        const t = (await getTracks(db, [recent.videoId])).get(recent.videoId);
        if (t) {
          seeds.push({ ...t, isAvailable: t.isAvailable });
          notes.push(
            `"This song" was taken to be your most recent YouTube Music history item: "${recent.title}" by ${recent.artist} (history snapshot, not live now-playing — iOS does not expose YouTube Music's now-playing track to this app).`,
          );
        }
      } else {
        notes.push('You referred to "this song", but the currently playing track is not visible to this app. Name the song to use it as a seed.');
      }
    }
    // "Based on my mood": we can't sense mood, so recent listening is the honest proxy.
    if (/\b(my|current)\s+mood\b/i.test(request) && !criteria.moods.length && !criteria.seedTracks.length && !seeds.length) {
      const recent = profile.observed.recentHistory.slice(0, 2).map((r) => r.videoId);
      const fallback = recent.length ? recent : profile.observed.recentTopTracks.slice(0, 2).map((t) => t.videoId);
      const meta = await getTracks(db, fallback);
      for (const id of fallback) {
        const t = meta.get(id);
        if (t) seeds.push({ ...t });
      }
      notes.push(
        seeds.length
          ? `I can't sense your mood, so I used what you played most recently (${seeds.map((s) => `"${s.title}"`).join(", ")}) as the starting point. Tell me a mood word for a different direction.`
          : "I can't sense your mood and have no recent listening to go on; tell me a mood (e.g. calm, upbeat, romantic).",
      );
    }
    for (const s of criteria.seedTracks) {
      const hits = await safe(`Seed search "${s.title}"`, () => provider.searchSongs(`${s.title} ${s.artist ?? ""}`.trim(), 5), []);
      const match = hits.find((h) => similar(h.title, s.title) && (!s.artist || h.artists.some((a) => similar(a, s.artist!)))) ?? (s.artist ? undefined : hits[0]);
      if (match) seeds.push(match);
      else notes.push(`Could not find "${s.title}${s.artist ? ` by ${s.artist}` : ""}" on YouTube Music; skipped as a seed.`);
    }
    const seedArtists = new Set(seeds.flatMap((s) => s.artists.slice(0, 1)).map((a) => a.toLowerCase()));
    if (criteria.excludeSeedArtists) for (const a of seedArtists) excludeArtists.add(a);

    // --- candidate generation ---------------------------------------------
    for (const s of seeds) {
      for (const t of await safe(`Radio for "${s.title}"`, () => provider.radio(s.videoId, 40), [])) add(t, "seed_radio");
    }
    for (const q of criteria.searchQueries) {
      for (const t of await safe(`Search "${q}"`, () => provider.searchSongs(q, 15), [])) add(t, "search");
    }
    let unverified = 0;
    for (const s of criteria.suggestedTracks) {
      const hits = await safe(`Verify "${s.title}"`, () => provider.searchSongs(`${s.title} ${s.artist}`, 5), []);
      const match = hits.find((h) => similar(h.title, s.title) && h.artists.some((a) => similar(a, s.artist)));
      if (match) add(match, "ai_suggestion", s.why);
      else unverified++;
    }
    if (unverified) notes.push(`${unverified} AI-suggested song(s) could not be verified on YouTube Music and were dropped.`);
    for (const a of criteria.seedArtists) {
      for (const t of await safe(`Search artist "${a}"`, () => provider.searchSongs(a, 10), [])) if (t.artists.some((x) => similar(x, a))) add(t, "seed_artist");
    }
    // Familiar pool: the user's most-played and liked tracks (only ranked in if they fit).
    const topIds = [...playCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 200).map(([id]) => id);
    const likedIds = (await db.selectFrom("library_items").select("video_id").where("kind", "=", "liked").limit(300).execute()).map((r) => r.video_id);
    const familiarTracks = await getTracks(db, [...new Set([...topIds, ...likedIds])]);
    for (const t of familiarTracks.values()) add({ ...t }, "your_history");
    if (familiarTracks.size === 0) notes.push("No listening history imported yet, so familiarity weighting is based on nothing; import Takeout or sync your library for personal results.");

    // --- filtering -----------------------------------------------------------
    const seen = new Set<string>();
    const seedIds = new Set(seeds.map((s) => s.videoId));
    const stored = await getTracks(db, [...cands.keys()]);
    let droppedUnavailable = 0;
    const filtered: Cand[] = [];
    for (const c of cands.values()) {
      const t = c.track;
      const artist = (t.artists[0] ?? "").toLowerCase();
      if (!t.isAvailable || stored.get(t.videoId)?.isAvailable === false) {
        droppedUnavailable++;
        continue;
      }
      if (t.resultType && !["song", "video", null].includes(t.resultType)) continue;
      if (seedIds.has(t.videoId) || disliked.has(t.videoId)) continue;
      if (t.artists.some((a) => excludeArtists.has(a.toLowerCase()))) continue;
      const key = dedupeKey(t.title, artist);
      if (seen.has(key)) continue;
      seen.add(key);
      filtered.push(c);
    }
    if (droppedUnavailable) notes.push(`${droppedUnavailable} unavailable/greyed-out track(s) were excluded.`);

    // --- annotate + score ------------------------------------------------------
    const forAnnotation = filtered.slice(0, 160).map((c) => c.track);
    const ann = await ensureAnnotations(db, forAnnotation, llm, this.deps.tagSource);
    const wantTerms = new Set([...criteria.moods, ...criteria.genres, ...criteria.contexts.flatMap((c) => c.split(/\s+/)), ...preferGenres].map((s) => s.toLowerCase()));
    const curve = energyCurve(9, criteria.energyStart, criteria.energyPeak, criteria.energyEnd);
    const eMin = Math.min(...curve) - 0.1;
    const eMax = Math.max(...curve) + 0.1;
    const d = criteria.discovery;

    const scored = filtered
      .map((c) => {
        const a = ann.get(c.track.videoId);
        if (a && a.genres.some((g) => avoidGenres.has(g))) return null;
        const terms = a ? [...a.moods, ...a.genres] : [];
        const overlap = terms.filter((t) => wantTerms.has(t) || [...wantTerms].some((w) => w.length > 3 && t.includes(w))).length;
        const fitMood = wantTerms.size ? Math.min(1, overlap / Math.min(3, wantTerms.size)) : 0.5;
        const fitEnergy = a?.energy == null ? 0.5 : a.energy >= eMin && a.energy <= eMax ? 1 : Math.max(0, 1 - Math.min(Math.abs(a.energy - eMin), Math.abs(a.energy - eMax)) * 3);
        const familiar = known.has(c.track.videoId);
        const artist = (c.track.artists[0] ?? "").toLowerCase();
        const taste = Math.min(1, (affinity.get(artist) ?? 0) + (boost.has(artist) ? 0.3 : 0));
        const srcBonus = (c.sources.has("seed_radio") ? 0.15 : 0) + (c.sources.has("ai_suggestion") ? 0.12 : 0) + (c.sources.has("search") ? 0.04 : 0);
        // History tracks with no evidence of fitting the mood shouldn't win on familiarity alone.
        const historyOnly = c.sources.size === 1 && c.sources.has("your_history");
        const fit = a ? 0.6 * fitMood + 0.4 * fitEnergy : historyOnly ? 0.1 : 0.4;
        const score = 0.5 * fit + (1 - d) * 0.3 * taste + d * 0.3 * (familiar ? 0 : 1) + srcBonus;
        return { c, a, familiar, score, fit };
      })
      .filter((x): x is NonNullable<typeof x> => x != null && x.fit > 0.15)
      .sort((x, y) => y.score - x.score);

    // --- selection -------------------------------------------------------------
    const targetCount = criteria.durationMinutes ? Math.ceil((criteria.durationMinutes * 60) / 215) : criteria.count ?? opts.defaultCount;
    const pool = scored.slice(0, Math.max(60, targetCount * 3));
    let selected: typeof pool = [];
    let explanation = "";
    let picksFromModel = false;

    if (llm?.isModel && pool.length) {
      try {
        const lines = pool.map(
          (p) =>
            `${p.c.track.videoId} | ${p.c.track.title} | ${p.c.track.artists.join(", ")} | ${p.familiar ? `familiar (${playCounts.get(p.c.track.videoId) ?? 0} plays)` : "new to user"} | energy ${p.a?.energy?.toFixed(2) ?? "?"} | ${p.a ? [...p.a.moods, ...p.a.genres].join("/") : "-"} | via ${[...p.c.sources].join("+")}`,
        );
        const res = await llm.generateJson({
          name: "playlist_picks",
          system:
            "You are a meticulous music curator. Choose and justify tracks ONLY from the verified candidate list (use the exact videoId). " +
            "Honor the request's mood, the person's real taste, the familiar/new balance, the per-artist limit and things to avoid. " +
            "Avoid cliché picks when the person asked for something tasteful. Reasons must be specific, not generic genre labels.",
          prompt: [
            `REQUEST: ${request}`,
            `CRITERIA: ${JSON.stringify({ moods: criteria.moods, genres: criteria.genres, contexts: criteria.contexts, avoid: criteria.avoid, discovery: d, maxPerArtist: criteria.maxPerArtist })}`,
            `PICK ABOUT ${targetCount} TRACKS${criteria.durationMinutes ? ` (~${criteria.durationMinutes} minutes total)` : ""}; about ${Math.round(targetCount * d)} should be new to the user.`,
            `TASTE PROFILE\n${profileForPrompt(profile, 15)}`,
            `CANDIDATES (videoId | title | artists | familiarity | energy | moods/genres | source)\n${lines.join("\n")}`,
          ].join("\n\n"),
          schema: PickSchema,
        });
        const byId = new Map(pool.map((p) => [p.c.track.videoId, p]));
        for (const pick of res.picks) {
          const p = byId.get(pick.videoId);
          if (!p || selected.includes(p)) continue;
          p.c.llmWhy = pick.reason;
          selected.push(p);
        }
        explanation = res.explanation;
        picksFromModel = selected.length > 0;
      } catch (err) {
        notes.push(`AI curation unavailable (${err instanceof LlmError ? err.type : "error"}); ranked by score instead.`);
      }
    }

    // Enforce per-artist cap and familiar/new balance; top up from score order.
    const perArtist = new Map<string, number>();
    const capped: typeof pool = [];
    const wantNew = Math.round(targetCount * d);
    const tryAdd = (p: (typeof pool)[number], respectBalance: boolean) => {
      const artist = (p.c.track.artists[0] ?? "").toLowerCase();
      if ((perArtist.get(artist) ?? 0) >= criteria.maxPerArtist || capped.includes(p)) return;
      if (respectBalance) {
        const nNew = capped.filter((x) => !x.familiar).length;
        const nFam = capped.length - nNew;
        if (!p.familiar && nNew >= wantNew + 1) return;
        if (p.familiar && nFam >= targetCount - wantNew + 1) return;
      }
      perArtist.set(artist, (perArtist.get(artist) ?? 0) + 1);
      capped.push(p);
    };
    for (const p of selected) if (capped.length < targetCount) tryAdd(p, false);
    for (const p of pool) if (capped.length < targetCount) tryAdd(p, true);
    for (const p of pool) if (capped.length < targetCount) tryAdd(p, false);
    selected = capped;

    if (criteria.durationMinutes) {
      const target = criteria.durationMinutes * 60;
      let total = 0;
      const fitted: typeof selected = [];
      for (const p of selected) {
        if (total >= target - 90) break;
        fitted.push(p);
        total += p.c.track.durationS ?? 215;
      }
      selected = fitted;
    }

    const ordered = sequence(
      selected.map((p) => ({ p, videoId: p.c.track.videoId, artist: p.c.track.artists[0] ?? "", energy: p.a?.energy ?? null, durationS: p.c.track.durationS ?? null })),
      { start: criteria.energyStart, peak: criteria.energyPeak, end: criteria.energyEnd },
    ).map((s) => s.p);

    await upsertTracks(db, ordered.map((p) => p.c.track), "ytm");

    const tracks: Recommendation[] = ordered.map((p) => ({
      videoId: p.c.track.videoId,
      title: p.c.track.title,
      artists: p.c.track.artists,
      album: p.c.track.album ?? null,
      durationS: p.c.track.durationS ?? null,
      familiar: p.familiar,
      userPlays: playCounts.get(p.c.track.videoId) ?? 0,
      sources: [...p.c.sources],
      reason: p.c.llmWhy ?? ruleReason(p.familiar, playCounts.get(p.c.track.videoId) ?? 0, p.a, p.c.sources, criteria),
      energy: p.a?.energy ?? null,
      moods: p.a?.moods ?? [],
      annotationSource: p.a?.source ?? null,
      url: trackLinks(p.c.track.videoId).web,
    }));
    const totalDurationS = tracks.reduce((s, t) => s + (t.durationS ?? 0), 0);

    if (!explanation) {
      const fam = tracks.filter((t) => t.familiar).length;
      explanation =
        `${tracks.length} tracks (${fam} from your own history/library, ${tracks.length - fam} new to you), ` +
        `selected for ${[...criteria.moods, ...criteria.contexts].slice(0, 4).join(", ") || "your request"} and sequenced along an energy arc ` +
        `${criteria.energyStart.toFixed(1)} → ${criteria.energyPeak.toFixed(1)} → ${criteria.energyEnd.toFixed(1)}.`;
    }
    if (tracks.some((t) => t.annotationSource === "inferred")) notes.push("Energy and mood values are AI estimates; YouTube Music provides no audio features.");
    if (criteria.durationMinutes) {
      if (totalDurationS < criteria.durationMinutes * 60 - 180) notes.push(`Only ${Math.round(totalDurationS / 60)} minutes of suitable verified tracks were found (asked for ${criteria.durationMinutes}).`);
    } else if (tracks.length < targetCount) notes.push(`Only ${tracks.length} suitable verified tracks were found (asked for ${targetCount}).`);
    if (!picksFromModel && llm?.isModel === false) notes.push("Selection used the rule-based ranker.");

    let playlistId: string | null = null;
    if (opts.persist && tracks.length) {
      playlistId = uuid();
      const now = nowIso();
      await db.transaction().execute(async (trx) => {
        await trx
          .insertInto("playlists")
          .values({
            id: playlistId!,
            title: criteria.title || "AI Mix",
            description: criteria.description,
            origin: "generated",
            remote_id: null,
            created_by_app: 0,
            criteria: JSON.stringify({ request, ...criteria }),
            explanation,
            track_count: tracks.length,
            created_at: now,
            updated_at: now,
            saved_at: null,
          })
          .execute();
        await trx.insertInto("playlist_tracks").values(tracks.map((t, i) => ({ playlist_id: playlistId!, position: i, video_id: t.videoId, reason: t.reason }))).execute();
      });
    }

    return { playlistId, title: criteria.title || "AI Mix", description: criteria.description, tracks, totalDurationS, criteria, explanation, notes, usedModel: parsed.usedModel };
  }
}

function ruleReason(familiar: boolean, plays: number, a: Annotation | undefined, sources: Set<string>, c: Criteria): string {
  const bits: string[] = [];
  if (familiar) bits.push(plays ? `you've played it ${plays}×` : "it's in your library");
  if (sources.has("seed_radio")) bits.push("YouTube Music's radio links it to your seed track");
  if (sources.has("ai_suggestion")) bits.push("suggested for this vibe and verified on YouTube Music");
  const hit = a ? [...a.moods, ...a.genres].filter((m) => [...c.moods, ...c.genres].includes(m)) : [];
  if (hit.length) bits.push(`matches ${hit.slice(0, 3).join(", ")}${a?.source === "inferred" ? " (AI-estimated)" : ""}`);
  if (!familiar && !bits.length) bits.push("new to you and found via a search for this mood");
  return bits.join("; ");
}
