import { z } from "zod";

/**
 * All runtime configuration comes from environment variables (or a local .env
 * loaded by the process manager / `node --env-file`). Nothing secret is ever
 * hardcoded; secrets are validated here and never logged.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().positive().default(8787),
  /** Public HTTPS origin used for OAuth issuer + absolute links, e.g. https://music.example.com */
  PUBLIC_BASE_URL: z.string().url().optional(),
  DATABASE_PATH: z.string().default("./data/companion.sqlite"),

  /** 32-byte key, base64. Encrypts stored credentials (AES-256-GCM). */
  MASTER_KEY: z.string().min(1, "MASTER_KEY is required (run `npm run init-env`)"),
  /** Single-user login passphrase for the PWA and OAuth consent screen. */
  APP_PASSPHRASE: z.string().min(12, "APP_PASSPHRASE must be at least 12 characters"),

  MUSIC_PROVIDER: z.enum(["ytmusic", "mock"]).default("ytmusic"),
  PYTHON_BIN: z.string().default("python3"),
  YTM_ADAPTER_PATH: z.string().default("./adapter/ytm_adapter.py"),
  /** Minimum ms between calls to YouTube Music (client-side rate limit). */
  YTM_MIN_INTERVAL_MS: z.coerce.number().int().nonnegative().default(350),
  /**
   * Hosted mode: call the adapter over HTTPS (api/ytm.py on Vercel) instead of a
   * local subprocess. Requests are authenticated with YTM_ADAPTER_SECRET.
   */
  YTM_ADAPTER_URL: z.string().url().optional(),
  YTM_ADAPTER_SECRET: z.string().min(32).optional(),

  LLM_PROVIDER: z.enum(["anthropic", "openai", "none"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  ANTHROPIC_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("medium"),
  /** Server-side refusal fallback (Anthropic beta). Set to "off" to disable. */
  ANTHROPIC_FALLBACKS: z.enum(["default", "off"]).default("default"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5"),

  /** IANA zone used for listening-hour stats (Takeout timestamps are UTC). */
  USER_TIMEZONE: z.string().default("UTC").refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "USER_TIMEZONE must be an IANA time zone like America/New_York"),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type Config = z.infer<typeof EnvSchema> & { masterKey: Buffer };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const merged = { ...env };
  // Hosted conveniences: DATABASE_URL and Vercel's production domain.
  if (merged.DATABASE_URL && !merged.DATABASE_PATH) merged.DATABASE_PATH = merged.DATABASE_URL;
  if (!merged.PUBLIC_BASE_URL && merged.VERCEL_PROJECT_PRODUCTION_URL) merged.PUBLIC_BASE_URL = `https://${merged.VERCEL_PROJECT_PRODUCTION_URL}`;
  const parsed = EnvSchema.safeParse(merged);
  if (!parsed.success) {
    // Only report which variables are wrong, never their values.
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid configuration:\n  ${issues}`);
  }
  const cfg = parsed.data;
  const masterKey = Buffer.from(cfg.MASTER_KEY, "base64");
  if (masterKey.length !== 32) {
    throw new Error("MASTER_KEY must be 32 bytes encoded as base64 (run `npm run init-env`)");
  }
  if (cfg.LLM_PROVIDER === "anthropic" && !cfg.ANTHROPIC_API_KEY) {
    throw new Error("LLM_PROVIDER=anthropic requires ANTHROPIC_API_KEY");
  }
  if (cfg.LLM_PROVIDER === "openai" && !cfg.OPENAI_API_KEY) {
    throw new Error("LLM_PROVIDER=openai requires OPENAI_API_KEY");
  }
  if (cfg.YTM_ADAPTER_URL && !cfg.YTM_ADAPTER_SECRET) {
    throw new Error("YTM_ADAPTER_URL requires YTM_ADAPTER_SECRET (>= 32 chars)");
  }
  if (cfg.NODE_ENV === "production" && cfg.HOST !== "127.0.0.1" && !cfg.PUBLIC_BASE_URL) {
    throw new Error("PUBLIC_BASE_URL is required when binding to a non-loopback host in production");
  }
  return { ...cfg, masterKey };
}

export function baseUrl(cfg: Config): string {
  return (cfg.PUBLIC_BASE_URL ?? `http://${cfg.HOST}:${cfg.PORT}`).replace(/\/$/, "");
}
