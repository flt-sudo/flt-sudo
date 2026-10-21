"use client";

import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Outcome =
  | { status: "locked" }
  | { status: "skipped"; reason: string }
  | { status: string; recordsExamined: number; newProfilesFound: number; duplicatesSkipped: number; excludedCount: number; errors: unknown[]; isSimulated: boolean }
  | { error: string };

export function ScanNowButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "warn" | "err"; text: string } | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/scan", { method: "POST" });
      const body = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))) as Outcome;
      if ("error" in body) setMessage({ tone: "err", text: body.error });
      else if (body.status === "locked") setMessage({ tone: "warn", text: "A scan is already running. Try again shortly." });
      else if ("recordsExamined" in body) {
        const text = `${body.status === "succeeded" ? "Scan complete" : `Scan ${body.status}`}${body.isSimulated ? " (simulated)" : ""}: ${body.recordsExamined} posts examined, ${body.newProfilesFound} new profiles, ${body.duplicatesSkipped} duplicates, ${body.excludedCount} excluded${body.errors.length ? `, ${body.errors.length} errors` : ""}.`;
        setMessage({ tone: body.status === "succeeded" ? "ok" : body.status === "partial" ? "warn" : "err", text });
      }
      router.refresh();
    } catch (err) {
      setMessage({ tone: "err", text: err instanceof Error ? err.message : "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={run} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Play />}
        {busy ? "Scanning…" : "Scan now"}
      </Button>
      {message && (
        <p
          role="status"
          className={message.tone === "ok" ? "text-xs text-success" : message.tone === "warn" ? "text-xs text-warning" : "text-xs text-destructive"}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
