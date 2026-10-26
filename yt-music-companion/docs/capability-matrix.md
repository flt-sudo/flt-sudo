# Capability matrix

The app serves the same information at `GET /api/capabilities` and in the `get_playback_capabilities` tool (source: `src/playback/capabilities.ts`).

Legend:

- **Official**: documented API or OS feature.
- **Unofficial**: works through ytmusicapi and may break.
- **Shortcut**: possible only through an iOS Shortcut that you run on the phone.
- **Unsupported**: not possible or not reliable.

"Tested here" describes how this repo verified it. **Nothing was tested against a live YouTube Music account**: the build sandbox can't reach music.youtube.com and has no credentials. Those rows say "needs your account".

| Desired capability | Status | How | Tested here |
|---|---|---|---|
| Analyze taste from full listening history | Official (Takeout) | Google Takeout `watch-history.json` import. YouTube Data API does **not** expose history. | Parser and importer, Takeout-format fixtures |
| Liked songs, library songs, playlists | Unofficial | ytmusicapi (browser-header auth) | Adapter with a fake client; sync with the mock provider |
| Recent history ("what have I been listening to") | Unofficial | ytmusicapi `get_history()`: about the last few hundred plays, coarse "Today/Yesterday" buckets, no timestamps | Same as above |
| Live or automatic history | Unsupported | No push API. Re-sync (recent) or re-import Takeout (scheduled exports every 2 months). | n/a |
| Search the music catalog | Unofficial | ytmusicapi search (no login needed). The official `search.list` returns generic videos at 100 quota units per call. | Adapter unit tests |
| Natural-language recommendations | This app | LLM criteria, then YouTube Music search, radio and history, then verification, ranking and sequencing | Engine tests (rule-based and scripted-LLM paths) |
| Create playlists in your account | Unofficial (official possible) | ytmusicapi `create_playlist`, PRIVATE by default. Official alternative: Data API `playlists.insert` (roadmap). | Mock provider end-to-end, including verification read-back |
| Add tracks to existing playlists | Unofficial | ytmusicapi `add_playlist_items`, **with confirmation** for playlists the app didn't create; duplicates skipped | API and PWA end-to-end with mock |
| Delete or overwrite playlists | Unsupported (by design) | Not implemented; do it in the app | n/a |
| Open a song or playlist on iPhone | Official | Universal links `https://music.youtube.com/watch?v=…` and `/playlist?list=…` hand off to the YouTube Music app | Link format tested; **app hand-off: check on your phone** |
| Open an unsaved draft as a queue | Experimental | `youtube.com/watch_videos?video_ids=…` makes a temporary list, may open in YouTube rather than YouTube Music, and is undocumented | Link format only |
| Start playback | Shortcut | Opening a watch link usually starts playing after your tap. The server can't start playback and reports `playbackConfirmed: false`. | Not verifiable server-side |
| Pause / resume / skip / previous | Shortcut | Shortcuts **Play/Pause**, **Skip Forward** and **Skip Back** act on the current Now Playing app. Also Control Center and Siri. | **Needs on-device test** with YouTube Music |
| "Hey Siri, play X on YouTube Music" | Shortcut / OS | YouTube Music's Siri media support (no server involved) | Not tested here |
| Know what's playing now ("this song") | Unsupported | No API. The app uses the latest history item as a labelled proxy. | Engine test checks the caveat |
| "Play something for my mood" | This app (proxy) | Mood can't be sensed; recent listening is used as the seed and the app says so | Engine test |
| ChatGPT integration | Official (MCP) | Remote MCP at `/mcp` with OAuth. Needs a public HTTPS URL and developer mode / custom connector on an eligible ChatGPT plan. | OAuth and MCP flow tested locally; **ChatGPT connection needs your deployment** |
| Standalone assistant | This app | PWA chat (OpenAI or Anthropic key, or rule-based mode) | Playwright run at iPhone 13 viewport |
| Export or delete stored data | This app | `GET /api/data/export`, `DELETE /api/data` | API tests |
