import type { NextFunction, Request, Response } from "express";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import { hashToken, randomToken, safeEqual, uuid } from "./crypto.js";

export const SESSION_COOKIE = "ymc_session";
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;

export type Principal =
  | { kind: "session" }
  | { kind: "api_token"; tokenId: string; scopes: string[] }
  | { kind: "oauth"; clientId: string; scopes: string[] };

declare module "express-serve-static-core" {
  interface Request {
    principal?: Principal;
  }
}

export const ALL_SCOPES = ["music:read", "music:write"] as const;

/**
 * Single-user auth. Three credential types, all checked here:
 *  - session cookie (PWA, after passphrase login)
 *  - personal API token (iOS Shortcuts, scripts) — `Authorization: Bearer ymc_...`
 *  - OAuth access token issued to MCP clients such as ChatGPT (verified by OAuthProvider)
 */
export class AuthService {
  constructor(
    private db: DB,
    private passphrase: string,
    private oauthVerify?: (token: string) => Promise<{ clientId: string; scopes: string[] } | null>,
  ) {}

  checkPassphrase(candidate: string): boolean {
    return safeEqual(candidate, this.passphrase);
  }

  async createSession(): Promise<{ token: string; expires: Date }> {
    const token = randomToken("sess");
    const expires = new Date(Date.now() + SESSION_TTL_MS);
    await this.db
      .insertInto("sessions")
      .values({ id_hash: hashToken(token), created_at: nowIso(), expires_at: expires.toISOString() })
      .execute();
    return { token, expires };
  }

  async destroySession(token: string): Promise<void> {
    await this.db.deleteFrom("sessions").where("id_hash", "=", hashToken(token)).execute();
  }

  async verifySession(token: string): Promise<boolean> {
    const row = await this.db
      .selectFrom("sessions")
      .select("expires_at")
      .where("id_hash", "=", hashToken(token))
      .executeTakeFirst();
    return !!row && row.expires_at > nowIso();
  }

  async createApiToken(name: string, scopes: string[]): Promise<{ id: string; token: string }> {
    const token = randomToken("ymc");
    const id = uuid();
    await this.db
      .insertInto("api_tokens")
      .values({ id, name, token_hash: hashToken(token), scopes: scopes.join(" "), created_at: nowIso(), last_used_at: null, revoked_at: null })
      .execute();
    return { id, token };
  }

  async listApiTokens() {
    return this.db
      .selectFrom("api_tokens")
      .select(["id", "name", "scopes", "created_at", "last_used_at", "revoked_at"])
      .orderBy("created_at", "desc")
      .execute();
  }

  async revokeApiToken(id: string): Promise<boolean> {
    const res = await this.db
      .updateTable("api_tokens")
      .set({ revoked_at: nowIso() })
      .where("id", "=", id)
      .where("revoked_at", "is", null)
      .executeTakeFirst();
    return Number(res.numUpdatedRows) > 0;
  }

  async verifyApiToken(token: string): Promise<Principal | null> {
    const row = await this.db
      .selectFrom("api_tokens")
      .select(["id", "scopes", "revoked_at"])
      .where("token_hash", "=", hashToken(token))
      .executeTakeFirst();
    if (!row || row.revoked_at) return null;
    await this.db.updateTable("api_tokens").set({ last_used_at: nowIso() }).where("id", "=", row.id).execute();
    return { kind: "api_token", tokenId: row.id, scopes: row.scopes.split(" ").filter(Boolean) };
  }

  async resolve(req: Request): Promise<Principal | null> {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const token = header.slice(7).trim();
      if (token.startsWith("ymc_")) return this.verifyApiToken(token);
      if (this.oauthVerify) {
        const info = await this.oauthVerify(token);
        if (info) return { kind: "oauth", ...info };
      }
      return null;
    }
    const cookie = (req as Request & { signedCookies?: Record<string, string> }).cookies?.[SESSION_COOKIE];
    if (typeof cookie === "string" && (await this.verifySession(cookie))) return { kind: "session" };
    return null;
  }

  middleware(requiredScope?: (typeof ALL_SCOPES)[number]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const principal = await this.resolve(req);
        if (!principal) {
          res.status(401).json({ error: "unauthorized", message: "Log in or send a valid Bearer token." });
          return;
        }
        if (requiredScope && principal.kind !== "session" && !principal.scopes.includes(requiredScope)) {
          res.status(403).json({ error: "forbidden", message: `Token lacks scope ${requiredScope}.` });
          return;
        }
        req.principal = principal;
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

export function hasScope(p: Principal | undefined, scope: string): boolean {
  if (!p) return false;
  return p.kind === "session" || p.scopes.includes(scope);
}
