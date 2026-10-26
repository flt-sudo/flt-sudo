import type { Logger } from "pino";
import type { Config } from "./config.js";
import { type DB, migrateToLatest, openDatabase } from "./db/index.js";
import { PlaylistEngine } from "./engine/playlist.js";
import { createApp } from "./http/app.js";
import { createLlm } from "./llm/index.js";
import type { LlmProvider } from "./llm/types.js";
import { createMusicProvider, MockProvider, type MusicProvider } from "./providers/music/index.js";
import { AuthService } from "./security/auth.js";
import { CredentialStore } from "./security/credentials.js";
import { SqliteOAuthProvider } from "./security/oauth.js";
import type { ToolContext } from "./tools/registry.js";

export interface Built {
  app: ReturnType<typeof createApp>;
  db: DB;
  provider: MusicProvider;
  llm: LlmProvider;
  auth: AuthService;
  oauth: SqliteOAuthProvider;
  toolCtx: ToolContext;
  close: () => Promise<void>;
}

/** Wires everything together. Tests pass overrides (in-memory DB, mock provider, fake LLM). */
export async function build(cfg: Config, log: Logger, overrides: { db?: DB; provider?: MusicProvider; llm?: LlmProvider; webDir?: string } = {}): Promise<Built> {
  const db = overrides.db ?? openDatabase(cfg.DATABASE_PATH);
  await migrateToLatest(db);
  const provider = overrides.provider ?? createMusicProvider(cfg, log);
  const llm = overrides.llm ?? createLlm(cfg);
  const credentials = new CredentialStore(db, cfg.masterKey);
  const stored = await credentials.get("ytmusic").catch(() => {
    log.error("Stored YouTube Music credential could not be decrypted (MASTER_KEY changed?). Reconnect in Settings.");
    return null;
  });
  await provider.configure(stored);
  const oauth = new SqliteOAuthProvider(db, cfg.masterKey, cfg.APP_PASSPHRASE);
  const auth = new AuthService(db, cfg.APP_PASSPHRASE, (t) => oauth.optionalVerify(t));
  const tagSource = provider instanceof MockProvider ? (id: string) => provider.tagsFor(id) : undefined;
  const engine = new PlaylistEngine({ db, provider, llm, timezone: cfg.USER_TIMEZONE, tagSource });
  const toolCtx: ToolContext = { db, provider, llm, engine, cfg, log };
  const app = createApp({ cfg, db, provider, llm, auth, credentials, oauth, toolCtx, log, webDir: overrides.webDir });
  return {
    app,
    db,
    provider,
    llm,
    auth,
    oauth,
    toolCtx,
    close: async () => {
      await provider.close();
      await db.destroy();
    },
  };
}
