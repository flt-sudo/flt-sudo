import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { Track } from "../providers/music/types.js";

export function normalizeArtist(name: string): string {
  return name
    .replace(/\s+-\s+Topic$/i, "")
    .replace(/VEVO$/i, "")
    .replace(/\s+Official$/i, "")
    .trim();
}

/**
 * Upsert tracks. `quality` lets authoritative YouTube Music metadata replace the
 * rougher title/channel text that Takeout provides, but never the reverse.
 */
export async function upsertTracks(db: DB, tracks: Track[], quality: "ytm" | "takeout"): Promise<void> {
  const now = nowIso();
  for (let i = 0; i < tracks.length; i += 200) {
    const batch = tracks.slice(i, i + 200);
    await db.transaction().execute(async (trx) => {
      for (const t of batch) {
        const artists = t.artists.length ? t.artists.map(normalizeArtist) : ["Unknown artist"];
        const row = {
          video_id: t.videoId,
          title: t.title,
          artists: JSON.stringify(artists),
          primary_artist: artists[0]!,
          album: t.album ?? null,
          duration_s: t.durationS ?? null,
          is_available: t.isAvailable ? 1 : 0,
          updated_at: now,
        };
        if (quality === "ytm") {
          await trx.insertInto("tracks").values(row).onConflict((oc) => oc.column("video_id").doUpdateSet(row)).execute();
        } else {
          await trx.insertInto("tracks").values(row).onConflict((oc) => oc.column("video_id").doNothing()).execute();
        }
      }
    });
  }
}

export interface StoredTrack {
  videoId: string;
  title: string;
  artists: string[];
  primaryArtist: string;
  album: string | null;
  durationS: number | null;
  isAvailable: boolean;
}

export function rowToTrack(r: {
  video_id: string;
  title: string;
  artists: string;
  primary_artist: string;
  album: string | null;
  duration_s: number | null;
  is_available: number;
}): StoredTrack {
  return {
    videoId: r.video_id,
    title: r.title,
    artists: JSON.parse(r.artists),
    primaryArtist: r.primary_artist,
    album: r.album,
    durationS: r.duration_s,
    isAvailable: r.is_available === 1,
  };
}

export async function getTracks(db: DB, ids: string[]): Promise<Map<string, StoredTrack>> {
  const out = new Map<string, StoredTrack>();
  for (let i = 0; i < ids.length; i += 500) {
    const rows = await db.selectFrom("tracks").selectAll().where("video_id", "in", ids.slice(i, i + 500)).execute();
    for (const r of rows) out.set(r.video_id, rowToTrack(r));
  }
  return out;
}
