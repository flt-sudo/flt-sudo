"use client";

import { useActionState } from "react";
import { updateReview, type ActionState } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Label, Select, Textarea } from "@/components/ui/input";
import { REVIEW_STATUSES, REVIEW_STATUS_LABELS, type ReviewStatus } from "@/lib/types";

export function ReviewForm({ creatorId, current }: { creatorId: string; current: ReviewStatus }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateReview, { ok: true, message: "" });
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="creatorId" value={creatorId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Review status</Label>
        <Select id="status" name="status" defaultValue="">
          <option value="">Keep “{REVIEW_STATUS_LABELS[current]}”</option>
          {REVIEW_STATUSES.filter((s) => s !== current).map((s) => (
            <option key={s} value={s}>{REVIEW_STATUS_LABELS[s]}</option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" maxLength={2000} placeholder="What did you verify?" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save review"}</Button>
      {state.message && <p className={state.ok ? "text-xs text-success" : "text-xs text-destructive"}>{state.message}</p>}
    </form>
  );
}
