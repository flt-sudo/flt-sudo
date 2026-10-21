// Applies supabase/migrations/*.sql in order, tracking what has run.
// Alternative to `supabase db push` for self-hosted setups.
// Usage: npm run db:migrate   (uses DATABASE_URL; requires a role that can create types/tables)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1, prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require", onnotice: () => {} });
const dir = join(process.cwd(), "supabase/migrations");
try {
  await sql`create table if not exists public._creator_radar_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from public._creator_radar_migrations`).map((r) => r.name as string));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    await sql.begin(async (tx) => {
      await tx.unsafe(readFileSync(join(dir, file), "utf8"));
      await tx`insert into public._creator_radar_migrations (name) values (${file})`;
    });
    console.log(`applied ${file}`);
  }
  console.log("migrations up to date");
} finally {
  await sql.end();
}
