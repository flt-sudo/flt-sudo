import { describe, expect, it } from "vitest";
import { dedupeKey } from "../src/engine/playlist.js";
import { energyCurve, fitDuration, sequence, spaceArtists } from "../src/engine/sequence.js";
import { heuristicCriteria } from "../src/engine/criteria.js";

describe("sequencing", () => {
  it("builds an arc that peaks around 60%", () => {
    const c = energyCurve(11, 0.3, 0.9, 0.4);
    expect(c[0]).toBeCloseTo(0.3);
    expect(c[6]).toBeCloseTo(0.9);
    expect(c[10]).toBeCloseTo(0.4);
    expect(Math.max(...c)).toBeCloseTo(0.9);
  });

  it("places high-energy tracks near the peak and spaces artists", () => {
    const items = [
      { videoId: "a", artist: "X", energy: 0.9, durationS: 200 },
      { videoId: "b", artist: "X", energy: 0.2, durationS: 200 },
      { videoId: "c", artist: "Y", energy: 0.5, durationS: 200 },
      { videoId: "d", artist: "Z", energy: 0.3, durationS: 200 },
      { videoId: "e", artist: "W", energy: 0.8, durationS: 200 },
    ];
    const out = sequence(items, { start: 0.2, peak: 0.9, end: 0.3 });
    expect(out).toHaveLength(5);
    expect(new Set(out.map((o) => o.videoId)).size).toBe(5);
    expect(out[0]!.energy).toBeLessThan(0.4);
    const peakIdx = out.findIndex((o) => o.videoId === "a");
    expect(peakIdx).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < out.length; i++) expect(out[i]!.artist === out[i - 1]!.artist && out[i]!.artist === "X").toBe(false);
  });

  it("spaces repeated artists when possible", () => {
    const out = spaceArtists([{ artist: "A" }, { artist: "A" }, { artist: "B" }, { artist: "C" }]);
    expect(out.map((o) => o.artist)).not.toEqual(["A", "A", "B", "C"]);
    expect(out[0]!.artist === out[1]!.artist).toBe(false);
  });

  it("fits a duration target", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ videoId: String(i), artist: String(i), energy: 0.5, durationS: 240 }));
    const out = fitDuration(items, 90);
    const total = out.reduce((s, x) => s + x.durationS, 0);
    expect(Math.abs(total - 90 * 60)).toBeLessThanOrEqual(240);
  });
});

describe("criteria + dedupe", () => {
  it("parses common phrasings without an LLM", () => {
    const c = heuristicCriteria("Build a 90-minute late-night driving playlist");
    expect(c.durationMinutes).toBe(90);
    expect(c.moods).toContain("driving");
    const s = heuristicCriteria("Find 15 songs that sound like Velvet Hour by Nova Lune without repeating the same artist");
    expect(s.count).toBe(15);
    expect(s.seedTracks[0]).toEqual({ title: "Velvet Hour", artist: "Nova Lune" });
    expect(s.excludeSeedArtists).toBe(true);
    expect(s.maxPerArtist).toBe(1);
    expect(heuristicCriteria("Find 15 songs that match the energy of this track").referencesCurrentTrack).toBe(true);
    expect(heuristicCriteria("romantic but not corny").avoid).toContain("corny");
  });

  it("treats remasters/live/feat variants as duplicates", () => {
    expect(dedupeKey("Heartline (2019 Remaster)", "Sade Rivers")).toBe(dedupeKey("Heartline", "Sade Rivers"));
    expect(dedupeKey("Heartline [Official Video]", "sade rivers")).toBe(dedupeKey("Heartline", "Sade Rivers"));
    expect(dedupeKey("Heartline II", "Sade Rivers")).not.toBe(dedupeKey("Heartline", "Sade Rivers"));
  });
});
