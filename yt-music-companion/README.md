# YouTube Music AI Companion

A private, single-user assistant that learns your **actual** YouTube Music taste. It builds and saves playlists, and opens music on your iPhone. You can use it from an iPhone PWA, from iOS Shortcuts, or from ChatGPT as a remote MCP server.

> Status: functional MVP. All flows are tested end-to-end against a mock provider. Live YouTube Music calls need your account; see "What's verified" below.

## Quick start

```bash
cd yt-music-companion
npm install
python3 -m venv .venv && .venv/bin/pip install -r adapter/requirements.txt   # ytmusicapi adapter
npm run init-env          # writes .env with MASTER_KEY + a passphrase (shown once)
# edit .env: PUBLIC_BASE_URL, USER_TIMEZONE, LLM_PROVIDER + key
npm run build
node --env-file=.env dist/src/server.js
```

Open `http://127.0.0.1:8787` and log in with the passphrase. Then:

1. **Connect YouTube Music** in Settings.
2. **Import your Takeout history.**
3. **Sync your library.**
4. **Ask away.**

To reach it from your phone, see [docs/iphone-setup.md](docs/iphone-setup.md) (HTTPS via Tailscale, Cloudflare Tunnel or a VPS).

**Demo without an account:**

```bash
MUSIC_PROVIDER=mock LLM_PROVIDER=none node --env-file=.env dist/src/server.js
```

This uses a clearly fictional 20-song catalog.

**Docker:**

```bash
docker build -t ymc .
docker run --env-file .env -v ymc:/data -p 127.0.0.1:8787:8787 ymc
```

## What you can say

The assistant understands requests like these:

- "Analyze my music taste." Returns observed stats plus labelled AI-inferred traits and data freshness.
- "Build me a playlist for a romantic night in Miami." Produces a sequenced draft, which you can save to YouTube Music.
- "Find 15 songs that match the energy of *Song* without repeating the same artist."
- "Build a 90-minute late-night driving playlist."
- "Play something based on my current mood." Your mood can't be sensed, so it uses your recent listening as the seed and says so.
- "Add this song to my late-night playlist." It asks for confirmation for existing playlists.
- "What have I been listening to most recently?"
- "Skip this song." It explains the iPhone Shortcut / Siri / Control Center options; the server can't control playback.

## Repository layout

```
adapter/            Python ytmusicapi bridge (JSON lines over stdio) + unit tests
src/
  config.ts         env validation          logger.ts   pino with secret redaction
  db/               Kysely schema + portable migrations (SQLite → Postgres)
  security/         AES-GCM credential vault, sessions/API tokens, OAuth 2.1 server for MCP
  providers/music/  MusicProvider interface, ytmusicapi client (retry/throttle), mock catalog
  ingest/           Google Takeout parser/importer, YouTube Music library sync
  profile/          observed stats (pure data) + AI inferences + user corrections
  llm/              provider abstraction: Anthropic SDK, OpenAI SDK, rule-based fallback
  engine/           NL → criteria, candidate generation, verification, ranking, sequencing
  playback/         deep links + capability matrix
  tools/            the tool registry shared by REST, MCP and chat
  agent/            chat agent (system prompt + tool loop)
  http/             Express app, MCP endpoint
web/                iPhone-first PWA (vanilla TS, Vite)
docs/               ADR, capability matrix, API, iPhone, ChatGPT, security, database, roadmap
test/               vitest suites (unit + API + MCP/OAuth + bridge)
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run build` | Typecheck server and web, build the PWA |
| `npm test` / `npm run test:py` | TS tests / Python adapter tests (use `.venv/bin/python -m unittest discover -s adapter` if `python3` lacks ytmusicapi) |
| `npm run import:takeout -- <watch-history.json>` | CLI import for big exports |
| `npm run migrate` | Apply DB migrations |
| `npm run init-env` | Generate `.env` secrets |
| `npm run dev` | Watch mode (API); `npx vite` for PWA hot reload |

## What's verified (and what isn't)

| Verified in this repo | Not verifiable here (needs you) |
|---|---|
| 34 TS tests + 7 Python tests covering: Takeout parsing and idempotent import, observed stats, corrections, encryption, tokens and scopes, CSRF, sequencing, dedupe, the engine (rule-based and scripted-LLM, including hallucination rejection), every API flow, confirmation gating, export/delete, the full OAuth + MCP flow, and the real Node↔Python bridge | Live ytmusicapi calls (the build sandbox can't reach music.youtube.com) |
| PWA driven by Playwright at iPhone 13 size against the real built server: login, connect, import, sync, generate, save (verified), skip guidance, confirm-gated add | Real Anthropic/OpenAI calls (no keys in the build env; code follows the official SDKs) |
| | iOS universal-link hand-off and Shortcuts playback actions on your device |
| | Connecting ChatGPT (needs deployment and an eligible plan) |
| | The Dockerfile (no Docker daemon in the build env) |

See [docs/capability-matrix.md](docs/capability-matrix.md) for the full works / doesn't-work table and [docs/ADR-001-architecture.md](docs/ADR-001-architecture.md) for the research and decisions.

## LLM notes

- **Anthropic** (default model `claude-opus-5-5`):
  - Uses adaptive thinking with effort `medium`, configurable via `ANTHROPIC_EFFORT`.
  - Enables the server-side refusal **fallback** beta by default. Set `ANTHROPIC_FALLBACKS=off` to disable.
- **OpenAI**: set `OPENAI_MODEL` (default `gpt-5`) to whatever model your account uses.
- **No key**: a transparent rule-based parser and router. It never suggests songs from memory.

## Next steps

See [docs/roadmap.md](docs/roadmap.md).
