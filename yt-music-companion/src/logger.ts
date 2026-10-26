import { pino, type Logger } from "pino";

/**
 * Paths that may carry credentials. pino replaces them with "[redacted]" so
 * cookies, bearer tokens and raw YouTube Music headers never reach the logs.
 */
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "headers.authorization",
  "headers.cookie",
  "*.headers_raw",
  "*.headersRaw",
  "*.auth",
  "*.cookie",
  "*.token",
  "*.access_token",
  "*.refresh_token",
  "*.passphrase",
  "*.apiKey",
];

export function createLogger(level: string): Logger {
  return pino({ level, redact: { paths: REDACT_PATHS, censor: "[redacted]" } });
}
