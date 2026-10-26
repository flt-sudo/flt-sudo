/**
 * Creates .env with a fresh MASTER_KEY and passphrase. Refuses to overwrite an
 * existing .env (losing MASTER_KEY makes stored credentials unreadable).
 */
import crypto from "node:crypto";
import fs from "node:fs";

const target = process.argv[2] ?? ".env";
if (fs.existsSync(target)) {
  console.error(`${target} already exists; not overwriting. Delete it first if you really want new keys.`);
  process.exit(1);
}
const words = crypto.randomBytes(18).toString("base64url");
const content = fs
  .readFileSync(".env.example", "utf8")
  .replace(/^MASTER_KEY=.*$/m, `MASTER_KEY=${crypto.randomBytes(32).toString("base64")}`)
  .replace(/^APP_PASSPHRASE=.*$/m, `APP_PASSPHRASE=${words}`);
fs.writeFileSync(target, content, { mode: 0o600 });
console.log(`Wrote ${target} (mode 600).`);
console.log(`Your app passphrase: ${words}`);
console.log("Store it in your password manager. Change it any time by editing APP_PASSPHRASE.");
