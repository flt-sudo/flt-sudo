import type { z } from "zod";
import { type AgentResult, type AgentTurn, LlmError, type LlmProvider, type ToolCallRecord, type ToolExecutor, type ToolSpec } from "./types.js";

/**
 * Rule-based stand-in used when no LLM is configured. It routes common
 * phrasings to tools and summarizes the results in plain text, so the app is
 * usable (and testable) end-to-end without an API key. It cannot do open-ended
 * conversation and says so.
 */
export class HeuristicProvider implements LlmProvider {
  readonly name = "none" as const;
  readonly model = "rule-based";
  readonly isModel = false;

  async generateJson<T>(_args: { system: string; prompt: string; schema: z.ZodType<T>; name: string }): Promise<T> {
    throw new LlmError("not_configured", "No LLM configured");
  }

  async runAgent(args: { system: string; history: AgentTurn[]; userMessage: string; tools: ToolSpec[]; execute: ToolExecutor }): Promise<AgentResult> {
    const msg = args.userMessage.trim();
    const t = msg.toLowerCase();
    const calls: ToolCallRecord[] = [];
    const run = async (name: string, input: unknown) => {
      const r = await args.execute(name, input);
      calls.push({ name, input, output: r.output, isError: !!r.isError });
      return r;
    };
    const done = (text: string): AgentResult => ({ text, toolCalls: calls, stopReason: "end_turn", model: this.model });
    const err = (r: { output: unknown; isError?: boolean }) => (r.isError ? `Sorry — ${(r.output as { message?: string })?.message ?? "that failed"}.` : null);

    if (/\b(skip|next song|next track|pause|resume|previous song|go back)\b/.test(t)) {
      const r = await run("get_playback_capabilities", { action: t });
      const g = (r.output as { guidance: { instruction: string } | null }).guidance;
      return done(`I can't control playback on your iPhone from here. ${g?.instruction ?? "Use Control Center or Siri."}`);
    }

    if (/analy[sz]e my (music )?taste|my (music )?(taste|profile)|what do i like/.test(t)) {
      const r = await run("get_music_profile", {});
      if (r.isError) return done(err(r)!);
      const p = r.output as { freshness: string; observed: { topArtists: Array<{ artist: string; plays: number }>; recentTopArtists: Array<{ artist: string }>; library: { likedTopArtists: Array<{ artist: string }> }; discovery: { newArtistsInRecentWindow: string[] } }; inferred: { summary: string | null } };
      const top = p.observed.topArtists.slice(0, 8).map((a) => `${a.artist} (${a.plays} plays)`).join(", ");
      const liked = p.observed.library.likedTopArtists.slice(0, 8).map((a) => a.artist).join(", ");
      const lines = [
        top ? `Most-played artists: ${top}.` : "No play history imported yet.",
        liked ? `Most-liked artists: ${liked}.` : "",
        p.observed.recentTopArtists.length ? `Lately: ${p.observed.recentTopArtists.slice(0, 5).map((a) => a.artist).join(", ")}.` : "",
        p.observed.discovery.newArtistsInRecentWindow.length ? `Recently discovered: ${p.observed.discovery.newArtistsInRecentWindow.slice(0, 5).join(", ")}.` : "",
        p.inferred.summary ? `AI-inferred summary: ${p.inferred.summary}` : "(AI genre/mood inference needs an LLM key.)",
        p.freshness,
      ];
      return done(lines.filter(Boolean).join("\n"));
    }

    if (/(listening to|listened to|played).*(recent|lately|most)|recent(ly)? (listening|played)|what have i been/.test(t)) {
      const r = await run("get_recent_listening", {});
      if (r.isError) return done(err(r)!);
      const o = r.output as { freshness: string; youtubeMusicHistory: { capturedAt: string | null; items: Array<{ title: string; artist: string; playedBucket: string | null }> }; takeoutRecentWindow: { topArtists: Array<{ artist: string; plays: number }> } };
      const hist = o.youtubeMusicHistory.items.slice(0, 8).map((i) => `${i.title} — ${i.artist}${i.playedBucket ? ` (${i.playedBucket})` : ""}`);
      const top = o.takeoutRecentWindow.topArtists.slice(0, 6).map((a) => `${a.artist} (${a.plays})`);
      return done(
        [
          hist.length ? `From your YouTube Music history (captured ${o.youtubeMusicHistory.capturedAt?.slice(0, 16).replace("T", " ") ?? "?"} UTC):\n• ${hist.join("\n• ")}` : "No YouTube Music history synced yet.",
          top.length ? `Top artists in the latest 90 days of Takeout data: ${top.join(", ")}.` : "",
          o.freshness,
        ].filter(Boolean).join("\n\n"),
      );
    }

    const addM = msg.match(/add (.+?) to (?:my |the )?(.+?)(?: playlist)?[.!]?$/i);
    if (addM) {
      const [, song, playlist] = addM;
      let videoId: string | null = null;
      let label = song!;
      if (/^(this|that|it|this song|this track)$/i.test(song!.trim())) {
        const rec = await run("get_recent_listening", { limit: 1 });
        const item = (rec.output as { youtubeMusicHistory: { items: Array<{ videoId: string; title: string; artist: string }> } }).youtubeMusicHistory.items[0];
        if (!item) return done("I can't see what's playing right now. Tell me the song title and artist.");
        videoId = item.videoId;
        label = `${item.title} — ${item.artist} (your most recent YouTube Music history item; I can't see live now-playing)`;
      } else {
        const s = await run("search_music", { query: song, limit: 1 });
        const hit = (s.output as { results?: Array<{ videoId: string; title: string; artists: string[] }> }).results?.[0];
        if (!hit) return done(`I couldn't find "${song}" on YouTube Music.`);
        videoId = hit.videoId;
        label = `${hit.title} — ${hit.artists.join(", ")}`;
      }
      const a = await run("add_tracks_to_playlist", { playlist, videoIds: [videoId] });
      if (a.isError) return done(err(a)!);
      const o = a.output as { status: string; summary?: string; confirmationId?: string; playlist?: string };
      if (o.status === "confirmation_required") return done(`Please confirm: ${o.summary}`);
      return done(o.status === "added_verified" ? `Added ${label} to "${o.playlist}" (verified).` : `Requested adding ${label} to "${o.playlist}" — status: ${o.status}.`);
    }

    const playM = msg.match(/^(?:play|put on|open)\s+(.+)$/i);
    if (playM && !/something|playlist for|mood|vibe/.test(t)) {
      const r = await run("open_music", { kind: "track", query: playM[1] });
      if (r.isError) return done(err(r)!);
      const o = r.output as { label: string; links: { web: string } };
      return done(`Found ${o.label}. Tap to open it in YouTube Music: ${o.links.web}\n(I can't confirm playback from here.)`);
    }

    if (/playlist|mix\b|\bsongs?\b.*\b(like|similar|energy|for)\b|\bfind \d+|play something|based on my (current )?mood/.test(t)) {
      const wantsPlaylist = /playlist|mix\b|play something/.test(t);
      const r = await run(wantsPlaylist ? "generate_playlist" : "recommend_tracks", { request: msg });
      if (r.isError) return done(err(r)!);
      const o = r.output as { playlistId: string | null; title: string; tracks: Array<{ title: string; artists: string[]; familiar: boolean }>; notes: string[]; explanation: string };
      if (!o.tracks.length) return done(`I couldn't find suitable tracks. ${o.notes.join(" ")}`);
      const list = o.tracks.map((x, i) => `${i + 1}. ${x.title} — ${x.artists.join(", ")}${x.familiar ? "" : " ✦new"}`).join("\n");
      return done(
        `${wantsPlaylist ? `Draft playlist "${o.title}"` : "Recommendations"}:\n${list}\n\n${o.explanation}${o.notes.length ? `\n\nNotes: ${o.notes.join(" ")}` : ""}${wantsPlaylist ? "\n\nSay or tap “save” to create it in YouTube Music." : ""}`,
      );
    }

    if (/^(search|find)\s+/i.test(msg)) {
      const r = await run("search_music", { query: msg.replace(/^(search( for)?|find)\s+/i, "") });
      if (r.isError) return done(err(r)!);
      const res = (r.output as { results: Array<{ title: string; artists: string[]; url: string }> }).results.slice(0, 8);
      return done(res.length ? res.map((x) => `• ${x.title} — ${x.artists.join(", ")}`).join("\n") : "No results.");
    }

    return done(
      "I'm running without an AI model, so I understand a fixed set of requests: “analyze my music taste”, “what have I been listening to”, " +
        "“build me a playlist for …”, “find 15 songs like <song>”, “play <song>”, “add <song> to <playlist>”, “skip”. " +
        "Set LLM_PROVIDER=anthropic or openai for free-form conversation.",
    );
  }
}
