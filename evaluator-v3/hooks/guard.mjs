#!/usr/bin/env node
// PreToolUse hook. Enforced outside the model:
//  1. Per-agent tool allowlists for evaluator subagents (defence in depth on top of
//     the `tools:` frontmatter in .claude/agents/eval-*.md).
//  2. Hard research budgets (WebSearch / WebFetch counts) for the active run.
// Denies by printing a PreToolUse permissionDecision of "deny"; the denial is also logged.
import fs from "node:fs";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const evalDir = path.join(root, "evaluator-v3");
const runsDir = path.join(evalDir, "runs");

const ALLOW = {
  "eval-planner": ["Read", "Glob", "Grep"],
  "eval-researcher": ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
  "eval-analyst": ["Read", "Glob", "Grep"],
  "eval-adversary": ["Read", "Glob", "Grep"],
  "eval-grader": ["Read", "Glob", "Grep"],
  "eval-baseline": ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
};

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let ev;
  try {
    ev = JSON.parse(raw);
  } catch {
    return; // malformed input: do not interfere
  }
  const agentType = ev.agent_type ?? null;
  const tool = ev.tool_name;

  if (agentType && ALLOW[agentType] && !ALLOW[agentType].includes(tool)) {
    return deny(`${agentType} is not permitted to use ${tool}`);
  }

  if (tool !== "WebSearch" && tool !== "WebFetch") return;
  const active = path.join(runsDir, ".active");
  if (!fs.existsSync(active)) return;
  const runId = fs.readFileSync(active, "utf8").trim();
  if (!/^[\w.-]+$/.test(runId)) return;
  const runDir = path.join(runsDir, runId);
  let budgets = { maxWebSearches: 12, maxWebFetches: 8 };
  try {
    budgets = { ...budgets, ...JSON.parse(fs.readFileSync(path.join(runDir, "meta.json"), "utf8")).budgets };
  } catch {}
  let used = 0;
  try {
    for (const line of fs.readFileSync(path.join(runDir, "tool-log.jsonl"), "utf8").split("\n")) {
      if (!line.trim()) continue;
      const e = JSON.parse(line);
      if (e.tool === tool && e.event !== "PreToolUseDenied") used++;
    }
  } catch {}
  const limit = tool === "WebSearch" ? budgets.maxWebSearches : budgets.maxWebFetches;
  if (used >= limit) return deny(`research budget exhausted: ${tool} ${used}/${limit} for run ${runId}`, runDir);

  function deny(reason, dir) {
    try {
      if (dir) {
        fs.appendFileSync(
          path.join(dir, "tool-log.jsonl"),
          JSON.stringify({ ts: new Date().toISOString(), event: "PreToolUseDenied", tool, toolUseId: ev.tool_use_id, agentId: ev.agent_id ?? null, agentType, input: { query: ev.tool_input?.query, url: ev.tool_input?.url }, resultUrls: [], ok: false, error: reason }) + "\n",
        );
      }
    } catch {}
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
  }
});
