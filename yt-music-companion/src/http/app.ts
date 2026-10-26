import fs from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import type { Logger } from "pino";
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { runChat } from "../agent/chat.js";
import { baseUrl, type Config } from "../config.js";
import { deleteAll, exportAll } from "../data/privacy.js";
import type { DB } from "../db/index.js";
import { importTakeout } from "../ingest/takeout.js";
import { syncLibrary } from "../ingest/library.js";
import type { LlmProvider } from "../llm/types.js";
import { CORRECTION_KINDS, addCorrection, deleteCorrection, getCorrections } from "../profile/profile.js";
import { ProviderError, type MusicProvider } from "../providers/music/types.js";
import { ALL_SCOPES, type AuthService, hasScope, SESSION_COOKIE } from "../security/auth.js";
import type { CredentialStore } from "../security/credentials.js";
import type { SqliteOAuthProvider } from "../security/oauth.js";
import { callTool, type ToolContext, ToolError, TOOLS, toolJsonSchema } from "../tools/registry.js";
import { handleMcp } from "./mcp.js";

export interface AppDeps {
  cfg: Config;
  db: DB;
  provider: MusicProvider;
  llm: LlmProvider;
  auth: AuthService;
  credentials: CredentialStore;
  oauth: SqliteOAuthProvider;
  toolCtx: ToolContext;
  log: Logger;
  webDir?: string;
}

const YTM_CRED = "ytmusic";

type Handler = (req: Request, res: Response) => Promise<unknown>;
const h = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next);
};

function scopesOf(req: Request): string[] | "all" {
  const p = req.principal;
  if (!p || p.kind === "session") return "all";
  return p.scopes;
}

function sessionOnly(req: Request, res: Response, next: NextFunction) {
  if (req.principal?.kind !== "session") {
    res.status(403).json({ error: "forbidden", message: "This action requires logging in to the app (not an API token)." });
    return;
  }
  next();
}

