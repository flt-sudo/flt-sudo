import crypto from "node:crypto";
import type { Logger } from "pino";
import { ProviderError } from "./types.js";
import { YTMusicProvider } from "./ytmusic.js";

/**
 * Same adapter, reached over HTTPS instead of stdio (hosted deployments where a
 * long-lived Python subprocess isn't available, e.g. Vercel). Each request is
 * stateless: the credential travels in the TLS-protected body, and the call is
 * authenticated with a timestamped HMAC over the body so the adapter endpoint
 * can't be used by anyone else.
 */
export class RemoteYTMusicProvider extends YTMusicProvider {
  constructor(private remote: { url: string; secret: string; minIntervalMs: number; timeoutMs?: number; log?: Logger }) {
    super({ pythonBin: "", adapterPath: "", minIntervalMs: remote.minIntervalMs, timeoutMs: remote.timeoutMs, log: remote.log });
  }

  protected override async ensureInit(): Promise<void> {
    /* stateless: auth is sent with every call */
  }

  protected override async rawCall<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const body = JSON.stringify({ method, params, auth: this.auth });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = crypto.createHmac("sha256", this.remote.secret).update(`${ts}.${body}`).digest("hex");
    let res: Response;
    try {
      res = await fetch(this.remote.url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-ymc-ts": ts, "x-ymc-sig": sig },
        body,
        signal: AbortSignal.timeout(this.remote.timeoutMs ?? 55_000),
      });
    } catch (err) {
      const timeout = (err as Error).name === "TimeoutError";
      throw new ProviderError(timeout ? "timeout" : "unavailable", timeout ? `YouTube Music adapter timed out on ${method}` : "YouTube Music adapter unreachable");
    }
    const data = (await res.json().catch(() => null)) as { result?: T; error?: { type: string; message: string } } | null;
    if (!data) throw new ProviderError("remote_error", `YouTube Music adapter returned HTTP ${res.status}`);
    if (data.error) throw new ProviderError(data.error.type, data.error.message);
    return data.result as T;
  }
}
