# Revision history

Prompts are the agent definitions in `.claude/agents/eval-*.md`; their version is `prompts/VERSION`.
Every change records what changed, why, and the evidence that motivated it. Held-out results must never motivate a change.

## Pre-registration (2026-11-10, before any benchmark run)

Fixed before the first agent run, and not changed afterwards without a dated entry here:
- Rubric categories, weights and observable anchors: `src/rubric.ts` (`CATEGORIES`).
- Pass standard: `src/rubric.ts` (`PASS_STANDARD`). A case passes iff no critical failure (grader-identified, or a deterministic canary / mustNotClaim hit), every mustFlag item flagged (regex or grader adjudication), and grader total ≥ 85. The 95 objective is met only if the held-out mean ≥ 95 and there are zero critical failures across held-out cases.
- Grader blinding: the code-generated validation record and certification line are stripped from the output before grading (`bench:grade-input`). Formats still differ between agent and baseline, so blinding is partial.

## v1 (2026-11-10)

Initial prompts: planner, researcher, analyst, adversary, grader, baseline.
- Baseline is a **reconstruction**: the original ChatGPT-round prompt was not available. It reproduces the described design (single pass, self-assessed score, no enforced evidence registry).

## Design changes during build (before any benchmark run)

- Architecture moved from direct API calls to Claude Code subagents at the user's request (no API key). Research uses Claude Code WebSearch/WebFetch; WebFetch is blocked by this environment's network policy, so web evidence is search-snippet level unless fetched.
- Added a stage lease in the guard hook: custom agent types load only at session start, so stages may run as general-purpose subagents; the lease applies the same tool allowlist to any subagent while a stage is declared.
