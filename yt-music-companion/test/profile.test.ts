import { describe, expect, it } from "vitest";
import { syncLibrary } from "../src/ingest/library.js";
import { importTakeout } from "../src/ingest/takeout.js";
import { computeObserved } from "../src/profile/observed.js";
import { addCorrection, getProfile } from "../src/profile/profile.js";
import { MockProvider } from "../src/providers/music/mock.js";
import { takeoutFixture, testDb } from "./helpers.js";

describe("observed profile", () => {
  it("computes counts, recent window relative to data end, and discovery", async () => {
    const db = await testDb();
    const mock = new MockProvider();
    await importTakeout(db, takeoutFixture(mock));
    const o = await computeObserved(db, { timezone: "UTC", recentDays: 90 });
    expect(o.totals.plays).toBe(67);
    expect(o.topArtists[0]).toMatchObject({ artist: "Nova Lune", plays: 40 });
    // Window ends at the newest play (2024-06-20), not "now".
    expect(o.recentWindow.endsAt).toBe("2024-06-20T01:15:00.000Z");
    expect(o.recentTopArtists.map((a) => a.artist)).toEqual(["Arcade Saints", "Ivo Ren"]);
    expect(o.discovery.newArtistsInRecentWindow).toEqual(["Arcade Saints", "Ivo Ren"]);
    expect(o.heavyRotation[0]).toMatchObject({ title: "Midnight Causeway", plays: 20 });
    expect(o.listeningHours.lateNightShare).toBeCloseTo(60 / 67, 5);
    expect(o.trends.map((t) => t.month)).toEqual(["2024-01", "2024-02", "2024-03", "2024-06"]);
  });

  it("labels inferred data, applies corrections and states freshness", async () => {
    const db = await testDb();
    const mock = new MockProvider();
    await mock.configure("{}");
    await importTakeout(db, takeoutFixture(mock));
    const sync = await syncLibrary(db, mock);
    expect(sync.errors).toEqual([]);
    expect(sync.liked).toBe(5);
    await db.insertInto("profile_inferences").values({ id: "inf1", kind: "genre", value: "rnb", weight: 0.9, confidence: 0.8, evidence: "Nova Lune", model: "test", created_at: "2024-07-01T00:00:00Z" }).execute();
    let p = await getProfile(db);
    expect(p.inferred.items.map((i) => i.value)).toEqual(["rnb"]);
    expect(p.inferred.label).toMatch(/AI-inferred/);
    expect(p.freshness).toMatch(/static export/);
    expect(p.observed.library.playlists.find((x) => x.title === "Late Night")).toBeTruthy();
    await addCorrection(db, "reject_inference", "genre:rnb");
    p = await getProfile(db);
    expect(p.inferred.items).toEqual([]);
    expect(p.corrections).toHaveLength(1);
  });
});
