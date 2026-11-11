# Evaluation: Should we approve the active-active multi-region project?

## Verdict

**No, not as proposed.** I recommend deferring it and spending a small part of the money on the things that actually caused downtime. The case for the project rests on three claims, and the attached documents contradict all three:

1. **The downtime number is about 12 times too high.** 99.99% over a 30-day month allows **4.32 minutes** of downtime, not 52. Roughly 52.6 minutes is the *yearly* allowance at 99.99%.
2. **The contract doesn't ask for 99.99%.** It requires **99.95%** per calendar month, which is 21.6 minutes per 30-day month.
3. **Region failure has not been our biggest risk.** The log shows **0 region-wide outages in 12 months**. Bad deploys caused **92 of 115 customer-facing minutes (80%)**, and active-active does little to prevent those.

The estimate is also incomplete. The ledger database's consistency model, RPO (how much data we can afford to lose) and RTO (how long recovery may take) are all "TBD". The "next quarter" timeline also conflicts with the estimate's own 2 engineers x 2 quarters.

A smaller, cheaper option fits the evidence better: deploy safety work now, plus a costed warm-standby disaster-recovery (DR) plan in a second region with explicit RPO/RTO. Active-active would be reconsidered only if the conditions listed under "When active-active would be justified" are met.

---

## Evaluation criteria

| # | Criterion | Why it matters |
|---|---|---|
| C1 | Is the stated target correct and does the contract require it? | The project's justification depends on it |
| C2 | Does it address the observed causes of downtime? | Money should go to the largest risk |
| C3 | Financial exposure vs. cost | SLA credits and customer retention vs. about $0.5M+/yr |
| C4 | Delivery and technical risk | Multi-region writes to a ledger are hard; the estimate is incomplete |
| C5 | Cheaper alternatives | The opportunity cost of the same engineers and money |
| C6 | Tail risk | Rare region outages are severe, and the record isn't long enough to show how rare |

---

## Detailed analysis

### C1: The target and the arithmetic

The contract (C.1) sets 99.95% availability per calendar month, measured over a 30-day month (43,200 minutes). Scheduled maintenance announced 72 hours in advance is excluded.

| Target | Allowed downtime / 30-day month | Allowed downtime / year |
|---|---|---|
| 99.9% | 43.2 min | ~8.8 h |
| **99.95% (contract)** | **21.6 min** | ~4.4 h |
| 99.99% (VP proposal) | **4.32 min** | ~52.6 min |

The "52 minutes a month" figure mixes up the yearly allowance with the monthly one. This matters more than it looks, because a monthly SLA leaves no room to average out a bad month. At 99.99% monthly, a single bad deploy lasting 5 minutes breaks the target.

A 99.99% internal goal can be a reasonable stretch. But it is not a contract requirement, and the fault-tolerance design alone won't get us there.

### C2: What actually caused downtime (last 12 months)

| Cause | Incidents | Minutes | Share | Would active-active have helped? |
|---|---|---|---|---|
| Bad deploys (config x2, schema migration, feature flag) | 4 | 92 | 80% | **Mostly no.** Deploys, config and flags normally reach both regions. It helps only if releases go one region at a time with traffic shifted away on failure, and that practice can be adopted without active-active. Schema migrations get *harder* with a multi-region-write ledger. |
| Certificate expiry | 1 | 11 | 10% | **No.** Certificates usually expire in all regions at once. |
| Third-party payment API | 1 | 9 | 8% | **No.** The dependency is outside our regions. |
| Single availability-zone (AZ) outage | 1 | 3 | 3% | Already handled by multi-AZ failover |
| Region-wide outage | 0 | 0 | 0% | This is what the project targets |
| **Total** | 7 | **115** | | |

Over the year, 115 minutes of downtime is about **99.978%** (115 / 525,600). Two months missed the 21.6-minute monthly target:

- **Jan 2026:** 38 minutes, about 99.912%
- **Aug 2026:** 22 minutes, about 99.949%. This missed by 0.4 minutes.

Both misses were bad deploys. With better deploy safety, both would very likely have stayed within budget. For example, halving the January migration impact gives 19 minutes.

**Theory vs. reality:** Two independent regions at 99.95% each would combine to about 99.99998%. But every incident in the log came from failures shared across regions (releases, certificates, external dependencies), and those are what limit real availability. Duplicating infrastructure doesn't remove failures shared across regions. Active-active also adds new shared failure modes of its own: global traffic routing and DNS, cross-region replication, split-brain (both regions accepting conflicting writes), and failover automation.

