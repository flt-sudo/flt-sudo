// Creates a throwaway database, applies the Supabase shim and all migrations.
// Requires TEST_DATABASE_URL pointing at a Postgres server whose user can create
// databases, e.g. postgres://postgres:postgres@localhost:5432/postgres
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

export const TEST_DB_URL = process.env.TEST_DATABASE_URL;

export async function freshDatabase(name: string): Promise<postgres.Sql> {
  if (!TEST_DB_URL) throw new Error("TEST_DATABASE_URL not set");
  const admin = postgres(TEST_DB_URL, { max: 1, onnotice: () => {} });
  await admin.unsafe(`drop database if exists ${name} with (force)`);
  await admin.unsafe(`create database ${name}`);
  await admin.end();

  const url = new URL(TEST_DB_URL);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 4, prepare: false, onnotice: () => {} });
  const root = join(__dirname, "..", "..");
  await sql.unsafe(readFileSync(join(root, "tests/db/supabase-shim.sql"), "utf8"));
  const dir = join(root, "supabase/migrations");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await sql.unsafe(readFileSync(join(dir, f), "utf8"));
  }
  return sql;
}

/** Runs fn as a Supabase-authenticated user (or anon) inside a rolled-back transaction. */
export async function asRole<T>(
  sql: postgres.Sql,
  who: { role: "anon" | "authenticated"; sub?: string },
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  let result: T;
  await sql
    .begin(async (tx) => {
      await tx.unsafe(`set local role ${who.role}`);
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: who.sub ?? "", role: who.role })}, true)`;
      result = await fn(tx);
      throw new Rollback();
    })
    .catch((e) => {
      if (!(e instanceof Rollback)) throw e;
    });
  return result!;
}

class Rollback extends Error {}

/** Asserts a statement fails without aborting the surrounding transaction. */
export async function expectFailure(tx: postgres.TransactionSql, query: (sp: postgres.TransactionSql) => Promise<unknown>, pattern: RegExp) {
  let error: unknown = null;
  await tx.savepoint(async (sp) => query(sp)).catch((e) => (error = e));
  if (!error) throw new Error(`expected failure matching ${pattern}`);
  if (!pattern.test(String((error as Error).message))) throw error;
}
