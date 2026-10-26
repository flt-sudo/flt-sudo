import { z } from "zod";
import type { Logger } from "pino";
import type { Config } from "../config.js";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { PlaylistEngine } from "../engine/playlist.js";
import { syncLibrary } from "../ingest/library.js";
import { getTracks } from "../ingest/tracks.js";
import type { LlmProvider } from "../llm/types.js";
import { CAPABILITIES, playbackGuidance } from "../playback/capabilities.js";
import { adhocQueueLink, playlistLinks, searchLink, trackLinks } from "../playback/links.js";
import { addCorrection, CORRECTION_KINDS, getProfile, refreshInferences } from "../profile/profile.js";
import { type MusicProvider, ProviderError } from "../providers/music/types.js";
import { uuid } from "../security/crypto.js";

export interface ToolContext {
  db: DB;
  provider: MusicProvider;
  llm: LlmProvider | null;
  engine: PlaylistEngine;
  cfg: Config;
  log?: Logger;
}

export interface ToolDef<I extends z.ZodObject = z.ZodObject> {
  name: string;
  title: string;
  description: string;
  scope: "music:read" | "music:write";
  readOnly: boolean;
  /** Tool changes remote state (your YouTube Music account). */
  remoteWrite: boolean;
  input: I;
  handler: (input: z.infer<I>, ctx: ToolContext) => Promise<unknown>;
}

export class ToolError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const def = <I extends z.ZodObject>(d: ToolDef<I>) => d as unknown as ToolDef;

const PENDING_TTL_MS = 15 * 60 * 1000;

async function resolvePlaylist(db: DB, ref: string) {
  const byId = await db.selectFrom("playlists").selectAll().where((eb) => eb.or([eb("id", "=", ref), eb("remote_id", "=", ref)])).executeTakeFirst();
  if (byId) return byId;
  const all = await db.selectFrom("playlists").selectAll().execute();
  const needle = ref.toLowerCase().replace(/\s*playlist$/, "").trim();
  const exact = all.filter((p) => p.title.toLowerCase() === needle);
  if (exact.length === 1) return exact[0]!;
  const partial = all.filter((p) => p.title.toLowerCase().includes(needle));
  if (partial.length === 1) return partial[0]!;
  if (partial.length > 1) throw new ToolError("ambiguous_playlist", `Several playlists match "${ref}": ${partial.map((p) => `"${p.title}"`).join(", ")}. Use the exact title or id.`);
  return null;
}

async function playlistTracks(db: DB, playlistId: string) {
  const rows = await db.selectFrom("playlist_tracks").selectAll().where("playlist_id", "=", playlistId).orderBy("position", "asc").execute();
  const meta = await getTracks(db, rows.map((r) => r.video_id));
  return rows.map((r) => ({ position: r.position, videoId: r.video_id, title: meta.get(r.video_id)?.title ?? null, artists: meta.get(r.video_id)?.artists ?? [], reason: r.reason }));
}

async function executeAddTracks(ctx: ToolContext, playlist: { id: string; remote_id: string | null; title: string }, videoIds: string[]) {
  if (!playlist.remote_id) throw new ToolError("not_saved", "That playlist only exists in this app. Save it to YouTube Music first (create_playlist).");
  // Avoid duplicates already in the remote playlist.
  let existing = new Set<string>();
  try {
    existing = new Set((await ctx.provider.playlist(playlist.remote_id, 1000)).tracks.map((t) => t.videoId));
  } catch {
    /* fall back to local knowledge */
    existing = new Set((await playlistTracks(ctx.db, playlist.id)).map((t) => t.videoId));
  }
  const toAdd = [...new Set(videoIds)].filter((v) => !existing.has(v));
  if (!toAdd.length) return { status: "nothing_to_add", message: "All of those tracks are already in the playlist.", playlist: playlist.title };
  await ctx.provider.addPlaylistItems(playlist.remote_id, toAdd);
  // Verify by re-reading the playlist; report only what we can confirm.
  let verified: number | null = null;
  try {
    const after = new Set((await ctx.provider.playlist(playlist.remote_id, 1000)).tracks.map((t) => t.videoId));
    verified = toAdd.filter((v) => after.has(v)).length;
  } catch {
    verified = null;
  }
  const pos = (await ctx.db.selectFrom("playlist_tracks").select((eb) => eb.fn.max("position").as("m")).where("playlist_id", "=", playlist.id).executeTakeFirst())?.m ?? -1;
  await ctx.db.insertInto("playlist_tracks").values(toAdd.map((v, i) => ({ playlist_id: playlist.id, position: Number(pos) + 1 + i, video_id: v, reason: "added by request" }))).execute();
  await ctx.db.updateTable("playlists").set({ updated_at: nowIso(), track_count: Number(pos) + 1 + toAdd.length }).where("id", "=", playlist.id).execute();
  return {
    status: verified === toAdd.length ? "added_verified" : verified == null ? "added_unverified" : "partially_verified",
    requested: toAdd.length,
    verifiedInPlaylist: verified,
    skippedDuplicates: videoIds.length - toAdd.length,
    playlist: playlist.title,
    links: playlistLinks(playlist.remote_id),
  };
}

