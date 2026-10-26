# Roadmap (prioritized)

## P0: needs you (blocks real use)

1. **Connect your YouTube Music account** (Settings → paste browser headers) and **import your Takeout** `watch-history.json`.
2. **Set an LLM key** (`LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, or `openai` + `OPENAI_API_KEY`). Without one, the app runs in rule-based mode.
3. **Deploy behind HTTPS** (Tailscale for private use; Cloudflare Tunnel or a VPS for ChatGPT).
4. **On-device checks:**
   - Do `music.youtube.com` links open the YouTube Music app?
   - Do the Shortcuts Skip Forward and Play/Pause actions control YouTube Music on your iOS version?

## P1: next improvements

1. **Official playlist path**: a `YouTubeDataApiProvider` for `playlists.insert` / `playlistItems.insert` using Google OAuth (`youtube` scope). It would be a fallback if ytmusicapi playlist writes break. It needs a Google Cloud project and costs 50 quota units per inserted track.
2. **ytmusicapi OAuth** as an alternative to browser headers. It needs your own "TVs and Limited Input devices" OAuth client. Device-code flow from Settings.
3. **Scheduled sync**: run `syncLibrary` periodically (e.g. every 6 hours) to accumulate the recent-history snapshots into a longer timeline between Takeout exports. Snapshots don't carry exact timestamps, so they would be stored as "seen by date X".
4. **Streaming chat responses** in the PWA (SSE) for long playlist generations.
5. **Takeout ZIP upload** (stream-unzip on the server) so you don't have to extract on the phone.

## P2: nice to have

1. Playlist editing UI (reorder/remove inside drafts before saving).
2. Weekly "taste drift" digest (new artists, rising genres) using the trends data.
3. Better energy estimates by combining LLM estimates with YouTube Music radio adjacency.
4. PostgreSQL deployment profile (switch `PostgresDialect`, add `pg` dependency, data copy script).
5. ChatGPT Apps SDK UI component (an inline playlist card widget) on top of the MCP server.

## Won't do (platform limits)

- Remote playback control from the server or ChatGPT (iOS forbids it).
- Reading YouTube Music's now-playing track.
- Fetching full history through any official API (none exists).
