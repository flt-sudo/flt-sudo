import type { DB } from "../db/index.js";

/**
 * Everything in this file is computed directly from stored data (Takeout plays,
 * synced library, feedback). No model output is mixed in, so every number can
 * be traced back to a row.
 */
export interface ArtistStat {
  artist: string;
  plays: number;
  share: number;
  firstPlayed: string | null;
  lastPlayed: string | null;
}

export interface TrackStat {
  videoId: string;
  title: string;
  artist: string;
  plays: number;
  lastPlayed: string | null;
}

export interface MonthTrend {
  month: string; // YYYY-MM
  plays: number;
  uniqueArtists: number;
  newArtists: number;
  topArtist: string | null;
}

export interface ObservedProfile {
  sources: {
    takeout: { plays: number; from: string | null; through: string | null; lastImportAt: string | null } | null;
    ytmLibrary: { lastSyncAt: string; liked: number; librarySongs: number; playlists: number; recentHistory: number } | null;
  };
  /** Window for "recent" stats ends at the newest data point, not "now", to avoid implying live data. */
  recentWindow: { days: number; endsAt: string | null };
  totals: { plays: number; uniqueTracks: number; uniqueArtists: number };
  topArtists: ArtistStat[];
  topTracks: TrackStat[];
  recentTopArtists: ArtistStat[];
  recentTopTracks: TrackStat[];
  heavyRotation: TrackStat[];
  trends: MonthTrend[];
  discovery: {
    newArtistsInRecentWindow: string[];
    recentPlaysFromNewArtistsShare: number | null;
    familiarShare: number | null;
  };
  listeningHours: { timezone: string; byHour: number[]; lateNightShare: number | null };
  library: {
    likedTopArtists: Array<{ artist: string; tracks: number }>;
    playlists: Array<{ id: string; title: string; trackCount: number; origin: string; topArtists: string[] }>;
  };
  recentHistory: Array<{ videoId: string; title: string; artist: string; playedBucket: string | null }>;
  feedback: { liked: number; disliked: number };
}

interface PlayRow {
  video_id: string;
  played_at: string;
  title: string;
  primary_artist: string;
}

function hourIn(tz: string, iso: string): number {
  const h = new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(new Date(iso));
  return Number(h) % 24;
}

function topN<T>(m: Map<string, T>, score: (v: T) => number, n: number): Array<[string, T]> {
  return [...m.entries()].sort((a, b) => score(b[1]) - score(a[1])).slice(0, n);
}