export const TOOLS: ToolDef[] = [
  def({
    name: "get_music_profile",
    title: "Get music taste profile",
    description:
      "Returns the user's taste profile: OBSERVED stats (top artists/tracks, trends, discovery, listening hours, library) computed from imported data, " +
      "plus clearly-labelled AI-INFERRED traits and the user's corrections. Includes a data-freshness statement — never present it as live data.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({
      refreshInferences: z.boolean().optional().describe("Re-run AI inference of genres/moods/contexts (requires an LLM)"),
    }),
    handler: async (input, ctx) => {
      if (input.refreshInferences) {
        if (!ctx.llm?.isModel) throw new ToolError("llm_not_configured", "AI inference needs LLM_PROVIDER=anthropic or openai.");
        return refreshInferences(ctx.db, ctx.llm, { timezone: ctx.cfg.USER_TIMEZONE });
      }
      return getProfile(ctx.db, { timezone: ctx.cfg.USER_TIMEZONE });
    },
  }),
  def({
    name: "get_recent_listening",
    title: "Get recent listening",
    description:
      "What the user has been listening to recently: the latest YouTube Music history snapshot (coarse 'Today/Yesterday' buckets, captured at sync time) " +
      "and the most-played artists/tracks in the last 90 days of imported Takeout data. Optionally re-syncs from YouTube Music first.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({
      sync: z.boolean().optional().describe("Fetch fresh history from YouTube Music before answering (requires connected account)"),
      limit: z.number().int().min(1).max(100).optional(),
    }),
    handler: async (input, ctx) => {
      let syncNote: string | null = null;
      if (input.sync) {
        try {
          const r = await syncLibrary(ctx.db, ctx.provider);
          syncNote = r.errors.length ? `Synced with issues: ${r.errors.join("; ")}` : `Synced at ${r.syncedAt}`;
        } catch (err) {
          syncNote = `Sync failed: ${(err as Error).message}`;
        }
      }
      const p = await getProfile(ctx.db, { timezone: ctx.cfg.USER_TIMEZONE });
      const lim = input.limit ?? 20;
      const capturedAt = (await ctx.db.selectFrom("recent_history").select("captured_at").limit(1).executeTakeFirst())?.captured_at ?? null;
      return {
        freshness: p.freshness,
        syncNote,
        youtubeMusicHistory: { capturedAt, items: p.observed.recentHistory.slice(0, lim) },
        takeoutRecentWindow: {
          window: p.observed.recentWindow,
          topArtists: p.observed.recentTopArtists.slice(0, lim),
          topTracks: p.observed.recentTopTracks.slice(0, lim),
          heavyRotation: p.observed.heavyRotation.slice(0, lim),
        },
      };
    },
  }),
  def({
    name: "search_music",
    title: "Search YouTube Music",
    description: "Search the YouTube Music catalog for songs (or music videos). Returns real, playable tracks with videoIds and links.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({
      query: z.string().min(1).max(200),
      type: z.enum(["songs", "videos"]).optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
    handler: async (input, ctx) => {
      const res = input.type === "videos" ? await ctx.provider.searchVideos(input.query, input.limit ?? 10) : await ctx.provider.searchSongs(input.query, input.limit ?? 10);
      return { query: input.query, results: res.filter((t) => t.isAvailable).map((t) => ({ ...t, url: trackLinks(t.videoId).web })) };
    },
  }),
  def({
    name: "recommend_tracks",
    title: "Recommend tracks",
    description:
      "Natural-language recommendations grounded in the user's listening history, e.g. 'find 15 songs that match the energy of <song> without repeating the artist'. " +
      "Every track is verified on YouTube Music; nothing is saved.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({
      request: z.string().min(2).max(1000),
      count: z.number().int().min(1).max(50).optional(),
      discovery: z.number().min(0).max(1).optional().describe("0 = familiar only, 1 = all new"),
    }),
    handler: async (input, ctx) => {
      const overrides: Record<string, unknown> = {};
      if (input.count) overrides.count = input.count;
      if (input.discovery != null) overrides.discovery = input.discovery;
      const r = await ctx.engine.run(input.request, { defaultCount: 15, persist: false, overrides });
      return { ...r, queueLink: r.tracks.length ? adhocQueueLink(r.tracks.map((t) => t.videoId)) : null, queueLinkNote: "Experimental YouTube link for an unsaved queue." };
    },
  }),
  def({
    name: "generate_playlist",
    title: "Generate playlist",
    description:
      "Builds a sequenced playlist from a natural-language request (mood, context, duration, seeds, exclusions) using the user's real taste. " +
      "Stores it locally as a draft and returns its playlistId. It is NOT in YouTube Music until create_playlist is called with that id.",
    scope: "music:read",
    readOnly: false,
    remoteWrite: false,
    input: z.object({
      request: z.string().min(2).max(1000),
      count: z.number().int().min(1).max(100).optional(),
      durationMinutes: z.number().int().min(5).max(600).optional(),
      discovery: z.number().min(0).max(1).optional(),
    }),
    handler: async (input, ctx) => {
      const overrides: Record<string, unknown> = {};
      if (input.count) overrides.count = input.count;
      if (input.durationMinutes) overrides.durationMinutes = input.durationMinutes;
      if (input.discovery != null) overrides.discovery = input.discovery;
      const r = await ctx.engine.run(input.request, { defaultCount: 20, persist: true, overrides });
      return { ...r, saved: false, next: "Call create_playlist with this playlistId to save it to YouTube Music." };
    },
  }),
  def({
    name: "create_playlist",
    title: "Save playlist to YouTube Music",
    description:
      "Creates a NEW playlist in the user's YouTube Music account (private by default) from a generated draft (playlistId) or an explicit list of videoIds. " +
      "Never modifies existing playlists. Reports the verified track count.",
    scope: "music:write",
    readOnly: false,
    remoteWrite: true,
    input: z.object({
      playlistId: z.string().optional().describe("Local draft id returned by generate_playlist"),
      title: z.string().max(150).optional(),
      description: z.string().max(5000).optional(),
      videoIds: z.array(z.string()).max(500).optional(),
      privacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).optional(),
    }),
    handler: async (input, ctx) => {
      let local = input.playlistId ? await ctx.db.selectFrom("playlists").selectAll().where("id", "=", input.playlistId).executeTakeFirst() : undefined;
      if (input.playlistId && !local) throw new ToolError("not_found", "No draft playlist with that id.", 404);
      if (local?.remote_id) {
        return { status: "already_saved", remotePlaylistId: local.remote_id, links: playlistLinks(local.remote_id) };
      }
      const videoIds = local ? (await playlistTracks(ctx.db, local.id)).map((t) => t.videoId) : (input.videoIds ?? []);
      if (!videoIds.length) throw new ToolError("invalid_params", "Provide a draft playlistId or a non-empty videoIds list.");
      const title = input.title ?? local?.title ?? "AI Mix";
      const description = (input.description ?? local?.description ?? "").slice(0, 4900) + " · Made with YT Music Companion";
      const privacy = input.privacy ?? "PRIVATE";
      const { playlistId: remoteId } = await ctx.provider.createPlaylist(title, description, privacy, videoIds);

      let verifiedCount: number | null = null;
      try {
        verifiedCount = (await ctx.provider.playlist(remoteId, 1000)).tracks.length;
      } catch {
        verifiedCount = null;
      }
      const now = nowIso();
      if (!local) {
        const id = uuid();
        await ctx.db.insertInto("playlists").values({ id, title, description, origin: "generated", remote_id: null, created_by_app: 0, criteria: null, explanation: null, track_count: videoIds.length, created_at: now, updated_at: now, saved_at: null }).execute();
        await ctx.db.insertInto("playlist_tracks").values(videoIds.map((v, i) => ({ playlist_id: id, position: i, video_id: v, reason: null }))).execute();
        local = await ctx.db.selectFrom("playlists").selectAll().where("id", "=", id).executeTakeFirstOrThrow();
      }
      await ctx.db.updateTable("playlists").set({ remote_id: remoteId, created_by_app: 1, saved_at: now, updated_at: now, title }).where("id", "=", local.id).execute();
      return {
        status: verifiedCount === videoIds.length ? "created_verified" : verifiedCount == null ? "created_unverified" : "created_count_mismatch",
        remotePlaylistId: remoteId,
        localPlaylistId: local.id,
        requestedTracks: videoIds.length,
        verifiedTracks: verifiedCount,
        privacy,
        links: playlistLinks(remoteId),
      };
    },
  }),
  def({
    name: "add_tracks_to_playlist",
    title: "Add tracks to a playlist",
    description:
      "Adds tracks to a playlist in YouTube Music, identified by title, remote id or local id. For playlists this app did not create, " +
      "returns status 'confirmation_required' with a confirmationId; ask the user, then call confirm_action. Duplicates are skipped.",
    scope: "music:write",
    readOnly: false,
    remoteWrite: true,
    input: z.object({
      playlist: z.string().min(1).describe("Playlist title, YouTube Music playlistId or local id"),
      videoIds: z.array(z.string()).min(1).max(200),
    }),
    handler: async (input, ctx) => {
      const pl = await resolvePlaylist(ctx.db, input.playlist);
      if (!pl) throw new ToolError("not_found", `No playlist matching "${input.playlist}". Sync your library or create it first.`, 404);
      const meta = await getTracks(ctx.db, input.videoIds);
      if (pl.created_by_app === 1) return executeAddTracks(ctx, pl, input.videoIds);
      const id = uuid();
      const names = input.videoIds.map((v) => meta.get(v)).map((t, i) => (t ? `${t.title} — ${t.primaryArtist}` : input.videoIds[i]));
      const summary = `Add ${input.videoIds.length} track(s) to your existing playlist "${pl.title}": ${names.slice(0, 10).join("; ")}${names.length > 10 ? "…" : ""}`;
      await ctx.db
        .insertInto("pending_actions")
        .values({ id, action: "add_tracks_to_playlist", payload: JSON.stringify({ playlistId: pl.id, videoIds: input.videoIds }), summary, status: "pending", created_at: nowIso(), expires_at: new Date(Date.now() + PENDING_TTL_MS).toISOString() })
        .execute();
      return { status: "confirmation_required", confirmationId: id, summary, expiresInMinutes: 15 };
    },
  }),
  def({
    name: "confirm_action",
    title: "Confirm or cancel a pending change",
    description: "Executes (confirm=true) or cancels a pending change that required the user's explicit confirmation. Only call after the user agreed.",
    scope: "music:write",
    readOnly: false,
    remoteWrite: true,
    input: z.object({ confirmationId: z.string(), confirm: z.boolean() }),
    handler: async (input, ctx) => {
      const pa = await ctx.db.selectFrom("pending_actions").selectAll().where("id", "=", input.confirmationId).executeTakeFirst();
      if (!pa || pa.status !== "pending") throw new ToolError("not_found", "No pending action with that id (it may have been used or cancelled).", 404);
      if (pa.expires_at < nowIso()) {
        await ctx.db.updateTable("pending_actions").set({ status: "expired" }).where("id", "=", pa.id).execute();
        throw new ToolError("expired", "That confirmation expired; please request the change again.");
      }
      if (!input.confirm) {
        await ctx.db.updateTable("pending_actions").set({ status: "cancelled" }).where("id", "=", pa.id).execute();
        return { status: "cancelled", summary: pa.summary };
      }
      // Mark first so a retry cannot apply it twice.
      const claimed = await ctx.db.updateTable("pending_actions").set({ status: "done" }).where("id", "=", pa.id).where("status", "=", "pending").executeTakeFirst();
      if (Number(claimed.numUpdatedRows) === 0) throw new ToolError("conflict", "Action already processed.");
      const payload = JSON.parse(pa.payload) as { playlistId: string; videoIds: string[] };
      const pl = await ctx.db.selectFrom("playlists").selectAll().where("id", "=", payload.playlistId).executeTakeFirstOrThrow();
      return { ...(await executeAddTracks(ctx, pl, payload.videoIds)), summary: pa.summary };
    },
  }),
  def({
    name: "list_playlists",
    title: "List playlists",
    description: "Lists playlists known to the app: synced YouTube Music playlists and generated drafts (with saved status).",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({ includeTracks: z.string().optional().describe("A playlist id or title whose tracks to include") }),
    handler: async (input, ctx) => {
      const rows = await ctx.db.selectFrom("playlists").selectAll().orderBy("updated_at", "desc").execute();
      const list = rows.map((p) => ({
        id: p.id,
        title: p.title,
        origin: p.origin,
        savedToYouTubeMusic: !!p.remote_id,
        remotePlaylistId: p.remote_id,
        createdByApp: p.created_by_app === 1,
        trackCount: p.track_count,
        updatedAt: p.updated_at,
        links: p.remote_id ? playlistLinks(p.remote_id) : null,
      }));
      let tracks = null;
      if (input.includeTracks) {
        const pl = await resolvePlaylist(ctx.db, input.includeTracks);
        if (pl) tracks = { playlist: pl.title, explanation: pl.explanation, tracks: await playlistTracks(ctx.db, pl.id) };
      }
      return { playlists: list, tracks };
    },
  }),
  def({
    name: "open_music",
    title: "Open music on iPhone",
    description:
      "Returns YouTube Music links to open a track, playlist, search or ad-hoc queue on the iPhone. Opening the link hands off to the YouTube Music app. " +
      "This cannot confirm that playback started; say 'here's the link' rather than 'now playing'.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({
      kind: z.enum(["track", "playlist", "search", "queue"]),
      id: z.string().optional().describe("videoId, YouTube Music playlistId, or local playlist id"),
      query: z.string().optional().describe("For kind=track without id: search and open the best match; for kind=search: the query"),
      videoIds: z.array(z.string()).optional().describe("For kind=queue"),
    }),
    handler: async (input, ctx) => {
      const base = { status: "link_ready", playbackConfirmed: false, note: "Open the link on your iPhone. Playback can't be confirmed from here." };
      if (input.kind === "track") {
        let id = input.id;
        let label: string | null = null;
        if (!id && input.query) {
          const hit = (await ctx.provider.searchSongs(input.query, 5)).find((t) => t.isAvailable);
          if (!hit) throw new ToolError("not_found", `No playable match for "${input.query}".`, 404);
          id = hit.videoId;
          label = `${hit.title} — ${hit.artists.join(", ")}`;
        }
        if (!id) throw new ToolError("invalid_params", "Provide id or query.");
        return { ...base, kind: "track", videoId: id, label, links: trackLinks(id) };
      }
      if (input.kind === "playlist") {
        if (!input.id && !input.query) throw new ToolError("invalid_params", "Provide a playlist id or title (query).");
        const pl = await resolvePlaylist(ctx.db, (input.id ?? input.query)!);
        const remote = pl?.remote_id ?? (input.id && !pl ? input.id : null);
        if (!remote) {
          if (pl) {
            const ids = (await playlistTracks(ctx.db, pl.id)).map((t) => t.videoId);
            return { ...base, kind: "queue", label: pl.title, links: { queue: adhocQueueLink(ids) }, warning: "This draft isn't saved to YouTube Music; the queue link is experimental. Save it with create_playlist for a reliable link." };
          }
          throw new ToolError("not_found", "Playlist not found.", 404);
        }
        return { ...base, kind: "playlist", label: pl?.title ?? null, links: playlistLinks(remote) };
      }
      if (input.kind === "search") {
        if (!input.query) throw new ToolError("invalid_params", "Provide query.");
        return { ...base, kind: "search", links: { web: searchLink(input.query) } };
      }
      const ids = input.videoIds ?? [];
      if (!ids.length) throw new ToolError("invalid_params", "Provide videoIds.");
      return { ...base, kind: "queue", links: { queue: adhocQueueLink(ids) }, warning: "Experimental: opens a temporary YouTube queue and may not open in the YouTube Music app." };
    },
  }),
  def({
    name: "get_playback_capabilities",
    title: "Playback capabilities",
    description:
      "Explains what playback control is possible. Pause/resume/skip can only be done on the iPhone (Shortcuts, Control Center or Siri), never from the server. " +
      "Pass an action like 'skip' to get the exact instruction.",
    scope: "music:read",
    readOnly: true,
    remoteWrite: false,
    input: z.object({ action: z.string().optional() }),
    handler: async (input) => ({ guidance: playbackGuidance(input.action), capabilities: CAPABILITIES }),
  }),
  def({
    name: "correct_profile",
    title: "Correct the taste profile",
    description:
      "Records a user correction that overrides inferences and ranking: exclude_artist, boost_artist, prefer_genre, avoid_genre, reject_inference (value = inference id or 'genre:<name>'), note.",
    scope: "music:write",
    readOnly: false,
    remoteWrite: false,
    input: z.object({ kind: z.enum(CORRECTION_KINDS), value: z.string().min(1).max(200), note: z.string().max(500).optional() }),
    handler: async (input, ctx) => addCorrection(ctx.db, input.kind, input.value, input.note),
  }),
  def({
    name: "rate_track",
    title: "Give recommendation feedback",
    description: "Thumbs up/down on a recommended track. Stored locally and used in future ranking (not sent to YouTube Music).",
    scope: "music:write",
    readOnly: false,
    remoteWrite: false,
    input: z.object({ videoId: z.string(), rating: z.enum(["up", "down"]), context: z.string().max(300).optional() }),
    handler: async (input, ctx) => {
      await ctx.db.insertInto("feedback").values({ id: uuid(), video_id: input.videoId, rating: input.rating === "up" ? 1 : -1, context: input.context ?? null, created_at: nowIso() }).execute();
      return { status: "recorded" };
    },
  }),
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));

