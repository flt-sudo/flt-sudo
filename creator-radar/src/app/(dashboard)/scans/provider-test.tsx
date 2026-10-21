"use client";

import { Loader2, PlugZap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProviderTest() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const res = await fetch("/api/provider/test", { method: "POST" });
            const body = await res.json().catch(() => ({ ok: false, message: `HTTP ${res.status}` }));
            setResult({ ok: Boolean(body.ok), message: String(body.message ?? body.error ?? "") });
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 className="animate-spin" /> : <PlugZap />} Test connection
      </Button>
      {result && <p className={result.ok ? "text-xs text-success" : "text-xs text-destructive"}>{result.message}</p>}
      <p className="text-[11px] text-muted-foreground">For the X API this makes one small search request that counts toward your quota.</p>
    </div>
  );
}
