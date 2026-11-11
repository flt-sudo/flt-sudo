import { z } from "zod";

/** Evidence classifications, strongest first. */
export const Classification = z.enum(["VERIFIED", "CORROBORATED", "INFERRED", "HYPOTHETICAL", "UNKNOWN"]);
export type Classification = z.infer<typeof Classification>;

export const SourceKind = z.enum(["web", "fixture", "calculation", "user_input", "none"]);

/** Stage A output. */
export const Plan = z.object({
  subject: z.string(),
  domain: z.string(),
  decisionObjective: z.string(),
  criteria: z
    .array(
      z.object({
        id: z.string().regex(/^C\d+$/),
        name: z.string(),
        weight: z.number().min(0).max(100),
        rationale: z.string(),
      }),
    )
    .min(3),
  knowledgeGaps: z.array(z.object({ id: z.string().regex(/^G\d+$/), question: z.string(), whyItMatters: z.string(), criteria: z.array(z.string()) })).min(1),
  assumptionsToVerify: z.array(z.object({ assumption: z.string(), source: z.enum(["user", "planner"]), howToCheck: z.string() })),
  answerability: z.enum(["answerable", "partially_answerable", "unanswerable"]).describe("Planner's initial view; may change after research"),
});
export type Plan = z.infer<typeof Plan>;

/** Stage B/C record. */
export const EvidenceRecord = z.object({
  id: z.string().regex(/^E\d+$/),
  claim: z.string().min(1),
  source: z.object({
    kind: SourceKind,
    ref: z.string().describe("URL, fixture file name, calculation id, or empty for none"),
    title: z.string().optional(),
  }),
  retrievedAt: z.string(),
  classification: Classification,
  corroboratingRefs: z.array(z.string()).default([]),
  applicability: z.string(),
  limitations: z.string(),
  contradicts: z.array(z.string()).default([]),
  gapIds: z.array(z.string()).default([]),
  verification: z.object({ status: z.enum(["checked", "unchecked", "failed"]), method: z.string() }),
  untrustedInstructionsObserved: z.boolean().default(false),
});
export type EvidenceRecord = z.infer<typeof EvidenceRecord>;

export const ResearchOutput = z.object({
  evidence: z.array(EvidenceRecord),
  unresolvedGaps: z.array(z.object({ gapId: z.string(), reason: z.string() })),
  injectionAttemptsObserved: z.array(z.object({ where: z.string(), summary: z.string() })).default([]),
});

export const Calculation = z.object({
  id: z.string().regex(/^K\d+$/),
  purpose: z.string(),
  expression: z.string().describe("Arithmetic only: numbers, + - * / ^ ( ), and functions min max round abs sqrt"),
  claimedResult: z.number(),
  tolerance: z.number().nonnegative().default(0.005).describe("Relative tolerance"),
});
export type Calculation = z.infer<typeof Calculation>;

/** Stage E output. */
export const Draft = z.object({
  verdict: z.string().describe("Decision-ready bottom line, including 'cannot be determined' when evidence is insufficient"),
  confidence: z.enum(["high", "moderate", "low", "none"]),
  criteriaAssessments: z.array(
    z.object({
      criterionId: z.string(),
      assessment: z.string(),
      mechanisms: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      evidenceIds: z.array(z.string()),
    }),
  ),
  claims: z
    .array(
      z.object({
        id: z.string().regex(/^CL\d+$/),
        text: z.string(),
        material: z.boolean().describe("Would the decision change if this claim were false?"),
        type: z.enum(["finding", "limitation"]).default("finding").describe("limitation = a statement that something cannot be determined from the evidence"),
        evidenceIds: z.array(z.string()),
        calculationIds: z.array(z.string()).default([]),
      }),
    )
    .min(1),
  alternatives: z.array(z.object({ option: z.string(), comparison: z.string() })),
  tradeoffs: z.array(z.string()),
  edgeCasesAndFailureModes: z.array(z.string()),
  counterarguments: z.array(z.object({ argument: z.string(), response: z.string() })),
  correctedUserAssumptions: z.array(z.object({ assumption: z.string(), correction: z.string(), evidenceIds: z.array(z.string()) })).default([]),
  calculations: z.array(Calculation).default([]),
  practicalImplications: z.array(z.string()),
  remainingUncertainty: z.array(z.string()),
  furtherResearchThatCouldChangeConclusion: z.array(z.string()),
});
export type Draft = z.infer<typeof Draft>;

export const GateName = z.enum(["coverage", "evidence_sufficiency", "reasoning_validity", "alternatives_counterarguments", "decision_usefulness", "traceability"]);
export type GateName = z.infer<typeof GateName>;

/** Stage F output. */
export const Review = z.object({
  defects: z.array(
    z.object({
      id: z.string().regex(/^D\d+$/),
      gate: GateName,
      severity: z.enum(["critical", "major", "minor"]),
      description: z.string(),
      location: z.string().describe("Claim id, criterion id, or section"),
      remedy: z.enum(["research", "reanalysis", "both"]),
    }),
  ),
  materialResearchGaps: z.array(z.object({ question: z.string(), couldChangeVerdict: z.boolean() })),
  gateOpinions: z.array(z.object({ gate: GateName, pass: z.boolean(), reason: z.string() })),
});
export type Review = z.infer<typeof Review>;

/** Benchmark case. Fields under `expected` are never shown to the agent. */
export const BenchCase = z.object({
  id: z.string(),
  split: z.enum(["dev", "heldout"]),
  domain: z.string(),
  difficulty: z.array(
    z.enum(["conflicting_sources", "missing_information", "misleading_assumption", "outdated_documentation", "incorrect_numbers", "competing_alternatives", "unanswerable", "prompt_injection", "standard"]),
  ),
  request: z.string(),
  fixtures: z.array(z.object({ name: z.string().regex(/^[\w.-]+$/), content: z.string() })).default([]),
  expected: z.object({
    summary: z.string(),
    mustFlag: z.array(z.object({ id: z.string(), description: z.string(), pattern: z.string().describe("Case-insensitive regex that a passing report must match") })),
    mustNotClaim: z.array(z.object({ id: z.string(), description: z.string(), pattern: z.string() })),
    numeric: z.array(z.object({ id: z.string(), description: z.string(), value: z.number(), tolerance: z.number() })).default([]),
    canaries: z.array(z.string()).default([]),
    criticalFailures: z.array(z.string()),
    expectedAnswerability: z.enum(["answerable", "partially_answerable", "unanswerable"]),
  }),
});
export type BenchCase = z.infer<typeof BenchCase>;
