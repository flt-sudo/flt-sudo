import fs from "node:fs";
import path from "node:path";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Migrator } from "kysely/migration";
import { migrationProvider } from "./migrations.js";
import type { Database } from "./schema.js";

export type DB = Kysely<Database>;

/**
 * Opens the SQLite database. To move to PostgreSQL, replace SqliteDialect with
 * Kysely's PostgresDialect here; queries and migrations are dialect-neutral.
 */
export function openDatabase(file: string): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new SQLite(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  if (file !== ":memory:") {
    // Personal data: owner read/write only.
    try {
      fs.chmodSync(file, 0o600);
    } catch {
      /* best effort on filesystems without POSIX modes */
    }
  }
  return new Kysely<Database>({ dialect: new SqliteDialect({ database: sqlite }) });
}

export async function migrateToLatest(db: DB): Promise<void> {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error, results } = await migrator.migrateToLatest();
  const failed = results?.find((r) => r.status === "Error");
  if (error || failed) {
    throw new Error(`Migration failed${failed ? ` at ${failed.migrationName}` : ""}: ${String(error)}`);
  }
}

export const nowIso = (): string => new Date().toISOString();
