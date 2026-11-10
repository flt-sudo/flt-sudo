---
name: evaluate
description: Run the Evaluator V3 deep-evaluation pipeline on a subject or benchmark case (plan → research → evidence registry → packet → analysis → adversarial review → quality gates → bounded revision → report with a code-generated validation record). Use when the user asks to evaluate, assess or review a subject with Evaluator V3, or when the eval-bench skill runs a case.
---

# Evaluator V3 pipeline

You are the orchestrator. You do **not** write the evaluation yourself: stage subagents do the thinking, `npm run ev` (deterministic TypeScript in `evaluator-v3/`) does all validation, and the hooks in `.claude/settings.json` log and police tool use. Your job is to move files between stages exactly as returned and to obey the gate results.

All commands run from `evaluator-v3/`: `npm run ev -- <command> ...`. Paths below are relative to the run directory `evaluator-v3/runs/<RUN>/`; give subagents the **absolute** run directory path.

## Rules
- Save each subagent's JSON reply **verbatim** to the named file with the Write tool. Do not edit, fix or embellish subagent output. If it is not valid JSON or fails a `*:check`, re-run that subagent once with the error message appended; if it fails again, stop and report the failure.
- Never read `evaluator-v3/bench/cases/**` directly. For a benchmark case use `bench:view` (the expected outcomes are hidden from you and the agents).
- Do not perform research yourself, and do not add evidence. Only `eval-researcher` researches.
- Only one run may be active at a time (the hooks log to the active run).

## Steps

1. **Start the run.**
   - Benchmark case: `npm run ev -- run:new --case <CASE_ID> --system agent`
   - Ad hoc subject: write the request to a file, then `npm run ev -- run:new --request-file <file>`
   - Add `--webfetch yes` only if WebFetch works in this environment.
   Note the `runId` and `dir` it prints.

2. **Plan.** Agent `eval-planner`: "Run directory: <abs dir>. Produce the plan." → save to `plan.json` → `npm run ev -- plan:check <RUN>`.

3. **Research.** Agent `eval-researcher`: "Run directory: <abs dir>. Research the plan in plan.json. Budgets: <from run:new>." → save to `research.json` → `npm run ev -- evidence:validate <RUN>`.

4. **Compile.** `npm run ev -- packet <RUN>`.

5. **Analyse.** Agent `eval-analyst`: "Run directory: <abs dir>. Write draft N=1." → save to `draft-1.json` → `npm run ev -- draft:check <RUN> 1`.

6. **Review.** Agent `eval-adversary` (a fresh agent every time): "Run directory: <abs dir>. Review draft N." → save to `review-N.json` → `npm run ev -- review:check <RUN> N`.

7. **Gates.** `npm run ev -- gates <RUN> N`.
   - If `certified: true` and `revision recommended: false` → go to step 9.
   - If `revision recommended: true` → step 8.
   - If `revision recommended: false` and not certified (revision limit reached) → step 9; the report will state it is not certified.

8. **Revise (bounded).**
   - Decide the remedy from the failing findings: if any target needs new facts (`remedy: research`/`both`, or an unresolved decisive gap), action is `research`/`both`; otherwise `reanalysis`.
   - `npm run ev -- revision:log <RUN> --action <action>` (it refuses after the revision limit and when there is nothing to fix).
   - For `research`/`both`: run `eval-researcher` again with "Targeted follow-up research for these defects only: <paste the revision targets>. Existing evidence is in research.json; continue numbering after the last E-id and return the COMPLETE evidence list (existing + new)." → overwrite `research.json` → `evidence:validate` → `packet`.
   - Run `eval-analyst` for draft N+1 → `draft:check`, then back to step 6 with N+1.

9. **Finalize.** `npm run ev -- finalize <RUN>` → writes `report.md` and `validation-record.json`, and deactivates the run.

10. **Report to the user.** Give the verdict, certification status, revision count and the key items from the validation record (checks not executed, independent-validation status). Link `report.md`. Do not claim the evaluation is independently validated; the record states its status.
