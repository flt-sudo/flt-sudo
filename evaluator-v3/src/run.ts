import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const RUNS = path.join(ROOT, "runs");
export const ACTIVE = path.join(RUNS, ".active");

export interface ToolLogEntry {
  ts: string;
  event: string;
  tool: string;
  toolUseId?: string;
  agentId: string | null;
  agentType: string | null;
  input: { query?: string; url?: string; file_path?: string; subagent_type?: string; description?: string };
  resultUrls: string[];
  ok: boolean;
  error?: string;
  responseChars?: number;
  usage?: Record<string, unknown>;
}

export interface RunMeta {
  runId: string;
  caseId: string | null;
  system: "agent" | "baseline";
  createdAt: string;
  request: string;
  fixtures: string[];
  budgets: Budgets;
  promptVersion: string;
  environment: { claudeCodeVersion: string | null; model: string | null; webFetchAvailable: boolean; notes: string[] };
}

export interface Budgets {
  maxWebSearches: number;
  maxWebFetches: number;
  maxRevisions: number;
}

export const DEFAULT_BUDGETS: Budgets = { maxWebSearches: 12, maxWebFetches: 8, maxRevisions: 2 };

export function runDir(runId: string): string {
  if (!/^[\w.-]+$/.test(runId)) throw new Error(`invalid run id ${runId}`);
  return path.join(RUNS, runId);
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

export function readJsonl<T>(file: string): T[] {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as T);
}

export function toolLog(runId: string): ToolLogEntry[] {
  return readJsonl<ToolLogEntry>(path.join(runDir(runId), "tool-log.jsonl"));
}

/** Normalise a URL for comparison: lowercase host, strip fragment, trailing slash and www. */
export function normUrl(u: string): string {
  try {
    const x = new URL(u.trim());
    x.hash = "";
    const host = x.hostname.toLowerCase().replace(/^www\./, "");
    const p = x.pathname.replace(/\/+$/, "");
    return `${host}${p}${x.search}`;
  } catch {
    return u.trim().toLowerCase();
  }
}

export function domainOf(u: string): string {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
