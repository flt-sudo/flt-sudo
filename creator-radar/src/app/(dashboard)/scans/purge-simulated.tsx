"use client";

import { useState, useTransition } from "react";
import { purgeSimulated } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

export function PurgeSimulated() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete all simulated creators, evidence and simulated scan runs?")) return;
          start(async () => setMsg((await purgeSimulated()).message));
        }}
      >
        Delete all simulated data
      </Button>
      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