export async function callTool(ctx: ToolContext, name: string, rawInput: unknown, scopes: string[] | "all"): Promise<unknown> {
  const tool = TOOL_MAP.get(name);
  if (!tool) throw new ToolError("unknown_tool", `Unknown tool ${name}`, 404);
  if (scopes !== "all" && !scopes.includes(tool.scope)) throw new ToolError("forbidden", `Token lacks scope ${tool.scope}`, 403);
  const parsed = tool.input.safeParse(rawInput ?? {});
  if (!parsed.success) throw new ToolError("invalid_params", parsed.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; "));
  try {
    return await tool.handler(parsed.data, ctx);
  } catch (err) {
    if (err instanceof ProviderError) {
      const status = err.type === "not_authenticated" ? 409 : err.type === "rate_limited" ? 429 : err.type === "invalid_params" ? 400 : 502;
      throw new ToolError(err.type, err.type === "not_authenticated" ? "YouTube Music isn't connected (or the session expired). Reconnect in Settings." : err.message, status);
    }
    throw err;
  }
}

export function toolJsonSchema(t: ToolDef): Record<string, unknown> {
  const { $schema: _s, ...schema } = z.toJSONSchema(t.input, { target: "draft-7", io: "input" }) as Record<string, unknown>;
  return schema;
}
