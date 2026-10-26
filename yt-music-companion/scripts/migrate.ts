import { loadConfig } from "../src/config.js";
import { migrateToLatest, openDatabase } from "../src/db/index.js";

const cfg = loadConfig();
const db = openDatabase(cfg.DATABASE_PATH);
await migrateToLatest(db);
console.log(`Database at ${cfg.DATABASE_PATH} is up to date.`);
await db.destroy();
