# Benchmark report: dev-round1 (dev)

Generated 2026-11-10T09:14:58.145Z by src/cli.ts bench:report from runs/*/grade.json.

Pass standard: A case PASSES iff: no critical failure is triggered (grader-identified, or deterministic canary / mustNotClaim hit), every mustFlag item is flagged (deterministic regex OR grader adjudication with quote), and the independent grader total >= 85. The 95 objective is met only if the held-out mean independent score >= 95 AND zero critical failures across held-out cases. Small-sample results do not establish population reliability.

## agent

- Cases graded: 1 of 5
- Mean independent score: 100.0 (95% bootstrap CI 100.0–100.0)
- Case pass rate: 100% (Wilson 95% CI 21–100%)
- Cases with a critical failure: 0
- Target (mean ≥ 95 and zero critical failures): NOT MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| dev-01-annual-pricing | 100 | yes | — | yes |

Category means: scope 20.0, accuracy 25.0, depth 20.0, critical 15.0, usefulness 10.0, clarity 10.0

## baseline

- Cases graded: 1 of 5
- Mean independent score: 93.8 (95% bootstrap CI 93.8–93.8)
- Case pass rate: 100% (Wilson 95% CI 21–100%)
- Cases with a critical failure: 0
- Target (mean ≥ 95 and zero critical failures): NOT MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| dev-01-annual-pricing | 93.75 | yes | — |  |

Category means: scope 20.0, accuracy 18.8, depth 20.0, critical 15.0, usefulness 10.0, clarity 10.0

