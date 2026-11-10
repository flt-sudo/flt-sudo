---
name: eval-bench
description: Run the Evaluator V3 benchmark - full agent pipeline and baseline on dev or held-out cases, blind grading by a separate grader subagent, deterministic checks, and the aggregated results report. Use when the user asks to run, grade or report the Evaluator V3 benchmark.
---

# Evaluator V3 benchmark

Work from `evaluator-v3/`. Commands: `npm run ev -- <command>`.

## Integrity rules (non-negotiable)
- Held-out cases are sealed. Run `npm run ev -- bench:verify` first; if it fails, stop and report. Never edit held-out cases or expected results, and never seal again.
- Never open `bench/cases/**` files. Before a run, read a case only through `npm run ev -- bench:view <CASE>` (no expected outcomes).
- Do not change prompts (`.claude/agents/eval-*.md`) or code while a held-out run is in progress. Prompt changes are allowed only after dev runs, and must be recorded in `docs/revision-history.md` with a bump of `prompts/VERSION`.
- One run at a time; no other subagents during a run.

## Per case
1. **Agent:** follow the `evaluate` skill with `run:new --case <CASE> --system agent`.
2. **Baseline:** `npm run ev -- run:new --case <CASE> --system baseline` (same budgets) → `npm run ev -- stage <RUN> eval-baseline` → launch the `eval-baseline` stage (or the general-purpose fallback described in the `evaluate` skill) with "Run directory: <abs dir>." → `stage:save <RUN> <agentId> report.md` → `npm run ev -- stage:clear <RUN>` → `npm run ev -- baseline:finalize <RUN>`.
3. **For each of the two runs:**
   - `npm run ev -- bench:check <RUN>` (deterministic checks)
   - `npm run ev -- bench:grade-input <RUN>` (blinded packet)
   - `npm run ev -- run:activate <RUN>` → `npm run ev -- stage <RUN> eval-grader` → launch a **fresh** `eval-grader` with "Grade the packet at <abs path to grade-input.md>." → `stage:save <RUN> <agentId> grade-raw.json` → `npm run ev -- stage:clear <RUN>` → `npm run ev -- run:deactivate`
   - `npm run ev -- bench:grade-record <RUN> --grader "<agent type and model>"`
4. Do not re-run a case to get a better score. A run that crashed before producing a report may be re-run once; record why in the results.

## Report
`npm run ev -- bench:report --split heldout --label <label>` (or `--split dev`). Then write up `docs/results.md`: the measured numbers, every failure, cases needing human adjudication (`needsHumanAdjudication`), cost/usage figures from the tool logs, and the limitations. State "objective met" only if the report says MET.
