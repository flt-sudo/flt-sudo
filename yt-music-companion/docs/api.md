# API

All `/api/*` routes except `/api/health`, `/api/auth/login` and `/api/auth/logout` require one of:

- **Session cookie**: the PWA, after passphrase login. Full access.
- **Personal API token**: `Authorization: Bearer ymc_…`, created in Settings. Scopes are `music:read` and `music:write`. Used by iOS Shortcuts and scripts. Account-management routes are session-only.
- **OAuth access token**: issued to MCP clients such as ChatGPT through `/authorize` and `/token`.

Errors are always `{"error": "<code>", "message": "<human readable>"}`. Codes:

| Code | HTTP status |
|---|---|
| `unauthorized` | 401 |
| `forbidden` | 403 |
| `invalid_params` | 400 |
| `not_found` | 404 |
| `not_authenticated` (YouTube Music not connected) | 409 |
| `rate_limited` | 429 |
| `remote_error` | 502 |

Rate limits:

- 300 requests per minute globally.
- 20 per minute for chat, recommendation and playlist generation.
- 10 login attempts per 15 minutes.

## Tools

These are the same tools exposed over REST, MCP and chat.

`POST /api/tools/<name>` with the JSON input. `GET /api/tools` lists them with JSON Schemas.

| Tool | Scope | Input | Notes |
|---|---|---|---|
| `get_music_profile` | read | `{refreshInferences?}` | Observed stats, AI-inferred traits (labelled), corrections, `freshness` text |
| `get_recent_listening` | read | `{sync?, limit?}` | YouTube Music history snapshot plus the last 90 days of Takeout data |
| `search_music` | read | `{query, type?: songs\|videos, limit?}` | Available tracks only |
| `recommend_tracks` | read | `{request, count?, discovery?}` | Verified tracks with reasons; not saved |
| `generate_playlist` | read | `{request, count?, durationMinutes?, discovery?}` | Sequenced **local draft**; returns `playlistId` |
| `create_playlist` | write | `{playlistId}` or `{title, videoIds}`, `privacy?` | Creates a **new** YouTube Music playlist (PRIVATE default) and returns `created_verified` / `created_unverified` |
| `add_tracks_to_playlist` | write | `{playlist, videoIds}` | `confirmation_required` + `confirmationId` unless the app created the playlist |
| `confirm_action` | write | `{confirmationId, confirm}` | Single-use; expires after 15 minutes |
| `list_playlists` | read | `{includeTracks?}` | Synced playlists and drafts |
| `open_music` | read | `{kind: track\|playlist\|search\|queue, id?, query?, videoIds?}` | Returns links, `playbackConfirmed: false` |
| `get_playback_capabilities` | read | `{action?}` | Capability matrix plus an instruction for skip/pause/etc. |
| `correct_profile` | write | `{kind, value, note?}` | `exclude_artist`, `boost_artist`, `prefer_genre`, `avoid_genre`, `reject_inference`, `note` |
| `rate_track` | write | `{videoId, rating: up\|down}` | Local feedback used in ranking |

REST aliases:

| Route | Tool |
|---|---|
| `GET /api/profile` | `get_music_profile` |
| `POST /api/profile/refresh` | `get_music_profile` with AI inference |
| `GET /api/recent?sync=true` | `get_recent_listening` |
| `GET /api/search?q=` | `search_music` |
| `GET /api/capabilities?action=skip` | `get_playback_capabilities` |
| `GET /api/playlists?tracks=<id or title>` | `list_playlists` |
| `POST /api/confirm/:id` `{confirm}` | `confirm_action` |

## Other routes

| Route | Purpose |
|---|---|
| `POST /api/auth/login` `{passphrase}` / `POST /api/auth/logout` / `GET /api/auth/me` | Session |
| `GET/POST/DELETE /api/tokens[/:id]` | Personal API tokens (session only; the raw token is shown once) |
| `GET /api/oauth/clients`, `DELETE /api/oauth/clients/:id` | Connected MCP clients; revoke kills all of a client's tokens |
| `GET /api/integrations` | Provider status, LLM, import log |
| `POST /api/integrations/ytmusic/connect` `{headers}` | Store browser headers (encrypted) and verify with a test call |
| `DELETE /api/integrations/ytmusic` | Disconnect (deletes the stored credential) |
| `POST /api/library/sync` | Pull liked songs, library songs, playlists and history |
| `POST /api/import/takeout[?includeYouTube=true]` | Body: contents of `watch-history.json` (≤ 300 MB) |
| `GET/POST/DELETE /api/profile/corrections` | Manage corrections |
| `POST /api/chat` `{message, history?}` | Standalone assistant (tool-using agent) |
| `POST /api/shortcuts/ask` `{text}` | Returns `{reply, openUrl, playbackConfirmed:false}` for Shortcuts |
| `GET /api/shortcuts/open?q=` or `?playlist=` | Returns `{openUrl}` |
| `GET /api/data/export` | Download all stored data as JSON |
| `DELETE /api/data` `{"confirm":"DELETE MY DATA", "everything"?: true}` | Delete stored data; `everything` also removes credentials and tokens |

## MCP and OAuth

- `POST /mcp`: Streamable HTTP, stateless, JSON responses. Needs a Bearer OAuth token. Tools are filtered by the granted scopes.
- `/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource/mcp`: discovery.
- `/register` (dynamic client registration), `/authorize` (consent page; requires your passphrase), `/token` (PKCE S256, refresh rotation), `/revoke`.
- Access tokens last 1 hour; refresh tokens last 30 days and rotate on use.

## Example (curl)

```bash
TOKEN=ymc_...   # Settings → iOS Shortcuts & API tokens
curl -s https://music.example.com/api/tools/generate_playlist \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"request":"90-minute late-night driving playlist, mostly new to me","discovery":0.7}'
```