export async function computeObserved(db: DB, opts: { timezone?: string; recentDays?: number; limit?: number } = {}): Promise<ObservedProfile> {
  const tz = opts.timezone ?? "UTC";
  const recentDays = opts.recentDays ?? 90;
  const limit = opts.limit ?? 25;

  const plays: PlayRow[] = await db
    .selectFrom("plays")
    .innerJoin("tracks", "tracks.video_id", "plays.video_id")
    .select(["plays.video_id", "plays.played_at", "tracks.title", "tracks.primary_artist"])
    .orderBy("plays.played_at", "asc")
    .execute();

  const lastTakeout = await db
    .selectFrom("imports")
    .selectAll()
    .where("kind", "=", "takeout")
    .where("status", "=", "done")
    .orderBy("finished_at", "desc")
    .executeTakeFirst();
  const lastSync = await db
    .selectFrom("imports")
    .selectAll()
    .where("kind", "=", "ytm_library")
    .where("status", "=", "done")
    .orderBy("finished_at", "desc")
    .executeTakeFirst();

  const total = plays.length;
  const through = plays.at(-1)?.played_at ?? null;
  const recentStart = through ? new Date(new Date(through).getTime() - recentDays * 86400_000).toISOString() : null;

  const artistAll = new Map<string, ArtistStat>();
  const trackAll = new Map<string, TrackStat>();
  const artistRecent = new Map<string, ArtistStat>();
  const trackRecent = new Map<string, TrackStat>();
  const firstHeard = new Map<string, string>();
  const months = new Map<string, { plays: number; artists: Map<string, number>; newArtists: Set<string> }>();
  const byHour = Array.from({ length: 24 }, () => 0);

  for (const p of plays) {
    const a = p.primary_artist;
    if (!firstHeard.has(a)) firstHeard.set(a, p.played_at);
    const as = artistAll.get(a) ?? { artist: a, plays: 0, share: 0, firstPlayed: p.played_at, lastPlayed: null };
    as.plays++;
    as.lastPlayed = p.played_at;
    artistAll.set(a, as);
    const ts = trackAll.get(p.video_id) ?? { videoId: p.video_id, title: p.title, artist: a, plays: 0, lastPlayed: null };
    ts.plays++;
    ts.lastPlayed = p.played_at;
    trackAll.set(p.video_id, ts);

    if (recentStart && p.played_at >= recentStart) {
      const ar = artistRecent.get(a) ?? { artist: a, plays: 0, share: 0, firstPlayed: firstHeard.get(a)!, lastPlayed: null };
      ar.plays++;
      ar.lastPlayed = p.played_at;
      artistRecent.set(a, ar);
      const tr = trackRecent.get(p.video_id) ?? { ...ts, plays: 0 };
      tr.plays++;
      tr.lastPlayed = p.played_at;
      trackRecent.set(p.video_id, tr);
    }

    const month = p.played_at.slice(0, 7);
    const mm = months.get(month) ?? { plays: 0, artists: new Map(), newArtists: new Set() };
    mm.plays++;
    mm.artists.set(a, (mm.artists.get(a) ?? 0) + 1);
    if (firstHeard.get(a) === p.played_at) mm.newArtists.add(a);
    months.set(month, mm);

    byHour[hourIn(tz, p.played_at)]!++;
  }

  const recentTotal = [...artistRecent.values()].reduce((s, x) => s + x.plays, 0);
  for (const s of artistAll.values()) s.share = total ? s.plays / total : 0;
  for (const s of artistRecent.values()) s.share = recentTotal ? s.plays / recentTotal : 0;

  const newArtists = recentStart ? [...artistRecent.values()].filter((s) => s.firstPlayed && s.firstPlayed >= recentStart) : [];
  const newPlays = newArtists.reduce((s, x) => s + x.plays, 0);

  // Heavy rotation: tracks played >= 5 times in the recent window.
  const heavy = [...trackRecent.values()].filter((t) => t.plays >= 5).sort((a, b) => b.plays - a.plays).slice(0, limit);

  const liked = await db
    .selectFrom("library_items")
    .innerJoin("tracks", "tracks.video_id", "library_items.video_id")
    .select(["tracks.primary_artist"])
    .where("library_items.kind", "=", "liked")
    .execute();
  const likedCount = new Map<string, number>();
  for (const r of liked) likedCount.set(r.primary_artist, (likedCount.get(r.primary_artist) ?? 0) + 1);
  const librarySongs = await db.selectFrom("library_items").select((eb) => eb.fn.countAll<number>().as("n")).where("kind", "=", "library_song").executeTakeFirst();

  const playlists = await db.selectFrom("playlists").select(["id", "title", "track_count", "origin"]).orderBy("updated_at", "desc").execute();
  const playlistOut: ObservedProfile["library"]["playlists"] = [];
  for (const pl of playlists) {
    const rows = await db
      .selectFrom("playlist_tracks")
      .innerJoin("tracks", "tracks.video_id", "playlist_tracks.video_id")
      .select("tracks.primary_artist")
      .where("playlist_tracks.playlist_id", "=", pl.id)
      .execute();
    const c = new Map<string, number>();
    for (const r of rows) c.set(r.primary_artist, (c.get(r.primary_artist) ?? 0) + 1);
    playlistOut.push({ id: pl.id, title: pl.title, trackCount: pl.track_count, origin: pl.origin, topArtists: topN(c, (v) => v, 3).map(([k]) => k) });
  }

  const recentHistory = await db
    .selectFrom("recent_history")
    .innerJoin("tracks", "tracks.video_id", "recent_history.video_id")
    .select(["recent_history.video_id", "tracks.title", "tracks.primary_artist", "recent_history.played_bucket"])
    .orderBy("recent_history.position", "asc")
    .limit(50)
    .execute();

  const fb = await db.selectFrom("feedback").select(["rating"]).execute();
  const syncStats = lastSync?.stats ? JSON.parse(lastSync.stats) : null;
  const lateNight = [22, 23, 0, 1, 2, 3, 4].reduce((s, h) => s + byHour[h]!, 0);

  return {
    sources: {
      takeout: lastTakeout || total
        ? { plays: total, from: plays[0]?.played_at ?? null, through, lastImportAt: lastTakeout?.finished_at ?? null }
        : null,
      ytmLibrary: lastSync
        ? { lastSyncAt: lastSync.finished_at!, liked: syncStats?.liked ?? 0, librarySongs: Number(librarySongs?.n ?? 0), playlists: syncStats?.playlists ?? 0, recentHistory: syncStats?.history ?? 0 }
        : null,
    },
    recentWindow: { days: recentDays, endsAt: through },
    totals: { plays: total, uniqueTracks: trackAll.size, uniqueArtists: artistAll.size },
    topArtists: topN(artistAll, (v) => v.plays, limit).map(([, v]) => v),
    topTracks: topN(trackAll, (v) => v.plays, limit).map(([, v]) => v),
    recentTopArtists: topN(artistRecent, (v) => v.plays, limit).map(([, v]) => v),
    recentTopTracks: topN(trackRecent, (v) => v.plays, limit).map(([, v]) => v),
    heavyRotation: heavy,
    trends: [...months.entries()].map(([month, m]) => ({
      month,
      plays: m.plays,
      uniqueArtists: m.artists.size,
      newArtists: m.newArtists.size,
      topArtist: topN(m.artists, (v) => v, 1)[0]?.[0] ?? null,
    })),
    discovery: {
      newArtistsInRecentWindow: newArtists.sort((a, b) => b.plays - a.plays).slice(0, limit).map((s) => s.artist),
      recentPlaysFromNewArtistsShare: recentTotal ? newPlays / recentTotal : null,
      familiarShare: recentTotal ? 1 - newPlays / recentTotal : null,
    },
    listeningHours: { timezone: tz, byHour, lateNightShare: total ? lateNight / total : null },
    library: {
      likedTopArtists: topN(likedCount, (v) => v, limit).map(([artist, tracks]) => ({ artist, tracks })),
      playlists: playlistOut,
    },
    recentHistory: recentHistory.map((r) => ({ videoId: r.video_id, title: r.title, artist: r.primary_artist, playedBucket: r.played_bucket })),
    feedback: { liked: fb.filter((f) => f.rating > 0).length, disliked: fb.filter((f) => f.rating < 0).length },
  };
}

