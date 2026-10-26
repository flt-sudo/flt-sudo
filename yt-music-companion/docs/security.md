# Security & privacy

| Concern | Measure |
|---|---|
| Hardcoded secrets | None. Config comes from env and is validated by Zod (`src/config.ts`); error messages name the bad variable, never its value. `npm run init-env` writes a mode-600 `.env`. |
| Credential storage | YouTube Music headers are sealed with AES-256-GCM using `MASTER_KEY`, with the provider name bound as AAD (`src/security/crypto.ts`). They are decrypted only in memory and sent to the Python adapter over stdin, never argv, env or disk. |
| Logging | pino redaction removes `authorization`, `cookie`, `set-cookie`, raw headers, tokens and API keys. The Python adapter never echoes params in errors (tested). |
| App login | Single passphrase, constant-time compared. Rate limit: 10 attempts per 15 minutes. Session cookie is `HttpOnly`, `SameSite=Strict`, `Secure` behind HTTPS, and its value is stored only as a SHA-256 hash. |
| CSRF | SameSite=Strict, plus an Origin check on cookie-authenticated writes. OAuth consent parameters are HMAC-signed. |
| API tokens | Random 256-bit, stored as hashes, scoped (`music:read` / `music:write`), revocable, last-used tracked. Account-management routes accept only the session cookie. |
| ChatGPT / MCP | OAuth 2.1 with PKCE (S256), DCR, passphrase-gated consent, 1-hour access tokens, rotating 30-day refresh tokens, per-client revocation. Read-only grants don't expose write tools. |
| Least privilege | Shortcut tokens default to read-only. Created playlists are PRIVATE by default. No delete-playlist capability exists. |
| Destructive changes | Modifying a playlist the app didn't create needs a single-use, 15-minute confirmation. `DELETE /api/data` requires a typed confirmation phrase. |
| Exposure | Binds to 127.0.0.1 by default and warns when exposed without HTTPS. Security headers: CSP, HSTS (on HTTPS), `nosniff`, `frame-ancestors 'none'`, no-referrer. |
| Rate limiting | Global 300/min; AI-heavy routes 20/min; client-side throttle and retry with jittered backoff for YouTube Music (writes are not auto-retried, so a timeout can't create a playlist twice). |
| Data ownership | `GET /api/data/export` downloads everything. `DELETE /api/data` deletes it; `everything: true` also wipes credentials and tokens. The SQLite file is created mode 600. The service worker never caches `/api`. |
| Disconnect / revocation | Settings → Disconnect deletes the sealed credential. To kill it at Google too, sign out of the browser session you copied the headers from. Revoke API tokens and OAuth clients individually. |

**Rotating `MASTER_KEY`** makes stored credentials unreadable. The server logs this and you reconnect. Back up `.env` with your password manager.
