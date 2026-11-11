# Evaluation: billing service extraction, effort and audit deadline (30 April 2027)

## 1. Verdict

**Engineer-months:** The attached material does not support an exact figure, and any exact number I gave would be made up. Every phase in the plan is marked "TBD". The coupling analysis says it is partial: shared database tables have "not yet analysed", and the background-job scan is "incomplete". Your own history shows estimates coming in 1.8 to 2.6 times too low. The defensible statement is a range. Based on your past extractions, a billing extraction is likely to take **about 13 to 25+ engineer-months**, and the high end has no firm limit until the shared tables are mapped.

**Will extraction finish before 30 April 2027? No.** You can say this with confidence even without an estimate, because the planned staffing is too small:

- Planned capacity: 4 engineers at 50% from January, so 2 FTE × about 4 months (Jan to Apr) = **at most about 8 engineer-months**. Holidays, ramp-up and the switching cost of 50% allocation push it lower in practice.
- Your smallest past extraction (notifications) **actually took 13 engineer-months**. That is more than 1.6 times the full capacity available.

**The more important finding:** the audit does not require extraction. Finding AF-2026-09 says: *"The auditors do not prescribe an architecture; database-level access controls, separate schemas with restricted roles, or service extraction are all acceptable if controls are demonstrable."* The question as framed to execs ("Will the extraction be done in time?") rests on a false premise. The answer they need is: **"Extraction will not be done by April. We can still meet the audit requirement on time if we treat compliance controls as the deadline work and run extraction separately as an architecture project."**

## 2. Evaluation criteria

1. **Can the numbers be estimated?** Is there enough scope information to commit to a figure?
2. **Calibration:** What does your own estimate history say about how accurate a new estimate would be?
3. **Capacity versus demand:** Can the planned staffing deliver within the time available?
4. **Requirement fit:** Does extraction actually match what the auditors asked for, and is it the cheapest compliant option?
5. **Risk and failure modes:** What happens if the chosen path slips?
6. **Decision usefulness:** What can execs responsibly commit to?

## 3. Detailed analysis

### 3.1 Scope is largely unknown

| Input | State | Implication |
|---|---|---|
| Phases 1–4 | All "TBD", no estimates | There is no bottom-up estimate to check or adjust |
| Files referencing `Billing::` | 214 | Wide coupling across the codebase; it says nothing about how deep the coupling goes |
| Shared DB tables | "not yet analysed" | **This is the biggest cost driver of any extraction** (data ownership, dual writes, foreign keys, joins in reports). Its absence leaves the estimate open-ended |
| Background jobs touching invoices | "at least 17 (scan incomplete)" | A lower bound only. Each job is an integration point that has to be rerouted or moved |
| Phase 2 "dual-write ledger" | Planned | Dual-writing a financial ledger is one of the riskiest extraction patterns. It needs reconciliation, idempotency and a backfill, plus a period of parallel running before cutover |
| Owner | "unassigned" | No one is accountable for the estimate or the delivery |

A billing ledger adds money-correctness and reconciliation requirements that search and notifications probably did not have. Billing is therefore unlikely to be easier than your past extractions, and may be harder.

### 3.2 Estimate history (n = 3)

| Project | Estimated | Actual | Actual ÷ Estimate |
|---|---|---|---|
| Search-service | 10 | 18 | 1.80 |
| Notifications | 5 | 13 | 2.60 |
| Auth | 7 | 16.8 | 2.40 |

- Arithmetic mean ratio ≈ **2.27**; geometric mean ≈ **2.24**; range 1.8 to 2.6.
- **All three projects overran by 80 to 160%.** The bias is systematic, not random noise.
- Actuals ranged from **13 to 18 engineer-months**, even when the estimate was as low as 5.
- The sample is small (n=3), so these ratios are indicative, not statistically robust. Still, the direction is consistent, and this is your own data, which is the right reference class (reference-class forecasting).

**Implication:** If the team produces a bottom-up estimate of E, plan on roughly **1.8E to 2.6E**, with about 2.25E as the central value.

### 3.3 Capacity versus demand

