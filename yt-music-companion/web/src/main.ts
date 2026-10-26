// iPhone-first PWA. Vanilla TS + tiny DOM helper; talks only to this server's /api.
type Attrs = Record<string, string | number | boolean | ((e: Event) => void) | undefined>;
type Child = Node | string | null | undefined | false | Child[];

function el(tag: string, attrs: Attrs = {}, ...children: Child[]): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === "function") e.addEventListener(k.replace(/^on/, ""), v as EventListener);
    else if (k === "class") e.className = String(v);
    else e.setAttribute(k, v === true ? "" : String(v));
  }
  const add = (c: Child) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else e.append(c instanceof Node ? c : document.createTextNode(c));
  };
  children.forEach(add);
  return e;
}

/** Plain text → nodes with clickable https links (no HTML injection). */
function linkify(text: string): Node[] {
  const out: Node[] = [];
  const re = /https:\/\/[^\s)]+/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    out.push(document.createTextNode(text.slice(last, m.index)));
    out.push(el("a", { href: m[0], target: "_blank", rel: "noopener" }, m[0].includes("music.youtube.com") ? "▶ Open in YouTube Music" : m[0]));
    last = (m.index ?? 0) + m[0].length;
  }
  out.push(document.createTextNode(text.slice(last)));
  return out;
}

class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : {},
    body: opts.body !== undefined ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login") {
    renderLogin();
    throw new ApiError(401, "unauthorized", "Please log in");
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? `Request failed (${res.status})`);
  return data as T;
}

const app = document.getElementById("app")!;
let tab: "ask" | "profile" | "playlists" | "settings" = "ask";
const chatHistory: Array<{ role: "user" | "assistant"; text: string; extra?: HTMLElement }> = [];
let me: { llm: { provider: string; model: string; isModel: boolean }; musicProvider: string } | null = null;

const fmtDur = (s: number | null | undefined) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "");
const fmtMin = (s: number) => `${Math.round(s / 60)} min`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function toast(msg: string) {
  const t = el("div", { class: "banner", style: "position:fixed;left:16px;right:16px;bottom:calc(80px + env(safe-area-inset-bottom));z-index:9" }, msg);
  document.body.append(t);
  setTimeout(() => t.remove(), 3500);
}

// ---------------------------------------------------------------- login
function renderLogin() {
  const input = el("input", { type: "password", placeholder: "Passphrase", autocomplete: "current-password" }) as HTMLInputElement;
  const err = el("div", { class: "muted" });
  const submit = async (e: Event) => {
    e.preventDefault();
    try {
      await api("/auth/login", { body: { passphrase: input.value } });
      await boot();
    } catch (x) {
      err.textContent = (x as Error).message;
    }
  };
  app.replaceChildren(
    el("form", { class: "login stack", onsubmit: submit }, el("h1", {}, "🎧 Music Companion"), el("p", { class: "muted" }, "Your private YouTube Music AI. Enter your passphrase."), input, el("button", { class: "primary", type: "submit" }, "Unlock"), err),
  );
  input.focus();
}

// ---------------------------------------------------------------- shell
function shell(content: HTMLElement, footer?: HTMLElement) {
  const tabs: Array<[typeof tab, string, string]> = [
    ["ask", "💬", "Ask"],
    ["profile", "📊", "Taste"],
    ["playlists", "🎶", "Playlists"],
    ["settings", "⚙️", "Settings"],
  ];
  const main = el("main", {}, content);
  app.replaceChildren(
    el(
      "div",
      { class: "shell" },
      el("header", { class: "top" }, el("h1", {}, "Music Companion"), el("span", { class: "pill" }, me?.llm.isModel ? me.llm.model : "rule-based")),
      main,
      footer ?? null,
      el(
        "nav",
        { class: "tabs" },
        tabs.map(([id, ico, label]) =>
          el("button", { class: tab === id ? "active" : "", onclick: () => go(id) }, el("span", { class: "ico" }, ico), label),
        ),
      ),
    ),
  );
  return main;
}

function go(t: typeof tab) {
  tab = t;
  ({ ask: renderAsk, profile: renderProfile, playlists: renderPlaylists, settings: renderSettings })[t]();
}

// ---------------------------------------------------------------- ask (chat)
const PROMPTS = [
  "Analyze my music taste",
  "What have I been listening to most recently?",
  "Build me a playlist for a romantic night in Miami",
  "Make a playlist that feels intimate, expensive, and atmospheric",
  "Give me something romantic but not corny",
  "Build a 90-minute late-night driving playlist",
  "Play something based on my current mood",
  "Skip this song",
];

