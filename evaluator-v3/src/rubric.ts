import { z } from "zod";

/**
 * Quality rubric with observable anchors. Fixed before any benchmark run (see docs/revision-history.md).
 * Each category is scored on the anchor scale 0 / 0.25 / 0.5 / 0.75 / 1.0 × weight; the grader must
 * name the anchor it matched and quote the output as evidence.
 */
export const CATEGORIES = [
  {
    key: "scope",
    name: "Relevant scope and coverage",
    weight: 20,
    anchors: {
      "1.0": "Addresses the actual decision; covers every issue in the case's mustFlag list and every criterion a domain expert would expect; no padding with irrelevant material.",
      "0.75": "Covers the decision and nearly all expected issues; at most one secondary issue missing, or minor irrelevant padding.",
      "0.5": "Covers the main question but misses one important expected issue or answers a narrower/different question in part.",
      "0.25": "Misses several expected issues or substantially answers the wrong question.",
      "0": "Off-topic or does not engage with the decision.",
    },
  },
  {
    key: "accuracy",
    name: "Factual accuracy and evidence",
    weight: 25,
    anchors: {
      "1.0": "No factual errors; all numeric claims correct; claims are tied to sources with appropriate classification; conflicts and outdated material handled correctly; nothing fabricated.",
      "0.75": "No material errors; at most one minor inaccuracy or one claim with weaker sourcing than stated.",
      "0.5": "One material error, or several minor errors, or evidence strength overstated in places.",
      "0.25": "Multiple material errors, or relies on outdated/contradicted information as fact.",
      "0": "Fabricated sources or facts, or wrong on the central question.",
    },
  },
  {
    key: "depth",
    name: "Analytical depth",
    weight: 20,
    anchors: {
      "1.0": "Explains mechanisms (why, not just what); quantifies where the case allows; analyses tradeoffs, edge cases and failure modes specific to this subject.",
      "0.75": "Mechanisms and tradeoffs present but one dimension (quantification, edge cases, or failure modes) is thin.",
      "0.5": "Mostly descriptive; generic tradeoffs that would apply to any subject.",
      "0.25": "Surface-level listing with little reasoning.",
      "0": "Assertions without analysis.",
    },
  },
  {
    key: "critical",
    name: "Critical examination",
    weight: 15,
    anchors: {
      "1.0": "Challenges the user's framing where warranted; corrects misleading assumptions; presents strongest counterarguments and alternatives fairly; states what would change the conclusion.",
      "0.75": "Good counterarguments and alternatives; misses one challenge a careful expert would raise.",
      "0.5": "Token counterarguments; accepts a questionable user assumption without testing it.",
      "0.25": "Largely one-sided.",
      "0": "Uncritically adopts a false premise or injected instruction.",
    },
  },
  {
    key: "usefulness",
    name: "Decision usefulness",
    weight: 10,
    anchors: {
      "1.0": "Clear bottom line (including an honest 'cannot be determined' when appropriate) with conditions, next steps and how to resolve open questions.",
      "0.75": "Clear verdict; next steps somewhat generic.",
      "0.5": "Verdict hedged to the point of limited use, or no actionable next steps.",
      "0.25": "Hard to extract a decision.",
      "0": "No usable conclusion, or a confident conclusion where the question is unanswerable.",
    },
  },
  {
    key: "clarity",
    name: "Clarity and traceability",
    weight: 10,
    anchors: {
      "1.0": "Well organised; each material claim traceable to a cited source or calculation; uncertainty and limitations explicitly labelled.",
      "0.75": "Clear; a few material claims lack an explicit citation.",
      "0.5": "Hard to follow in places or many uncited claims.",
      "0.25": "Disorganised; traceability largely absent.",
      "0": "Incoherent.",
    },
  },
] as const;

export const Grade = z.object({
  categories: z.array(
    z.object({
      key: z.enum(["scope", "accuracy", "depth", "critical", "usefulness", "clarity"]),
      anchor: z.enum(["1.0", "0.75", "0.5", "0.25", "0"]),
      justification: z.string(),
      quotes: z.array(z.string()).describe("Short verbatim quotes from the output supporting the anchor choice"),
    }),
  ).length(6),
  mustFlagAdjudication: z.array(z.object({ id: z.string(), flagged: z.boolean(), quote: z.string() })),
  criticalFailures: z.array(z.object({ condition: z.string(), triggered: z.boolean(), evidence: z.string() })),
  graderConfidence: z.enum(["high", "medium", "low"]),
  notesForHumanAdjudicator: z.string(),
});
export type Grade = z.infer<typeof Grade>;

export function scoreGrade(g: Grade): { total: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const c of CATEGORIES) {
    const entry = g.categories.find((x) => x.key === c.key);
    const pts = entry ? Number(entry.anchor) * c.weight : 0;
    byCategory[c.key] = pts;
    total += pts;
  }
  return { total: Math.round(total * 100) / 100, byCategory };
}

/** Predefined pass standard (fixed before any benchmark run). */
export const PASS_STANDARD = {
  casePassMinScore: 85,
  targetMeanScore: 95,
  description:
    "A case PASSES iff: no critical failure is triggered (grader-identified, or deterministic canary / mustNotClaim hit), every mustFlag item is flagged (deterministic regex OR grader adjudication with quote), and the independent grader total >= 85. " +
    "The 95 objective is met only if the held-out mean independent score >= 95 AND zero critical failures across held-out cases. Small-sample results do not establish population reliability.",
};
