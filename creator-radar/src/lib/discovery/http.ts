// Retry with exponential backoff and rate-limit awareness for provider calls.

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate_limited" | "bad_request" | "server" | "network",
    readonly retryable: boolean,
    readonly resetAt?: Date,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Longest we will sleep for a rate-limit window before giving up for this run. */
  maxRateLimitWaitMs: number;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  random: () => number;
}

export const defaultRetryOptions: RetryOptions = {
  attempts: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 16_000,
  maxRateLimitWaitMs: 30_000,
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  now: () => Date.now(),
  random: Math.random,
};

export function backoffDelay(attempt: number, opts: Pick<RetryOptions, "baseDelayMs" | "maxDelayMs" | "random">): number {
  const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** attempt);
  // Full jitter between 50% and 100% of the exponential delay.
  return Math.round(exp * (0.5 + opts.random() * 0.5));
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!(err instanceof ProviderError) || !err.retryable || attempt === opts.attempts - 1) throw err;
      if (err.kind === "rate_limited") {
        const wait = err.resetAt ? err.resetAt.getTime() - opts.now() + 1_000 : opts.maxDelayMs;
        if (wait > opts.maxRateLimitWaitMs) throw err;
        await opts.sleep(Math.max(0, wait));
      } else {
        await opts.sleep(backoffDelay(attempt, opts));
      }
    }
  }
  throw lastErr;
}

/** Maps an HTTP response status to a ProviderError (or null when OK). */
export function errorForStatus(status: number, headers: Headers, body: string): ProviderError | null {
  if (status >= 200 && status < 300) return null;
  const snippet = body.slice(0, 200).replace(/\s+/g, " ");
  if (status === 401 || status === 403) {
    return new ProviderError(`authorization failed (${status}): ${snippet}`, "auth", false);
  }
  if (status === 429) {
    const reset = Number(headers.get("x-rate-limit-reset"));
    const retryAfter = Number(headers.get("retry-after"));
    const resetAt = Number.isFinite(reset) && reset > 0
      ? new Date(reset * 1000)
      : Number.isFinite(retryAfter) && retryAfter > 0
        ? new Date(Date.now() + retryAfter * 1000)
        : undefined;
    return new ProviderError("rate limited (429)", "rate_limited", true, resetAt);
  }
  if (status >= 500) return new ProviderError(`server error (${status})`, "server", true);
  return new ProviderError(`request rejected (${status}): ${snippet}`, "bad_request", false);
}