function trackRow(t: any, i: number) {
  return el(
    "div",
    { class: "track" },
    el("div", { class: "n" }, String(i + 1)),
    el(
      "div",
      { class: "meta" },
      el("div", { class: "t" }, t.title ?? t.videoId),
      el("div", { class: "muted small" }, (t.artists ?? []).join(", "), t.durationS ? ` · ${fmtDur(t.durationS)}` : "", t.familiar === false ? " · ✦ new to you" : ""),
      t.reason ? el("div", { class: "why" }, t.reason) : null,
    ),
    el(
      "div",
      { class: "acts" },
      el("a", { href: `https://music.youtube.com/watch?v=${encodeURIComponent(t.videoId)}`, target: "_blank", rel: "noopener", "aria-label": "Open in YouTube Music" }, "▶"),
      el("button", { "aria-label": "Like", onclick: () => rate(t.videoId, "up") }, "👍"),
      el("button", { "aria-label": "Dislike", onclick: () => rate(t.videoId, "down") }, "👎"),
    ),
  );
}

async function rate(videoId: string, rating: "up" | "down") {
  await api("/tools/rate_track", { body: { videoId, rating } });
  toast(rating === "up" ? "Noted — more like this." : "Noted — less like this.");
}

function playlistCard(r: any) {
  const status = el("div", { class: "muted small" });
  const saveBtn = el("button", { class: "primary" }, "Save to YouTube Music") as HTMLButtonElement;
  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    status.textContent = "Saving…";
    try {
      const s = await api("/tools/create_playlist", { body: { playlistId: r.playlistId } });
      const verified = s.status === "created_verified" ? `✓ Saved & verified (${s.verifiedTracks} tracks, ${s.privacy.toLowerCase()})` : s.status === "already_saved" ? "Already saved" : `Saved, but couldn't verify all tracks (${s.status})`;
      status.replaceChildren(verified + " ", el("a", { href: s.links.play, target: "_blank", rel: "noopener" }, "▶ Open playlist"));
      saveBtn.remove();
    } catch (e) {
      status.textContent = (e as Error).message;
      saveBtn.disabled = false;
    }
  });
  return el(
    "div",
    { class: "card" },
    el("h3", {}, r.title, " ", el("span", { class: "muted small" }, `${r.tracks.length} tracks · ${fmtMin(r.totalDurationS)}`)),
    el("div", { class: "muted small" }, r.explanation),
    el("div", {}, r.tracks.map(trackRow)),
    r.notes?.length ? el("details", {}, el("summary", { class: "muted small" }, "Notes & caveats"), el("ul", { class: "muted small" }, r.notes.map((n: string) => el("li", {}, n)))) : null,
    r.playlistId ? el("div", { class: "row wrap" }, saveBtn) : r.queueLink ? el("a", { href: r.queueLink, target: "_blank", rel: "noopener", class: "small" }, "▶ Open as temporary queue (experimental)") : null,
    status,
  );
}

function confirmCard(o: any) {
  const status = el("div", { class: "muted small" });
  const act = (confirm: boolean) => async () => {
    try {
      const r = await api(`/confirm/${o.confirmationId}`, { body: { confirm } });
      status.textContent = confirm ? (r.status === "added_verified" ? `✓ Done and verified in "${r.playlist}".` : `Status: ${r.status}`) : "Cancelled.";
      card.querySelectorAll("button").forEach((b) => ((b as HTMLButtonElement).disabled = true));
    } catch (e) {
      status.textContent = (e as Error).message;
    }
  };
  const card = el("div", { class: "card" }, el("h3", {}, "Confirm change"), el("div", {}, o.summary), el("div", { class: "row" }, el("button", { class: "primary", onclick: act(true) }, "Yes, do it"), el("button", { class: "ghost", onclick: act(false) }, "Cancel")), status);
  return card;
}

function extrasFor(toolCalls: any[]): HTMLElement | undefined {
  const box = el("div");
  for (const c of toolCalls ?? []) {
    if (c.isError) continue;
    if ((c.name === "generate_playlist" || c.name === "recommend_tracks") && c.output?.tracks?.length) box.append(playlistCard(c.output));
    if (c.output?.status === "confirmation_required") box.append(confirmCard(c.output));
  }
  return box.childElementCount ? box : undefined;
}