- Capacity: 4 × 0.5 FTE × about 4 months ≈ **8 engineer-months, at best**. A realistic figure after holidays, onboarding, the switching cost of 50% allocation and incident work is perhaps **5 to 7**.
- Using your history in reverse: for the realistic actual to fit in 8 engineer-months, the team's *estimate* would need to be **at most about 3.1 (at 2.6×) to 4.4 (at 1.8×) engineer-months**. That is smaller than any past extraction estimate, including notifications at 5, and implausible for a ledger with 214 referencing files and 17+ jobs.
- Calendar time matters as well as effort. Dual-write ledgers usually need weeks of parallel running and reconciliation before cutover, which adds elapsed time regardless of headcount.
- Adding people late does not fix this. More engineers cost ramp-up time on a coupled monolith (Brooks's law), and the critical path (boundary discovery, then dual-write, then reconciliation, then cutover) is sequential.
- Many audits also need controls to have been **operating and evidenced** before the deadline, not just switched on that day. If that applies here, finishing on 30 April is already too late. Confirm with the auditors.

**Conclusion: a firm "No" for full extraction (Phases 1 to 4) by 30 April 2027 with the planned staffing.** Even Phase 3 (invoice cutover) is very unlikely to be complete.

### 3.4 Requirement fit: extraction is one acceptable option, and the most expensive

The finding has three control objectives:
1. Access to billing **data** restricted to authorised roles.
2. Access to billing **code paths** restricted, with **segregation of duties**.
3. **Audit logging of changes.**

Each can be met inside the monolith with standard techniques:

| Control objective | Option inside the monolith | Notes |
|---|---|---|
| Restricted data access | Move billing tables to a separate PostgreSQL schema or database with dedicated DB roles; non-billing app roles get no grants. Rails multiple-database support (Rails 6+) lets billing models connect with separate credentials | Named explicitly by the auditor as acceptable. Requires the shared-table analysis, which is needed for extraction anyway |
| Restricted code paths and segregation of duties | Move billing code to a dedicated module or engine, with module boundaries enforced (e.g. Packwerk). Add CODEOWNERS on billing paths, branch protection with required approval from billing owners, and separate deploy approval | Gives demonstrable, auditable change control without a network boundary |
| Audit logging | DB-level (e.g. pgaudit) plus application-level change history (e.g. PaperTrail or Audited gems), and git and CI records of reviews and approvals | Logging is required whichever architecture you pick; extraction does not provide it automatically |
| Demonstrability | Access reviews, role matrices, evidence exports | The auditor's key word is "demonstrable" |

These controls are also useful steps *toward* extraction: schema separation, module boundaries and table ownership are roughly Phase 1 of any extraction anyway. Very little is thrown away.

## 4. Strengths and weaknesses of the current plan

**Strengths**
- Extraction is a valid, auditor-accepted end state, with long-term architectural benefits (independent deploys, clear ownership).
- Dual-write followed by cutover is a recognised migration pattern that lowers cutover risk.
- Some coupling data already exists (214 files, 17+ jobs).

**Weaknesses**
- No estimates, no owner, and part-time staffing on a deadline-driven project.
- The coupling analysis is missing its most important part (shared tables).
- It ties a compliance deadline to a large, historically under-estimated architecture project.
- The plan contains no audit-specific controls: no logging, access-review or segregation-of-duties evidence. A completed extraction could still fail the audit if these are missing.

## 5. Alternatives compared

| Option | Meets AF-2026-09? | Likely by 30 Apr 2027? | Rough effort | Risk |
|---|---|---|---|---|
| A. Full service extraction (current plan) | Yes, if logging and SoD are added | **No** | ~13 to 25+ eng-months (history-based, uncalibrated) | High: ledger dual-write, schedule |
| B. Schema/DB role separation + code ownership + audit logging inside the monolith | Yes (explicitly named) | **Plausible**, depending on how many tables are shared | Not estimated; likely a fraction of A, to be confirmed by the shared-table analysis | Medium: shared tables and cross-domain joins may need refactoring |
| C. B now, A later as a roadmap item | Yes | Plausible for compliance; extraction lands after the deadline | B + A, with B partly reused in A | Lowest compliance risk |
| D. Ask the auditors for an extension or accept a remediation plan | Maybe | Not applicable | Low | Depends on the auditor; damages credibility if used first |

**Recommended: Option C.** I have not estimated Option B's effort either. The same shared-table gap applies, so it must be estimated quickly and padded by your historical bias.

## 6. Tradeoffs

- **Speed versus architectural purity:** B satisfies the audit sooner. A gives cleaner long-term isolation but cannot be delivered in time.
- **Cost of doing work twice:** B's schema separation and module boundaries overlap heavily with A's Phase 1, so the waste is small.
- **Strength of controls:** A network or service boundary is a stronger technical control. DB roles plus code ownership are weaker against a malicious insider with production access, but the auditor accepts them explicitly.
- **Staffing:** 2 FTE spread over four people is a weak setup for either option. For B, fewer people at full allocation with a named owner would be more effective.

## 7. Edge cases and failure modes

- **Shared-table explosion:** If billing tables are joined heavily by reporting, admin, or other domains, both B and A grow significantly. This is the main unknown and should be analysed first (in days, not months).
- **"Finished" versus "operating":** Controls switched on 29 April may not satisfy an auditor who wants an evidence period. Confirm what "by 30 April" means.
- **Partial extraction:** A half-done dual-write in April is the worst outcome. It brings the complexity of two systems without any compliance benefit, plus ledger reconciliation risk.
- **Undiscovered jobs:** The scan found "at least 17". Missed jobs that write invoices directly to the monolith DB would break segregation in either option.
- **Superuser or ops access:** DBA, console (`rails console`) and production-access paths must also be restricted and logged. This is often missed and fails audits whatever the architecture.
- **Calendar start:** "From January" may in practice mean mid-January, which cuts capacity further.

## 8. Counterarguments

- *"Billing may be simpler than past extractions."* This is possible, but there is no evidence for it. 214 files, a ledger with dual writes, and 17+ jobs suggest it is not. Even if the actual effort matched your smallest-ever extraction (13), it would still exceed the 8 available.
- *"We'll add more engineers."* Only partly helpful. The work is sequential and the codebase is coupled. Your history also shows overruns of 1.8 to 2.6× even when projects were properly staffed.
- *"Extraction is the 'right' long-term answer, so commit to it."* This can be true and still be no reason to put the audit at risk on it. Keep it as a roadmap goal, separate from the compliance deadline.
- *"The history is only three data points."* True. But all three point the same way, and the capacity gap is large enough that the conclusion holds across the full observed range.

## 9. Quantitative summary

- Available capacity: ≤8 eng-months (realistically about 5 to 7).
- Historical actuals for comparable extractions: 13, 16.8, 18 eng-months.
- Overrun multiplier: 1.8 to 2.6× (mean about 2.27×).
- Largest estimate that could still finish in time given your bias: about 3.1 to 4.4 eng-months, which is below every past extraction estimate.
- Expected range for billing extraction: **about 13 to 25+ eng-months**. This is a reference-class range, not an estimate. Something like 2.25 × a still-unproduced bottom-up estimate is the honest way to frame it.
- At 2 FTE, 13 to 25 eng-months means about **6.5 to 12.5+ calendar months**, i.e. likely completion between mid/late 2027 and early 2028, not April.

## 10. What to say at the exec meeting

1. "We cannot give an exact engineer-month figure today. Scope isn't analysed, and our last three extractions overran by 1.8 to 2.6×. Our past extractions cost 13 to 18 engineer-months. Expect billing to cost at least that."
2. "**No**, a full billing extraction will not be finished by 30 April 2027 with the planned staffing. That staffing provides at most about 8 engineer-months."
3. "The auditors do not require extraction. They explicitly accept DB-level access controls or separate schemas with restricted roles, as long as access restriction, segregation of duties and audit logging are demonstrable."
4. "Proposal: (a) in the next 2 to 3 weeks, finish the shared-table and job analysis and assign an owner; (b) scope and estimate a compliance-controls track (schema/role separation, code ownership and approvals, audit logging, evidence) targeting completion well before April so there is an evidence period; (c) keep extraction as a separately estimated roadmap item that reuses that work."
5. "Confirm with the auditors whether controls must be operating for a period before 30 April."

## 11. Sources

- Run inputs: `/home/user/flt-sudo/evaluator-v3/runs/r20261111T061745-508202a8/request.md`, and in `sources/`: `billing-extraction-plan.md`, `dependency-analysis.md`, `estimate-history.csv`, `audit-finding.md`.
- General engineering knowledge, not checked by web search in this run: Rails multiple-database support (Rails 6.0+), Shopify Packwerk for module boundaries, GitHub CODEOWNERS with branch protection, the PostgreSQL pgaudit extension, the PaperTrail and Audited gems, reference-class forecasting and Brooks's law.

## 12. Remaining uncertainty

- The number of shared tables is unknown. It is the dominant driver for both options.
- It is unclear whether "by 30 April" means controls in place or controls evidenced over a period.
- The history has only n=3, and the earlier projects may not be comparable (team size, era, domain risk).
- "Actual_eng_months" may have been measured inconsistently across projects.
- The effort for Option B has not been estimated. I claim it is plausible by April, not certain.
- Whether planned staffing could be raised to full-time is unknown. It would not change the extraction verdict but would help Option B.

## Self-assessed quality score: 82/100

The verdict is well supported for the yes/no question, and the reframing is anchored directly in the auditor's text. I deducted points because the alternative's effort could not be quantified, the historical sample is small, and the technical references were not checked by web search in this run.
