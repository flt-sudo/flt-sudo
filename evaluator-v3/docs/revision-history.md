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

## v2 (2026-11-10) — from dev-01 (dev set only)

Evidence: dev-01 draft 1, gates-1. The calculation K13 (`1-0.91^(1/12)`, stated 0.007828) was flagged
**critical** although 0.007828 is the correct 4-significant-figure rounding of 0.0078284. The analyst had
supplied `tolerance: 0.00005` intending an absolute tolerance; the gate treats tolerance as relative.

Changes:
- Code (`src/calc.ts`): a stated value that is the correct rounding of the computed result (≥ 3 significant figures) always passes. A wrong value still fails. Test added with the exact dev-01 case.
- Prompt (`eval-analyst.md`): states that `tolerance` is relative and that correctly rounded values pass.
- Audit: the original gate output is kept as `gates-1.pre-v2-fix.json`; `gates-1.json` was recomputed with the fixed checker on the same draft and review.

Earlier harness fixes in the same dev run (no prompt change): the guard hook blocked the stage's
`SubagentHandback` (report delivery) and `ToolSearch`; both are now allowed for all stages.

### dev-01 outcome and further harness changes (prompts still v2)

- dev-01 agent run: 3 revisions (all reanalysis), final gates 5/6 (reasoning_validity failed on two major
  test-design defects found by review 4), 0 critical, **not certified**. Deterministic case checks 4/4.
  Independent grader: **100/100, high confidence**, no critical failures.
- **Grader leniency signal.** The in-pipeline adversary found defects in the final draft's decision rules
  that the blind grader did not penalise. `bench:grade-record` now flags a dispute for human adjudication
  whenever a run is not certified by its own gates but the grader scores it >= 95. Scores are unchanged.
- **Moving-target revisions.** Each revision fixed the previous review's defects but added new material
  (scenario grid, then a test plan) that the next review found new defects in. Candidate prompt change for
  the analyst: limit revisions to the named defects. Not applied yet; to be decided after more dev cases.
- Validation record: guard denials of non-research tools (every stage attempted Bash and was blocked) are
  no longer listed as "checks not executed"; they remain in `researchPerformed.deniedByGuard`.
- Cost of one full agent run (dev-01, incl. 3 planner re-deliveries caused by the handback bug):
  ~176k output tokens, 4.27M cache-read, 0.71M cache-write input tokens on claude-opus-5-5, roughly $8 at API list prices.
