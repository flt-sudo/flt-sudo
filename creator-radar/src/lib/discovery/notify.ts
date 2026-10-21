// Optional scan-summary webhook (e.g. Slack/Discord incoming webhook).
// Sends counts and a dashboard link only — never creator handles or post text.

import type { Logger } from "@/lib/log";
import type { NotificationPreferences } from "@/lib/types";

export interface ScanSummary {
  runId: string;
  isSimulated: boolean;
  newProfiles: number;
  newLikely: number;
  status: string;
}

export function validWebhookUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function notifyScanComplete(
  prefs: NotificationPreferences,
  summary: ScanSummary,
  log: Logger,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const url = validWebhookUrl(process.env.NOTIFY_WEBHOOK_URL);
  if (!prefs.webhook_enabled || !url) return false;
  const count = prefs.notify_on === "likely_new_launch" ? summary.newLikely : summary.newProfiles;
  if (count === 0) return false;
  const [one, many] = prefs.notify_on === "likely_new_launch"
    ? ["likely new launch", "likely new launches"]
    : ["new profile", "new profiles"];
  const base = process.env.APP_URL?.replace(/\/$/, "");
  const text =
    `Creator Radar${summary.isSimulated ? " (SIMULATED DATA)" : ""}: ${count} ${count === 1 ? one : many} found.` +
    (base ? ` Review: ${base}/discoveries` : "");
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, content: text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) log.warn("webhook rejected", { status: res.status });
    return res.ok;
  } catch (err) {
    log.warn("webhook failed", { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}
