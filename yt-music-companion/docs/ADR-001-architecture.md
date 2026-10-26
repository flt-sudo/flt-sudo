# ADR-001: Architecture of the YouTube Music AI Companion

- Status: accepted (MVP)
- Date: 2026-10-26

## Context

You want one assistant that knows your real YouTube Music taste, builds playlists and saves them to your account, and helps with playback on your iPhone. ChatGPT is your preferred interface. Feasibility research (sources are listed at the end) found these limits:

1. **No official YouTube Music API exists.** The official YouTube Data API v3 can create playlists and add items. Those playlists show up in YouTube Music. But the API has no Music-catalog search (`search.list` returns generic videos and costs 100 of the 10,000 daily quota units), no library songs, and **no watch history**. The watch-history list has been empty for API clients since 2016.
2. **ytmusicapi** (v1.12.3, actively maintained) emulates the YouTube Music web client. It supports search, library, liked songs, playlists, `get_history`, radio/up-next, and playlist creation and editing. Auth comes in two forms:
   - **Browser headers**: you copy the request headers of a signed-in browser session. This works today.
   - **OAuth**: since November 2024 this needs your own Google Cloud OAuth client of the "TVs and Limited Input devices" type.
   It is unofficial and can break when Google changes the web client.
3. **Google Takeout** exports `YouTube and YouTube Music/history/watch-history.json`. It is the only source of complete, timestamped listening history. Music plays carry `"header": "YouTube Music"` and `music.youtube.com/watch?v=` URLs. The export is manual. It can be scheduled to repeat every 2 months for a year.
4. **iOS** does not let a server control another app's playback. The YouTube Music app accepts universal links (`https://music.youtube.com/...`) and Siri media requests. The Shortcuts actions Play/Pause, Skip Forward and Skip Back act on the current Now Playing app, but only when you run them on the phone. Shortcuts "Get Current Song" only covers Apple Music, so no app can read what YouTube Music is playing right now.
5. **ChatGPT** can call an external backend only as a **remote MCP server** over HTTPS, added as a custom connector/app in **developer mode**. OpenAI's help center lists full MCP (write actions) for Business, Enterprise and Edu workspaces on the web. Earlier coverage said Plus and Pro had access, and recent third-party reports disagree. Treat eligibility as uncertain and check your own account. An ordinary ChatGPT chat cannot call an arbitrary API.

## Decisions

| Decision | Choice | Why / tradeoff |
|---|---|---|
| Backend language | TypeScript on Node 22 with Express 5 | Your preference. Express is needed by the official MCP SDK's OAuth helpers. |
| YouTube Music access | ytmusicapi, isolated in `adapter/ytm_adapter.py`. It is a long-lived subprocess speaking newline-delimited JSON over stdin/stdout, with a typed TS client (`YTMusicProvider`) behind the `MusicProvider` interface. | ytmusicapi is the only practical way to get search, library and history. Isolating it keeps Python at about 200 lines. Credentials travel only over stdin. A future official-API provider can implement the same interface for the playlist subset. |
| Auth to YouTube Music | Browser-header auth, pasted once and stored AES-256-GCM encrypted | This method works without a Google Cloud project. ytmusicapi OAuth can be added later as an alternative (see the roadmap). |
| Full history | Google Takeout JSON import, idempotent (unique on `(video_id, played_at, source)`) | It is the only complete source. Re-importing newer exports only adds new plays. |
| Database | SQLite through **Kysely**. Text UUID keys, ISO timestamps and JSON-as-text, with no dialect-specific SQL in migrations. | Zero-ops on one machine. Moving to PostgreSQL means switching to `PostgresDialect` in `src/db/index.ts` and copying data. |
| LLM | `LlmProvider` interface implemented with the official Anthropic SDK (default `claude-opus-5-5`, adaptive thinking, effort `medium`) and the official OpenAI SDK (Chat Completions with structured outputs and tools). A rule-based fallback runs when no key is set. | Each provider owns its tool loop with native types. Structured outputs (Zod schemas) keep parsing reliable. The rule-based mode keeps the app usable and testable without keys. |
| Hallucination control | The LLM proposes criteria, search queries and candidate songs. **Every song is verified through YouTube Music search before it can be used.** The final pick step may only choose from verified videoIds; any other id is ignored. | Recommendations can't contain made-up songs. Unverifiable suggestions are counted and reported. |
| Mood and energy data | AI-estimated per-track annotations, stored with `source` and `model` | YouTube Music exposes no audio features. Estimates are labelled as such everywhere. |
| Observed vs inferred | `computeObserved()` is pure SQL and arithmetic over imported rows. AI inferences live in a separate table with confidence and evidence. User corrections override both. | This meets the "don't invent statistics" requirement and lets you correct the profile. |
| Interfaces | A single **tool registry** (`src/tools/registry.ts`) with Zod schemas, consumed by REST (`/api/tools/:name` plus aliases), the MCP server (`/mcp`) and the in-app chat agent | One behaviour across ChatGPT, the PWA and Shortcuts. |
| ChatGPT | Stateless Streamable-HTTP MCP endpoint with a built-in OAuth 2.1 server: dynamic client registration, PKCE, a consent screen gated by your passphrase, hashed and rotating tokens, and revocation | ChatGPT connectors support OAuth or no auth, and no-auth is unacceptable for personal data. |
| iPhone UI | Vanilla-TS PWA (about 19 kB of JS), dark, safe-area aware, 44 px touch targets | Fast, installable to the Home Screen, no framework churn. |
| Playback | Deep links plus iOS Shortcuts recipes. The server never claims playback started (`playbackConfirmed: false`). | That is what iOS permits. |
| Destructive operations | New playlists are created directly (private by default). Adding to a playlist the app did not create returns a `confirmation_required` record that must be confirmed. Deleting playlists is not implemented. | Matches the "confirm before modifying" requirement. |

## Consequences

- The ytmusicapi path can break without notice. The adapter is small, pinned (`ytmusicapi==1.12.3`) and fails with typed errors (`not_authenticated`, `rate_limited`, …) rather than silently.
- Browser-header credentials are as powerful as a login cookie. They are encrypted at rest, never logged, and removable with Disconnect. Signing out of that browser session invalidates them at Google.
- Without Takeout, the profile relies on library, likes, playlists and the roughly 200-item recent-history snapshot. The UI and the LLM are told which sources exist and how fresh they are.

## Sources

- ytmusicapi docs: setup, [OAuth](https://github.com/sigma67/ytmusicapi/blob/main/docs/source/setup/oauth.rst) ("As of November 2024 … requires a Client Id and Secret") and [browser auth](https://github.com/sigma67/ytmusicapi/blob/main/docs/source/setup/browser.rst); PyPI release 1.12.3
- [YouTube Data API quota costs](https://developers.google.com/youtube/v3/determine_quota_cost) (search.list 100 units; playlistItems.insert 50; 10,000 per day default)
- [OpenAI: Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt-beta)
- [OpenAI Devs announcement of full MCP support in developer mode](https://x.com/OpenAIDevs/status/1965807401745207708)
- Takeout format: [google_takeout_parser](https://github.com/purarue/google_takeout_parser) (`YouTube and YouTube Music/history/watch-history.json`, "My Activity" JSON schema)
- YouTube Music Siri support: [Android Police (2019)](https://www.androidpolice.com/2019/10/28/youtube-music-adds-siri-support-on-ios-while-assistant-integration-remains-laughably-inconsistent/)
