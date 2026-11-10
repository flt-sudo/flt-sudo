import fs from "node:fs";
import path from "node:path";
import type { GateReport } from "./gates.js";
import type { RegistryResult } from "./registry.js";
import { domainOf, readJson, readJsonl, RunMeta, ToolLogEntry } from "./run.js";
import type { Draft } from "./schemas.js";

export interface RevisionEntry {
  cycle: number;
  ts: string;
  reasons: string[];
  action: "research" | "reanalysis" | "both";
}

export interface ValidationRecord {
  runId: string;
  generatedAt: string;
  generatedBy: "code (src/validation-record.ts) from tool-log.jsonl and run files — not written by the model";
  researchPerformed: {
    webSearches: { query: string; ok: boolean; agentType: string | null; resultCount: number }[];
    webFetches: { url: string; ok: boolean; error?: string }[];
    fixturesRead: string[];
    deniedByGuard: { tool: string; reason: string }[];
    subagentCalls: { agentType: string | null; description?: string; ok: boolean; usage?: Record<string, unknown> }[];
  };
  sourcesInspected: { ref: string; how: "fetched" | "fixture_read" }[];
  sourcesCitedFromSearchSnippetsOnly: string[];
  checksExecuted: string[];
  checksNotExecuted: string[];
  independentValidationStatus: string;
  remainingUncertainty: string[];
  revisions: { count: number; entries: RevisionEntry[] };
  finalQualityGates: Record<string, { pass: boolean; findings: string[] }> | "not run";
  certified: boolean;
}

export function buildValidationRecord(dir: string): ValidationRecord {
  const meta = readJson<RunMeta>(path.join(dir, "meta.json"));
  const log = readJsonl<ToolLogEntry>(path.join(dir, "tool-log.jsonl"));
  const reg: RegistryResult | null = fs.existsSync(path.join(dir, "evidence.validated.json")) ? readJson(path.join(dir, "evidence.validated.json")) : null;
  const revisions = readJsonl<RevisionEntry>(path.join(dir, "revisions.jsonl"));
  const gateFiles = fs.readdirSync(dir).filter((f) => /^gates-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const lastGates: GateReport | null = gateFiles.length ? readJson(path.join(dir, gateFiles[gateFiles.length - 1]!)) : null;
  const draftFiles = fs.readdirSync(dir).filter((f) => /^draft-\d+\.json$/.test(f)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const lastDraft: Draft | null = draftFiles.length ? readJson(path.join(dir, draftFiles[draftFiles.length - 1]!)) : null;
  const research = fs.existsSync(path.join(dir, "research.json")) ? readJson<{ unresolvedGaps?: { gapId: string; reason: string }[] }>(path.join(dir, "research.json")) : null;
  const grade = fs.existsSync(path.join(dir, "grade.json")) ? readJson<{ grader: string; total: number; criticalFailures: string[] }>(path.join(dir, "grade.json")) : null;

  const ok = log.filter((e) => e.event === "PostToolUse" || e.event === "PostToolUseFailure");
  const webSearches = ok.filter((e) => e.tool === "WebSearch").map((e) => ({ query: e.input.query ?? "", ok: e.ok, agentType: e.agentType, resultCount: e.resultUrls.length }));
  const webFetches = ok.filter((e) => e.tool === "WebFetch").map((e) => ({ url: e.input.url ?? "", ok: e.ok, error: e.error?.slice(0, 160) }));
  const sourcesDir = path.join(dir, "sources") + path.sep;
  const fixturesRead = [...new Set(ok.filter((e) => e.tool === "Read" && e.ok && e.input.file_path && path.resolve(e.input.file_path).startsWith(sourcesDir)).map((e) => path.basename(e.input.file_path!)))];
  const deniedByGuard = log.filter((e) => e.event === "PreToolUseDenied").map((e) => ({ tool: e.tool, reason: e.error ?? "" }));
  const subagentCalls = ok.filter((e) => e.tool === "Agent" || e.tool === "Task").map((e) => ({ agentType: e.input.subagent_type ?? null, description: e.input.description, ok: e.ok, usage: e.usage }));

  const sourcesInspected = [
    ...webFetches.filter((f) => f.ok).map((f) => ({ ref: f.url, how: "fetched" as const })),
    ...fixturesRead.map((f) => ({ ref: f, how: "fixture_read" as const })),
  ];
  const snippetOnly = reg ? [...new Set(reg.records.filter((r) => r.provenance === "search_result").map((r) => r.source.ref))] : [];

  const checksExecuted: string[] = [];
  const checksNotExecuted: string[] = [];
  if (reg) checksExecuted.push(`Evidence registry validation: ${reg.records.length} accepted, ${reg.rejected.length} rejected (source never retrieved / schema), ${reg.violations.length} classification downgrade(s)`);
  else checksNotExecuted.push("Evidence registry validation (no evidence.validated.json)");
  if (lastGates) {
    checksExecuted.push(`Deterministic quality gates over ${gateFiles.length} draft(s)`);
    for (const c of lastGates.calcChecks) {
      if (c.actual === null) checksNotExecuted.push(`Calculation ${c.id} could not be evaluated: ${c.error}`);
      else checksExecuted.push(`Calculation ${c.id} re-executed: ${c.expression} = ${c.actual} (claimed ${c.claimed}) → ${c.ok ? "match" : "MISMATCH"}`);
    }
  } else checksNotExecuted.push("Quality gates (never run)");
  if (fs.existsSync(path.join(dir, "packet.json"))) checksExecuted.push("Context packet contradiction-retention assertion");
  for (const f of webFetches.filter((x) => !x.ok)) checksNotExecuted.push(`Fetch failed: ${f.url} — ${f.error ?? "error"}`);
  for (const d of deniedByGuard) checksNotExecuted.push(`Blocked by guard: ${d.tool} — ${d.reason}`);
  if (!meta.environment.webFetchAvailable) checksNotExecuted.push("Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched");
  for (const g of research?.unresolvedGaps ?? []) checksNotExecuted.push(`Knowledge gap ${g.gapId} unresolved: ${g.reason}`);

  const remainingUncertainty = [
    ...(lastDraft?.remainingUncertainty ?? []),
    ...(reg?.records.filter((r) => r.effectiveClassification === "UNKNOWN").map((r) => `${r.id} UNKNOWN: ${r.claim}`) ?? []),
  ];

  const independentValidationStatus = grade
    ? `Graded by separate grader process (${grade.grader}); total ${grade.total}/100; critical failures: ${grade.criticalFailures.length ? grade.criticalFailures.join("; ") : "none"}. Grader is the same model family as the agent.`
    : "NOT INDEPENDENTLY VALIDATED. Only the in-pipeline adversarial review (same model family, fresh context) and deterministic checks were applied.";

  return {
    runId: meta.runId,
    generatedAt: new Date().toISOString(),
    generatedBy: "code (src/validation-record.ts) from tool-log.jsonl and run files — not written by the model",
    researchPerformed: { webSearches, webFetches, fixturesRead, deniedByGuard, subagentCalls },
    sourcesInspected,
    sourcesCitedFromSearchSnippetsOnly: snippetOnly.filter((u) => domainOf(u) !== ""),
    checksExecuted,
    checksNotExecuted,
    independentValidationStatus,
    remainingUncertainty,
    revisions: { count: revisions.length, entries: revisions },
    finalQualityGates: lastGates ? Object.fromEntries(Object.entries(lastGates.gates).map(([k, v]) => [k, { pass: v.pass, findings: v.findings.map((f) => `[${f.severity}/${f.source}] ${f.detail}`) }])) : "not run",
    certified: lastGates?.certified ?? false,
  };
}
