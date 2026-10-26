import crypto from "node:crypto";
import type { Request, Response } from "express";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import { InvalidGrantError, InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthorizationParams, OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { OAuthClientInformationFull, OAuthTokenRevocationRequest, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { ALL_SCOPES } from "./auth.js";
import { hashToken, randomToken, safeEqual } from "./crypto.js";

const ACCESS_TTL_S = 3600;
const REFRESH_TTL_S = 30 * 24 * 3600;
const CODE_TTL_S = 300;

/**
 * Minimal single-user OAuth 2.1 authorization server for MCP clients such as
 * ChatGPT: dynamic client registration, PKCE (enforced by the SDK handlers),
 * a consent screen gated by the app passphrase, hashed tokens, rotation and
 * revocation. Tokens are opaque random strings; only SHA-256 hashes are stored.
 */
export class SqliteOAuthProvider implements OAuthServerProvider {
  private hmacKey: Buffer;

  constructor(private db: DB, masterKey: Buffer, private passphrase: string) {
    this.hmacKey = crypto.createHmac("sha256", masterKey).update("oauth-consent").digest();
  }

  get clientsStore(): OAuthRegisteredClientsStore {
    return {
      getClient: async (clientId: string) => {
        const row = await this.db.selectFrom("oauth_clients").selectAll().where("client_id", "=", clientId).executeTakeFirst();
        return row ? (JSON.parse(row.metadata) as OAuthClientInformationFull) : undefined;
      },
      registerClient: async (client) => {
        const full: OAuthClientInformationFull = {
          ...client,
          client_id: `mcp_${crypto.randomBytes(16).toString("hex")}`,
          client_id_issued_at: Math.floor(Date.now() / 1000),
        };
        await this.db
          .insertInto("oauth_clients")
          .values({ client_id: full.client_id, client_secret: full.client_secret ?? null, metadata: JSON.stringify(full), created_at: nowIso() })
          .execute();
        return full;
      },
    };
  }

  private sign(payload: string): string {
    return crypto.createHmac("sha256", this.hmacKey).update(payload).digest("base64url");
  }

  /** Renders the consent screen. The request parameters travel in an HMAC-signed blob so they can't be altered. */
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const scopes = (params.scopes?.length ? params.scopes : [...ALL_SCOPES]).filter((s) => (ALL_SCOPES as readonly string[]).includes(s));
    const blob = Buffer.from(
      JSON.stringify({
        c: client.client_id,
        r: params.redirectUri,
        s: params.state ?? null,
        p: params.codeChallenge,
        sc: scopes,
        rs: params.resource?.href ?? null,
        t: Date.now(),
      }),
    ).toString("base64url");
    const sig = this.sign(blob);
    const name = escapeHtml(client.client_name ?? client.client_id);
    // form-action must also allow the client's origin because the consent POST redirects there.
    res.setHeader("Content-Security-Policy", `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${new URL(params.redirectUri).origin}`);
    res.setHeader("X-Frame-Options", "DENY");
    res.status(200).type("html").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorize</title>
<style>body{font:16px -apple-system,system-ui,sans-serif;max-width:420px;margin:40px auto;padding:0 16px;background:#0e0e12;color:#eee}input,button{font:inherit;width:100%;padding:12px;margin:6px 0;border-radius:10px;border:1px solid #444;background:#1b1b22;color:#eee;box-sizing:border-box}button{background:#e63946;border:0;font-weight:600}.muted{color:#999;font-size:14px}</style></head>
<body><h2>Allow ${name}?</h2><p>${name} wants to use your YouTube Music Companion with these permissions:</p>
<ul>${scopes.map((s) => `<li>${s === "music:read" ? "Read your taste profile, history and playlists" : "Create playlists and (with confirmation) modify playlists"}</li>`).join("")}</ul>
<form method="post" action="/oauth/consent"><input type="hidden" name="blob" value="${blob}"><input type="hidden" name="sig" value="${sig}">
<input type="password" name="passphrase" placeholder="App passphrase" autocomplete="current-password" required>
<button type="submit" name="decision" value="allow">Allow</button><button type="submit" name="decision" value="deny" style="background:#333">Deny</button></form>
<p class="muted">Redirects to ${escapeHtml(new URL(params.redirectUri).origin)}</p></body></html>`);
  }

  /** POST /oauth/consent handler. */
  async handleConsent(req: Request, res: Response): Promise<void> {
    const { blob, sig, passphrase, decision } = (req.body ?? {}) as Record<string, string>;
    if (!blob || !sig || !safeEqual(sig, this.sign(blob))) {
      res.status(400).send("Invalid or tampered authorization request.");
      return;
    }
    const p = JSON.parse(Buffer.from(blob, "base64url").toString()) as { c: string; r: string; s: string | null; p: string; sc: string[]; rs: string | null; t: number };
    if (Date.now() - p.t > 10 * 60 * 1000) {
      res.status(400).send("Authorization request expired. Start again from your client.");
      return;
    }
    const redirect = new URL(p.r);
    if (p.s) redirect.searchParams.set("state", p.s);
    if (decision !== "allow") {
      redirect.searchParams.set("error", "access_denied");
      res.redirect(302, redirect.href);
      return;
    }
    if (!passphrase || !safeEqual(passphrase, this.passphrase)) {
      res.status(401).send("Wrong passphrase. Go back and try again.");
      return;
    }
    const code = randomToken("code", 24);
    await this.db
      .insertInto("oauth_codes")
      .values({ code_hash: hashToken(code), client_id: p.c, code_challenge: p.p, redirect_uri: p.r, scopes: p.sc.join(" "), resource: p.rs, expires_at: new Date(Date.now() + CODE_TTL_S * 1000).toISOString() })
      .execute();
    redirect.searchParams.set("code", code);
    res.redirect(302, redirect.href);
  }

  private async getCode(clientId: string, code: string) {
    const row = await this.db.selectFrom("oauth_codes").selectAll().where("code_hash", "=", hashToken(code)).executeTakeFirst();
    if (!row || row.client_id !== clientId || row.expires_at < nowIso()) throw new InvalidGrantError("Invalid or expired authorization code");
    return row;
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    return (await this.getCode(client.client_id, authorizationCode)).code_challenge;
  }

  private async issue(clientId: string, scopes: string[], resource: string | null): Promise<OAuthTokens> {
    const access = randomToken("mcpat");
    const refresh = randomToken("mcprt");
    const now = Date.now();
    await this.db
      .insertInto("oauth_tokens")
      .values([
        { token_hash: hashToken(access), kind: "access", client_id: clientId, scopes: scopes.join(" "), resource, expires_at: new Date(now + ACCESS_TTL_S * 1000).toISOString(), revoked_at: null },
        { token_hash: hashToken(refresh), kind: "refresh", client_id: clientId, scopes: scopes.join(" "), resource, expires_at: new Date(now + REFRESH_TTL_S * 1000).toISOString(), revoked_at: null },
      ])
      .execute();
    return { access_token: access, token_type: "bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: scopes.join(" ") };
  }

  async exchangeAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string, _codeVerifier?: string, redirectUri?: string): Promise<OAuthTokens> {
    const row = await this.getCode(client.client_id, authorizationCode);
    if (redirectUri && redirectUri !== row.redirect_uri) throw new InvalidGrantError("redirect_uri mismatch");
    // Single use.
    await this.db.deleteFrom("oauth_codes").where("code_hash", "=", row.code_hash).execute();
    return this.issue(client.client_id, row.scopes.split(" ").filter(Boolean), row.resource);
  }

  async exchangeRefreshToken(client: OAuthClientInformationFull, refreshToken: string, scopes?: string[]): Promise<OAuthTokens> {
    const row = await this.db.selectFrom("oauth_tokens").selectAll().where("token_hash", "=", hashToken(refreshToken)).executeTakeFirst();
    if (!row || row.kind !== "refresh" || row.client_id !== client.client_id || row.revoked_at || row.expires_at < nowIso()) {
      throw new InvalidGrantError("Invalid refresh token");
    }
    const granted = row.scopes.split(" ").filter(Boolean);
    const next = scopes?.length ? scopes.filter((s) => granted.includes(s)) : granted;
    // Rotate: the old refresh token stops working.
    await this.db.updateTable("oauth_tokens").set({ revoked_at: nowIso() }).where("token_hash", "=", row.token_hash).execute();
    return this.issue(client.client_id, next, row.resource);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const row = await this.db.selectFrom("oauth_tokens").selectAll().where("token_hash", "=", hashToken(token)).executeTakeFirst();
    if (!row || row.kind !== "access" || row.revoked_at || row.expires_at < nowIso()) throw new InvalidTokenError("Invalid or expired token");
    return {
      token,
      clientId: row.client_id,
      scopes: row.scopes.split(" ").filter(Boolean),
      expiresAt: Math.floor(new Date(row.expires_at).getTime() / 1000),
      resource: row.resource ? new URL(row.resource) : undefined,
    };
  }

  async revokeToken(_client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    await this.db.updateTable("oauth_tokens").set({ revoked_at: nowIso() }).where("token_hash", "=", hashToken(request.token)).execute();
  }

  /** For the Settings screen: connected OAuth clients and full revocation. */
  async listClients() {
    const rows = await this.db.selectFrom("oauth_clients").selectAll().orderBy("created_at", "desc").execute();
    return rows.map((r) => {
      const m = JSON.parse(r.metadata) as OAuthClientInformationFull;
      return { clientId: r.client_id, name: m.client_name ?? null, redirectUris: m.redirect_uris, createdAt: r.created_at };
    });
  }

  async revokeClient(clientId: string): Promise<boolean> {
    await this.db.updateTable("oauth_tokens").set({ revoked_at: nowIso() }).where("client_id", "=", clientId).where("revoked_at", "is", null).execute();
    await this.db.deleteFrom("oauth_codes").where("client_id", "=", clientId).execute();
    const r = await this.db.deleteFrom("oauth_clients").where("client_id", "=", clientId).executeTakeFirst();
    return Number(r.numDeletedRows) > 0;
  }

  async optionalVerify(token: string): Promise<{ clientId: string; scopes: string[] } | null> {
    try {
      const info = await this.verifyAccessToken(token);
      return { clientId: info.clientId, scopes: info.scopes };
    } catch {
      return null;
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
