import { evaluate, withinTolerance } from "./calc.js";
import type { RegistryResult, ValidatedRecord } from "./registry.js";
import type { Draft, GateName, Plan, Review } from "./schemas.js";

export interface Finding {
  gate: GateName;
  severity: "critical" | "major" | "minor";
  source: "deterministic" | "reviewer";
  detail: string;
}

export interface CalcCheck {
  id: string;
  expression: string;
  claimed: number;
  actual: number | null;
  ok: boolean;
  error?: string;
}

export interface GateReport {
  gates: Record<GateName, { pass: boolean; findings: Finding[] }>;
  calcChecks: CalcCheck[];
  criticalCount: number;
  certified: boolean;
  revisionRecommended: boolean;
  revisionTargets: Finding[];
}

const GATES: GateName[] = ["coverage", "evidence_sufficiency", "reasoning_validity", "alternatives_counterarguments", "decision_usefulness", "traceability"];
const WEAK = new Set(["HYPOTHETICAL", "UNKNOWN"]);

export function runCalcChecks(draft: Draft): CalcCheck[] {
  return draft.calculations.map((c) => {
    try {
      const actual = evaluate(c.expression);
      return { id: c.id, expression: c.expression, claimed: c.claimedResult, actual, ok: withinTolerance(actual, c.claimedResult, c.tolerance) };
    } catch (e) {
      return { id: c.id, expression: c.expression, claimed: c.claimedResult, actual: null, ok: false, error: String((e as Error).message) };
    }
  });
}

export function deterministicFindings(plan: Plan, reg: RegistryResult, draft: Draft, unresolvedGapIds: string[]): { findings: Finding[]; calcChecks: CalcCheck[] } {
  const f: Finding[] = [];
  const add = (gate: GateName, severity: Finding["severity"], detail: string) => f.push({ gate, severity, source: "deterministic", detail });
  const byId = new Map<string, ValidatedRecord>(reg.records.map((r) => [r.id, r]));
  const rejected = new Set(reg.rejected.map((r) => r.id));
  const calcIds = new Set(draft.calculations.map((c) => c.id));

  // Traceability
  for (const cl of draft.claims) {
    for (const e of cl.evidenceIds) {
      if (rejected.has(e)) add("traceability", cl.material ? "critical" : "major", `${cl.id} cites rejected evidence ${e} (source never retrieved)`);
      else if (!byId.has(e)) add("traceability", cl.material ? "critical" : "major", `${cl.id} cites nonexistent evidence ${e}`);
    }
    for (const k of cl.calculationIds) if (!calcIds.has(k)) add("traceability", "critical", `${cl.id} cites nonexistent calculation ${k}`);
    if (cl.material && cl.evidenceIds.length === 0 && cl.calculationIds.length === 0) add("traceability", "major", `material claim ${cl.id} has no evidence or calculation`);
  }
  for (const a of draft.criteriaAssessments) {
    for (const e of a.evidenceIds) if (!byId.has(e)) add("traceability", "major", `assessment ${a.criterionId} cites missing/rejected evidence ${e}`);
  }
  for (const c of draft.correctedUserAssumptions) {
    for (const e of c.evidenceIds) if (!byId.has(e)) add("traceability", "major", `assumption correction cites missing/rejected evidence ${e}`);
  }

  // Evidence sufficiency
  for (const cl of draft.claims.filter((c) => c.material && c.evidenceIds.length > 0)) {
    const recs = cl.evidenceIds.map((e) => byId.get(e)).filter((r): r is ValidatedRecord => !!r);
    if (recs.length > 0 && recs.every((r) => WEAK.has(r.effectiveClassification)) && cl.calculationIds.length === 0) {
      add("evidence_sufficiency", "major", `material claim ${cl.id} rests only on HYPOTHETICAL/UNKNOWN evidence`);
    }
  }
  if (draft.confidence === "high") {
    const weakMaterial = draft.claims.filter((c) => c.material && !c.evidenceIds.some((e) => ["VERIFIED", "CORROBORATED"].includes(byId.get(e)?.effectiveClassification ?? "")) && c.calculationIds.length === 0);
    if (weakMaterial.length > 0) add("evidence_sufficiency", "major", `high confidence but material claims lack VERIFIED/CORROBORATED support: ${weakMaterial.map((c) => c.id).join(", ")}`);
  }
  const covered = new Set(reg.records.flatMap((r) => r.gapIds));
  for (const g of plan.knowledgeGaps) {
    if (!covered.has(g.id) && !unresolvedGapIds.includes(g.id)) add("evidence_sufficiency", "major", `knowledge gap ${g.id} neither researched nor declared unresolved`);
  }
  if (unresolvedGapIds.length > 0 && draft.remainingUncertainty.length === 0) add("evidence_sufficiency", "major", "unresolved gaps exist but remainingUncertainty is empty");
  if (reg.violations.length > 0) add("evidence_sufficiency", "minor", `${reg.violations.length} evidence classification violation(s) downgraded by registry`);

  // Reasoning validity: re-execute every calculation
  const calcChecks = runCalcChecks(draft);
  for (const c of calcChecks) {
    if (!c.ok) add("reasoning_validity", "critical", c.error ? `${c.id} could not be evaluated: ${c.error}` : `${c.id}: claimed ${c.claimed} but expression evaluates to ${c.actual}`);
  }

  // Coverage
  const assessed = new Set(draft.criteriaAssessments.map((a) => a.criterionId));
  for (const c of plan.criteria) if (!assessed.has(c.id)) add("coverage", "major", `criterion ${c.id} (${c.name}) not assessed`);

  // Alternatives and counterarguments
  if (draft.alternatives.length === 0) add("alternatives_counterarguments", "major", "no alternatives considered");
  if (draft.counterarguments.length === 0) add("alternatives_counterarguments", "major", "no counterarguments considered");

  // Decision usefulness
  if (!draft.verdict.trim()) add("decision_usefulness", "critical", "empty verdict");
  if (draft.practicalImplications.length === 0) add("decision_usefulness", "major", "no practical implications");

  return { findings: f, calcChecks };
}

