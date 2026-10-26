import { describe, expect, it } from "vitest";
import { cleanTitle, extractVideoId, importTakeout, parseTakeout } from "../src/ingest/takeout.js";
import { MockProvider } from "../src/providers/music/mock.js";
import { takeoutFixture, testDb } from "./helpers.js";

describe("Takeout parsing", () => {
  it("extracts video ids and cleans localized titles", () => {
    expect(extractVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(extractVideoId(undefined)).toBeNull();
    expect(cleanTitle("Watched Velvet Hour")).toBe("Velvet Hour");
    expect(cleanTitle("Has visto Canción")).toBe("Canción");
    expect(cleanTitle("Watched")).toBe("Watched");
  });

  it("keeps only YouTube Music plays and reports what it skipped", () => {
    const { plays, stats } = parseTakeout(takeoutFixture(new MockProvider()));
    expect(stats.musicPlays).toBe(67);
    expect(stats.skippedNonMusic).toBe(1);
    expect(stats.skippedRemoved).toBe(1);
    expect(stats.skippedAds).toBe(1);
    expect(plays[0]!.artist).toBe("Nova Lune"); // " - Topic" stripped
  });

  it("rejects non-array input with a helpful message", () => {
    expect(() => parseTakeout({ not: "an array" })).toThrow(/JSON array/);
  });

  it("imports idempotently", async () => {
    const db = await testDb();
    const fx = takeoutFixture(new MockProvider());
    const first = await importTakeout(db, fx);
    expect(first.stats.inserted).toBe(67);
    expect(first.dataFrom).toBe("2024-01-01T23:30:00.000Z");
    const second = await importTakeout(db, fx);
    expect(second.stats.inserted).toBe(0);
    expect(second.stats.duplicates).toBe(67);
    const n = await db.selectFrom("plays").select((eb) => eb.fn.countAll<number>().as("n")).executeTakeFirst();
    expect(Number(n!.n)).toBe(67);
  });
});