function renderAsk() {
  const list = el("div", { class: "chat" });
  const draw = () => {
    list.replaceChildren(
      ...(chatHistory.length
        ? []
        : [el("div", { class: "card" }, el("h3", {}, "Ask about your music"), el("div", { class: "muted small" }, "Recommendations use your imported history. Links open YouTube Music; playback control happens on your phone (see Settings → Shortcuts)."))]),
      ...chatHistory.flatMap((m) => [el("div", { class: `msg ${m.role}` }, ...(m.role === "assistant" ? linkify(m.text) : [m.text])), m.extra ?? null].filter(Boolean) as HTMLElement[]),
    );
    main.scrollTop = main.scrollHeight;
  };
  const input = el("input", { placeholder: "Ask for music…", enterkeyhint: "send", autocomplete: "off" }) as HTMLInputElement;
  const send = async (text: string) => {
    if (!text.trim()) return;
    input.value = "";
    const history = chatHistory.map(({ role, text }) => ({ role, text }));
    chatHistory.push({ role: "user", text });
    draw();
    const thinking = el("div", { class: "msg assistant thinking" }, "Thinking…");
    list.append(thinking);
    main.scrollTop = main.scrollHeight;
    try {
      const r = await api("/chat", { body: { message: text, history } });
      chatHistory.push({ role: "assistant", text: r.text || "(no reply)", extra: extrasFor(r.toolCalls) });
    } catch (e) {
      chatHistory.push({ role: "assistant", text: `⚠️ ${(e as Error).message}` });
    }
    draw();
  };
  const chips = el("div", { class: "chips" }, PROMPTS.map((p) => el("button", { onclick: () => send(p) }, p)));
  const composer = el(
    "form",
    { class: "composer", onsubmit: (e: Event) => (e.preventDefault(), send(input.value)) },
    input,
    el("button", { class: "primary", type: "submit", "aria-label": "Send" }, "↑"),
  );
  const main = shell(el("div", {}, chips, list), composer);
  draw();
}

