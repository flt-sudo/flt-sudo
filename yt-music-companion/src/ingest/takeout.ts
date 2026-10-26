import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { uuid } from "../security/crypto.js";
import { normalizeArtist, upsertTracks } from "./tracks.js";

/**
 * Google Takeout → "YouTube and YouTube Music" → history → watch-history.json
 * (export format must be JSON). Each entry looks like:
 *   { header: "YouTube Music", title: "Watched <song>", titleUrl: "https://music.youtube.com/watch?v=<id>",
 *     subtitles: [{ name: "<Artist> - Topic", url }], time: "2024-05-01T03:04:05.678Z", products: ["YouTube"] }
 * Only entries whose header is "YouTube Music" are counted as music plays by
 * default; plain YouTube views are optional because most are not music.
 */
export interface TakeoutEntry {
  header?: string;
  title?: string;
  titleUrl?: string;
  subtitles?: Array<{ name?: string; url?: string }>;
  time?: string;
  details?: Array<{ name?: string }>;
}

export interface ParsedPlay {
  videoId: string;
  title: string;
  artist: string | null;
  playedAt: string;
  header: string;
}

export interface ParseStats {
  totalEntries: number;
  musicPlays: number;
  skippedNonMusic: number;
  skippedAds: number;
  skippedRemoved: number;
  skippedMalformed: number;
}

// Localized "Watched ..." prefixes seen in Takeout exports.
const WATCHED_PREFIXES = [
  /^Watched\s+/i,
  /^Has visto\s+/i,
  /^Viste\s+/i,
  /^Assistiu a\s+/i,
  /^Você assistiu a\s+/i,
  /^A regardé\s+/i,
  /^Vous avez regardé\s+/i,
  /^Angesehen:\s*/i,
  /^Hai guardato\s+/i,
  /^Bekeken:\s*/i,
];

export function extractVideoId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/^\/(?:shorts\/|embed\/)?([A-Za-z0-9_-]{11})$/);
    if (u.hostname === "youtu.be" && m) return m[1]!;
  } catch {
    /* fall through */
  }
  return null;
}

export function cleanTitle(title: string): string {
  let t = title;
  for (const re of WATCHED_PREFIXES) {
    if (re.test(t)) {
      t = t.replace(re, "");
      break;
    }
  }
  return t.trim();
}

export function parseTakeout(entries: unknown, opts: { includeYouTube?: boolean } = {}): { plays: ParsedPlay[]; stats: ParseStats } {
  if (!Array.isArray(entries)) {
    throw new Error("Not a Takeout watch-history.json: expected a top-level JSON array. Re-export history in JSON format.");
  }
  const stats: ParseStats = { totalEntries: entries.length, musicPlays: 0, skippedNonMusic: 0, skippedAds: 0, skippedRemoved: 0, skippedMalformed: 0 };
  const plays: ParsedPlay[] = [];
  for (const raw of entries as TakeoutEntry[]) {
    if (!raw || typeof raw !== "object" || typeof raw.time !== "string") {
      stats.skippedMalformed++;
      continue;
    }
    const header = raw.header ?? "YouTube";
    const isMusic = header === "YouTube Music" || /music\.youtube\.com/.test(raw.titleUrl ?? "");
    if (!isMusic && !opts.includeYouTube) {
      stats.skippedNonMusic++;
      continue;
    }
    if (raw.details?.some((d) => /Google Ads/i.test(d.name ?? ""))) {
      stats.skippedAds++;
      continue;
    }
    const videoId = extractVideoId(raw.titleUrl);
    if (!videoId) {
      stats.skippedRemoved++;
      continue;
    }
    const time = new Date(raw.time);
    if (Number.isNaN(time.getTime())) {
      stats.skippedMalformed++;
      continue;
    }
    const channel = raw.subtitles?.[0]?.name;
    plays.push({
      videoId,
      title: cleanTitle(raw.title ?? ""),
      artist: channel ? normalizeArtist(channel) : null,
      playedAt: time.toISOString(),
      header,
    });
    stats.musicPlays++;
  }
  return { plays, stats };
}

export interface ImportResult {
  importId: string;
  stats: ParseStats & { inserted: number; duplicates: number };
  dataFrom: string | null;
  dataThrough: string | null;
}

/** Idempotent import: re-importing an overlapping or newer export only adds new plays. */
export async function importTakeout(db: DB, entries: unknown, opts: { includeYouTube?: boolean } = {}): Promise<ImportResult> {
  const importId = uuid();
  await db.insertInto("imports").values({ id: importId, kind: "takeout", status: "running", started_at: nowIso(), finished_at: null, stats: null, data_from: null, data_through: null, error: null }).execute();
  try {
    const { plays, stats } = parseTakeout(entries, opts);
    // Latest title/artist text per video for the tracks table (YTM sync later upgrades it).
    const latest = new Map<string, ParsedPlay>();
    for (const p of plays) {
      const prev = latest.get(p.videoId);
      if (!prev || prev.playedAt < p.playedAt) latest.set(p.videoId, p);
    }
    await upsertTracks(
      db,
      [...latest.values()].map((p) => ({ videoId: p.videoId, title: p.title, artists: p.artist ? [p.artist] : [], isAvailable: true })),
      "takeout",
    );

    let inserted = 0;
    for (let i = 0; i < plays.length; i += 500) {
      const batch = plays.slice(i, i + 500);
      const res = await db
        .insertInto("plays")
        .values(batch.map((p) => ({ id: uuid(), video_id: p.videoId, played_at: p.playedAt, source: "takeout", import_id: importId })))
        .onConflict((oc) => oc.columns(["video_id", "played_at", "source"]).doNothing())
        .executeTakeFirst();
      inserted += Number(res.numInsertedOrUpdatedRows ?? 0);
    }
    const times = plays.map((p) => p.playedAt).sort();
    const result: ImportResult = {
      importId,
      stats: { ...stats, inserted, duplicates: plays.length - inserted },
      dataFrom: times[0] ?? null,
      dataThrough: times.at(-1) ?? null,
    };
    await db
      .updateTable("imports")
      .set({ status: "done", finished_at: nowIso(), stats: JSON.stringify(result.stats), data_from: result.dataFrom, data_through: result.dataThrough })
      .where("id", "=", importId)
      .execute();
    return result;
  } catch (err) {
    await db.updateTable("imports").set({ status: "error", finished_at: nowIso(), error: (err as Error).message }).where("id", "=", importId).execute();
    throw err;
  }
}