export function createApp(d: AppDeps) {
  const { cfg, db, provider, auth, credentials, oauth, toolCtx, log } = d;
  const app = express();
  const origin = baseUrl(cfg);
  const secureCookies = origin.startsWith("https://");
  app.set("trust proxy", cfg.PUBLIC_BASE_URL ? 1 : false);
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    if (secureCookies) res.setHeader("Strict-Transport-Security", "max-age=31536000");
    if (!req.path.startsWith("/authorize")) {
      res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    }
    next();
  });
  app.use(cookieParser());

  const globalLimiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false });
  const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "rate_limited", message: "Too many attempts; wait 15 minutes." } });
  const heavyLimiter = rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "rate_limited", message: "Slow down — too many AI requests per minute." } });
  app.use(globalLimiter);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // ---- OAuth 2.1 for MCP clients (ChatGPT etc.) -----------------------------
  const mcpUrl = new URL("/mcp", origin);
  app.use("/oauth/consent", loginLimiter);
  app.post("/oauth/consent", express.urlencoded({ extended: false, limit: "16kb" }), h((req, res) => oauth.handleConsent(req, res)));
  app.use(
    mcpAuthRouter({
      provider: oauth,
      issuerUrl: new URL(origin),
      resourceServerUrl: mcpUrl,
      scopesSupported: [...ALL_SCOPES],
      resourceName: "YouTube Music Companion",
    }),
  );
  const bearer = requireBearerAuth({ verifier: oauth, resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpUrl) });
  app.post("/mcp", heavyLimiter, bearer, express.json({ limit: "1mb" }), h((req, res) => handleMcp(toolCtx, req, res)));
  app.all("/mcp", (_req, res) => {
    res.status(405).set("Allow", "POST").json({ error: "method_not_allowed", message: "Stateless MCP: use POST." });
  });

  // ---- auth ---------------------------------------------------------------
  const json = express.json({ limit: "1mb" });
  app.post("/api/auth/login", loginLimiter, json, h(async (req, res) => {
    const pass = (req.body as { passphrase?: unknown })?.passphrase;
    if (typeof pass !== "string" || !auth.checkPassphrase(pass)) {
      res.status(401).json({ error: "invalid_passphrase", message: "Wrong passphrase." });
      return;
    }
    const s = await auth.createSession();
    res.cookie(SESSION_COOKIE, s.token, { httpOnly: true, secure: secureCookies, sameSite: "strict", expires: s.expires, path: "/" });
    res.json({ ok: true });
  }));
  app.post("/api/auth/logout", h(async (req, res) => {
    const c = req.cookies?.[SESSION_COOKIE];
    if (typeof c === "string") await auth.destroySession(c);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ ok: true });
  }));

  const api = express.Router();
  api.use(auth.middleware());
  api.use(json);
  // CSRF: session-cookie requests must come from our own origin (SameSite=strict + this check).
  api.use((req, res, next) => {
    if (req.principal?.kind === "session" && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const o = req.headers.origin;
      if (o && o !== origin && o !== `http://localhost:${cfg.PORT}`) {
        res.status(403).json({ error: "bad_origin", message: "Cross-origin request rejected." });
        return;
      }
    }
    next();
  });

  api.get("/auth/me", h(async (req, res) => {
    res.json({ principal: req.principal?.kind, llm: { provider: d.llm.name, model: d.llm.model, isModel: d.llm.isModel }, musicProvider: provider.name });
  }));

  // ---- tokens (for iOS Shortcuts) ----------------------------------------------
  api.get("/tokens", sessionOnly, h(async (_req, res) => res.json({ tokens: await auth.listApiTokens() })));
  api.post("/tokens", sessionOnly, h(async (req, res) => {
    const { name, scopes } = (req.body ?? {}) as { name?: string; scopes?: string[] };
    const sc = (scopes?.length ? scopes : ["music:read"]).filter((s) => (ALL_SCOPES as readonly string[]).includes(s));
    const t = await auth.createApiToken((name ?? "iOS Shortcuts").slice(0, 60), sc);
    res.status(201).json({ ...t, scopes: sc, note: "Copy this token now; it is shown only once." });
  }));
  api.delete("/tokens/:id", sessionOnly, h(async (req, res) => res.json({ revoked: await auth.revokeApiToken(String(req.params.id)) })));
  api.get("/oauth/clients", sessionOnly, h(async (_req, res) => res.json({ clients: await oauth.listClients() })));
  api.delete("/oauth/clients/:id", sessionOnly, h(async (req, res) => res.json({ revoked: await oauth.revokeClient(String(req.params.id)) })));

  // ---- integrations ---------------------------------------------------------------
  api.get("/integrations", h(async (_req, res) => {
    const [status, meta, imports] = await Promise.all([
      provider.status(),
      credentials.meta(YTM_CRED),
      db.selectFrom("imports").selectAll().orderBy("started_at", "desc").limit(10).execute(),
    ]);
    res.json({ ytmusic: { ...status, connectedAt: meta.created_at ?? null }, llm: { provider: d.llm.name, model: d.llm.model, isModel: d.llm.isModel }, imports });
  }));
  api.post("/integrations/ytmusic/connect", sessionOnly, h(async (req, res) => {
    const headers = (req.body as { headers?: unknown })?.headers;
    if (typeof headers !== "string" || headers.length < 50 || headers.length > 32_000) {
      res.status(400).json({ error: "invalid_headers", message: "Paste the full request headers copied from an authenticated music.youtube.com request." });
      return;
    }
    const authJson = await provider.setupBrowserAuth(headers);
    await credentials.put(YTM_CRED, authJson, { method: "browser_headers" });
    await provider.configure(authJson);
    // Prove the credential works before reporting success.
    try {
      const lists = await provider.libraryPlaylists(5);
      res.json({ connected: true, verified: true, samplePlaylists: lists.slice(0, 3).map((p) => p.title) });
    } catch (err) {
      res.json({ connected: true, verified: false, message: `Saved, but a test request failed: ${(err as Error).message}` });
    }
  }));
  api.delete("/integrations/ytmusic", sessionOnly, h(async (_req, res) => {
    const removed = await credentials.delete(YTM_CRED);
    await provider.configure(null);
    res.json({
      disconnected: removed,
      revokeRemotely:
        "The stored cookie copy is deleted. To invalidate it at Google too, sign out of music.youtube.com in the browser you copied it from (or Google Account → Security → Your devices → sign out that session).",
    });
  }));
  api.post("/library/sync", heavyLimiter, h(async (_req, res) => {
    if (!(await credentials.meta(YTM_CRED)).connected) {
      res.status(409).json({ error: "not_connected", message: "Connect YouTube Music first." });
      return;
    }
    res.json(await syncLibrary(db, provider));
  }));

  // ---- imports -------------------------------------------------------------------
  api.post("/import/takeout", express.json({ limit: "300mb" }), h(async (req, res) => {
    const includeYouTube = req.query.includeYouTube === "true";
    res.json(await importTakeout(db, req.body, { includeYouTube }));
  }));
  api.get("/imports", h(async (_req, res) => res.json({ imports: await db.selectFrom("imports").selectAll().orderBy("started_at", "desc").limit(50).execute() })));

  // ---- profile corrections / feedback -------------------------------------------------
  api.get("/profile/corrections", h(async (_req, res) => res.json({ corrections: await getCorrections(db), kinds: CORRECTION_KINDS })));
  api.post("/profile/corrections", h(async (req, res) => {
    if (!hasScope(req.principal, "music:write")) throw new ToolError("forbidden", "Needs music:write", 403);
    const { kind, value, note } = (req.body ?? {}) as { kind?: string; value?: string; note?: string };
    if (!kind || !(CORRECTION_KINDS as readonly string[]).includes(kind) || !value) throw new ToolError("invalid_params", `kind must be one of ${CORRECTION_KINDS.join(", ")} and value is required`);
    res.status(201).json(await addCorrection(db, kind as (typeof CORRECTION_KINDS)[number], value, note));
  }));
  api.delete("/profile/corrections/:id", h(async (req, res) => {
    if (!hasScope(req.principal, "music:write")) throw new ToolError("forbidden", "Needs music:write", 403);
    res.json({ deleted: await deleteCorrection(db, String(req.params.id)) });
  }));

  // ---- tools (generic) + REST conveniences ------------------------------------------------
  api.get("/tools", (_req, res) => {
    res.json({ tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, scope: t.scope, readOnly: t.readOnly, remoteWrite: t.remoteWrite, inputSchema: toolJsonSchema(t) })) });
  });
  const heavy = new Set(["recommend_tracks", "generate_playlist"]);
  api.post("/tools/:name", (req, res, next) => (heavy.has(String(req.params.name)) ? heavyLimiter(req, res, next) : next()), h(async (req, res) => {
    res.json(await callTool(toolCtx, String(req.params.name), req.body, scopesOf(req)));
  }));
  const alias = (method: "get" | "post", p: string, tool: string, input: (req: Request) => unknown) =>
    api[method](p, h(async (req, res) => res.json(await callTool(toolCtx, tool, input(req), scopesOf(req)))));
  alias("get", "/profile", "get_music_profile", () => ({}));
  alias("post", "/profile/refresh", "get_music_profile", () => ({ refreshInferences: true }));
  alias("get", "/recent", "get_recent_listening", (r) => ({ sync: r.query.sync === "true" }));
  alias("get", "/search", "search_music", (r) => ({ query: String(r.query.q ?? ""), type: r.query.type === "videos" ? "videos" : undefined }));
  alias("get", "/capabilities", "get_playback_capabilities", (r) => ({ action: r.query.action ? String(r.query.action) : undefined }));
  alias("get", "/playlists", "list_playlists", (r) => ({ includeTracks: r.query.tracks ? String(r.query.tracks) : undefined }));
  alias("post", "/confirm/:id", "confirm_action", (r) => ({ confirmationId: r.params.id, confirm: (r.body as { confirm?: boolean })?.confirm !== false }));

  // ---- chat (standalone assistant for the PWA and Shortcuts) -------------------------
  api.post("/chat", heavyLimiter, h(async (req, res) => {
    const { message, history } = (req.body ?? {}) as { message?: string; history?: Array<{ role: "user" | "assistant"; text: string }> };
    if (typeof message !== "string" || !message.trim() || message.length > 2000) throw new ToolError("invalid_params", "message (1-2000 chars) is required");
    const hist = Array.isArray(history) ? history.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string").map((m) => ({ role: m.role, text: m.text.slice(0, 4000) })) : [];
    const r = await runChat(toolCtx, d.llm, hist, message.trim(), scopesOf(req));
    res.json(r);
  }));

  // iOS Shortcuts: one round trip, returns text to speak/show and (optionally) a link to open.
  api.post("/shortcuts/ask", heavyLimiter, h(async (req, res) => {
    const text = String((req.body as { text?: string })?.text ?? "").trim();
    if (!text) throw new ToolError("invalid_params", "text is required");
    const r = await runChat(toolCtx, d.llm, [], text, scopesOf(req));
    const links: string[] = [];
    for (const c of r.toolCalls) {
      const o = c.output as { links?: Record<string, string> } | undefined;
      if (o?.links) links.push(...Object.values(o.links));
    }
    const plain = r.text.replace(/\*\*/g, "").replace(/https?:\/\/\S+/g, "").replace(/\n{3,}/g, "\n\n").trim();
    res.json({ reply: plain || r.text, openUrl: links.find((l) => l.startsWith("https://music.youtube.com")) ?? links[0] ?? "", playbackConfirmed: false });
  }));
  api.get("/shortcuts/open", h(async (req, res) => {
    const q = String(req.query.q ?? "").trim();
    const playlist = String(req.query.playlist ?? "").trim();
    const out = (await callTool(toolCtx, "open_music", playlist ? { kind: "playlist", query: playlist } : { kind: "track", query: q }, scopesOf(req))) as { links: Record<string, string> };
    res.json({ ...out, openUrl: out.links.play ?? out.links.web ?? out.links.queue });
  }));

  // ---- privacy: export & delete ------------------------------------------------------
  api.get("/data/export", sessionOnly, h(async (_req, res) => {
    res.setHeader("Content-Disposition", `attachment; filename="music-companion-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(await exportAll(db));
  }));
  api.delete("/data", sessionOnly, h(async (req, res) => {
    const { confirm, everything } = (req.body ?? {}) as { confirm?: string; everything?: boolean };
    if (confirm !== "DELETE MY DATA") throw new ToolError("confirmation_required", 'Send {"confirm":"DELETE MY DATA"} to proceed. This cannot be undone.');
    const r = await deleteAll(db, { everything: !!everything });
    if (everything) await provider.configure(null);
    res.json(r);
  }));

  app.use("/api", api);

  // ---- PWA ----------------------------------------------------------------------
  const webDir = d.webDir ?? path.resolve("dist/web");
  if (fs.existsSync(webDir)) {
    app.use(express.static(webDir, { index: "index.html", maxAge: "1h", setHeaders: (res, p) => p.endsWith("sw.js") && res.setHeader("Cache-Control", "no-cache") }));
    app.get(/^\/(?!api|mcp|oauth|\.well-known).*/, (_req, res) => res.sendFile(path.join(webDir, "index.html")));
  }

  // ---- errors --------------------------------------------------------------------
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ToolError) {
      res.status(err.status).json({ error: err.code, message: err.message });
      return;
    }
    if (err instanceof ProviderError) {
      res.status(err.type === "not_authenticated" ? 409 : err.type === "invalid_headers" ? 400 : 502).json({ error: err.type, message: err.message });
      return;
    }
    const e = err as { type?: string; status?: number; message?: string };
    if (e?.type === "entity.too.large") {
      res.status(413).json({ error: "too_large", message: "Upload too large." });
      return;
    }
    if (e?.type === "entity.parse.failed") {
      res.status(400).json({ error: "invalid_json", message: "Body is not valid JSON." });
      return;
    }
    log.error({ err: e?.message, path: req.path }, "unhandled error");
    res.status(500).json({ error: "internal_error", message: "Something went wrong. Check the server logs." });
  });
  return app;
}
