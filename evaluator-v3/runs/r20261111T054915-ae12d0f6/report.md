# Evidence Synthesis: Four-Day (32-Hour) Week for a 300-Person Customer Support Organisation

## 1. Verdict

**The COO's claim that "the research is clear: a four-day week raises productivity by 40%" is not supported by the evidence you collected.** The 40% figure comes from the weakest source in the pack: a single software company's blog reporting self-rated productivity, with no comparison group. The strongest source is the Nordvik et al. cluster-randomised trial. It shows a different picture:

- **Productivity:** total output was roughly unchanged (-2%, 95% CI -7% to +3%) on 20% fewer hours. That implies output per hour rose by about 16-29%. It did not show output rising 40%.
- **Wellbeing:** improved meaningfully (+0.4 SD on a validated burnout scale).
- **Retention:** improved materially (annualised voluntary attrition 9.1% vs 13.0%).
- **Customer service specifically:** first-response time got **11% slower** (CI +4% to +18%) unless teams used staggered schedules.

**Recommendation:** do not roll out to all 300 people in Q2 on the strength of the 40% claim. Use Q2 to **start a structured, staggered-schedule pilot** (randomised or stepped-wedge) with service-level guardrails and a pre-agreed decision rule. The case for a four-day week in support is plausible on wellbeing and retention grounds. It is unproven on service levels, and service is where a support org carries the most risk.

## 2. Evaluation Criteria

1. **Study design:** randomisation, control group, sample size, clustering, duration.
2. **Outcome measurement:** objective vs self-reported measures; stated intention vs observed behaviour.
3. **Independence and incentives:** who produced the source and why.
4. **Relevance to your context:** customer support, a 32-hour four-day model, about 300 staff, and coverage-bound work.
5. **Precision:** confidence intervals and effect sizes vs bare point claims.
6. **Verifiability:** published or peer-reviewed vs grey literature.

## 3. Source-by-Source Assessment

| Source | Design | What it measures | Strength | Relevance to support |
|---|---|---|---|---|
| **A. Kestrel blog (2025)** | Single firm, n=60, before/after, no control | Self-rated productivity +40% | **Very weak** | Low (engineering/design staff) |
| **B. Nordvik, Achebe & Lund (2026)** | Cluster RCT, 112 teams, 9 firms, 9 months | Objective output, FRT, validated burnout scale, attrition | **Strongest in the pack, with caveats** | **High** (31 customer-service teams) |
| **C. Workforce Pulse (2025)** | Vendor opinion survey, n=4,000 | Stated belief that people *would* be more productive | **Not evidence of effect** | Low |
| **D. Varmland municipal trial (2024)** | Single public employer, observational | Management view that service was "maintained"; overtime +6% | **Weak** | Moderate (service setting, but a 36-hour model, not four days) |

### A. Kestrel Software blog: the source of the "40%"

- **Mechanism of bias.** Employees who have just been given a valued benefit are asked whether they are more productive. They have every reason to say yes: gratitude, a wish to keep the benefit, expectancy effects, and the Hawthorne effect. A self-rating is not a measure of output.
- **No counterfactual.** Any change over the same period (new tooling, seasonality, a backlog clearing) is attributed to the four-day week.
- **Publication incentive.** A company blog is employer-brand and recruiting content. Firms whose trial went badly rarely write it up, so this kind of source is subject to survivorship and publication bias.
- **Transferability.** The staff are 60 engineers and designers. Their work is asynchronous and output-based, and nobody has to staff a queue. That is almost the opposite of a support operation.
- **Possible confusion.** The "40%" also circulates from Microsoft Japan's 2019 "Work-Life Choice Challenge". That was a one-month, company-run experiment in which *sales per employee* rose about 40% against the prior year. If the COO has that figure in mind, it is equally weak: one month, no control, a revenue metric, and a different context.

**Bottom line:** this source cannot support any productivity claim, let alone a 40% one.

### B. Nordvik, Achebe & Lund (2026): the most informative source

