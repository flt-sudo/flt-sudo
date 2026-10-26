import request from "supertest";
import { describe, expect, it } from "vitest";
import { PASS, takeoutFixture, testApp } from "./helpers.js";

const HEADERS = `accept: */*\ncookie: SAPISID=fake; __Secure-3PAPISID=fake\nx-goog-authuser: 0\nuser-agent: Mozilla/5.0 (iPhone)\n`;

async function loggedIn() {
  const t = await testApp();
  const agent = request.agent(t.app);
  const res = await agent.post("/api/auth/login").send({ passphrase: PASS });
  expect(res.status).toBe(200);
  expect(res.headers["set-cookie"]?.[0]).toMatch(/HttpOnly/);
  expect(res.headers["set-cookie"]?.[0]).toMatch(/SameSite=Strict/);
  return { t, agent };
}

describe("HTTP API", () => {
  it("requires auth and rejects wrong passphrase", async () => {
    const t = await testApp();
    expect((await request(t.app).get("/api/health")).body).toEqual({ ok: true });
    expect((await request(t.app).get("/api/profile")).status).toBe(401);
    expect((await request(t.app).post("/api/auth/login").send({ passphrase: "nope" })).status).toBe(401);
    expect((await request(t.app).get("/api/profile").set("Authorization", "Bearer ymc_invalid")).status).toBe(401);
  });

  it("end-to-end: connect, import, sync, generate, save, open, confirm-gated add", async () => {
    const { t, agent } = await loggedIn();

    const conn = await agent.post("/api/integrations/ytmusic/connect").send({ headers: HEADERS });
    expect(conn.body).toMatchObject({ connected: true, verified: true });
    const credRow = await t.db.selectFrom("credentials").selectAll().executeTakeFirstOrThrow();
    expect(credRow.ciphertext).not.toContain("mock");

    const imp = await agent.post("/api/import/takeout").send(takeoutFixture(t.mock));
    expect(imp.body.stats.inserted).toBe(67);
    const sync = await agent.post("/api/library/sync");
    expect(sync.body.errors).toEqual([]);

    const profile = await agent.get("/api/profile");
    expect(profile.body.observed.topArtists[0].artist).toBe("Nova Lune");
    expect(profile.body.freshness).toMatch(/Takeout/);

    const gen = await agent.post("/api/tools/generate_playlist").send({ request: "late-night driving playlist", count: 6 });
    expect(gen.status).toBe(200);
    expect(gen.body.saved).toBe(false);
    expect(gen.body.tracks.length).toBeGreaterThan(2);

    const save = await agent.post("/api/tools/create_playlist").send({ playlistId: gen.body.playlistId });
    expect(save.body.status).toBe("created_verified");
    expect(save.body.privacy).toBe("PRIVATE");
    expect(save.body.links.web).toMatch(/^https:\/\/music\.youtube\.com\/playlist\?list=PLmock/);
    const again = await agent.post("/api/tools/create_playlist").send({ playlistId: gen.body.playlistId });
    expect(again.body.status).toBe("already_saved");

    const open = await agent.post("/api/tools/open_music").send({ kind: "track", query: "Velvet Hour" });
    expect(open.body).toMatchObject({ status: "link_ready", playbackConfirmed: false });
    expect(open.body.links.web).toBe("https://music.youtube.com/watch?v=mock0000000");

    // App-created playlist: no confirmation needed; duplicates skipped.
    const addOwn = await agent.post("/api/tools/add_tracks_to_playlist").send({ playlist: save.body.remotePlaylistId, videoIds: ["mock0000019", gen.body.tracks[0].videoId] });
    expect(addOwn.body.status).toBe("added_verified");
    expect(addOwn.body.skippedDuplicates).toBe(1);

    // Pre-existing user playlist: confirmation required, nothing changes until confirmed.
    const before = t.mock.calls.filter((c) => c.method === "addPlaylistItems").length;
    const pending = await agent.post("/api/tools/add_tracks_to_playlist").send({ playlist: "late night", videoIds: ["mock0000017"] });
    expect(pending.body.status).toBe("confirmation_required");
    expect(pending.body.summary).toMatch(/Heartline/);
    expect(t.mock.calls.filter((c) => c.method === "addPlaylistItems").length).toBe(before);
    const conf = await agent.post(`/api/confirm/${pending.body.confirmationId}`).send({ confirm: true });
    expect(conf.status).toBe(200);
    expect(t.mock.calls.filter((c) => c.method === "addPlaylistItems").length).toBe(before + 1);
    const replay = await agent.post(`/api/confirm/${pending.body.confirmationId}`).send({ confirm: true });
    expect(replay.status).toBe(404);
  });

  it("enforces API-token scopes and session-only routes", async () => {
    const { t, agent } = await loggedIn();
    const tok = await agent.post("/api/tokens").send({ name: "Shortcuts", scopes: ["music:read"] });
    expect(tok.status).toBe(201);
    const bearer = { Authorization: `Bearer ${tok.body.token}` };
    expect((await request(t.app).get("/api/capabilities").set(bearer)).status).toBe(200);
    const write = await request(t.app).post("/api/tools/create_playlist").set(bearer).send({ videoIds: ["mock0000000"] });
    expect(write.status).toBe(403);
    expect((await request(t.app).get("/api/data/export").set(bearer)).status).toBe(403);
    expect((await request(t.app).post("/api/tokens").set(bearer).send({})).status).toBe(403);
    await agent.delete(`/api/tokens/${tok.body.id}`);
    expect((await request(t.app).get("/api/capabilities").set(bearer)).status).toBe(401);
  });

  it("rejects cross-origin cookie writes", async () => {
    const { agent } = await loggedIn();
    const r = await agent.post("/api/tools/rate_track").set("Origin", "https://evil.example").send({ videoId: "mock0000000", rating: "up" });
    expect(r.status).toBe(403);
  });

  it("chat + Shortcuts endpoints work without an LLM and never claim playback", async () => {
    const { t, agent } = await loggedIn();
    await agent.post("/api/integrations/ytmusic/connect").send({ headers: HEADERS });
    await agent.post("/api/import/takeout").send(takeoutFixture(t.mock));
    const chat = await agent.post("/api/chat").send({ message: "Analyze my music taste" });
    expect(chat.body.text).toMatch(/Nova Lune \(40 plays\)/);
    expect(chat.body.toolCalls[0].name).toBe("get_music_profile");
    const skip = await agent.post("/api/chat").send({ message: "Skip this song" });
    expect(skip.body.text).toMatch(/can't control playback/);
    const play = await agent.post("/api/shortcuts/ask").send({ text: "Play Velvet Hour" });
    expect(play.body.openUrl).toBe("https://music.youtube.com/watch?v=mock0000000");
    expect(play.body.playbackConfirmed).toBe(false);
    expect(play.body.reply).not.toMatch(/now playing/i);
  });

  it("disconnects, exports and deletes data", async () => {
    const { t, agent } = await loggedIn();
    await agent.post("/api/integrations/ytmusic/connect").send({ headers: HEADERS });
    await agent.post("/api/import/takeout").send(takeoutFixture(t.mock));
    const exp = await agent.get("/api/data/export");
    expect(exp.headers["content-disposition"]).toMatch(/attachment/);
    expect(exp.body.plays).toHaveLength(67);
    expect(JSON.stringify(exp.body)).not.toMatch(/ciphertext/);
    const dis = await agent.delete("/api/integrations/ytmusic");
    expect(dis.body.disconnected).toBe(true);
    expect((await agent.post("/api/library/sync")).status).toBe(409);
    expect((await agent.delete("/api/data").send({})).status).toBe(400);
    const del = await agent.delete("/api/data").send({ confirm: "DELETE MY DATA" });
    expect(del.body.deleted).toContain("plays");
    expect((await agent.get("/api/profile")).body.observed.totals.plays).toBe(0);
  });
});
