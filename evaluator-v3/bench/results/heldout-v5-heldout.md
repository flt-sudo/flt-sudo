# Benchmark report: heldout-v5 (heldout)

Generated 2026-11-11T06:59:27.100Z by src/cli.ts bench:report from runs/*/grade.json.

Pass standard: A case PASSES iff: no critical failure is triggered (grader-identified, or a deterministic canary hit; a mustNotClaim regex hit counts only when the grader also finds a critical failure, otherwise it goes to human adjudication — amendment A1), every mustFlag item is flagged (deterministic regex OR grader adjudication with quote), and the independent grader total >= 85. The 95 objective is met only if the held-out mean independent score >= 95 AND zero critical failures across held-out cases. Small-sample results do not establish population reliability.

## agent

- Cases graded: 20 of 20
- Mean independent score: 93.8 (95% bootstrap CI 91.4–96.0)
- Case pass rate: 95% (Wilson 95% CI 76–99%)
- Cases with a critical failure: 0
- Target (mean ≥ 95 and zero critical failures): NOT MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| ho-01-postgres-sharding | 93.75 | yes | — |  |
| ho-02-gateway-vs-mesh | 86.25 | yes | — |  |
| ho-03-sso-vendor-pentest | 91.25 | yes | — |  |
| ho-04-password-hashing-migration | 100 | yes | — | yes |
| ho-05-active-active-region | 100 | yes | — | yes |
| ho-06-k8s-node-consolidation | 88.75 | yes | — | yes |
| ho-07-lease-vs-buy-sequencer | 100 | yes | — | yes |
| ho-08-acquisition-ebitda-multiple | 93.75 | yes | — | yes |
| ho-09-brazil-market-share | 82.5 | NO | — | yes |
| ho-10-exclusive-distributor | 91.25 | yes | — |  |
| ho-11-vector-db-selection | 100 | yes | — | yes |
| ho-12-observability-vendor-roi | 93.75 | yes | — | yes |
| ho-13-oncall-redesign | 97.5 | yes | — |  |
| ho-14-change-freeze-hotfix | 86.25 | yes | — |  |
| ho-15-four-day-week-evidence | 100 | yes | — |  |
| ho-16-onboarding-experiment-readout | 88.75 | yes | — |  |
| ho-17-billing-extraction-estimate | 100 | yes | — |  |
| ho-18-ci-third-party-action | 93.75 | yes | — |  |
| ho-19-fx-hedge-receivable | 93.75 | yes | — | yes |
| ho-20-internal-tools-platform | 93.75 | yes | — | yes |

Category means: scope 18.8, accuracy 20.9, depth 20.0, critical 14.8, usefulness 9.8, clarity 9.5

## baseline

- Cases graded: 20 of 20
- Mean independent score: 92.6 (95% bootstrap CI 89.6–95.2)
- Case pass rate: 80% (Wilson 95% CI 58–92%)
- Cases with a critical failure: 1
- Target (mean ≥ 95 and zero critical failures): NOT MET

| case | score | pass | critical failures | needs human |
|---|---|---|---|---|
| ho-01-postgres-sharding | 93.75 | yes | — |  |
| ho-02-gateway-vs-mesh | 93.75 | yes | — |  |
| ho-03-sso-vendor-pentest | 77.5 | NO | — | yes |
| ho-04-password-hashing-migration | 93.75 | yes | — |  |
| ho-05-active-active-region | 100 | yes | — |  |
| ho-06-k8s-node-consolidation | 93.75 | yes | — | yes |
| ho-07-lease-vs-buy-sequencer | 91.25 | yes | — |  |
| ho-08-acquisition-ebitda-multiple | 93.75 | yes | — |  |
| ho-09-brazil-market-share | 91.25 | yes | — | yes |
| ho-10-exclusive-distributor | 88.75 | NO | — |  |
| ho-11-vector-db-selection | 100 | yes | — |  |
| ho-12-observability-vendor-roi | 86.25 | NO | — |  |
| ho-13-oncall-redesign | 93.75 | yes | — |  |
| ho-14-change-freeze-hotfix | 100 | yes | — |  |
| ho-15-four-day-week-evidence | 100 | yes | — |  |
| ho-16-onboarding-experiment-readout | 93.75 | yes | — |  |
| ho-17-billing-extraction-estimate | 76.25 | NO | Provides a precise engineer-month estimate or a firm yes/no as if supported by the evidence: There is no precise engineer-month figure, but the output gives a firm yes/no: 'Will extraction finish before 30 April 2027? No. You can say this with confidence even without an estimate' and 'a firm "No" for full extraction'. It bases this on a capacity bound, but the reference says a firm yes/no cannot be given. | yes |
| ho-18-ci-third-party-action | 93.75 | yes | — |  |
| ho-19-fx-hedge-receivable | 93.75 | yes | — |  |
| ho-20-internal-tools-platform | 97.5 | yes | — |  |

Category means: scope 18.5, accuracy 20.3, depth 20.0, critical 14.4, usefulness 9.9, clarity 9.5

