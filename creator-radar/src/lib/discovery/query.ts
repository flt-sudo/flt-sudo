import { createHash } from "node:crypto";
import type { SearchQuery } from "./providers/types";

const MAX_TERM_LENGTH = 80;

/** Cleans operator-entered terms: trims, strips quotes/operators, de-duplicates. */
export function sanitizeTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const t = raw
      .replace(/["()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TERM_LENGTH);
    if (t.length < 3) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

export function queryKey(query: string): string {
  return createHash("sha256").update(query).digest("hex").slice(0, 24);
}

/**
 * Packs quoted phrases into OR-groups that fit the provider's query length
 * limit (512 chars on X's recent-search endpoint for most access levels).
 */
export function buildPhraseQueries(terms: string[], suffix: string, maxLength = 512): SearchQuery[] {
  const clean = sanitizeTerms(terms);
  const groups: string[][] = [];
  let current: string[] = [];
  const render = (g: string[]) => `(${g.map((t) => `"${t}"`).join(" OR ")})${suffix ? ` ${suffix}` : ""}`;
  for (const term of clean) {
    const next = [...current, term];
    if (current.length > 0 && render(next).length > maxLength) {
      groups.push(current);
      current = [term];
    } else {
      current = next;
    }
  }
  if (current.length) groups.push(current);
  return groups.map((g) => {
    const query = render(g);
    return { key: queryKey(query), query, terms: g };
  });
}

/** Which configured term (if any) a post's text contains, for display. */
export function matchTerm(text: string, terms: string[]): string | null {
  const lower = text.toLowerCase().replace(/[‘’]/g, "'");
  return terms.find((t) => lower.includes(t.toLowerCase())) ?? null;
}
