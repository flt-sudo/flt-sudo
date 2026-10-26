import crypto from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { PASS, testApp } from "./helpers.js";

const REDIRECT = "https://chatgpt.com/connector_platform_oauth_redirect";

async function oauthToken(app: Parameters<typeof request>[0], scope = "music:read music:write") {
  const reg = await request(app).post("/register").send({ client_name: "ChatGPT", redirect_uris: [REDIRECT], token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"] });
  expect(reg.status).toBe(201);
  const clientId = reg.body.client_id as string;
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  const auth = await request(app).get("/authorize").query({ client_id: clientId, redirect_uri: REDIRECT, response_type: "code", code_challenge: challenge, code_challenge_method: "S256", state: "xyz", scope });
  expect(auth.status).toBe(200);
  expect(auth.text).toMatch(/Allow ChatGPT\?/);
  const blob = auth.text.match(/name="blob" value="([^"]+)"/)![1]!;
  const sig = auth.text.match(/name="sig" value="([^"]+)"/)![1]!;

  const bad = await request(app).post("/oauth/consent").type("form").send({ blob, sig, passphrase: "wrong", decision: "allow" });
  expect(bad.status).toBe(401);
  const tampered = await request(app).post("/oauth/consent").type("form").send({ blob: blob.slice(0, -2) + "AA", sig, passphrase: PASS, decision: "allow" });
  expect(tampered.status).toBe(400);

  const consent = await request(app).post("/oauth/consent").type("form").send({ blob, sig, passphrase: PASS, decision: "allow" });
  expect(consent.status).toBe(302);
  const loc = new URL(consent.headers.location!);
  expect(loc.origin + loc.pathname).toBe(REDIRECT);
  expect(loc.searchParams.get("state")).toBe("xyz");
  const code = loc.searchParams.get("code")!;

  const tok = await request(app).post("/token").type("form").send({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT });
  expect(tok.status).toBe(200);
  const reuse = await request(app).post("/token").type("form").send({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: clientId, redirect_uri: REDIRECT });
  expect(reuse.status).toBe(400);
  return { ...tok.body, clientId } as { access_token: string; refresh_token: string; clientId: string };
}

const mcp = (app: Parameters<typeof request>[0], token: string, body: unknown) =>
  request(app).post("/mcp").set("Authorization", `Bearer ${token}`).set("Accept", "application/json, text/event-stream").send(body);

describe("MCP + OAuth (ChatGPT connector path)", () => {
  it("publishes discovery metadata and challenges unauthenticated calls", async () => {
    const { app } = await testApp();
    const meta = await request(app).get("/.well-known/oauth-authorization-server");
    expect(meta.body.code_challenge_methods_supported).toContain("S256");
    expect(meta.body.registration_endpoint).toMatch(/\/register$/);
    const prm = await request(app).get("/.well-known/oauth-protected-resource/mcp");
    expect(prm.body.resource).toMatch(/\/mcp$/);
    const r = await request(app).post("/mcp").send({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(r.status).toBe(401);
    expect(r.headers["www-authenticate"]).toMatch(/resource_metadata=/);
  });

  it("full OAuth flow, tool listing, tool call, refresh rotation and revocation", async () => {
    const { app, oauth } = await testApp();
    const tok = await oauthToken(app);

    const init = await mcp(app, tok.access_token, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } });
    expect(init.status).toBe(200);
    expect(init.body.result.serverInfo.name).toBe("yt-music-companion");

    const list = await mcp(app, tok.access_token, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const names = list.body.result.tools.map((t: { name: string }) => t.name);
    for (const n of ["get_music_profile", "get_recent_listening", "recommend_tracks", "generate_playlist", "create_playlist", "add_tracks_to_playlist", "search_music", "open_music", "get_playback_capabilities"]) {
      expect(names).toContain(n);
    }
    const create = list.body.result.tools.find((t: { name: string }) => t.name === "create_playlist");
    expect(create.annotations.readOnlyHint).toBe(false);
    expect(create.annotations.destructiveHint).toBe(true);

    const call = await mcp(app, tok.access_token, { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_music", arguments: { query: "velvet" } } });
    expect(call.body.result.structuredContent.results[0].title).toBe("Velvet Hour");

    const ref = await request(app).post("/token").type("form").send({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: tok.clientId });
    expect(ref.status).toBe(200);
    const old = await request(app).post("/token").type("form").send({ grant_type: "refresh_token", refresh_token: tok.refresh_token, client_id: tok.clientId });
    expect(old.status).toBe(400);

    await oauth.revokeClient(tok.clientId);
    expect((await mcp(app, ref.body.access_token, { jsonrpc: "2.0", id: 4, method: "tools/list", params: {} })).status).toBe(401);
  });

  it("read-only grants don't expose write tools", async () => {
    const { app } = await testApp();
    const tok = await oauthToken(app, "music:read");
    const list = await mcp(app, tok.access_token, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const names = list.body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("search_music");
    expect(names).not.toContain("create_playlist");
  });
});
