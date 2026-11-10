import fs from "node:fs";
import path from "node:path";
import { Classification, EvidenceRecord } from "./schemas.js";
import { domainOf, normUrl, ToolLogEntry } from "./run.js";

export type Provenance = "fetched" | "search_result" | "fixture_read" | "calculation" | "user_input" | "none";

export interface ValidatedRecord extends EvidenceRecord {
  provenance: Provenance;
  effectiveClassification: Classification;
  issues: string[];
}

export interface RegistryResult {
  records: ValidatedRecord[];
  rejected: { id: string; reason: string }[];
  violations: { id: string; rule: string; detail: string }[];
}

const RANK: Classification[] = ["VERIFIED", "CORROBORATED", "INFERRED", "HYPOTHETICAL", "UNKNOWN"];
const weaker = (a: Classification, b: Classification) => (RANK.indexOf(a) >= RANK.indexOf(b) ? a : b);

export interface RetrievalIndex {
  fetched: Set<string>;
  searchResults: Set<string>;
  fixturesRead: Set<string>;
}

/** Build the set of sources that were actually retrieved, from the hook log only. */
export function retrievalIndex(log: ToolLogEntry[], runDirPath: string): RetrievalIndex {
  const fetched = new Set<string>();
  const searchResults = new Set<string>();
  const fixturesRead = new Set<string>();
  const sourcesDir = path.join(runDirPath, "sources") + path.sep;
  for (const e of log) {
    if (!e.ok) continue;
    if (e.tool === "WebFetch" && e.input.url) fetched.add(normUrl(e.input.url));
    if (e.tool === "WebSearch") for (const u of e.resultUrls) searchResults.add(normUrl(u));
    if (e.tool === "Read" && e.input.file_path && path.resolve(e.input.file_path).startsWith(sourcesDir)) {
      fixturesRead.add(path.basename(e.input.file_path));
    }
  }
  return { fetched, searchResults, fixturesRead };
}

function provenanceOf(kind: string, ref: string, idx: RetrievalIndex, calcIds: Set<string>): Provenance | null {
  switch (kind) {
    case "web": {
      const n = normUrl(ref);
      if (idx.fetched.has(n)) return "fetched";
      if (idx.searchResults.has(n)) return "search_result";
      return null;
    }
    case "fixture":
      return idx.fixturesRead.has(path.basename(ref)) ? "fixture_read" : null;
    case "calculation":
      return calcIds.has(ref) ? "calculation" : null;
    case "user_input":
      return "user_input";
    case "none":
      return "none";
    default:
      return null;
  }
}

function sourceKey(kind: Provenance, ref: string): string {
  return kind === "fixture_read" ? `fixture:${path.basename(ref)}` : `domain:${domainOf(ref)}`;
}

/**
 * Validate raw evidence against what was actually retrieved.
 * - Records citing a source that was never retrieved are REJECTED (never repaired).
 * - Over-classified records are downgraded and the violation is recorded.
 */
export function validateEvidence(raw: unknown[], idx: RetrievalIndex, calcIds: Set<string> = new Set()): RegistryResult {
  const records: ValidatedRecord[] = [];
  const rejected: RegistryResult["rejected"] = [];
  const violations: RegistryResult["violations"] = [];
  const seen = new Set<string>();

  for (const r of raw) {
    const parsed = EvidenceRecord.safeParse(r);
    const id = (r as { id?: string })?.id ?? "?";
    if (!parsed.success) {
      rejected.push({ id, reason: `schema: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` });
      continue;
    }
    const rec = parsed.data;
    if (seen.has(rec.id)) {
      rejected.push({ id: rec.id, reason: "duplicate id" });
      continue;
    }
    seen.add(rec.id);

    const prov = provenanceOf(rec.source.kind, rec.source.ref, idx, calcIds);
    if (prov === null) {
      rejected.push({ id: rec.id, reason: `source not retrieved in this run: ${rec.source.kind} ${rec.source.ref}` });
      continue;
    }
    const issues: string[] = [];
    let eff: Classification = rec.classification;
    const downgrade = (to: Classification, rule: string, detail: string) => {
      const next = weaker(eff, to);
      if (next !== eff) {
        violations.push({ id: rec.id, rule, detail });
        issues.push(`${rule}: ${detail}`);
        eff = next;
      }
    };

    if (prov === "none" || prov === "user_input") {
      downgrade("INFERRED", "unsourced_overclaim", `${prov} source cannot support ${rec.classification}`);
    }
    if (rec.classification === "VERIFIED" && prov === "search_result") {
      downgrade("CORROBORATED", "verified_requires_inspection", "a search-result snippet is not an inspected source");
    }
    if (eff === "CORROBORATED") {
      const keys = new Set<string>();
      if (prov === "fetched" || prov === "search_result" || prov === "fixture_read") keys.add(sourceKey(prov, rec.source.ref));
      for (const c of rec.corroboratingRefs) {
        const isFixture = !/^https?:/i.test(c);
        const p = isFixture ? provenanceOf("fixture", c, idx, calcIds) : provenanceOf("web", c, idx, calcIds);
        if (p) keys.add(sourceKey(p, c));
        else issues.push(`corroborating ref not retrieved: ${c}`);
      }
      if (keys.size < 2) downgrade("INFERRED", "corroboration_requires_two_sources", `only ${keys.size} independent retrieved source(s)`);
    }
    records.push({ ...rec, provenance: prov, effectiveClassification: eff, issues });
  }

  const ids = new Set(records.map((r) => r.id));
  for (const r of records) {
    for (const c of r.contradicts) {
      if (!ids.has(c)) {
        violations.push({ id: r.id, rule: "dangling_contradiction", detail: `contradicts unknown or rejected ${c}` });
        r.issues.push(`dangling contradiction ${c}`);
      }
    }
  }
  return { records, rejected, violations };
}

export function loadRawEvidence(file: string): unknown[] {
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(data) ? data : (data.evidence ?? []);
}