**Why it is strong:**
- Randomisation at team level removes most selection and confounding problems.
- Its outcomes are objective (tickets resolved, billable output) and it uses a validated burnout instrument.
- It reports confidence intervals.
- It includes a customer-service subgroup of 31 teams.
- Nine months is long enough to get past the first novelty period.

**What it actually shows:**
- *Total output* fell slightly, and the change is statistically indistinguishable from zero (-2%, CI -7% to +3%). The study does **not** show output rising by 40%, or rising at all.
- *Output per hour* rose, because the same output came from 80% of the hours. Section 6 gives the arithmetic: about +22.5%, with a range of about +16% to +29%. This is the honest version of the "productivity gain" story: people work more intensively, or with less waste, in fewer hours.
- *Customer-service first-response time* got 11% slower (CI +4% to +18%). The interval excludes zero, so this is a real degradation in this trial. It went away with staggered schedules.
- *Wellbeing* improved by 0.4 SD, a moderate effect by conventional benchmarks.
- *Voluntary attrition* fell from 13.0% to 9.1% annualised, about a 30% relative reduction.

**Caveats you should raise at the offsite:**
- **Unverified status.** It is a working paper and not peer-reviewed. I could not find it through web search, so its existence, exact methods and full results should be checked against the original document before anyone cites it. The figures here come only from your summary.
- **Subgroup fragility.** The customer-service finding rests on 31 teams. The "unless staggered schedules" result is a sub-subgroup. If it was not pre-specified, it may be a post-hoc finding and could be noise. The summary does not say how many teams staggered, or whether staggering was itself randomised.
- **Clustering and contamination.** With 9 firms and teams randomised within them, control teams may have absorbed treatment teams' overflow work or coverage gaps. That would make the four-day teams look better than they would in a whole-org rollout. You need to check whether the standard errors account for clustering at firm level.
- **Self-selected firms.** Firms that volunteer for a four-day-week trial are likely more enthusiastic and better managed than average. That limits external validity.
- **Burnout scores are unblinded.** The scale is validated, but people knew whether they had the benefit, so expectancy effects can still inflate wellbeing scores.
- **Attrition uncertainty.** No confidence interval is given for attrition. With about 112 teams over 9 months, the absolute number of leavers may be modest, and annualising a 9-month figure adds further uncertainty.
- **Missing outcomes for support.** The summary reports nothing on CSAT, resolution time, reopen rates, SLA attainment, quality scores, overtime or cost. "Tickets resolved" can hold steady while quality drops, for example through faster, shallower closures.

### C. Workforce Pulse survey (HR software vendor)

- It measures **stated intention**, not effect: "71% *would* be more productive". People reliably overestimate the benefits of perks they want.
- It is produced by a vendor with a commercial interest in workforce-flexibility themes. The sampling frame, response rate and question wording are unknown.
- **What it is useful for:** showing that demand for the policy is high. That matters for recruitment and employer brand, and for managing the disappointment if a pilot is rolled back. It says nothing about whether the policy works.

### D. Varmland municipal working-time trial (2024)

- It cut hours by 10% (40 to 36), not 20%, and did not move to a four-day pattern. **It is not evidence about the model the COO is proposing.**
- "Service levels maintained" is a management judgement. No objective metric is reported.
- **Overtime costs rose 6%.** This is the most decision-relevant detail. It suggests service was maintained partly by **buying back hours**, so part of the cost moved into overtime. A 20% cut in a support org would put far more pressure on the same mechanism.
- Read together with Nordvik, it points the same way: service-delivery settings need hidden capacity, such as overtime, backfill or rescheduling, to hold service levels when hours fall.

## 4. What the Evidence Shows, by Outcome

