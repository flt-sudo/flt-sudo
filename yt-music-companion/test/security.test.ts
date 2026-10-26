import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { AuthService } from "../src/security/auth.js";
import { CredentialStore } from "../src/security/credentials.js";
import { open, seal } from "../src/security/crypto.js";
import { testDb } from "./helpers.js";

const key = crypto.randomBytes(32);

describe("crypto", () => {
  it("round-trips and binds to AAD", () => {
    const s = seal(key, "cookie: SAPISID=secret", "cred:ytmusic");
    expect(s.ciphertext).not.toContain("secret");
    expect(open(key, s, "cred:ytmusic")).toBe("cookie: SAPISID=secret");
    expect(() => open(key, s, "cred:other")).toThrow();
    const tampered = { ...s, ciphertext: Buffer.from("x" + s.ciphertext).toString("base64") };
    expect(() => open(key, tampered, "cred:ytmusic")).toThrow();
    expect(() => open(crypto.randomBytes(32), s, "cred:ytmusic")).toThrow();
  });

  it("stores credentials encrypted and deletes on disconnect", async () => {
    const db = await testDb();
    const store = new CredentialStore(db, key);
    await store.put("ytmusic", '{"cookie":"SECRET"}');
    const row = await db.selectFrom("credentials").selectAll().executeTakeFirstOrThrow();
    expect(JSON.stringify(row)).not.toContain("SECRET");
    expect(await store.get("ytmusic")).toBe('{"cookie":"SECRET"}');
    expect(await store.delete("ytmusic")).toBe(true);
    expect(await store.get("ytmusic")).toBeNull();
  });
});

describe("auth", () => {
  it("issues hashed API tokens that can be revoked", async () => {
    const db = await testDb();
    const auth = new AuthService(db, "a long passphrase");
    const { id, token } = await auth.createApiToken("shortcuts", ["music:read"]);
    const row = await db.selectFrom("api_tokens").selectAll().executeTakeFirstOrThrow();
    expect(row.token_hash).not.toBe(token);
    expect(await auth.verifyApiToken(token)).toMatchObject({ kind: "api_token", scopes: ["music:read"] });
    await auth.revokeApiToken(id);
    expect(await auth.verifyApiToken(token)).toBeNull();
    expect(auth.checkPassphrase("a long passphrase")).toBe(true);
    expect(auth.checkPassphrase("wrong")).toBe(false);
  });
});

describe("config", () => {
  it("validates required secrets without echoing values", () => {
    expect(() => loadConfig({ MASTER_KEY: "c2hvcnQ=", APP_PASSPHRASE: "long enough pass" })).toThrow(/32 bytes/);
    expect(() => loadConfig({ APP_PASSPHRASE: "x" })).toThrow(/MASTER_KEY/);
    expect(() =>
      loadConfig({ MASTER_KEY: crypto.randomBytes(32).toString("base64"), APP_PASSPHRASE: "long enough pass", LLM_PROVIDER: "anthropic" }),
    ).toThrow(/ANTHROPIC_API_KEY/);
  });
});
