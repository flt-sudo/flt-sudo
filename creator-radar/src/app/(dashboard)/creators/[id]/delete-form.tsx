"use client";

import { Trash2 } from "lucide-react";
import { deleteCreator } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";

export function DeleteForm({ creatorId, handle }: { creatorId: string; handle: string }) {
  return (
    <form
      action={deleteCreator}
      onSubmit={(e) => {
        if (!confirm(`Permanently delete @${handle} and all stored evidence? This cannot be undone.`)) e.preventDefault();
      }}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="creatorId" value={creatorId} />
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="suppress" defaultChecked className="mt-0.5 accent-[var(--primary)]" />
        Prevent re-discovery (stores only a one-way hash of the handle and profile name)
      </label>
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 /> Delete creator and evidence
      </Button>
    </form>
  );
}