| Outcome | Best estimate | Confidence | Main basis |
|---|---|---|---|
| **Total output** | About flat (-2%, CI -7% to +3%) | Moderate | B |
| **Output per hour** | About +16% to +29% | Moderate (depends on B's design) | B (derived) |
| **"+40% productivity"** | **Not supported** | High confidence the claim is overstated | A is self-report; B contradicts it |
| **Wellbeing / burnout** | Improves, moderate effect (+0.4 SD) | Moderate | B; consistent with UK 2022 pilot self-reports |
| **Voluntary attrition** | Likely falls substantially (about 30% relative) | Moderate-low (no CI) | B; consistent with UK pilot employer reports |
| **Support service levels (FRT)** | **Worsens about 11%** without staggering; about neutral with staggering | Low-moderate (subgroup) | B; D hints at overtime costs |
| **Cost** | Risk of overtime or backfill costs | Low (thin data) | D (+6% overtime at a 10% cut) |

**External context.** I did not verify primary documents for these; they come from secondary reporting.
- The 2022 UK pilot ran in 61 companies with about 2,900 employees. It reported 71% of employees with less burnout, a 57% fall in turnover, roughly stable revenue, and 56 of 61 firms continuing. However, it had no randomised control, firms self-selected, and the burnout figures were self-reported.
- Iceland's 2015-2019 public-sector trials (35-36 hours) reported productivity held or improved in most workplaces.

This literature broadly matches the Nordvik pattern: wellbeing and retention gains, output roughly maintained. It does **not** show large gains in total output.

## 5. Why Support Is Different (Mechanisms)

1. **Support is coverage-bound, not just output-bound.** Knowledge workers can compress the same output into fewer hours. Support agents serve a queue of customers who arrive on *their* schedule. Higher output per hour helps only if handle time actually falls. It does nothing for coverage of hours when nobody is on shift.
2. **Queueing is non-linear.** In Erlang-type staffing, a small fall in staffed agents at a given interval can raise wait times sharply when occupancy is already high. That is consistent with Nordvik's 11% FRT slowdown, and it means the effect could be much worse on peak days such as Mondays or the days after a release.
3. **"Everyone off Friday" is the failure mode.** If the whole org takes the same day off, coverage collapses on that day. Staggering (for example Mon-Thu and Tue-Fri crews, or rotating days off) restores coverage. Nordvik's subgroup suggests this neutralises the FRT penalty.
4. **Where intensity gains come from in support.** The main sources are fewer meetings, less idle time and more focused handling. But agents in support often already run at high occupancy, so there is less slack to remove than in engineering. Pushing intensity further risks quality and, in the end, the very burnout the policy is meant to reduce.
5. **Hidden capacity transfer.** Varmland's overtime increase shows how gaps get filled quietly. If agents work "voluntary" overtime or log in on their day off, the wellbeing and retention benefits shrink.

## 6. Quantitative Analysis

**Output per hour (from Nordvik):** hours ratio = 32/40 = 0.80.
- Point estimate: 0.98 / 0.80 = **1.225, i.e. +22.5% per hour**
- Lower bound: 0.93 / 0.80 = 1.1625, i.e. +16%
- Upper bound: 1.03 / 0.80 = 1.2875, i.e. +29%

Even the most generous per-hour reading falls short of 40%. And per-hour productivity is not what the COO's phrasing implies, which is more total output.

**Capacity gap for 300 agents (if per-hour throughput did *not* improve):**
- Staffed hours fall from 12,000 to 9,600 per week, a cut of 2,400 hours. That is the equivalent of 60 forty-hour FTE, or **75 thirty-two-hour agents (+25% headcount)** to restore the same staffed hours.
- If per-hour throughput rises by about 22.5% as in Nordvik, ticket *volume* capacity is roughly preserved. But *interval coverage* (agents on shift at 9am on a Friday) still depends entirely on scheduling.

**Attrition (illustrative, applying Nordvik rates to 300 staff):**
- At 13.0%, about 39 leavers per year; at 9.1%, about 27. That is about **12 fewer leavers per year**.
- *Assumption, not from the sources:* if a fully loaded cost to replace a support agent (recruiting, training, ramp-up) is $8k-$20k, the saving is roughly **$95k-$235k per year**. You should replace this with your own cost-per-hire and ramp-time data.
- Compare that with overtime exposure. *Also an assumption:* if Varmland's 6% overtime increase at a 10% cut scaled linearly to about 12% at a 20% cut, the cost could rival or exceed the attrition saving, depending on your payroll and overtime premium. Your org's existing support attrition rate matters a great deal here. Support attrition is often well above 13%, which would make the retention upside larger.

**Wellbeing:** 0.4 SD is a moderate effect. On a typical burnout scale, it would move a median employee to roughly the 34th percentile of the control group's burnout distribution. That assumes normality and comes from the standard normal CDF at -0.4 ≈ 0.34.

## 7. Strengths and Weaknesses of the Overall Evidence Base

**Strengths**
- One randomised trial with objective outcomes and a support-specific subgroup.
- Wellbeing and retention results point the same way across sources and the wider literature.

**Weaknesses**
- Only one rigorous source, and it is an unpublished working paper I could not verify.
- The support-specific evidence rests on small subgroups.
- There is no evidence on CSAT, quality or cost in support, and no long-run data beyond 9 months.
- Three of the four sources are weak or irrelevant to the causal question.
- Publication and selection bias run through the whole four-day-week literature: enthusiastic firms trial it, and successful trials get written up.

## 8. Alternatives and Comparisons

| Option | Pros | Cons |
|---|---|---|
| **Full rollout, 32h / 4 days, same day off for everyone** | Simple; strong signal to staff | Coverage collapse on the day off; highest FRT risk; hard to reverse |
| **32h with staggered four-day rosters** | Keeps coverage; supported by Nordvik's subgroup | WFM complexity; harder team cohesion and handovers |
| **9-day fortnight or 36h (Varmland-like)** | Smaller capacity hit; lower risk | Smaller wellbeing and retention gain; Varmland still saw overtime rise |
| **Randomised or stepped-wedge pilot (recommended)** | Produces your own causal evidence; reversible; politically defensible | Takes 6-9 months; temporary unfairness between teams |
| **Other wellbeing levers (lower occupancy targets, better tooling, deflection or self-service, schedule flexibility)** | Addresses burnout without a coverage cut | Less attractive for recruitment; may not match the retention effect |

## 9. Recommended Plan for a Support Org

1. **Reframe the goal at the offsite.** Move from "+40% productivity" to "maintain service levels and output while improving wellbeing and retention". That is what the best evidence supports, and it is a perfectly good business case if it holds.
2. **Run WFM modelling first.** Use your actual arrival patterns by interval and channel. Model staggered four-day rosters (Mon-Thu / Tue-Fri, or rotating days off) against SLA targets, and quantify any backfill needed.
3. **Run a pilot from Q2, not a rollout.** Choose a stepped-wedge or randomised design across teams, for example 6-10 teams first, then expanding in waves. Run it for at least 6 months, and better 9.
4. **Pre-register the metrics.**
   - *Service:* FRT, SLA attainment, resolution time, reopen rate, CSAT, QA scores, backlog.
   - *Capacity and cost:* tickets resolved per agent, AHT, occupancy, overtime hours and cost, contractor or backfill spend.
   - *People:* validated burnout scale, sickness absence, voluntary attrition, and off-day logins (a sign of hidden work).
5. **Set guardrails and a decision rule.** For example, pause or adjust if FRT worsens by more than X% or SLA attainment drops below Y% for more than Z weeks. Agree in advance what result counts as "success" for scaling.
6. **Handle the operational and legal details.**
   - Define whether "32h for 100% pay" applies to part-timers, shift-premium staff and on-call rotations.
   - Check working-time law and contract terms in each jurisdiction.
   - Plan holiday and bank-holiday accrual, since a four-day pattern changes how they are calculated.
   - Design handovers between staggered crews.
7. **Verify the Nordvik paper.** Get the full working paper and check its clustering adjustments, whether the customer-service and staggering analyses were pre-specified, and the attrition confidence interval.
8. **Communicate carefully.** Source C shows staff want this. Present it explicitly as a trial with criteria, so that a rollback or modification does not itself damage retention.

## 10. Edge Cases and Failure Modes

- **Peak periods** (product launches, outages, seasonal spikes) are where a coverage deficit matters most. You need an agreed surge protocol, for example temporarily suspending the fifth day off with time given back later.
- **Hidden intensification.** Output holds, but agents feel *more* pressured. That would show up as burnout scores worsening after the initial novelty and later attrition.
- **Quality erosion.** Ticket counts stay steady because of faster, shallower closures, which shows up as higher reopen rates and lower CSAT.
- **Tiered support.** Tier 2/3 specialists are scarce. If the one SME for a product is off, escalations stall.
- **Global or 24/7 coverage.** Shift patterns may already be compressed, which leaves little room for further reduction.
- **Equity between teams.** Pilot vs control teams, and support vs other departments, can cause resentment. Wave timing should be transparent.
- **Novelty decay.** Wellbeing gains in the first 3-6 months may fade. Nine months of data is still short.

## 11. Counterarguments

- **"Larger trials (UK 2022, Iceland) show it works, so why pilot?"** Those trials were not randomised, firms self-selected, outcomes were largely self-reported, and few involved queue-based support. They also show output *maintained*, not +40%. They support trying it, not skipping the evaluation.
- **"The retention saving pays for itself."** Possibly, especially if your current attrition is high. But it has to be set against coverage and overtime costs, and the Nordvik attrition estimate has no reported confidence interval.
- **"A pilot delays a benefit staff want."** A stepped-wedge design gets everyone onto the policy within a few quarters while still producing evidence. A failed big-bang rollout that has to be reversed would be worse for morale.
- **"The FRT finding is a small subgroup."** True. That cuts both ways: it is uncertain, but it is also the only support-specific causal evidence available, and it points to harm without mitigation.

## 12. Remaining Uncertainty

- Whether the Nordvik paper exists as described and holds up methodologically. I could not find it online.
- Effects on CSAT, quality and cost in support. There is no data on these in the pack.
- Effects beyond 9 months.
- How your own volume patterns, channel mix (chat, phone, email), occupancy and attrition baseline change the arithmetic.
- Whether your staff's per-hour intensity gains would match Nordvik's, given that support occupancy is often already high.

## Sources

- Provided documents in /home/user/flt-sudo/evaluator-v3/runs/r20261111T054915-ae12d0f6/sources/: source-A-kestrel-blog.md, source-B-nordvik-2026.md, source-C-workforce-pulse.md, source-D-varmland-trial.md
- External context, from search results only (secondary reporting; page fetching was unavailable):
  - [Soon.works: What did the four-day week trials actually measure?](https://soon.works/research/what-the-four-day-week-trials-measured)
  - [Nordic Labour Journal: Reduced hours, same productivity levels](https://www.nordiclabourjournal.org/reduced-hours-same-productivity-levels-and-a-more-sustainable-working-life/)
  - [Mental Health Foundation: The impact of a shorter working week](https://www.mentalhealth.org.uk/our-work/research/32-hour-week)
  - [Forbes Australia: UK four-day week trial results](https://www.forbes.com.au/news/innovation/are-four-day-workweeks-the-future-the-results-of-this-trial-are-telling/)
  - [Fox: 4-day workweek boosts happiness while preserving productivity (UK trial)](https://www.fox35orlando.com/news/4-day-workweek-boosts-employee-happiness-preserving-productivity-uk-trial)
  - [Gulf News: Why the world is embracing 4-day weeks](https://gulfnews.com/special-reports/why-the-world-is-embracing-4-day-weeks-what-studies-show-1.1733491851882)
  - Microsoft Japan 2019 figure, as summarised in search results.

## Self-Assessed Quality Score: 80/100

**Strengths:** every source is assessed on its design; the per-hour and capacity arithmetic is worked out explicitly; the recommendations are specific to support. **Limitations:**
- The Nordvik paper could not be independently verified.
- External figures come from secondary search summaries, without access to primary documents.
- The replacement-cost and overtime-scaling figures are labelled assumptions, not organisation data.
- This was a single pass with no independent verification step.
