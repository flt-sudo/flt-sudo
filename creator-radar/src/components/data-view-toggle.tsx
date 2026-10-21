"use client";

import { useTransition } from "react";
import { setDataView } from "@/app/(dashboard)/actions";
import { cn } from "@/lib/utils";

export function DataViewToggle({ view }: { view: "live" | "simulated" }) {
  const [pending, start] = useTransition();
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-xs" role="group" aria-label="Data set">
      {(["live", "simulated"] as const).map((v) => (
        <button
          key={v}
          type="button"
          disabled={pending}
          aria-pressed={view === v}
          onClick={() => start(() => setDataView(v))}
          className={cn(
            "rounded px-2.5 py-1 capitalize transition-colors",
            view === v
              ? v === "simulated"
                ? "bg-warning/15 text-warning"
                : "bg-success/15 text-success"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "live" ? "Live data" : "Simulated"}
        </button>
      ))}
    </div>
  );
}
