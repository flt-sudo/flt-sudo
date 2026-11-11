# Evaluator V3 — Architecture (as built)

Status: implemented and benchmarked (results: `docs/results.md`). Date: 2026-11-11.
This replaces the Phase-0 plan, which proposed direct Messages API calls. At the user's request the pipeline runs as
**Claude Code subagents**, with no API key. The plan's other principles carried over: code-owned validation, a log-derived validation record and sealed benchmarks.
The change is recorded in `docs/revision-history.md`.

## 1. Environment (inspected before building)

| Item | Finding | Consequence |
|---|---|---|
| Runtime | Node 22, TypeScript, vitest | Deterministic modules in TypeScript (`src/`), 31 tests |
| Model access | Claude Code subagents, `claude-opus-5-5` (recorded per stage in `usage.jsonl`) | No API credential needed |
| Web | WebSearch works. WebFetch to most hosts is blocked by the environment's network policy | Web evidence is mostly search-snippet level |
| Repository | Unrelated `yt-music-companion/` app alongside | Self-contained `evaluator-v3/`; nothing else touched |
| Production systems | None reachable or in scope | Nothing deployed; no infrastructure |

## 2. Roles

```
            Claude Code main session = ORCHESTRATOR (moves files, obeys gates; writes no evaluation content)
                 │  npm run ev -- <cmd>   (deterministic TypeScript: all validation, gates, records)
                 │  hooks (.claude/settings.json): guard.mjs (PreToolUse), log-tool.mjs (PostToolUse/Failure)
                 ▼
 request + fixtures ─► [A] eval-planner ─► plan.json ──plan:check
                       [B] eval-researcher ─► research.json ──evidence:validate─► evidence.validated.json   (only stage with WebSearch/WebFetch)
                       [C] registry (code) ─ reclassifies or rejects each record against tool-log.jsonl
                       [D] packet (code) ─► packet.json  (facts, contradictions, unknowns; contradictions never dropped)
                       [E] eval-analyst ─► draft-N.json ──draft:check (schema, evidence-ID refs, calc re-execution)
                       [F] eval-adversary (fresh each time) ─► review-N.json ──review:check
                       [G] gates (code) ─► gates-N.json  (certified? revision recommended?)
                       [H] revision:log (code) ─ bounded loop back to B (research/both) or E (reanalysis)
                       finalize (code) ─► report.md + validation-record.json
 benchmark only:       eval-baseline (single pass) · eval-grader (fresh, blinded) · bench:* (code)
```

| Component | Who | Contract |
|---|---|---|
| Planner | subagent, read-only | Criteria with weights, knowledge gaps `G\d+`, assumptions in the question flagged for verification |
| Researcher | subagent, Read/Glob/Grep + WebSearch/WebFetch | Evidence records `E\d+` with source, classification, applicability, limitations, contradictions |
| Registry | code (`src/registry.ts`) | VERIFIED needs a source retrieved in *this* run (fixture or fetched page) or a re-executed calculation. CORROBORATED needs ≥ 2 independent retrieved sources. A snippet-only source is capped. A never-retrieved source is **rejected**, not repaired |
| Packet | code (`src/packet.ts`) | Size-bounded context; deterministic check that contradicting records survive |
| Analyst | subagent, read-only | Claims tied to evidence IDs. Calculations `K\d+` with expressions that code re-executes (`src/calc.ts`, parsed arithmetic, no `eval`) |
| Adversary | subagent, read-only, fresh context | Severity-rated defects. **v5 verify-then-new:** review 1 is independent. Later reviews check prior defects and may add new ones only if critical or in revised material |
| Gates | code (`src/gates.ts`) | Deterministic findings plus reviewer findings. `certified = all gates pass ∧ 0 critical`. Stop rule: no revision once certified; otherwise revise while `revisions < maxRevisions` |
| Revision controller | code (`revision:log`) | Refuses beyond the limit or when nothing is failing. Logs action (research / reanalysis / both) and targets |
| Validation record | code (`src/validation-record.ts`) | Eight fields built from `tool-log.jsonl`, the registry and the gates. The model never writes it, so it cannot mark an unexecuted check as done |

## 3. Hand-off integrity

- `stage:save <RUN> <agentId> <file>` copies the subagent's final hand-back **verbatim from its transcript** and appends model and token usage to `usage.jsonl`.
  The orchestrator never retypes output.
- A schema failure gets one resend to the same subagent, then the run stops.
- `stages.jsonl` records the stage timeline. `revisions.jsonl` records each revision's reason.

## 4. Security boundaries (enforced outside the model)

| Control | Mechanism |
|---|---|
| Per-stage tool allowlist | `tools:` frontmatter in `.claude/agents/eval-*.md` **and** `hooks/guard.mjs` per agent type |
| Stage lease | `stage <RUN> <agent>` writes `runs/<id>/.stage`. While it is set, **any** subagent (including a general-purpose fallback) is held to that stage's allowlist |
| Read-only research | Only researcher and baseline get WebSearch/WebFetch. No stage can Write, Edit or Bash |
| Run isolation | While a run is active, subagent Read/Glob/Grep outside that run directory is denied, so a baseline cannot read the agent's report |
| Research budgets | Guard denies WebSearch/WebFetch past `meta.json` budgets (default 12/8). **Known defect:** it counts completed calls, so parallel calls can overrun; see results |
| Untrusted content | Prompts treat retrieved text as data. Injection resistance is *measured* by canary fixtures and deterministic checks |
| Secrets / production | No credentials in context. No deploys. Writes are only by code, under `evaluator-v3/runs/` and `bench/results/` |

## 5. Benchmark

- **Cases:** 5 dev (`bench/cases/dev/`, free to inspect and tune on) and 20 held-out (`bench/cases/heldout/`), sealed by
  `bench/heldout.MANIFEST.sha256`. `run:new` refuses a held-out case whose hash changed. `bench:verify` checks the seal.
- **Blindness:** `bench:view` and `run:new` strip expected outcomes. Agents and the orchestrator never open case files directly.
- **Baseline:** a reconstruction of the original single-pass prompt, with the same tools and budgets.
- **Deterministic checks** (`bench:check`): mustFlag and mustNotClaim regexes, numeric targets and injection canaries.
- **Grading** (`bench:grade-input` → fresh `eval-grader` → `bench:grade-record`):
  - The grader sees a blinded packet: the output without its validation record or certification line, the reference and the anchored rubric (`src/rubric.ts`).
  - Rubric weights: scope 20, accuracy 25, depth 20, critical 15, usefulness 10, clarity 10.
- **Pass standard (pre-registered, amendment A1):**
  - A case passes if there is no critical failure, every mustFlag item is flagged and the grader total is ≥ 85.
  - A mustNotClaim regex hit counts only if the grader confirms it; otherwise it goes to human adjudication.
  - The objective is met only if the held-out mean is ≥ 95 **and** there are zero critical failures.
- **Report** (`bench:report`): bootstrap CI on the mean, Wilson CI on the pass rate, per-category means, disputes and the adjudication queue.

## 6. Known limitations of the design

- Every role uses the same model family, including the grader and the case author.
- Blinding is partial: output formats differ between systems.
- The research budget is a soft cap under parallel calls.
- The orchestrator's own token use is not logged.
- Web evidence is limited by the network policy.
- n = 20 gives CIs about ±2.5 points wide.
