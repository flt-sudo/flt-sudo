/** Provider-neutral music types. Every Track here refers to a real, resolvable YouTube Music videoId. */
export interface Track {
  videoId: string;
  title: string;
  artists: string[];
  album?: string | null;
  durationS?: number | null;
  isAvailable: boolean;
  isExplicit?: boolean;
  resultType?: string | null;
  thumbnail?: string | null;
}

export interface HistoryTrack extends Track {
  /** YouTube Music only exposes coarse buckets ("Today", "Yesterday", "Last week"), not exact times. */
  playedBucket?: string | null;
}

export interface PlaylistSummary {
  playlistId: string;
  title: string;
  trackCount?: number | null;
  description?: string | null;
}

export interface PlaylistDetail extends PlaylistSummary {
  tracks: Track[];
}

export type Privacy = "PRIVATE" | "UNLISTED" | "PUBLIC";

export interface ProviderStatus {
  provider: string;
  available: boolean;
  authenticated: boolean;
  detail?: string;
}

export class ProviderError extends Error {
  constructor(
    public type:
      | "not_authenticated"
      | "not_initialized"
      | "rate_limited"
      | "remote_error"
      | "invalid_params"
      | "invalid_headers"
      | "dependency_missing"
      | "unavailable"
      | "timeout"
      | "internal_error"
      | string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }

  get retryable(): boolean {
    return this.type === "rate_limited" || this.type === "remote_error" || this.type === "timeout";
  }
}

/**
 * The single seam between the app and YouTube Music. Implementations:
 *  - YTMusicProvider: ytmusicapi via the Python adapter (unofficial, full feature set)
 *  - MockProvider: deterministic in-memory catalog for tests/demo
 * A future official-API provider (YouTube Data API v3) can implement the playlist subset.
 */
export interface MusicProvider {
  readonly name: string;
  /** Load (or clear, with null) the account credential. */
  configure(auth: string | null): Promise<void>;
  status(): Promise<ProviderStatus>;
  /** Convert pasted browser request headers into a storable credential string. */
  setupBrowserAuth(headersRaw: string): Promise<string>;

  searchSongs(query: string, limit?: number): Promise<Track[]>;
  searchVideos(query: string, limit?: number): Promise<Track[]>;
  /** "Radio"/up-next continuation seeded by a track: YouTube Music's own similarity graph. */
  radio(videoId: string, limit?: number): Promise<Track[]>;

  likedSongs(limit?: number): Promise<Track[]>;
  librarySongs(limit?: number): Promise<Track[]>;
  libraryPlaylists(limit?: number): Promise<PlaylistSummary[]>;
  playlist(playlistId: string, limit?: number): Promise<PlaylistDetail>;
  history(): Promise<HistoryTrack[]>;

  createPlaylist(title: string, description: string, privacy: Privacy, videoIds: string[]): Promise<{ playlistId: string }>;
  addPlaylistItems(playlistId: string, videoIds: string[]): Promise<{ added: number }>;

  close(): Promise<void>;
}
