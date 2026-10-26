/** Usage: npm run import:takeout -- "/path/to/Takeout/YouTube and YouTube Music/history/watch-history.json" [--include-youtube] */
import fs from "node:fs";
import { loadConfig } from "../src/config.js";
import { migrateToLatest, openDatabase } from "../src/db/index.js";
import { importTakeout } from "../src/ingest/takeout.js";

const file = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!file) {
  console.error('Usage: npm run import:takeout -- "<path>/watch-history.json" [--include-youtube]');
  process.exit(1);
}
if (file.endsWith(".html")) {
  console.error("This is the HTML export. Re-export from Google Takeout with history format set to JSON.");
  process.exit(1);
}
const cfg = loadConfig();
const db = openDatabase(cfg.DATABASE_PATH);
await migrateToLatest(db);
const res = await importTakeout(db, JSON.parse(fs.readFileSync(file, "utf8")), { includeYouTube: process.argv.includes("--include-youtube") });
console.log(JSON.stringify(res, null, 2));
await db.destroy();
