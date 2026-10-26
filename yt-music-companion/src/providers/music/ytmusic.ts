import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import readline from "node:readline";
import type { Logger } from "pino";
import { Throttle, withRetry } from "./retry.js";
import {
  type HistoryTrack,
  type MusicProvider,
  type PlaylistDetail,
  type PlaylistSummary,
  type Privacy,
  ProviderError,
  type ProviderStatus,
  type Track,
} from "./types.js";

interface Pending {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * Typed client for adapter/ytm_adapter.py (ytmusicapi). The Python process is
 * spawned lazily, kept alive, and restarted on crash. Credentials are sent only
 * over stdin in the `init` message.
 */
export class YTMusicProvider implements MusicProvider {
  readonly name = "ytmusic";
  private proc: ChildProcessWithoutNullStreams | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  protected auth: string | null = null;
  private initialized = false;
  private throttle: Throttle;

  constructor(
    private opts: { pythonBin: string; adapterPath: string; minIntervalMs: number; timeoutMs?: number; log?: Logger },
  ) {
    this.throttle = new Throttle(opts.minIntervalMs);
  }

  private start(): ChildProcessWithoutNullStreams {
    if (this.proc) return this.proc;
    const proc = spawn(this.opts.pythonBin, ["-I", this.opts.adapterPath], { stdio: ["pipe", "pipe", "pipe"] });
    this.proc = proc;
    this.initialized = false;
    const rl = readline.createInterface({ input: proc.stdout });
    rl.on("line", (line) => this.onLine(line));
    proc.stderr.on("data", (d: Buffer) => this.opts.log?.warn({ adapter: d.toString().slice(0, 500) }, "ytm adapter stderr"));
    const fail = (why: string) => {
      this.proc = null;
      this.initialized = false;
      for (const [id, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(new ProviderError("unavailable", `YouTube Music adapter ${why}`));
        this.pending.delete(id);
      }
    };
    proc.on("error", (err) => fail(`failed to start (${err.message}). Is Python 3 with ytmusicapi installed?`));
    proc.on("exit", (code) => fail(`exited (code ${code})`));
    return proc;
  }

  private onLine(line: string) {
    let msg: { id: number; result?: unknown; error?: { type: string; message: string } };
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    const p = this.pending.get(msg.id);
    if (!p) return;
    clearTimeout(p.timer);
    this.pending.delete(msg.id);
    if (msg.error) p.reject(new ProviderError(msg.error.type, msg.error.message));
    else p.resolve(msg.result);
  }

  protected rawCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const proc = this.start();
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new ProviderError("timeout", `YouTube Music adapter timed out on ${method}`));
      }, this.opts.timeoutMs ?? 30_000);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      proc.stdin.write(JSON.stringify({ id, method, params }) + "\n");
    });
  }

  protected async ensureInit() {
    if (this.initialized && this.proc) return;
    await this.rawCall("init", this.auth ? { auth: this.auth } : {});
    this.initialized = true;
  }

  /** Network-touching calls: init, throttle, retry transient failures. */
  private call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    return withRetry(() =>
      this.throttle.run(async () => {
        await this.ensureInit();
        return this.rawCall<T>(method, params);
      }),
    );
  }

  async configure(auth: string | null): Promise<void> {
    this.auth = auth;
    this.initialized = false;
  }

  async status(): Promise<ProviderStatus> {
    try {
      const s = await this.rawCall<{ ytmusicapiVersion: string | null }>("status");
      if (!s.ytmusicapiVersion) return { provider: this.name, available: false, authenticated: false, detail: "ytmusicapi not installed" };
      return {
        provider: this.name,
        available: true,
        authenticated: !!this.auth,
        detail: `ytmusicapi ${s.ytmusicapiVersion}${this.auth ? "" : " (not connected — search only)"}`,
      };
    } catch (err) {
      return { provider: this.name, available: false, authenticated: false, detail: (err as Error).message };
    }
  }

  async setupBrowserAuth(headersRaw: string): Promise<string> {
    const res = await this.rawCall<{ auth: string }>("setup_browser", { headers_raw: headersRaw });
    return res.auth;
  }

  searchSongs(query: string, limit = 20) {
    return this.call<Track[]>("search", { query, filter: "songs", limit });
  }
  searchVideos(query: string, limit = 20) {
    return this.call<Track[]>("search", { query, filter: "videos", limit });
  }
  radio(videoId: string, limit = 25) {
    return this.call<Track[]>("watch_playlist", { video_id: videoId, limit, radio: true });
  }
  likedSongs(limit = 1000) {
    return this.call<Track[]>("liked_songs", { limit });
  }
  librarySongs(limit = 1000) {
    return this.call<Track[]>("library_songs", { limit });
  }
  libraryPlaylists(limit = 200) {
    return this.call<PlaylistSummary[]>("library_playlists", { limit });
  }
  playlist(playlistId: string, limit = 500) {
    return this.call<PlaylistDetail>("playlist", { playlist_id: playlistId, limit });
  }
  history() {
    return this.call<HistoryTrack[]>("history");
  }
  createPlaylist(title: string, description: string, privacy: Privacy, videoIds: string[]) {
    // Writes are not retried automatically: a timeout may still have created the playlist.
    return this.throttle.run(async () => {
      await this.ensureInit();
      return this.rawCall<{ playlistId: string }>("create_playlist", { title, description, privacy, video_ids: videoIds });
    });
  }
  addPlaylistItems(playlistId: string, videoIds: string[]) {
    return this.throttle.run(async () => {
      await this.ensureInit();
      return this.rawCall<{ added: number }>("add_playlist_items", { playlist_id: playlistId, video_ids: videoIds });
    });
  }

  async close(): Promise<void> {
    this.proc?.stdin.end();
    this.proc?.kill();
    this.proc = null;
  }
}
