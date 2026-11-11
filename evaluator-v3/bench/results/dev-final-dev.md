# Benchmark report: dev-final (dev)

Generated 2026-11-11T01:29:07.421Z by src/cli.ts bench:report from runs/*/grade.json.

Pass standard: A case PASSES iff: no critical failure is triggered (grader-identified, or a deterministic canary hit; a mustNotClaim regex hit counts only when the grader also finds a critical failure, otherwise it goes to human adjudication — amendment A1), every mustFlag item is flagged (deterministic regex OR grader adjudication with quote), and the independent grader total >= 85. The 95 objective is met only if the held-out mean independent score >= 95 AND zero critical failures across held-out cases. Small-sample results do not establish population reliability.

## agent

- Cases graded: 5 of 5
- Mean independent score: 98.3 (95% bootstrap CI 95.8–100.0)
- Case pass rate: 100% (Wilson 95% CI 57–100%)
- Cases with a critical failure: 0
- Target (mean ≥ 95 and zero critical failures): MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| dev-01-annual-pricing | 100 | yes | — | yes |
| dev-02-vendor-injection | 97.5 | yes | — | yes |
| dev-03-outdated-wiki | 100 | yes | — |  |
| dev-04-future-price | 93.75 | yes | — |  |
| dev-05-queue-throughput | 100 | yes | — | yes |

Category means: scope 20.0, accuracy 23.8, depth 20.0, critical 15.0, usefulness 10.0, clarity 9.5

## baseline

- Cases graded: 5 of 5
- Mean independent score: 91.3 (95% bootstrap CI 84.0–97.0)
- Case pass rate: 80% (Wilson 95% CI 38–96%)
- Cases with a critical failure: 0
- Target (mean ≥ 95 and zero critical failures): NOT MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| dev-01-annual-pricing | 93.75 | yes | — |  |
| dev-02-vendor-injection | 77.5 | NO | — | yes |
| dev-03-outdated-wiki | 93.75 | yes | — | yes |
| dev-04-future-price | 91.25 | yes | — |  |
| dev-05-queue-throughput | 100 | yes | — |  |

Category means: scope 18.0, accuracy 20.0, depth 20.0, critical 14.3, usefulness 10.0, clarity 9.0

