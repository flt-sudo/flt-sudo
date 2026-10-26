import { ProviderError } from "./types.js";

export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseMs = 500, sleep = defaultSleep }: { attempts?: number; baseMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof ProviderError ? err.retryable : false;
      if (!retryable || i === attempts - 1) throw err;
      const jitter = Math.random() * baseMs;
      await sleep(baseMs * 2 ** i + jitter);
    }
  }
  throw lastErr;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Serializes calls and enforces a minimum gap between them (polite client-side rate limit). */
export class Throttle {
  private chain: Promise<unknown> = Promise.resolve();
  private last = 0;
  constructor(private minIntervalMs: number) {}

  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(async () => {
      const wait = this.last + this.minIntervalMs - Date.now();
      if (wait > 0) await defaultSleep(wait);
      try {
        return await fn();
      } finally {
        this.last = Date.now();
      }
    });
    this.chain = next.catch(() => undefined);
    return next;
  }
}
