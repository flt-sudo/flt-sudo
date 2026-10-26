import { type Kysely, sql } from "kysely";
import type { Migration, MigrationProvider } from "kysely/migration";

/**
 * Migrations use only the portable Kysely schema builder (text/integer/real
 * columns, no autoincrement), so the same files run on SQLite and PostgreSQL.
 */
const m001: Migration = {
  async up(db: Kysely<any>) {
    await db.schema
      .createTable("tracks")
      .addColumn("video_id", "text", (c) => c.primaryKey())
      .addColumn("title", "text", (c) => c.notNull())
      .addColumn("artists", "text", (c) => c.notNull())
      .addColumn("primary_artist", "text", (c) => c.notNull())
      .addColumn("album", "text")
      .addColumn("duration_s", "integer")
      .addColumn("is_available", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("updated_at", "text", (c) => c.notNull())
      .execute();
    await db.schema.createIndex("tracks_primary_artist").on("tracks").column("primary_artist").execute();

    await db.schema
      .createTable("plays")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("video_id", "text", (c) => c.notNull())
      .addColumn("played_at", "text", (c) => c.notNull())
      .addColumn("source", "text", (c) => c.notNull())
      .addColumn("import_id", "text", (c) => c.notNull())
      .addUniqueConstraint("plays_unique", ["video_id", "played_at", "source"])
      .execute();
    await db.schema.createIndex("plays_played_at").on("plays").column("played_at").execute();
    await db.schema.createIndex("plays_video").on("plays").column("video_id").execute();

    await db.schema
      .createTable("recent_history")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("video_id", "text", (c) => c.notNull())
      .addColumn("position", "integer", (c) => c.notNull())
      .addColumn("played_bucket", "text")
      .addColumn("captured_at", "text", (c) => c.notNull())
      .addColumn("import_id", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("library_items")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("kind", "text", (c) => c.notNull())
      .addColumn("video_id", "text", (c) => c.notNull())
      .addColumn("captured_at", "text", (c) => c.notNull())
      .addColumn("import_id", "text", (c) => c.notNull())
      .addUniqueConstraint("library_unique", ["kind", "video_id"])
      .execute();

    await db.schema
      .createTable("playlists")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("title", "text", (c) => c.notNull())
      .addColumn("description", "text")
      .addColumn("origin", "text", (c) => c.notNull())
      .addColumn("remote_id", "text")
      .addColumn("created_by_app", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("criteria", "text")
      .addColumn("explanation", "text")
      .addColumn("track_count", "integer", (c) => c.notNull().defaultTo(0))
      .addColumn("created_at", "text", (c) => c.notNull())
      .addColumn("updated_at", "text", (c) => c.notNull())
      .addColumn("saved_at", "text")
      .execute();
    await db.schema.createIndex("playlists_remote").on("playlists").column("remote_id").execute();

    await db.schema
      .createTable("playlist_tracks")
      .addColumn("playlist_id", "text", (c) => c.notNull())
      .addColumn("position", "integer", (c) => c.notNull())
      .addColumn("video_id", "text", (c) => c.notNull())
      .addColumn("reason", "text")
      .addPrimaryKeyConstraint("playlist_tracks_pk", ["playlist_id", "position"])
      .execute();

    await db.schema
      .createTable("track_annotations")
      .addColumn("video_id", "text", (c) => c.primaryKey())
      .addColumn("energy", "real")
      .addColumn("valence", "real")
      .addColumn("moods", "text", (c) => c.notNull())
      .addColumn("genres", "text", (c) => c.notNull())
      .addColumn("source", "text", (c) => c.notNull())
      .addColumn("model", "text")
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("profile_inferences")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("kind", "text", (c) => c.notNull())
      .addColumn("value", "text", (c) => c.notNull())
      .addColumn("weight", "real", (c) => c.notNull())
      .addColumn("confidence", "real", (c) => c.notNull())
      .addColumn("evidence", "text")
      .addColumn("model", "text")
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("profile_corrections")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("kind", "text", (c) => c.notNull())
      .addColumn("value", "text", (c) => c.notNull())
      .addColumn("note", "text")
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("feedback")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("video_id", "text", (c) => c.notNull())
      .addColumn("rating", "integer", (c) => c.notNull())
      .addColumn("context", "text")
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("imports")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("kind", "text", (c) => c.notNull())
      .addColumn("status", "text", (c) => c.notNull())
      .addColumn("started_at", "text", (c) => c.notNull())
      .addColumn("finished_at", "text")
      .addColumn("stats", "text")
      .addColumn("data_from", "text")
      .addColumn("data_through", "text")
      .addColumn("error", "text")
      .execute();

    await db.schema
      .createTable("credentials")
      .addColumn("provider", "text", (c) => c.primaryKey())
      .addColumn("ciphertext", "text", (c) => c.notNull())
      .addColumn("iv", "text", (c) => c.notNull())
      .addColumn("tag", "text", (c) => c.notNull())
      .addColumn("meta", "text")
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("api_tokens")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("name", "text", (c) => c.notNull())
      .addColumn("token_hash", "text", (c) => c.notNull().unique())
      .addColumn("scopes", "text", (c) => c.notNull())
      .addColumn("created_at", "text", (c) => c.notNull())
      .addColumn("last_used_at", "text")
      .addColumn("revoked_at", "text")
      .execute();

    await db.schema
      .createTable("sessions")
      .addColumn("id_hash", "text", (c) => c.primaryKey())
      .addColumn("created_at", "text", (c) => c.notNull())
      .addColumn("expires_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("oauth_clients")
      .addColumn("client_id", "text", (c) => c.primaryKey())
      .addColumn("client_secret", "text")
      .addColumn("metadata", "text", (c) => c.notNull())
      .addColumn("created_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("oauth_codes")
      .addColumn("code_hash", "text", (c) => c.primaryKey())
      .addColumn("client_id", "text", (c) => c.notNull())
      .addColumn("code_challenge", "text", (c) => c.notNull())
      .addColumn("redirect_uri", "text", (c) => c.notNull())
      .addColumn("scopes", "text", (c) => c.notNull())
      .addColumn("resource", "text")
      .addColumn("expires_at", "text", (c) => c.notNull())
      .execute();

    await db.schema
      .createTable("oauth_tokens")
      .addColumn("token_hash", "text", (c) => c.primaryKey())
      .addColumn("kind", "text", (c) => c.notNull())
      .addColumn("client_id", "text", (c) => c.notNull())
      .addColumn("scopes", "text", (c) => c.notNull())
      .addColumn("resource", "text")
      .addColumn("expires_at", "text", (c) => c.notNull())
      .addColumn("revoked_at", "text")
      .execute();

    await db.schema
      .createTable("pending_actions")
      .addColumn("id", "text", (c) => c.primaryKey())
      .addColumn("action", "text", (c) => c.notNull())
      .addColumn("payload", "text", (c) => c.notNull())
      .addColumn("summary", "text", (c) => c.notNull())
      .addColumn("status", "text", (c) => c.notNull())
      .addColumn("created_at", "text", (c) => c.notNull())
      .addColumn("expires_at", "text", (c) => c.notNull())
      .execute();
  },
  async down(db: Kysely<any>) {
    for (const t of [
      "pending_actions", "oauth_tokens", "oauth_codes", "oauth_clients", "sessions", "api_tokens",
      "credentials", "imports", "feedback", "profile_corrections", "profile_inferences",
      "track_annotations", "playlist_tracks", "playlists", "library_items", "recent_history",
      "plays", "tracks",
    ]) {
      await sql`drop table if exists ${sql.table(t)}`.execute(db);
    }
  },
};

export const migrations: Record<string, Migration> = {
  "001_initial": m001,
};

export const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};
