# iPhone setup

## 1. Run the server where your phone can reach it over HTTPS

The server binds to `127.0.0.1` by default. Expose it through one of these:

| Option | Reaches | Good for |
|---|---|---|
| **Tailscale** on the server and the iPhone, then `tailscale serve --https=443 http://127.0.0.1:8787` | Only your devices | Most private. The PWA and Shortcuts work; ChatGPT **can't** reach it. |
| **Cloudflare Tunnel** (`cloudflared tunnel --url http://127.0.0.1:8787`, or a named tunnel on your domain) | Public HTTPS | Needed for ChatGPT. Everything stays behind the app's auth. |
| **Docker on a small VPS** (`docker run -v ymc:/data --env-file .env -p 127.0.0.1:8787:8787 …`) behind Caddy or nginx with TLS | Public HTTPS | Always on, even when your laptop sleeps |

Set `PUBLIC_BASE_URL` to the HTTPS origin, e.g. `https://music.example.com`. Secure cookies and the OAuth issuer depend on it.

## 2. Install the PWA

1. Open `PUBLIC_BASE_URL` in **Safari** on the iPhone and enter your passphrase.
2. Tap Share, then **Add to Home Screen**. It opens full-screen like an app.
3. In **Settings**:
   - **Connect YouTube Music**: paste the browser headers. This is a one-time step on a computer; see the in-app instructions.
   - **Import Takeout**: in the Files app, unzip the export and pick `YouTube and YouTube Music/history/watch-history.json`. For large exports, run the import on a computer instead: `npm run import:takeout -- path/to/watch-history.json`.
   - Tap **Sync library now**.

### Getting the Takeout export

1. Go to [takeout.google.com](https://takeout.google.com) and click **Deselect all**.
2. Tick **YouTube and YouTube Music**.
3. Under **All YouTube data included**, keep only **history**.
4. Under **Multiple formats**, set History to **JSON**.
5. Optional: choose **Export every 2 months for 1 year** to get periodic refreshes. Re-import each new export; duplicates are skipped.

## 3. iOS Shortcuts

First, in **Settings → iOS Shortcuts & API tokens**, create a token. Use read-only scope, or tick write if you want "add to playlist" by voice. Copy it once.

A Shortcut's name doubles as its Siri phrase: "Hey Siri, Ask Music".

### "Ask Music" (any request, by voice)

1. **Dictate Text** (or **Ask for Input** for typing).
2. **Get Contents of URL**
   - URL: `https://YOUR_HOST/api/shortcuts/ask`
   - Method: POST
   - Headers: `Authorization` = `Bearer ymc_…`
   - Request Body: JSON, `text` = *Dictated Text*
3. **Get Dictionary Value** `reply` from *Contents of URL*, then **Speak Text** (or **Show Result**).
4. **Get Dictionary Value** `openUrl` from *Contents of URL*.
5. **If** *Dictionary Value* **has any value**, then **Open URLs** *Dictionary Value*.

Examples:

- "Analyze my music taste"
- "What have I been listening to most recently?"
- "Play Velvet Hour"
- "Build me a playlist for a romantic night in Miami"
- "Add this song to my late-night playlist" (it replies with a confirmation request for existing playlists)

### "Open Music Playlist"

1. **Ask for Input**: "Which playlist?"
2. **Get Contents of URL**: `https://YOUR_HOST/api/shortcuts/open?playlist=` + *Provided Input*, with the same `Authorization` header.
3. **Get Dictionary Value** `openUrl`, then **Open URLs**.

### Playback controls (no server involved)

These use iOS's own Now Playing controls. **Test each one with YouTube Music on your phone**; this was not testable from the build environment.

- **Music Skip**: a single **Skip Forward** action.
- **Music Back**: **Skip Back**.
- **Music Play/Pause**: **Play/Pause**.

Add them to the Home Screen, the Action Button, or Back Tap (Settings → Accessibility → Touch → Back Tap). If an action doesn't affect YouTube Music on your iOS version, Control Center and "Hey Siri, skip" work as fallbacks.

## What to expect

- Links open the YouTube Music app (universal links). The app **never** claims something is playing, because it can't see that.
- "This song" means the newest item in your synced YouTube Music history, and the reply says so.
- Generated playlists are private drafts until you tap **Save to YouTube Music**. Saved playlists are created PRIVATE.
