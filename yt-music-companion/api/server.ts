import type { IncomingMessage, ServerResponse } from "node:http";
import { build, type Built } from "../src/bootstrap.js";
import { loadConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";

// Vercel entry point: the Express app runs as one function; the PWA is served
// as static files by Vercel's CDN. Built once per warm instance.
let ready: Promise<Built> | null = null;

function app(): Promise<Built> {
  if (!ready) {
    const cfg = loadConfig();
    ready = build(cfg, createLogger(cfg.LOG_LEVEL), { webDir: "/nonexistent" }).catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const built = await app();
    built.app(req as never, res as never);
  } catch (err) {
    console.error("startup failed:", (err as Error).message);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "startup_failed", message: "Server misconfigured; check the deployment logs." }));
  }
}
