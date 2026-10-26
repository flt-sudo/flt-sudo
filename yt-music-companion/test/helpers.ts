import crypto from "node:crypto";
import pg from "pg";
import { build } from "../src/bootstrap.js";
import { loadConfig } from "../src/config.js";
import { openDatabase, migrateToLatest } from "../src/db/index.js";
import { createLogger } from "../src/logger.js";
import { HeuristicProvider } from "../src/llm/heuristic.js";
import type { LlmProvider } from "../src/llm/types.js";
import { MockProvider } from "../src/providers/music/mock.js";

export const PASS = "correct horse battery staple";

export function testConfig(extra: Record<string, string> = {}) {
  return loadConfig({
    NODE_ENV: "test",
    MASTER_KEY: crypto.randomBytes(32).toString("base64"),
    APP_PASSPHRASE: PASS,
    MUSIC_PROVIDER: "mock",
    DATABASE_PATH: ":memory:",
    LOG_LEVEL: "silent",
    PORT: "8787",
    ...extra,
  });
}

/**
 * In-memory SQLite by default. Set TEST_DATABASE_URL (a Postgres server URL) to
 * run the same suites against PostgreSQL; each call gets a fresh database.
 */
export async function testDb() {
  const base = process.env.TEST_DATABASE_URL;
  let target = ":memory:";
  if (base) {
    const name = `ymc_test_${crypto.randomBytes(6).toString("hex")}`;
    const admin = new pg.Client({ connectionString: base });
    await admin.connect();
    await admin.query(`create database ${name}`);
    await admin.end();
    const u = new URL(base);
    u.pathname = `/${name}`;
    target = u.toString();
  }
  const db = openDatabase(target);
  await migrateToLatest(db);
  return db;
}

export async function testApp(opts: { llm?: LlmProvider; connected?: boolean } = {}) {
  const cfg = testConfig();
  const provider = new MockProvider();
  const built = await build(cfg, createLogger("silent"), { db: await testDb(), provider, llm: opts.llm ?? new HeuristicProvider(), webDir: "/nonexistent" });
  return { ...built, cfg, mock: provider };
}

/** Takeout-format fixture built from the mock catalog (ids are 11 chars like real ones). */
export function takeoutFixture(mock: MockProvider) {
  const c = mock.catalog;
  const entries: unknown[] = [];
  const push = (i: number, iso: string, header = "YouTube Music") =>
    entries.push({
      header,
      title: `Watched ${c[i]!.title}`,
      titleUrl: `https://music.youtube.com/watch?v=${c[i]!.videoId}`,
      subtitles: [{ name: `${c[i]!.artists[0]} - Topic`, url: "https://www.youtube.com/channel/x" }],
      time: iso,
      products: ["YouTube"],
      activityControls: ["YouTube watch history"],
    });
  // Nova Lune heavy all-time; Arcade Saints heavy recently; Ivo Ren is a recent discovery.
  for (let d = 0; d < 30; d++) push(0, new Date(Date.UTC(2024, 0, 1 + d, 23, 30)).toISOString());
  for (let d = 0; d < 10; d++) push(1, new Date(Date.UTC(2024, 1, 1 + d, 22, 0)).toISOString());
  for (let d = 0; d < 20; d++) push(4, new Date(Date.UTC(2024, 5, 1 + d, 1, 15)).toISOString());
  for (let d = 0; d < 6; d++) push(16, new Date(Date.UTC(2024, 5, 10 + d, 12, 0)).toISOString());
  push(8, "2024-03-03T20:00:00.000Z");
  // Noise that must be skipped:
  entries.push({ header: "YouTube", title: "Watched Cat video", titleUrl: "https://www.youtube.com/watch?v=aaaaaaaaaaa", time: "2024-06-01T00:00:00Z" });
  entries.push({ header: "YouTube Music", title: "Watched a video that has been removed", time: "2024-06-01T00:00:00Z" });
  entries.push({ header: "YouTube Music", title: "Watched Ad", titleUrl: "https://music.youtube.com/watch?v=bbbbbbbbbbb", time: "2024-06-01T00:00:00Z", details: [{ name: "From Google Ads" }] });
  return entries;
}