// ---------------------------------------------------------------- profile
async function renderProfile() {
  const main = shell(el("div", { class: "muted" }, "Loading…"));
  let p: any;
  try {
    p = await api("/profile");
  } catch (e) {
    main.replaceChildren(el("div", { class: "banner" }, (e as Error).message));
    return;
  }
  const o = p.observed;
  const maxPlays = Math.max(1, ...o.topArtists.map((a: any) => a.plays));
  const refresh = el("button", { class: "ghost" }, me?.llm.isModel ? "Re-run AI analysis" : "AI analysis needs an LLM key") as HTMLButtonElement;
  refresh.disabled = !me?.llm.isModel;
  refresh.addEventListener("click", async () => {
    refresh.disabled = true;
    refresh.textContent = "Analyzing…";
    try {
      await api("/profile/refresh", { method: "POST", body: {} });
      renderProfile();
    } catch (e) {
      toast((e as Error).message);
      refresh.disabled = false;
    }
  });
  const corrKind = el("select", {}, p.corrections !== undefined ? ["exclude_artist", "boost_artist", "prefer_genre", "avoid_genre", "note"].map((k) => el("option", { value: k }, k.replace("_", " "))) : []) as HTMLSelectElement;
  const corrValue = el("input", { placeholder: "e.g. Drake, or 'country'" }) as HTMLInputElement;
  const addCorr = async (e: Event) => {
    e.preventDefault();
    if (!corrValue.value.trim()) return;
    await api("/profile/corrections", { body: { kind: corrKind.value, value: corrValue.value } });
    renderProfile();
  };
  const reject = (id: string) => async () => {
    await api("/profile/corrections", { body: { kind: "reject_inference", value: id } });
    renderProfile();
  };

  main.replaceChildren(
    el("div", { class: "banner" }, p.freshness),
    el(
      "div",
      { class: "card" },
      el("h2", {}, "Observed · top artists"),
      o.topArtists.length
        ? o.topArtists.slice(0, 12).map((a: any) => el("div", { class: "stack", style: "margin:8px 0" }, el("div", { class: "row small" }, el("span", { class: "grow" }, a.artist), el("span", { class: "muted" }, plural(a.plays, "play"))), el("div", { class: "bar" }, el("span", { style: `width:${(a.plays / maxPlays) * 100}%` }))))
        : el("div", { class: "muted small" }, "Import Google Takeout history (Settings) to see play counts."),
    ),
    el("div", { class: "card" }, el("h2", {}, "Observed · top tracks"), o.topTracks.slice(0, 10).map((t: any, i: number) => trackRow({ ...t, artists: [t.artist], reason: plural(t.plays, "play") }, i))),
    el(
      "div",
      { class: "card" },
      el("h2", {}, `Observed · recent (last ${o.recentWindow.days} days of data)`),
      el("div", { class: "muted small" }, o.recentWindow.endsAt ? `Window ends ${o.recentWindow.endsAt.slice(0, 10)} (your newest imported play).` : "No timestamped history."),
      el("div", {}, o.recentTopArtists.slice(0, 8).map((a: any) => el("span", { class: "tag" }, `${a.artist} · ${a.plays}`))),
      o.discovery.newArtistsInRecentWindow.length ? el("div", { class: "small", style: "margin-top:8px" }, "Newly discovered: ", o.discovery.newArtistsInRecentWindow.slice(0, 8).join(", ")) : null,
      o.discovery.familiarShare != null ? el("div", { class: "muted small" }, `${Math.round(o.discovery.familiarShare * 100)}% of recent plays were artists you already knew.`) : null,
      o.recentHistory.length ? el("details", {}, el("summary", { class: "small" }, "YouTube Music history snapshot"), o.recentHistory.slice(0, 20).map((t: any, i: number) => trackRow({ ...t, artists: [t.artist], reason: t.playedBucket }, i))) : null,
    ),
    el(
      "div",
      { class: "card" },
      el("h2", {}, "Trends"),
      el("div", { class: "kv" }, o.trends.slice(-12).flatMap((t: any) => [el("span", {}, `${t.month} · top: ${t.topArtist ?? "—"}`), el("span", { class: "muted" }, `${t.plays} plays · ${t.newArtists} new`)])),
      o.listeningHours.lateNightShare != null ? el("div", { class: "muted small", style: "margin-top:8px" }, `${Math.round(o.listeningHours.lateNightShare * 100)}% of plays between 10pm and 5am (${o.listeningHours.timezone}).`) : null,
    ),
    el(
      "div",
      { class: "card" },
      el("h2", {}, "AI-inferred traits ", el("span", { class: "muted small" }, "(may be wrong)")),
      p.inferred.summary ? el("p", { class: "small" }, p.inferred.summary) : el("div", { class: "muted small" }, "Not generated yet."),
      el(
        "div",
        {},
        p.inferred.items.map((i: any) =>
          el("span", { class: "tag inferred", title: i.evidence ?? "" }, `${i.kind}: ${i.value} `, el("button", { style: "min-height:22px;padding:0 6px;background:transparent", "aria-label": `Reject ${i.value}`, onclick: reject(i.id) }, "✕")),
        ),
      ),
      el("div", { class: "row", style: "margin-top:8px" }, refresh),
    ),
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "Your corrections"),
      p.corrections.length ? p.corrections.map((c: any) => el("div", { class: "row small" }, el("span", { class: "grow" }, `${c.kind.replace("_", " ")}: ${c.value}`), el("button", { class: "ghost", onclick: async () => (await api(`/profile/corrections/${c.id}`, { method: "DELETE" }), renderProfile()) }, "Remove"))) : el("div", { class: "muted small" }, "None yet. Corrections override AI inferences and ranking."),
      el("form", { class: "stack", onsubmit: addCorr }, corrKind, corrValue, el("button", { type: "submit" }, "Add correction")),
    ),
  );
}

// ---------------------------------------------------------------- playlists
async function renderPlaylists(openId?: string) {
  const main = shell(el("div", { class: "muted" }, "Loading…"));
  const data = await api(`/playlists${openId ? `?tracks=${encodeURIComponent(openId)}` : ""}`);
  const lists = data.playlists as any[];
  const detail = data.tracks
    ? el(
        "div",
        { class: "card" },
        el("h2", {}, data.tracks.playlist),
        data.tracks.explanation ? el("div", { class: "muted small" }, data.tracks.explanation) : null,
        data.tracks.tracks.map(trackRow),
      )
    : null;
  main.replaceChildren(
    detail ?? el("span"),
    lists.length
      ? el(
          "div",
          {},
          lists.map((p) =>
            el(
              "div",
              { class: "card" },
              el("div", { class: "row" }, el("strong", { class: "grow" }, p.title), el("span", { class: "pill" }, p.origin === "generated" ? (p.savedToYouTubeMusic ? "AI · saved" : "AI · draft") : "YouTube Music")),
              el("div", { class: "muted small" }, `${p.trackCount} tracks · updated ${p.updatedAt.slice(0, 10)}`),
              el(
                "div",
                { class: "row wrap", style: "margin-top:8px" },
                el("button", { class: "ghost", onclick: () => renderPlaylists(p.id) }, "Tracks"),
                p.links ? el("a", { href: p.links.play, target: "_blank", rel: "noopener" }, el("button", { class: "primary" }, "▶ Open")) : null,
                !p.savedToYouTubeMusic && p.origin === "generated"
                  ? el("button", {
                      onclick: async () => {
                        try {
                          const s = await api("/tools/create_playlist", { body: { playlistId: p.id } });
                          toast(s.status === "created_verified" ? "Saved and verified in YouTube Music." : `Saved (${s.status}).`);
                          renderPlaylists();
                        } catch (e) {
                          toast((e as Error).message);
                        }
                      },
                    }, "Save to YouTube Music")
                  : null,
              ),
            ),
          ),
        )
      : el("div", { class: "card muted" }, "No playlists yet. Ask for one in the Ask tab, or sync your library in Settings."),
  );
}

