# Database

SQLite via [Kysely](https://kysely.dev). Types are in `src/db/schema.ts`; migrations are in `src/db/migrations.ts` and run automatically at startup (or `npm run migrate`).

Portability rules that keep PostgreSQL a drop-in:

- Text primary keys (UUIDs or provider ids), no autoincrement.
- ISO-8601 UTC timestamps stored as text.
- JSON stored as text.
- Booleans stored as 0/1 integers.
- Only the Kysely schema builder in migrations. No raw dialect SQL except `drop table`.

| Table | Contents |
|---|---|
| `tracks` | One row per videoId: title, artists (JSON), primary artist, album, duration, availability |
| `plays` | **Observed** timestamped plays from Takeout; unique `(video_id, played_at, source)` |
| `recent_history` | Latest YouTube Music history snapshot (position, coarse bucket, captured_at) |
| `library_items` | Liked songs and library songs (replaced on each sync) |
| `playlists`, `playlist_tracks` | Synced YouTube Music playlists (`origin=ytm`) and generated drafts (`origin=generated`, `remote_id` once saved, `created_by_app`) |
| `track_annotations` | **Inferred** energy, valence, moods and genres per track, with `source` and `model` |
| `profile_inferences` | **Inferred** taste traits with weight, confidence and evidence |
| `profile_corrections` | Your overrides |
| `feedback` | Thumbs up/down on tracks |
| `imports` | Import/sync log: status, stats, data range |
| `credentials` | Sealed provider credentials (ciphertext, IV, tag) |
| `api_tokens`, `sessions` | Hashed tokens and sessions |
| `oauth_clients`, `oauth_codes`, `oauth_tokens` | MCP OAuth server state (codes and tokens hashed) |
| `pending_actions` | Changes awaiting your confirmation |

## Moving to PostgreSQL

1. `npm i pg`, then in `src/db/index.ts` replace `SqliteDialect` with `new PostgresDialect({ pool: new Pool({ connectionString }) })`.
2. Start once to run migrations.
3. Copy data: `GET /api/data/export` from the old instance, then insert the rows in table order. Credentials aren't exported, so reconnect YouTube Music afterwards.