/**
 * Per-artist affinity used to rank candidates. Combines recency-weighted plays
 * (half-life 180 days, relative to newest data), likes, library and playlist
 * membership, and explicit feedback. Returned values are in [0, 1].
 */
export async function artistAffinity(db: DB): Promise<Map<string, number>> {
  const plays = await db
    .selectFrom("plays")
    .innerJoin("tracks", "tracks.video_id", "plays.video_id")
    .select(["tracks.primary_artist", "plays.played_at"])
    .execute();
  const newest = plays.reduce((m, p) => (p.played_at > m ? p.played_at : m), "");
  const ref = newest ? new Date(newest).getTime() : Date.now();
  const score = new Map<string, number>();
  const add = (a: string, v: number) => score.set(a, (score.get(a) ?? 0) + v);
  for (const p of plays) {
    const ageDays = (ref - new Date(p.played_at).getTime()) / 86400_000;
    add(p.primary_artist, Math.pow(0.5, ageDays / 180));
  }
  const lib = await db
    .selectFrom("library_items")
    .innerJoin("tracks", "tracks.video_id", "library_items.video_id")
    .select(["tracks.primary_artist", "library_items.kind"])
    .execute();
  for (const r of lib) add(r.primary_artist, r.kind === "liked" ? 3 : 1);
  const pl = await db
    .selectFrom("playlist_tracks")
    .innerJoin("tracks", "tracks.video_id", "playlist_tracks.video_id")
    .innerJoin("playlists", "playlists.id", "playlist_tracks.playlist_id")
    .select(["tracks.primary_artist"])
    .where("playlists.origin", "=", "ytm")
    .execute();
  for (const r of pl) add(r.primary_artist, 1);
  const fb = await db
    .selectFrom("feedback")
    .innerJoin("tracks", "tracks.video_id", "feedback.video_id")
    .select(["tracks.primary_artist", "feedback.rating"])
    .execute();
  for (const r of fb) add(r.primary_artist, r.rating * 4);

  const max = Math.max(1e-9, ...[...score.values()]);
  const out = new Map<string, number>();
  for (const [a, v] of score) out.set(a.toLowerCase(), Math.max(0, v) / max);
  return out;
}