// ---------------------------------------------------------------- settings
async function renderSettings() {
  const main = shell(el("div", { class: "muted" }, "Loading…"));
  const [integ, tokens, clients, caps] = await Promise.all([api("/integrations"), api("/tokens"), api("/oauth/clients"), api("/capabilities")]);
  const yt = integ.ytmusic;
  const headers = el("textarea", { placeholder: "Paste request headers here (they're encrypted at rest and never logged)" }) as HTMLTextAreaElement;
  const connStatus = el("div", { class: "muted small" });
  const connect = async () => {
    connStatus.textContent = "Connecting…";
    try {
      const r = await api("/integrations/ytmusic/connect", { body: { headers: headers.value } });
      headers.value = "";
      connStatus.textContent = r.verified ? `✓ Connected. Found playlists: ${r.samplePlaylists.join(", ") || "(none)"}` : r.message;
      setTimeout(renderSettings, 1500);
    } catch (e) {
      connStatus.textContent = (e as Error).message;
    }
  };
  const syncStatus = el("div", { class: "muted small" });
  const sync = async () => {
    syncStatus.textContent = "Syncing library, playlists and history…";
    try {
      const r = await api("/library/sync", { method: "POST", body: {} });
      syncStatus.textContent = `✓ ${r.liked} liked, ${plural(r.librarySongs, "library song")}, ${plural(r.playlists, "playlist")}, ${plural(r.history, "history item")}.${r.errors.length ? ` Issues: ${r.errors.join("; ")}` : ""}`;
    } catch (e) {
      syncStatus.textContent = (e as Error).message;
    }
  };
  const file = el("input", { type: "file", accept: "application/json,.json" }) as HTMLInputElement;
  const impStatus = el("div", { class: "muted small" });
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    if (f.name.endsWith(".html")) {
      impStatus.textContent = "That's the HTML export. Re-export Takeout history in JSON format.";
      return;
    }
    impStatus.textContent = `Importing ${(f.size / 1e6).toFixed(1)} MB…`;
    try {
      const r = await api("/import/takeout", { body: await f.text() });
      impStatus.textContent = `✓ ${r.stats.inserted} new plays (${r.stats.duplicates} already imported) from ${r.dataFrom?.slice(0, 10)} to ${r.dataThrough?.slice(0, 10)}. Skipped ${r.stats.skippedNonMusic} non-music views.`;
    } catch (e) {
      impStatus.textContent = (e as Error).message;
    }
  });
  const tokName = el("input", { placeholder: "Token name (e.g. iPhone Shortcuts)" }) as HTMLInputElement;
  const tokWrite = el("input", { type: "checkbox" }) as HTMLInputElement;
  const tokOut = el("div", { class: "small" });
  const mkToken = async () => {
    const r = await api("/tokens", { body: { name: tokName.value || "iPhone Shortcuts", scopes: tokWrite.checked ? ["music:read", "music:write"] : ["music:read"] } });
    tokOut.replaceChildren("Copy now — shown once: ", el("code", {}, r.token));
  };

  main.replaceChildren(
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "YouTube Music account"),
      el("div", { class: yt.authenticated ? "banner ok" : "banner" }, yt.authenticated ? `Connected${yt.connectedAt ? ` since ${yt.connectedAt.slice(0, 10)}` : ""} · ${yt.detail ?? ""}` : `Not connected · ${yt.detail ?? ""}`),
      yt.authenticated
        ? el("div", { class: "row wrap" }, el("button", { class: "primary", onclick: sync }, "Sync library now"), el("button", { class: "danger", onclick: async () => { const r = await api("/integrations/ytmusic", { method: "DELETE" }); toast("Disconnected. " + r.revokeRemotely); renderSettings(); } }, "Disconnect"))
        : el(
            "details",
            { open: true },
            el("summary", {}, "How to connect (desktop browser, ~2 minutes)"),
            el(
              "ol",
              { class: "small" },
              el("li", {}, "On a computer, open music.youtube.com in Firefox or Chrome and sign in."),
              el("li", {}, "Open developer tools → Network, filter for ", el("code", {}, "browse"), ", then click Library."),
              el("li", {}, "Click a POST ", el("code", {}, "browse?…"), " request with status 200 → copy request headers."),
              el("li", {}, "Paste below. They give account access like a login cookie — they're encrypted at rest; disconnect any time."),
            ),
          ),
      yt.authenticated ? null : el("div", { class: "stack" }, headers, el("button", { class: "primary", onclick: connect }, "Connect")),
      connStatus,
      syncStatus,
    ),
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "Import listening history (Google Takeout)"),
      el("div", { class: "muted small" }, "takeout.google.com → deselect all → YouTube and YouTube Music → 'All YouTube data included' → only history → format JSON. Unzip and choose ", el("code", {}, "history/watch-history.json"), ". Re-import newer exports any time; duplicates are skipped."),
      file,
      impStatus,
      integ.imports?.length ? el("details", {}, el("summary", { class: "small" }, "Import log"), integ.imports.map((i: any) => el("div", { class: "muted small" }, `${i.started_at.slice(0, 16).replace("T", " ")} · ${i.kind} · ${i.status}${i.data_through ? ` · data through ${i.data_through.slice(0, 10)}` : ""}`))) : null,
    ),
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "iOS Shortcuts & API tokens"),
      el("div", { class: "muted small" }, "Create a token for the Shortcuts in docs/iphone-setup.md (Ask Music, Play, Skip, Pause). Read-only tokens can't change playlists."),
      tokName,
      el("label", { class: "row small" }, tokWrite, "Allow creating/modifying playlists (music:write)"),
      el("button", { onclick: mkToken }, "Create token"),
      tokOut,
      tokens.tokens.map((t: any) => el("div", { class: "row small" }, el("span", { class: "grow" }, `${t.name} · ${t.scopes}${t.revoked_at ? " · revoked" : t.last_used_at ? ` · used ${t.last_used_at.slice(0, 10)}` : ""}`), t.revoked_at ? null : el("button", { class: "ghost", onclick: async () => (await api(`/tokens/${t.id}`, { method: "DELETE" }), renderSettings()) }, "Revoke"))),
    ),
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "Connected AI apps (ChatGPT / MCP)"),
      el("div", { class: "muted small" }, "MCP endpoint: ", el("code", {}, `${location.origin}/mcp`), ". See docs/chatgpt.md for eligibility and setup."),
      clients.clients.length ? clients.clients.map((c: any) => el("div", { class: "row small" }, el("span", { class: "grow" }, `${c.name ?? c.clientId} · since ${c.createdAt.slice(0, 10)}`), el("button", { class: "danger", onclick: async () => (await api(`/oauth/clients/${c.clientId}`, { method: "DELETE" }), renderSettings()) }, "Revoke"))) : el("div", { class: "muted small" }, "None connected."),
    ),
    el(
      "div",
      { class: "card" },
      el("h2", {}, "What works (honestly)"),
      el("table", { class: "matrix" }, caps.capabilities.map((c: any) => el("tr", {}, el("td", {}, c.capability), el("td", { class: `status-${c.status}` }, c.status)))),
    ),
    el(
      "div",
      { class: "card stack" },
      el("h2", {}, "Your data"),
      el("div", { class: "row wrap" }, el("a", { href: "/api/data/export", download: true }, el("button", {}, "Export all data (JSON)")), el("button", { class: "danger", onclick: async () => { if (!confirm("Delete ALL stored music data from this app? (Your YouTube Music account is not touched.)")) return; await api("/data", { method: "DELETE", body: { confirm: "DELETE MY DATA" } }); toast("Deleted."); renderSettings(); } }, "Delete stored data")),
      el("button", { class: "ghost", onclick: async () => (await api("/auth/logout", { method: "POST", body: {} }), renderLogin()) }, "Log out"),
    ),
  );
}

// ---------------------------------------------------------------- boot
async function boot() {
  try {
    me = await api("/auth/me");
  } catch {
    return;
  }
  go(tab);
}

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
void boot();
