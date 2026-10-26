import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { PlaylistEngine } from "../src/engine/playlist.js";
import { importTakeout } from "../src/ingest/takeout.js";
import { syncLibrary } from "../src/ingest/library.js";
import type { AgentResult, LlmProvider } from "../src/llm/types.js";
import { addCorrection } from "../src/profile/profile.js";
import { MockProvider } from "../src/providers/music/mock.js";
import { takeoutFixture, testDb } from "./helpers.js";

async function setup(llm: LlmProvider | null = null) {
  const db = await testDb();
  const mock = new MockProvider();
  await mock.configure("{}");
  await importTakeout(db, takeoutFixture(mock));
  await syncLibrary(db, mock);
  const engine = new PlaylistEngine({ db, provider: mock, llm, timezone: "UTC", tagSource: (id) => mock.tagsFor(id) });
  return { db, mock, engine };
}

/** Scripted LLM: returns canned JSON per schema name, recording prompts. */
class FakeLlm implements LlmProvider {
  readonly name = "anthropic" as const;
  readonly model = "fake-model";
  readonly isModel = true;
  prompts: Record<string, string> = {};
  constructor(private responses: Record<string, unknown>) {}
  async generateJson<T>(args: { name: string; prompt: string; schema: z.ZodType<T> }): Promise<T> {
    this.prompts[args.name] = args.prompt;
    const r = this.responses[args.name];
    if (r === undefined) throw new Error(`no canned response for ${args.name}`);
    return args.schema.parse(typeof r === "function" ? (r as (p: string) => unknown)(args.prompt) : r);
  }
  async runAgent(): Promise<AgentResult> {
    throw new Error("not used");
  }
}

describe("playlist engine (rule-based)", () => {
  it("builds a verified, de-duplicated, sequenced playlist from history + catalog", async () => {
    const { engine } = await setup();
    const r = await engine.run("Build me a playlist for a romantic night in Miami", { defaultCount: 8, persist: true });
    expect(r.tracks.length).toBeGreaterThanOrEqual(5);
    expect(r.playlistId).toBeTruthy();
    const ids = r.tracks.map((t) => t.videoId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(r.tracks.some((t) => t.title.includes("Unavailable"))).toBe(false);
    const perArtist = new Map<string, number>();
    for (const t of r.tracks) perArtist.set(t.artists[0]!, (perArtist.get(t.artists[0]!) ?? 0) + 1);
    expect(Math.max(...perArtist.values())).toBeLessThanOrEqual(2);
    expect(r.tracks.some((t) => t.familiar)).toBe(true);
    expect(r.tracks.every((t) => t.reason.length > 0)).toBe(true);
    expect(r.notes.join(" ")).toMatch(/No LLM configured/);
  });

  it("honours seed exclusions and profile corrections", async () => {
    const { engine, db } = await setup();
    await addCorrection(db, "exclude_artist", "Coral Static");
    const r = await engine.run("Find 6 songs that sound like Velvet Hour by Nova Lune without repeating the same artist", { defaultCount: 15, persist: false });
    expect(r.criteria.count).toBe(6);
    expect(r.tracks.length).toBeGreaterThan(0);
    expect(r.tracks.length).toBeLessThanOrEqual(6);
    expect(r.tracks.some((t) => t.artists.includes("Nova Lune"))).toBe(false);
    expect(r.tracks.some((t) => t.artists.includes("Coral Static"))).toBe(false);
    expect(r.tracks.some((t) => t.sources.includes("seed_radio"))).toBe(true);
    expect(new Set(r.tracks.map((t) => t.artists[0])).size).toBe(r.tracks.length);
  });

  it("uses recent listening as an explicit proxy for 'my mood'", async () => {
    const { engine } = await setup();
    const r = await engine.run("Play something based on my current mood", { defaultCount: 5, persist: false });
    expect(r.notes.join(" ")).toMatch(/can't sense your mood/);
    expect(r.tracks.some((t) => t.sources.includes("seed_radio"))).toBe(true);
  });

  it("says when 'this song' had to be guessed from history", async () => {
    const { engine } = await setup();
    const r = await engine.run("Find 5 songs that match the energy of this track", { defaultCount: 5, persist: false });
    expect(r.notes.join(" ")).toMatch(/most recent YouTube Music history item/);
  });
});

describe("playlist engine (LLM path)", () => {
  it("drops unverifiable AI suggestions and ignores picks outside the candidate list", async () => {
    const llm = new FakeLlm({
      playlist_criteria: {
        title: "Intimate, Expensive",
        description: "Low lights",
        count: 4,
        durationMinutes: null,
        moods: ["intimate", "atmospheric"],
        genres: ["jazz"],
        avoidGenres: [],
        contexts: ["dinner"],
        energyStart: 0.3,
        energyPeak: 0.5,
        energyEnd: 0.3,
        seedTracks: [],
        seedArtists: [],
        excludeArtists: [],
        excludeSeedArtists: false,
        maxPerArtist: 2,
        discovery: 0.5,
        referencesCurrentTrack: false,
        searchQueries: ["intimate atmospheric"],
        suggestedTracks: [
          { title: "Gold Leaf", artist: "The Quiet Expensive", why: "lacquered jazz" },
          { title: "Totally Invented Song", artist: "Nobody Real", why: "hallucinated" },
        ],
        avoid: [],
      },
      track_annotations: (prompt: string) => ({
        tracks: prompt
          .split("\n")
          .filter((l) => l.startsWith("mock"))
          .map((l) => ({ videoId: l.split(" | ")[0], energy: 0.4, valence: 0.5, moods: ["intimate", "atmospheric"], genres: ["jazz"] })),
      }),
      playlist_picks: { picks: [{ videoId: "notARealId01", reason: "fake" }, { videoId: "mock0000008", reason: "Gold-leaf jazz for a quiet dinner" }], explanation: "Quiet luxury." },
    });
    const { engine } = await setup(llm);
    const r = await engine.run("Make a playlist that feels intimate, expensive, and atmospheric", { defaultCount: 10, persist: false });
    expect(r.usedModel).toBe("fake-model");
    expect(r.notes.join(" ")).toMatch(/1 AI-suggested song\(s\) could not be verified/);
    expect(r.tracks.map((t) => t.videoId)).not.toContain("notARealId01");
    const gold = r.tracks.find((t) => t.videoId === "mock0000008");
    expect(gold?.reason).toBe("Gold-leaf jazz for a quiet dinner");
    expect(gold?.annotationSource).toBe("inferred");
    expect(r.explanation).toBe("Quiet luxury.");
    expect(r.tracks.length).toBe(4);
    // The taste profile was given to the model, with observed/inferred labels.
    expect(llm.prompts.playlist_criteria).toMatch(/OBSERVED top artists \(all-time plays\): Nova Lune \(40\)/);
  });
});