### C3: Money, SLA credits vs. project cost

**How credits work (C.2):** we owe 10% of monthly fees for each *full* 0.1% below 99.95%.

- The first credit (10%) applies only at 99.85% or below, which is **64.8 or more minutes** in a month.
- The credit reaches 20% at 108 or more minutes and 30% at 151.2 or more minutes.
- **No credits were owed in the last 12 months.** The worst month (38 minutes) was 0.038% below target, well short of a full 0.1%.

**Region-outage scenarios (unmitigated, full outage):**

| Outage length in a month | Availability | Full 0.1% steps below 99.95% | Credit |
|---|---|---|---|
| 1 h (60 min) | 99.861% | 0 | 0% |
| 3 h (180 min) | 99.583% | 3 | 30% |
| 6 h (360 min) | 99.167% | 7 | 70% |
| 14.5 h (870 min, the length of AWS's Oct 2025 us-east-1 event) | 97.986% | 19 | **190%** |

The quoted clause shows **no credit cap**. Read literally, a long regional event could cost more than one month's fees. Legal should confirm whether the full contract has a cap, a termination right for chronic breach, or exclusions (for example force majeure or third-party services).

**Project cost:**

- Infrastructure: $41k x 12 = **$492k/yr**, ongoing.
- Engineering: 2 engineers x 2 quarters, about 1 engineer-year. At an assumed $200–300k loaded cost, that is $0.2–0.3M one-time.
- Probably missing from the estimate: the multi-region-write ledger database (licensing or managed-service premium), cross-region data transfer, and permanent extra operational and on-call load.
- Realistic first year: about **$0.7–0.8M+**. After that: about $0.5M+/yr.

**Break-even on credits alone.** Let F be monthly fees, p the yearly chance of a significant regional outage affecting us, and c the credit fraction.

- Assume p = 0.2 (one every 5 years) and c = 30–100%.
- Expected credits are then about 0.06F–0.2F per year.
- Matching $500k/yr requires **F of about $2.5M–8M per month**.
- Unless this customer pays millions per month, credits alone don't justify the project.

**The real stake is retention and reputation.** Losing the biggest customer, or failing a renewal, after a multi-hour regional outage could be worth far more than credits. This is the strongest argument *for* investing in regional resilience. But that argument supports a defined RTO, not necessarily active-active. A warm standby that recovers in 30–60 minutes would cut a 14.5-hour event to the 0–10% credit range for much less money.

### C4: Delivery and technical risk

- **The ledger database is unresolved.** Multi-region *writes* to a financial ledger force a choice. One option is synchronous consensus across regions, which adds cross-region latency to every write. The other is asynchronous or multi-master replication, which risks conflicts, double-posting and reconciliation work. Product and finance need to define the consistency model and RPO first. Without that the estimate isn't usable, and the $41k could change a lot.
- **The schedule doesn't add up.** The estimate says 2 quarters of engineering, so "next quarter" is optimistic.
- **The project could cause outages.** The dominant cause of downtime today is change risk. A large migration of the core data layer is itself a high-risk change, and it would compete for the same engineers who would fix deploy safety.

### C5: Alternatives, ranked by expected value per dollar

1. **Deploy safety**, targeting 80% of observed minutes:
   - progressive or canary delivery with automated rollback on SLO burn
   - config validation and staged config rollout
   - feature-flag guardrails and kill switches
   - expand/contract (backward-compatible) schema migrations
   - deploy freezes near month-end if the SLA budget is nearly used
2. **Certificate automation:** ACME or managed certificates, expiry alerting at 30/14/7 days, and synthetic TLS checks.
3. **Payment-API resilience:** circuit breakers, queue-and-retry for non-interactive payments, a secondary payment provider if the business allows it, and a check of whether third-party outages are excluded from the SLA.
4. **Regional DR, warm standby or pilot light:**
   - cross-region backups and replication of the ledger with a defined RPO
   - infrastructure-as-code to rebuild in the second region
   - a target RTO (for example 30–60 minutes)
   - regular failover game days
   - This typically costs a fraction of active-active and covers the tail risk well enough for a 99.95% monthly SLA.
5. **SLO and error-budget practice:** track a 21.6-minute monthly budget internally, alert on budget burn, and set an internal target slightly stricter than the contract (for example 99.97%).

### C6: Tail risk and the counterarguments

- **"Zero region outages in 12 months proves little."** True. One year is a small sample, and large regional events do happen; AWS us-east-1 had a roughly 14.5-hour event in Oct 2025 ([AWS post-event summary](https://aws.amazon.com/id/message/101925/)). That justifies *some* regional resilience. Warm-standby DR is the proportionate answer, and active-active is the maximal one.
- **"The biggest customer may demand it, or the next big deal may need 99.99%."** If sales or renewal needs show this, it becomes a revenue decision. Get it in writing (RFP requirements, renewal terms) before spending $0.5M+/yr.
- **"Active-active also enables region-by-region releases."** Partly true. But region-by-region (or cell-based) release can be built on a cheaper standby setup, or within one region using cells.
- **"Doing it later is harder."** Some truth for the data layer. Defining the ledger's consistency model and RPO now (a cheap design exercise) protects the option without committing infrastructure spend.

---

## Strengths and weaknesses of the proposal

**Strengths**
- It addresses a real, high-severity tail risk.
- It positions us for stricter future SLAs.
- It can support region-by-region rollouts.

**Weaknesses**
- The core arithmetic is wrong by 12x.
- It targets a cause with no recorded minutes while ignoring the cause of 80% of minutes.
- The cost is incomplete: the ledger is TBD, and data transfer and ops cost are missing.
- The timeline conflicts with the estimate.
- It adds complexity and new shared failure modes.
- It diverts engineers from the fixes with the highest payoff.

## Edge cases and failure modes

- **Measurement mismatch:** "customer-facing minutes" may not equal SLA-measured unavailability. Partial degradations, per-feature outages and measurement method (who measures, from where) could push SLA minutes up or down.
- **Third-party exclusion:** whether payment-API downtime counts against the SLA depends on contract language not provided.
- **Split-brain or ledger divergence** in active-active can turn an availability incident into a data-integrity incident. For a ledger, that is worse than downtime.
- **Failover that itself fails** (DNS caching, health-check flapping) can make regional events *longer* if failover isn't regularly tested.
- **Uncapped credits:** if the full contract really has no cap, one long event could cost more than a month's fees. That is worth a contract amendment (a cap) whatever happens with this project.

## Remaining uncertainty

- Monthly fees from Halvorsen Logistics, and its share of revenue. These are needed for the break-even and retention analysis.
- The full contract: credit cap, exclusions, termination for chronic breach, renewal date.
- The cloud provider and regions, and their regional incident history.
- The cost of warm-standby DR, which I haven't estimated.
- Loaded engineer cost, which I assumed.
- How SLA availability is measured.

## When active-active would be justified

Revisit the decision if any of these hold:
- the customer or a pipeline deal contractually requires 99.99% or a near-zero RTO;
- the modeled retention loss from a multi-hour regional outage exceeds the yearly cost;
- the ledger consistency model and RPO/RTO are defined and the estimate is rebuilt to include them.

## Recommended actions

1. Correct the target in internal communication: 99.95% monthly, which is 21.6 minutes.
2. Fund deploy safety and certificate automation now.
3. Scope and cost a warm-standby DR plan with an explicit RTO/RPO, and run a failover drill.
4. Have legal review the credit cap and exclusions.
5. Have product and finance define the ledger's consistency requirements.
6. Re-decide on active-active in 1–2 quarters with those inputs.

## Sources

- Run directory documents: `/home/user/flt-sudo/evaluator-v3/runs/r20261111T025709-eab8e481/sources/contract-sla-clause.md`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T025709-eab8e481/sources/incident-log-12m.csv`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T025709-eab8e481/sources/multi-region-estimate.md`
- [AWS post-event summary, Oct 2025 us-east-1](https://aws.amazon.com/id/message/101925/): 11:48 PM PDT Oct 19 to 2:20 PM PDT Oct 20, about 14.5 h
- [InfoQ on the AWS DynamoDB outage postmortem](https://www.infoq.com/news/2025/11/aws-dynamodb-outage-postmortem)
- [ThousandEyes outage analysis](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025)

## Self-assessed quality score: 84/100

The arithmetic, the contract reading and the cause attribution can be checked directly against the documents, and I'm confident in them. I lose points because the financial conclusion depends on unknown contract fees, an assumed engineer cost and an assumed regional outage frequency. I also didn't estimate the cost of the recommended warm-standby DR.
