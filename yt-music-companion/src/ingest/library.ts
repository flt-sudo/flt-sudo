import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { MusicProvider } from "../providers/music/types.js";
import { uuid } from "../security/crypto.js";
import { upsertTracks } from "./tracks.js";

export interface SyncResult {
  importId: string;
  liked: number;
  librarySongs: number;
  playlists: number;
  playlistTracks: number;
  history: number;
  errors: string[];
  syncedAt: string;
}

/**
 * Pulls the user's library from YouTube Music (requires a connected account).
 * Each section is independent: one failing (e.g. history disabled) does not
 * abort the others, and failures are reported rather than hidden.
 */
export async function syncLibrary(db: DB, provider: MusicProvider, opts: { playlistTrackLimit?: number } = {}): Promise<SyncResult> {
  const importId = uuid();
  const syncedAt = nowIso();
  await db.insertInto("imports").values({ id: importId, kind: "ytm_library", status: "running", started_at: syncedAt, finished_at: null, stats: null, data_from: null, data_through: null, error: null }).execute();
  const result: SyncResult = { importId, liked: 0, librarySongs: 0, playlists: 0, playlistTracks: 0, history: 0, errors: [], syncedAt };

  const replaceLibrary = async (kind: string, ids: string[]) => {
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("library_items").where("kind", "=", kind).execute();
      const unique = [...new Set(ids)];
      for (let i = 0; i < unique.length; i += 500) {
        await trx
          .insertInto("library_items")
          .values(unique.slice(i, i + 500).map((video_id) => ({ id: uuid(), kind, video_id, captured_at: syncedAt, import_id: importId })))
          .execute();
      }
    });
  };

  try {
    const liked = await provider.likedSongs();
    await upsertTracks(db, liked, "ytm");
    await replaceLibrary("liked", liked.map((t) => t.videoId));
    result.liked = liked.length;
  } catch (err) {
    result.errors.push(`liked songs: ${(err as Error).message}`);
  }

  try {
    const songs = await provider.librarySongs();
    await upsertTracks(db, songs, "ytm");
    await replaceLibrary("library_song", songs.map((t) => t.videoId));
    result.librarySongs = songs.length;
  } catch (err) {
    result.errors.push(`library songs: ${(err as Error).message}`);
  }

  try {
    const lists = await provider.libraryPlaylists();
    for (const pl of lists) {
      // Skip YouTube Music's auto-generated "Liked Music" (LM) and Episodes lists; liked songs are synced above.
      if (pl.playlistId === "LM" || pl.playlistId === "SE") continue;
      let tracks: Awaited<ReturnType<MusicProvider["playlist"]>>["tracks"] = [];
      try {
        tracks = (await provider.playlist(pl.playlistId, opts.playlistTrackLimit ?? 300)).tracks;
      } catch (err) {
        result.errors.push(`playlist "${pl.title}": ${(err as Error).message}`);
      }
      await upsertTracks(db, tracks, "ytm");
      const existing = await db.selectFrom("playlists").select(["id", "created_by_app"]).where("remote_id", "=", pl.playlistId).executeTakeFirst();
      const id = existing?.id ?? uuid();
      await db.transaction().execute(async (trx) => {
        const row = {
          id,
          title: pl.title,
          description: pl.description ?? null,
          origin: existing ? undefined : "ytm",
          remote_id: pl.playlistId,
          track_count: tracks.length || pl.trackCount || 0,
          updated_at: syncedAt,
        };
        if (existing) {
          const { origin: _o, ...upd } = row;
          await trx.updateTable("playlists").set(upd).where("id", "=", id).execute();
        } else {
          await trx.insertInto("playlists").values({ ...row, origin: "ytm", created_by_app: 0, criteria: null, explanation: null, created_at: syncedAt, saved_at: syncedAt }).execute();
        }
        if (tracks.length) {
          await trx.deleteFrom("playlist_tracks").where("playlist_id", "=", id).execute();
          await trx.insertInto("playlist_tracks").values(tracks.map((t, i) => ({ playlist_id: id, position: i, video_id: t.videoId, reason: null }))).execute();
        }
      });
      result.playlists++;
      result.playlistTracks += tracks.length;
    }
  } catch (err) {
    result.errors.push(`playlists: ${(err as Error).message}`);
  }

  try {
    const hist = await provider.history();
    await upsertTracks(db, hist, "ytm");
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("recent_history").execute();
      if (hist.length) {
        await trx
          .insertInto("recent_history")
          .values(hist.map((t, i) => ({ id: uuid(), video_id: t.videoId, position: i, played_bucket: t.playedBucket ?? null, captured_at: syncedAt, import_id: importId })))
          .execute();
      }
    });
    result.history = hist.length;
  } catch (err) {
    result.errors.push(`history: ${(err as Error).message}`);
  }

  const allFailed = result.errors.length >= 4;
  await db
    .updateTable("imports")
    .set({ status: allFailed ? "error" : "done", finished_at: nowIso(), stats: JSON.stringify(result), error: result.errors.join("; ") || null })
    .where("id", "=", importId)
    .execute();
  return result;
}
