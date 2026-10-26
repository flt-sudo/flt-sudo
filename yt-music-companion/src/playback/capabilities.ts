/**
 * Single source of truth for what works, used by the get_playback_capabilities
 * tool, the PWA and docs/capability-matrix.md. Keep the statuses honest:
 *   official      – documented, supported API or OS feature
 *   unofficial    – works via ytmusicapi (reverse-engineered web client; may break)
 *   shortcut      – possible only through a user-run iOS Shortcut on the phone
 *   unsupported   – not possible / not reliable; we don't pretend
 * `verified` says how this project tested it.
 */
export type CapStatus = "official" | "unofficial" | "shortcut" | "unsupported";

export interface Capability {
  id: string;
  capability: string;
  status: CapStatus;
  how: string;
  verified: string;
}

export const CAPABILITIES: Capability[] = [
  { id: "read_library", capability: "Read liked songs, library songs, playlists", status: "unofficial", how: "ytmusicapi (browser-header auth) via the Python adapter", verified: "Adapter unit-tested against a fake client; live calls need your account" },
  { id: "read_history_recent", capability: "Recent YouTube Music history (~last few hundred plays)", status: "unofficial", how: "ytmusicapi get_history(); only coarse 'Today/Yesterday/…' buckets, no timestamps", verified: "Adapter unit-tested; live calls need your account" },
  { id: "read_history_full", capability: "Full timestamped listening history", status: "official", how: "Google Takeout export (watch-history.json) imported manually; YouTube Data API does NOT expose watch history", verified: "Parser and import tested with Takeout-format fixtures" },
  { id: "history_live", capability: "Live/automatic history updates", status: "unsupported", how: "No API pushes plays. Re-sync the library (recent history) or schedule recurring Takeout exports (every 2 months) and re-import", verified: "n/a" },
  { id: "search", capability: "Search YouTube Music catalog", status: "unofficial", how: "ytmusicapi search (works without login)", verified: "Adapter unit-tested; live calls not reachable from the build sandbox" },
  { id: "create_playlist", capability: "Create playlists in your account", status: "unofficial", how: "ytmusicapi create_playlist (private by default). Official alternative: YouTube Data API playlists.insert (OAuth app + quota) — roadmap", verified: "Mock-tested; live call needs your account" },
  { id: "modify_playlist", capability: "Add tracks to existing playlists", status: "unofficial", how: "ytmusicapi add_playlist_items; requires your confirmation for playlists this app did not create", verified: "Mock-tested incl. confirmation flow" },
  { id: "delete_playlist", capability: "Delete playlists", status: "unsupported", how: "Deliberately not implemented (destructive). Delete in the YouTube Music app", verified: "n/a" },
  { id: "open_track", capability: "Open a song in YouTube Music on iPhone", status: "official", how: "Universal link https://music.youtube.com/watch?v=… opens the app if installed", verified: "Link format unit-tested; app hand-off must be checked on your phone" },
  { id: "open_playlist", capability: "Open a playlist", status: "official", how: "Universal link https://music.youtube.com/playlist?list=…", verified: "Link format unit-tested; check on device" },
  { id: "start_playback", capability: "Start playback", status: "shortcut", how: "Opening a watch link usually starts playing, but you must tap/run it; the server cannot start playback remotely and never claims it did", verified: "Not verifiable from the server" },
  { id: "pause_resume", capability: "Pause / resume", status: "shortcut", how: "iOS Shortcuts 'Play/Pause' action acts on the current Now Playing app; you run the Shortcut (or say it to Siri)", verified: "Needs on-device test with YouTube Music" },
  { id: "skip", capability: "Skip to next / previous", status: "shortcut", how: "iOS Shortcuts 'Skip Forward' / 'Skip Back' (Now Playing controls) — run on the phone", verified: "Needs on-device test with YouTube Music" },
  { id: "siri_play", capability: "\"Play <song> on YouTube Music\" by voice", status: "shortcut", how: "Siri media intents supported by the YouTube Music app (no server involvement)", verified: "Reported by app release notes; not tested here" },
  { id: "now_playing", capability: "Know what's playing right now", status: "unsupported", how: "YouTube Music exposes no now-playing API to other apps; Shortcuts 'Get Current Song' only covers Apple Music. Closest proxy: most recent history item", verified: "n/a" },
  { id: "remote_control", capability: "Server/ChatGPT directly controlling iPhone playback", status: "unsupported", how: "iOS does not allow a web server to control another app's playback", verified: "n/a" },
  { id: "chatgpt_mcp", capability: "Use from ChatGPT", status: "official", how: "Remote MCP server (/mcp) with OAuth; requires ChatGPT developer mode / custom connector on an eligible plan, and a public HTTPS URL", verified: "MCP protocol tested locally (tool listing/calls); ChatGPT connection needs your deployment" },
];

export function playbackGuidance(action?: string) {
  const a = (action ?? "").toLowerCase();
  if (/skip|next/.test(a)) return { action: "skip", supportedFromServer: false, instruction: "Run the 'Music Skip' Shortcut (or the Shortcuts 'Skip Forward' action) on your iPhone, or say \"Hey Siri, skip\"." };
  if (/prev|back/.test(a)) return { action: "previous", supportedFromServer: false, instruction: "Run the Shortcuts 'Skip Back' action on your iPhone." };
  if (/pause|stop|resume|play\/pause/.test(a)) return { action: "pause_resume", supportedFromServer: false, instruction: "Run the 'Music Play/Pause' Shortcut on your iPhone, use Control Center, or say \"Hey Siri, pause\"." };
  return null;
}
