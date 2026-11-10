#!/usr/bin/env node
// PostToolUse / PostToolUseFailure hook. Runs outside the model: appends a record of every
// research-relevant tool call to the active run's tool-log.jsonl. The evidence registry
// later accepts only sources that appear in this log.
// Plain .mjs (no deps) so it is fast and cannot be altered by model output at runtime.
import fs from "node:fs";
import path from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const evalDir = path.join(root, "evaluator-v3");
const activeFile = path.join(evalDir, "runs", ".active");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    if (!fs.existsSync(activeFile)) return;
    const runId = fs.readFileSync(activeFile, "utf8").trim();
    if (!/^[\w.-]+$/.test(runId)) return;
    const runDir = path.join(evalDir, "runs", runId);
    if (!fs.existsSync(runDir)) return;

    const ev = JSON.parse(raw);
    const respText = typeof ev.tool_response === "string" ? ev.tool_response : JSON.stringify(ev.tool_response ?? "");
    const urls = [...new Set(respText.match(/https?:\/\/[^\s"'<>)\]\\]+/g) ?? [])];
    const input = ev.tool_input ?? {};
    const rec = {
      ts: new Date().toISOString(),
      event: ev.hook_event_name,
      tool: ev.tool_name,
      toolUseId: ev.tool_use_id,
      agentId: ev.agent_id ?? null,
      agentType: ev.agent_type ?? null,
      input: {
        query: input.query,
        url: input.url,
        file_path: input.file_path,
        subagent_type: input.subagent_type,
        description: input.description,
      },
      // For WebFetch the fetched URL is the input URL; for WebSearch the result URLs.
      resultUrls: ev.tool_name === "WebSearch" ? urls.slice(0, 50) : [],
      ok: ev.hook_event_name !== "PostToolUseFailure" && !/"is_error"\s*:\s*true/.test(respText.slice(0, 2000)),
      error: ev.hook_event_name === "PostToolUseFailure" ? String(ev.error ?? respText).slice(0, 500) : undefined,
      responseChars: respText.length,
      usage: ev.tool_name === "Agent" || ev.tool_name === "Task" ? extractUsage(ev.tool_response) : undefined,
    };
    fs.appendFileSync(path.join(runDir, "tool-log.jsonl"), JSON.stringify(rec) + "\n");
  } catch (e) {
    // Never block the tool call; record the hook failure for the validation record.
    try {
      fs.appendFileSync(path.join(evalDir, "runs", "hook-errors.log"), `${new Date().toISOString()} ${e}\n`);
    } catch {}
  }
});

function extractUsage(resp) {
  if (!resp || typeof resp !== "object") return undefined;
  const pick = {};
  for (const k of ["totalTokens", "totalToolUseCount", "totalDurationMs", "usage"]) if (k in resp) pick[k] = resp[k];
  return Object.keys(pick).length ? pick : undefined;
}
