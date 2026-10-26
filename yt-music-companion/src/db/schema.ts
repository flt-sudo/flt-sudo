/**
 * Kysely table types. Conventions chosen for a painless SQLite -> PostgreSQL move:
 *  - text primary keys (UUIDs or provider ids), no autoincrement
 *  - timestamps as ISO-8601 text (UTC)
 *  - JSON stored as text (switch to jsonb in Postgres if desired)
 *  - booleans as integers 0/1
 */
export interface TracksTable {
  video_id: string;
  title: string;
  /** JSON array of artist names, primary artist first */
  artists: string;
  primary_artist: string;
  album: string | null;
  duration_s: number | null;
  is_available: number;
  updated_at: string;
}

/** A single timestamped play, observed from Google Takeout watch history. */
export interface PlaysTable {
  id: string;
  video_id: string;
  played_at: string;
  source: string; // 'takeout'
  import_id: string;
}

/** Snapshot of YouTube Music's own "History" page (no exact timestamps available). */
export interface RecentHistoryTable {
  id: string;
  video_id: string;
  position: number;
  played_bucket: string | null; // e.g. "Today", "Yesterday", "This week"
  captured_at: string;
  import_id: string;
}

export interface LibraryItemsTable {
  id: string;
  kind: string; // 'liked' | 'library_song'
  video_id: string;
  captured_at: string;
  import_id: string;
}

export interface PlaylistsTable {
  id: string;
  title: string;
  description: string | null;
  /** 'ytm' = exists in the user's YouTube Music account; 'generated' = created by this app */
  origin: string;
  remote_id: string | null;
  /** 1 if this app created the remote playlist (so it may be extended without extra confirmation) */
  created_by_app: number;
  criteria: string | null;
  explanation: string | null;
  track_count: number;
  created_at: string;
  updated_at: string;
  saved_at: string | null;
}

export interface PlaylistTracksTable {
  playlist_id: string;
  position: number;
  video_id: string;
  reason: string | null;
}

/** Per-track AI-inferred attributes. Always labelled as inferred, never observed. */
export interface TrackAnnotationsTable {
  video_id: string;
  energy: number | null; // 0..1
  valence: number | null; // 0..1
  moods: string; // JSON string[]
  genres: string; // JSON string[]
  source: string; // 'inferred' | 'user'
  model: string | null;
  created_at: string;
}

export interface ProfileInferencesTable {
  id: string;
  kind: string; // 'genre' | 'mood' | 'context' | 'summary'
  value: string;
  weight: number;
  confidence: number;
  evidence: string | null;
  model: string | null;
  created_at: string;
}

export interface ProfileCorrectionsTable {
  id: string;
  kind: string;
  value: string;
  note: string | null;
  created_at: string;
}

export interface FeedbackTable {
  id: string;
  video_id: string;
  rating: number; // +1 like, -1 dislike
  context: string | null;
  created_at: string;
}

export interface ImportsTable {
  id: string;
  kind: string; // 'takeout' | 'ytm_library' | 'ytm_history' | 'ytm_playlists'
  status: string; // 'running' | 'done' | 'error'
  started_at: string;
  finished_at: string | null;
  stats: string | null;
  data_from: string | null;
  data_through: string | null;
  error: string | null;
}

export interface CredentialsTable {
  provider: string;
  ciphertext: string;
  iv: string;
  tag: string;
  meta: string | null;
  created_at: string;
}

export interface ApiTokensTable {
  id: string;
  name: string;
  token_hash: string;
  scopes: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface SessionsTable {
  id_hash: string;
  created_at: string;
  expires_at: string;
}

export interface OAuthClientsTable {
  client_id: string;
  client_secret: string | null;
  metadata: string;
  created_at: string;
}

export interface OAuthCodesTable {
  code_hash: string;
  client_id: string;
  code_challenge: string;
  redirect_uri: string;
  scopes: string;
  resource: string | null;
  expires_at: string;
}

export interface OAuthTokensTable {
  token_hash: string;
  kind: string; // 'access' | 'refresh'
  client_id: string;
  scopes: string;
  resource: string | null;
  expires_at: string;
  revoked_at: string | null;
}

export interface PendingActionsTable {
  id: string;
  action: string;
  payload: string;
  summary: string;
  status: string; // 'pending' | 'done' | 'cancelled' | 'expired'
  created_at: string;
  expires_at: string;
}

export interface Database {
  tracks: TracksTable;
  plays: PlaysTable;
  recent_history: RecentHistoryTable;
  library_items: LibraryItemsTable;
  playlists: PlaylistsTable;
  playlist_tracks: PlaylistTracksTable;
  track_annotations: TrackAnnotationsTable;
  profile_inferences: ProfileInferencesTable;
  profile_corrections: ProfileCorrectionsTable;
  feedback: FeedbackTable;
  imports: ImportsTable;
  credentials: CredentialsTable;
  api_tokens: ApiTokensTable;
  sessions: SessionsTable;
  oauth_clients: OAuthClientsTable;
  oauth_codes: OAuthCodesTable;
  oauth_tokens: OAuthTokensTable;
  pending_actions: PendingActionsTable;
}
