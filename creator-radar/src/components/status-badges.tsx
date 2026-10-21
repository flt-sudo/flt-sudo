import { Badge } from "@/components/ui/badge";
import { CLASSIFICATION_LABELS, REVIEW_STATUS_LABELS, type Classification, type ReviewStatus } from "@/lib/types";
import { pct } from "@/lib/utils";

const CLASS_TONE = {
  likely_new_launch: "success",
  possible_new_launch: "info",
  existing_creator_promotion: "neutral",
  needs_review: "warning",
} as const;

export function ClassificationBadge({ value }: { value: Classification }) {
  return <Badge tone={CLASS_TONE[value]}>{CLASSIFICATION_LABELS[value]}</Badge>;
}

const REVIEW_TONE = { pending: "violet", confirmed: "success", dismissed: "neutral" } as const;

export function ReviewBadge({ value }: { value: ReviewStatus }) {
  return <Badge tone={REVIEW_TONE[value]}>{REVIEW_STATUS_LABELS[value]}</Badge>;
}

export function SimulatedBadge() {
  return (
    <Badge tone="warning" title="Synthetic data from the mock provider — not a real discovery">
      Simulated
    </Badge>
  );
}

/** Confidence bar. Labelled as a score, never as verified fact. */
export function ConfidenceMeter({ value }: { value: number }) {
  const n = Math.max(0, Math.min(1, Number(value)));
  const color = n >= 0.75 ? "bg-success" : n >= 0.45 ? "bg-info" : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-2" title="Heuristic launch score — not a verified probability">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${n * 100}%` }} />
      </div>
      <span className="tabular text-xs text-muted-foreground">{pct(n)}</span>
    </div>
  );
}

const SCAN_TONE = { running: "info", succeeded: "success", partial: "warning", failed: "danger" } as const;

export function ScanStatusBadge({ value }: { value: keyof typeof SCAN_TONE }) {
  return <Badge tone={SCAN_TONE[value] ?? "neutral"}>{value}</Badge>;
}
