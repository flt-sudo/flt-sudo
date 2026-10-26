import fs from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { ProviderError } from "../src/providers/music/types.js";
import { YTMusicProvider } from "../src/providers/music/ytmusic.js";

// Exercises the real Node <-> Python subprocess bridge. Network calls to YouTube
// are not made: we only use methods that fail locally before any request.
const python = fs.existsSync(".venv/bin/python") ? ".venv/bin/python" : "python3";
const p = new YTMusicProvider({ pythonBin: python, adapterPath: "./adapter/ytm_adapter.py", minIntervalMs: 0, timeoutMs: 20_000 });
afterAll(() => p.close());

describe("ytmusic adapter bridge", () => {
  it("reports status over the stdio protocol", async () => {
    const s = await p.status();
    expect(s.provider).toBe("ytmusic");
    expect(s.authenticated).toBe(false);
  });

  it("maps adapter errors to typed ProviderErrors", async () => {
    await p.configure(null);
    const err = await p.likedSongs().catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(["not_authenticated", "dependency_missing"]).toContain(err.type);
  });

  it("parses pasted browser headers without echoing them on failure", async () => {
    const err = await p.setupBrowserAuth("garbage without cookie SECRET123").catch((e) => e);
    if (err instanceof ProviderError) expect(err.message).not.toContain("SECRET123");
  });

  it("reports a clear error when Python is missing", async () => {
    const broken = new YTMusicProvider({ pythonBin: "/nonexistent/python", adapterPath: "x.py", minIntervalMs: 0 });
    const s = await broken.status();
    expect(s.available).toBe(false);
    await broken.close();
  });
});