export function combineGates(det: { findings: Finding[]; calcChecks: CalcCheck[] }, review: Review | null, revisionsSoFar: number, maxRevisions: number): GateReport {
  const findings = [...det.findings];
  if (review) {
    for (const d of review.defects) findings.push({ gate: d.gate, severity: d.severity, source: "reviewer", detail: `${d.id} [${d.location}] ${d.description}` });
    for (const o of review.gateOpinions) if (!o.pass && !review.defects.some((d) => d.gate === o.gate && d.severity !== "minor")) {
      findings.push({ gate: o.gate, severity: "major", source: "reviewer", detail: `reviewer gate opinion: ${o.reason}` });
    }
  } else {
    for (const g of GATES) findings.push({ gate: g, severity: "major", source: "deterministic", detail: "no independent review available" });
  }
  const gates = Object.fromEntries(
    GATES.map((g) => {
      const fs = findings.filter((x) => x.gate === g);
      return [g, { pass: !fs.some((x) => x.severity !== "minor"), findings: fs }];
    }),
  ) as GateReport["gates"];
  const criticalCount = findings.filter((x) => x.severity === "critical").length;
  const allPass = GATES.every((g) => gates[g].pass);
  const decisiveGap = review?.materialResearchGaps.some((g) => g.couldChangeVerdict) ?? false;
  const revisionTargets = findings.filter((x) => x.severity !== "minor");
  return {
    gates,
    calcChecks: det.calcChecks,
    criticalCount,
    certified: allPass && criticalCount === 0,
    revisionRecommended: (!allPass || decisiveGap) && revisionsSoFar < maxRevisions,
    revisionTargets,
  };
}
