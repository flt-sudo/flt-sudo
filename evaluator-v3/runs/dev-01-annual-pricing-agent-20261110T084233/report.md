# Evaluation: Launching an annual billing plan at $490 per seat per year alongside the existing $49 per seat per month plan for a B2B SaaS tool

**Decision objective:** Decide whether to launch an annual plan at $490 per seat per year, paid upfront. If not at that price, decide what price or discount and what conditions to use. The test is whether the plan raises net revenue and customer lifetime value once three things are weighed: the cash and retention gains, the revenue given up by moving monthly customers who would have stayed anyway to a lower effective price, and how reliable the evidence is that annual billing actually cuts churn for this customer base.

## Verdict

Bottom line: do not launch $490/year broadly now. Run it as a controlled test instead. The evidence cannot show whether the plan raises net revenue and LTV, because that depends on who converts and on the month-12 renewal rate, and only the company's own data can supply those (E14, E9, E4). Next steps. (1) Within weeks, pull 12-month retention for tenured monthly customers and churn by tenure band and seat count (E14). Confirm how the pilot's 91% was defined and how sales picked the 40 accounts (E4). (2) Offer $490, framed as '2 months free', to a randomized subset of accounts with a holdout. Use no-refund cancellation at term end, prorated mid-term seat adds and no refunds on mid-term seat reductions (E18, E19). (3) At month 6, when the enrollment window in the memo closes (E2), read uptake and converter mix. Estimate the converters' would-have-stayed share from the step-(1) historical retention of accounts with the same tenure band and seat count, checked against the holdout's first six months. If that predicted share exceeds about 64-66%, the year-one break-even (K33, K48), do not widen the offer beyond the test cohort. This is an early warning only; the scale decision is made in step (4). (4) At about month 19, after every converter has passed its first renewal, compare the offered and holdout arms as randomized (intention-to-treat): cumulative revenue per account and the share still paying. Scale up only if the offered arm is ahead, with the confidence interval excluding a loss. Randomization keeps this comparison free of selection. If the base is too small to power it (about 9,700 accounts per arm under illustrative assumptions, K52), use the fallback: converters' month-12 renewal, measured on at least about 250 converted accounts, must beat 1 - 10c, with c taken from holdout accounts matched to the converters on tenure band and seat count, not from the holdout's blended churn. Blended churn gives about 68%, but a tenured pool at 1% or 0.78% churn needs about 90% or 92% (K20, K22, K23, K50). Why: the memo's premise is wrong. $490 is a 16.7% discount, not 25%, and a true 25% discount would be $441 (E1, E5; K1, K2). 16.7% is a common market level (E6, E7). In year one, converting an average-churn seat is roughly neutral (-$4.80 per seat, K18), and a converter who would have stayed costs $98 per seat (K5). Across 10-30% conversion the year-one effect ranges from -$29.40 to about +$13.87 per base seat. The positive end is likely overstated for the tenured converter pool the evidence points to (K16, K41, K49). Over a lifetime the plan pays off only if renewal exceeds 1 - 10c, where c is the converter's counterfactual monthly churn: about 68% at average churn and 90% at 1% churn (K20, K22). The pilot's 91% cannot settle this. Its accounts were hand-picked and tenured, its definition is unclear, and with n=40 its 95% interval is about 78-97% (E4; K43, K44).

**Confidence:** low  ·  **Certified by quality gates:** NO

## Corrected assumptions

- **Assumption:** $490 per year is a 25% discount versus the monthly plan.
  **Correction:** It is a 16.7% discount ($490/$588), exactly two months free. A 25% discount would be $441. [E1, E5]
- **Assumption:** The pilot's 91% 12-month retention shows annual billing reduces churn.
  **Correction:** The pilot accounts were customers with more than a year of tenure, hand-picked by sales, with no control group and n=40, so the result cannot be attributed to annual billing. How retention was defined (in-term vs month-12 renewal) is unclear. If it was in-term, it largely reflects prepaid lock-in. If it was renewal, it is favorable but still confounded by selection and tenure. [E4, E10, E11, E14, E17]
- **Assumption:** 30% of monthly customers will convert within 6 months, per benchmarks.
  **Correction:** The figure is unsourced and no verifiable benchmark exists. Vendor claims range from about 15% to 45% depending on which plan is the default. [E2, E9]
- **Assumption:** A 25% discount is the 'sweet spot' for annual conversion.
  **Correction:** The most common annual discount in market data is 16.7%, and the typical band is 15-20%. Lower-priced plans reportedly discount more, but deeper discounts also tend to attract weaker-commitment buyers. [E6, E7, E11]
- **Assumption:** Annual billing will substantially reduce churn across the base.
  **Correction:** Churn likely concentrates in early-tenure accounts that may be less likely to prepay, so the plan may mainly discount already-loyal accounts. This company's tenure breakdown is unknown. [E13, E14, E3]

## Criteria

### C1 Correctness of the discount and effective price (weight 15)

The memo misstates the discount. $49 x 12 = $588, and $490/$588 = 83.3%, so the discount is 16.7% (exactly two months free), not 25% (E1, E5; K1). A real 25% discount would be $441 (K2). The memo's '25% is the sweet spot' rationale therefore does not describe the proposed price. Recurly's benchmark data reports 16.7% as the most common annual discount, and it sits inside the typical 15-20% band (E6, E7). That support is a single unfetched, undated search snippet plus vendor marketing. E6 also notes that lower-priced plans tend to carry larger annual discounts, which for a $49 tool partly cuts against calling $490 'well placed'. [E1, E5, E6, E7, E8]

*Mechanisms:* The effective annual price drives every revenue comparison. The gap between the true and stated discount changes which benchmarks apply. It also shows the memo's numbers were not checked, which weakens trust in its other unsourced figures (the 30% conversion, the 'benchmarks').

*Strengths:*
- The price ($490) matches a common market convention, 'two months free' (E6, E7).
- It is easy to market as '2 months free'. One unverified claim says this framing outperforms an equivalent percentage discount (E8).

*Weaknesses:*
- The memo's stated 25% discount is arithmetically wrong (E5).
- The '25% sweet spot' rationale cites no source (E1), and some vendors that do use 20-25% are enterprise products that may not compare (E8).
- The positioning evidence is snippet-level, and E6 notes that lower-priced plans tend to discount more, so market data does not rule out a somewhat deeper discount for a $49 tool (E6, E7).

### C2 Causal evidence that annual billing reduces churn here (weight 25)

There is no reliable causal evidence that annual billing reduces churn for this customer base. Sales hand-picked the 40 pilot accounts (91% '12-month logo retention') from customers with more than a year of tenure (E4). How that retention was defined is unclear (E4). If it is in-term retention, it is odd. The packet's own note on E4 says churn inside a prepaid term implies refunds or non-payment. Annual-plan churn is also reported to fall mostly at renewal rather than mid-term (E17), though that comes from a single mobile-app vendor snippet. On that reading it says nothing about renewal. If it is the month-12 renewal rate, it is materially favorable: 91% is well above the roughly 68% renewal rate at which an average-churn converter is LTV-neutral (K20). Even then it beats monthly LTV for tenured accounts only if their counterfactual monthly churn exceeds about 0.9% (K24, K25), and this company's tenured monthly retention is unknown (E14). A tenure-matched comparison would still not isolate the effect, because sales picked these accounts on criteria beyond tenure that are not recorded (E4, E11). As a monthly-equivalent rate, 91% corresponds to about 0.78% churn (K13). The sample is small: about 3.6 churned accounts (K14), with a Wilson 95% interval of about 78% to 97% (K43, K44). The pilot's 91% versus the base's 67.7% (K3) resembles the observational gap Baremetrics reports (92% vs 68%) (E10). That resemblance fits either selection or a real effect and does not show how the gap splits between them. E11 attributes much of such gaps to self-selection, while one vendor matched-pair analysis claims a residual causal effect (E12). Neither covers B2B seat-based SaaS directly. [E4, E10, E11, E12, E13, E14, E17]

*Mechanisms:* Several mechanisms can raise measured annual retention. Three do so without annual billing changing customer behavior. (1) Selection: committed customers choose, or are picked for, annual plans (E11). In the pilot, sales picking adds a layer on top of tenure (E4). (2) Tenure: tenured accounts churn less regardless of billing (E13). (3) Mechanical lock-in: if retention is measured in-term, a prepaid account cannot churn voluntarily mid-term, and the real loss shows up at renewal (E17). Whether (3) applies to the pilot depends on its retention definition, which is unclear (E4). Two possibly causal mechanisms also exist. (a) Sunk-cost commitment and more time to adopt the product (E12). (b) Possibly fewer involuntary churn events: one charge a year instead of twelve removes eleven chances for a failed card payment. (b) is reasoning only. The packet has no evidence on payment-failure rates or on the share of the 3.2% churn that is involuntary, so it cannot be sized and should not be treated as established.

*Strengths:*
- Several observational sources agree on the direction: annual customers retain better (E10).
- One matched-pair study suggests some effect remains after controlling for observables (E12).
- Fewer card charges is a plausible non-selection mechanism, although the packet has no evidence on its size.
- If the pilot's 91% is a renewal rate, it exceeds the blended LTV break-even renewal rate (K20).

*Weaknesses:*
- The pilot was hand-picked by sales and tenure-selected, with no control group (E4, E14).
- The pilot is too small to estimate an effect precisely (K14, K43, K44).
- The pilot's retention definition (in-term vs month-12 renewal) is unclear, and the renewal rate is not reported separately (E4, E17).
- The selection-versus-treatment question is contested (E11 vs E12).
- The share of churn that is involuntary is unknown, and the packet has no payment-failure evidence, so that mechanism cannot be sized.

### C3 Net revenue and LTV impact including cannibalization (weight 25)

The net effect cannot be determined without the converter mix and the renewal rate, but it can be bounded. Year one: at blended 3.2% churn a monthly seat is expected to earn $494.79 (K4), so converting an average-churn seat to $490 is roughly neutral at -$4.80 (K18). Break-even is about 3.38% monthly churn (K10). Splitting converters into two types: a would-have-stayed converter forgoes $98 per seat (K5). A would-have-churned converter would have paid about $299.56 on average at the blended hazard, so prepaying $490 gains about $190.44 (K31, K32), provided no refund is given. Year one is positive only if fewer than about 66% of converters would have stayed (K33). Scenario grid, as year-one change per seat across the whole base, before fees. If all converters would have stayed: -$9.80 / -$19.60 / -$29.40 at 10% / 20% / 30% conversion (K34, K35, K16). If 90% would have stayed: -$6.92 / -$13.83 / -$20.75 (K36-K38). If 50% would have stayed: +$4.62 / +$9.24 / +$13.87 (K39-K41). If converters mirror the blended base: about -$1.44 at 30% (K42). Timing caveat: the grid treats every converter as converting at month 0. In the memo, conversion happens over 6 months (E2), so converters must first survive to the point of conversion, and they earn monthly prices until then. Survival to conversion shifts the mix toward would-have-stayed accounts, and part of each converter's revenue is unaffected by the switch, so the grid's per-base-seat figures are approximations, not forecasts. Caveat on the positive cells: they value would-have-churned converters at the blended 3.2% hazard. Converters are expected to be tenured and lower-churn, so those who would still have churned probably leave later and would have paid more. At an illustrative 1% hazard, a would-have-churned seat would have paid about $312.63, so the gain falls to about $177.37 (K46, K47). The break-even would-have-stayed share falls to about 64% (K48), and the 30%-conversion, 50%-stayed cell falls to about +$11.91 (K49). If tenured churn is back-loaded rather than constant, the gain shrinks further. It ranges from +$441 for a seat that would have left after one month, through -$49 for one that would have left after eleven, to -$98 for one that pays all twelve monthly payments and leaves at the 12-month boundary (K54, K53, K5). The positive cells are therefore upper-end values for the expected pool. Lifetime: monthly LTV per seat is 49/c, which is $1,531.25 at 3.2% and $4,900 at an illustrative 1% (K19, K21). Annual LTV is 490/(1-r). The plan is therefore LTV-neutral at renewal rate r = 1 - 10c: 68% for an average converter and 90% for a 1%-churn converter (K20, K22). For a converter churning at the pilot-implied 0.78%, it is 92.2% (K23). At a 91% renewal rate annual LTV is $5,444 (K26). 24-month view: a 3.2%-churn monthly seat earns $829.71, so the annual plan needs about 69.3% renewal to match it within 24 months (K27, K28). A 1%-churn seat earns $1,050.18, more than the $980 maximum an annual seat can pay in 24 months (K29, K30), so its payback lies beyond two years. Converters are plausibly lower-churn than average, since self-selection favors committed buyers (E11) and churn tends to concentrate early (E13). That is not established for this base, and the pilot shows which accounts sales picked, not which would self-select (E4). [E2, E3, E4, E11, E12, E13, E14, E16, E17, E19]

*Mechanisms:* In year one an annual converter pays a fixed $490 whatever they would otherwise have done. The plan's year-one value therefore depends only on the converter's counterfactual monthly revenue. Its lifetime value depends on whether annual renewal beats the converter's counterfactual monthly survival by enough to repay the 16.7% discount. The break-even renewal rate r = 1 - 10c follows directly from 490/(1-r) = 49/c. Cannibalization is worst when converters are self-selected loyal accounts (E11, E13). The same lower churn also shrinks the gain from the would-have-churned minority, because those accounts would have paid for more months before leaving (K47). The gain from would-have-churned converters relies on the prepaid cash being kept, so it depends on no-refund terms (E19).

*Strengths:*
- Converters who would otherwise have churned early add about $177-190 per seat in year one, depending on their hazard (K32, K47, E16).
- If annual billing causally lifts renewal above 1 - 10c, multi-year LTV rises (K20, K22, E12).
- The break-even renewal rates are computable from packet data and give the test a concrete fallback threshold once c is estimated for matched accounts (K20, K22).

*Weaknesses:*
- For low-churn converters, year one is negative (illustrative 1% churn: -$66.71 per seat, K12), and payback lies beyond 24 months (K29, K30).
- The grid's positive cells use blended-hazard churner revenue and are likely overstated for a tenured converter pool (K46-K49).
- The grid assumes every converter converts at month 0; with conversion spread over 6 months (E2), survival to conversion and pre-conversion monthly revenue change both the mix and the per-base-seat figures.
- The model applies 3.2% logo churn as if it were seat churn, and ignores seat expansion and contraction within 8-seat accounts (E3).
- The constant-hazard model is a simplification. Early-concentrated churn would make tenured converters lower-churn still (E16, E13).
- Comparisons are undiscounted and gross of fees. The fee saving (+$3.25 per seat, K17) and the time value of the upfront cash (at most about $18 per seat at an illustrative 8% cost of capital, K45, and less for an expected seat paying about 10.1 months, K4) are small next to the $98 discount.
- The converter mix and renewal rates are unknown (E14, E17).

### C4 Cash flow and payment-cost effects (weight 10)

The payment-cost benefit is real but small. For an 8-seat account, monthly fees come to about $140.02 a year versus $113.98 for one annual charge, a saving of about $26.04 per account per year (K7, K8, K9; E3, E15). That is roughly 3% of the $784 an 8-seat would-have-stayed account gives up (K6). The cash benefit is larger: $3,920 per 8-seat account arrives upfront rather than over 12 months. At an illustrative 8% annual cost of capital (an assumption, not packet data), the time value is at most about $18 per seat per year (K45). K45 assumes the monthly customer would have paid all 12 months; an expected monthly seat pays about 10.1 months ($494.79 / $49, K4), so the cash actually advanced, and its time value, are smaller. Either way it is well below the $98 discount. Under ASC 606, recognized revenue still accrues straight-line, so the P&L gains nothing from the timing (E20). [E3, E15, E20]

*Mechanisms:* The fixed $0.30 per-charge fee falls from 12 charges to 1. The 2.9% percentage fee scales with the amount and does not change. Prepayment improves working capital. It also removes eleven recurring card charges. Any resulting fall in involuntary churn is plausible but has no evidence in the packet; it is discussed under C2.

*Strengths:*
- Cash comes in earlier (E20).
- There are fewer charges, so the fixed per-charge fee is paid once rather than twelve times (E15).

*Weaknesses:*
- The fee saving (K9) and the illustrative time value (K45, an upper bound) are immaterial next to the discount given up (K5, K6).
- B2B annual deals often move to ACH or invoice, and international cards cost more, so actual fees could differ (E15).

### C5 Robustness of the conversion assumption and price positioning (weight 15)

The 30% conversion assumption is unsourced (E2), and no verifiable benchmark for monthly-to-annual conversion exists in the evidence (E9). The only vendor figures conflict: about 15% adoption when monthly is the default versus 35-45% when annual is the default (E9). Conversion scales both the benefit and the cannibalization. The grid shows that converter mix, not conversion rate, sets the sign: at 30% conversion the result ranges from -$29.40 to +$13.87 per base seat (K16, K41). A higher rate is therefore not automatically better. On price positioning, 16.7% is a common norm (E6, E7), but the evidence is snippet-level, and E6 notes that lower-priced plans tend to carry larger discounts. Deepening to 25% would raise the cost of every would-have-stayed converter to $147 per seat and could draw in less committed buyers who renew worse (E11). So $490 is a reasonable test price, but the evidence does not show it is optimal. [E1, E2, E6, E7, E8, E9, E11]

*Mechanisms:* Deeper discounts or annual-by-default presentation pull in marginal, less committed buyers. That raises uptake but lowers the quality of the converter pool (E11). The '2 months free' framing may lift uptake without changing the price (E8).

*Strengths:*
- The price is within reported market norms (E6, E7).
- The framing lever is available at no extra discount (E8).

*Weaknesses:*
- The 30% conversion figure is unsupported (E2, E9).
- The memo does not say who is expected to convert (E2).
- The memo's benchmark references are untraceable (E1).
- The price-positioning evidence is a single unfetched snippet plus vendor marketing (E6, E7).

### C6 Operational and contractual risk of annual billing (weight 10)

These risks are manageable with standard terms, but the supplied documents define none of them. Common practice is to prorate seat additions to the term end, to give a credit or a reduction at renewal (rather than a refund) on seat reductions, and to end a cancelled subscription at term end with no refund. Some vendors allow a short refund window (E18, E19). Generous refunds or mid-term downgrades would undo the lock-in and the year-one gain from would-have-churned converters (K32). Prepayment creates deferred revenue, and seat changes require contract-modification accounting under ASC 606 (E20). [E18, E19, E20]

*Mechanisms:* The in-term retention benefit, and the year-one gain from would-have-churned converters, exist only because cash is locked in. Refund policy therefore directly sets how much 'retention' the plan delivers. Seat true-ups decide whether expansion revenue during the term is captured.

*Strengths:*
- Market templates exist for seat proration and no-refund cancellation (E18, E19).

*Weaknesses:*
- The company's intended terms are unknown (G6).
- Consumer-protection rules in some jurisdictions may limit no-refund terms (E19).
- Deferred-revenue accounting and modification handling add work (E20).

## Key claims

- **CL1** (material): $490 per year is a 16.7% discount versus $588 per year at monthly pricing, not 25%. A 25% discount would be $441. [E1, E5, K1, K2]
- **CL2** (material): A 16.7% ('two months free') discount is reported as the most common SaaS annual discount and lies within the typical 15-20% band. The evidence is snippet-level, and lower-priced plans reportedly carry larger discounts, so $490 is a reasonable price but not shown to be optimal. [E6, E7]
- **CL3** (material): At 3.2% monthly churn, 12-month retention is about 67.7%, and expected year-one revenue per monthly seat is about $494.79, roughly equal to the $490 annual price (an average converter loses about $4.80). [E3, E16, K3, K4, K18]
- **CL4** (material): Under a constant-hazard model, converting a monthly seat to $490/year loses revenue in year one whenever that seat's monthly churn is below about 3.4%. [E16, K10]
- **CL5**: Illustrative assumption (not evidence-backed): a converter with 1% monthly churn would have yielded about $556.71 in year one on monthly billing, so converting them costs about $66.71 per seat. [E16, K11, K12]
- **CL6** (material): The pilot's 91% retention cannot be attributed to annual billing. Sales hand-picked the accounts from customers with more than a year of tenure, there is no control group, and n=40 means only about 3.6 churned accounts, with a Wilson 95% interval of about 78-97%. [E4, E14, K14, K43, K44]
- **CL7** (material): 91% annual retention is equivalent to about 0.78% monthly churn. Tenured monthly customers could plausibly churn at a similar rate, because SaaS churn concentrates early, but this company's tenured monthly retention is unknown. [E4, E13, E14, K13]
- **CL8** (material): Observational annual-versus-monthly retention gaps are confounded by self-selection (and, for in-term measures, by contractual lock-in). That the pilot's gap matches the industry gap does not show how much of it is causal. Evidence for a residual causal effect is limited to one vendor matched-pair claim, and the split remains unresolved. [E10, E11, E12, E17]
- **CL9** (material): The memo's 30% six-month conversion assumption has no source, and no verifiable benchmark was found. [E2, E9]
- **CL10**: Payment-fee savings are about $26.04 per 8-seat account per year, small next to the $784 a would-have-stayed 8-seat account gives up. [E3, E15, K7, K8, K9, K6]
- **CL11**: If all 30% of converters were would-have-stayed accounts, the plan would cost about $29.40 per seat per year averaged across the whole base (before fee savings). [E2, E16, K5, K16]
- **CL12**: Under ASC 606, annual prepayment improves cash timing but not recognized revenue timing, and it adds deferred-revenue and modification accounting. [E20]
- **CL13**: Standard annual terms (prorated seat adds, no mid-term refunds on reductions, cancellation effective at term end) preserve the lock-in. Generous refund terms would weaken it. [E18, E19]
- **CL14** (material): The annual plan is LTV-neutral when the annual renewal rate equals 1 - 10 x the converter's counterfactual monthly churn: about 68% at 3.2%, 90% at 1%, and 92.2% at the pilot-implied 0.78%. [E3, E16, K19, K20, K21, K22, K23]
- **CL15** (material): Across 10-30% conversion, the year-one effect per base seat ranges from -$29.40 to +$13.87, and it is positive only if fewer than about 66% of converters would have stayed monthly anyway. Both the positive cells and the 66% threshold assume would-have-churned converters churn at the blended 3.2% hazard, so they are upper-end values for a tenured converter pool. [E2, E3, E16, K31, K32, K33, K34, K35, K16, K36, K37, K38, K39, K40, K41, K42]
- **CL16** (material): How the pilot's 91% retention was defined is unclear. If it is the month-12 renewal rate, it clears the 68% blended LTV break-even, and for tenured accounts it beats monthly LTV only if their monthly churn exceeds about 0.9% (12-month retention below about 89.7%). [E4, E14, E17, K20, K24, K25, K26]
- **CL17**: Over 24 months, an average-churn converter breaks even at about 69.3% renewal. A 1%-churn converter cannot break even within 24 months even at 100% renewal ($980 vs $1,050.18). [E3, E16, K27, K28, K29, K30]
- **CL18**: Reasoning only, with no packet evidence: annual prepay may cut involuntary churn by removing eleven of twelve card charges. The packet does not report payment-failure rates or the involuntary share of churn, so this mechanism can be neither sized nor relied on.
- **CL19**: If would-have-churned converters churn at an illustrative 1% hazard rather than 3.2%, their year-one gain falls from about $190 to about $177 per seat, the break-even would-have-stayed share falls from about 66% to about 64%, and the best 30%-conversion cell falls from +$13.87 to about +$11.91 per base seat. The gain ranges from +$441 to -$98 depending on when such a seat would have churned (-$49 after eleven paid months; -$98 for a seat that pays all twelve monthly payments and leaves at the 12-month boundary). [E3, E13, E16, K46, K47, K48, K49, K53, K54, K5]
- **CL20** (material): A useful test needs far more than the pilot's 40 accounts. Estimating converters' month-12 renewal within about ±5 points needs about 246 converted accounts, and within ±3 points near 90% about 384. The randomized offered-versus-holdout comparison must use a post-renewal outcome, not in-term retention, and its effect is diluted by uptake: at an illustrative 20% uptake, a 10-point lift among converters moves the arm-level share still paying at month 19 by only about 2 points from about 53.9%, which needs about 9,700 accounts per arm. The final read arrives about 19 months after launch, given a 6-month enrollment window. [E2, E4, E17, K50, K51, K52, K55, K56]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Actual discount (%) of $490/year versus $49 x 12 | `(1 - 490/(49*12))*100` | 16.6667 | 16.666666666666664 | yes |
| K2 | Annual price that would be a true 25% discount | `49*12*0.75` | 441 | 441 | yes |
| K3 | 12-month retention at 3.2% monthly churn | `0.968^12` | 0.67687 | 0.67686847547098 | yes |
| K4 | Expected year-one revenue per monthly seat at 3.2% churn (payments at start of each month); equivalent to about 10.1 paid months at $49 | `49*(1-0.968^12)/0.032` | 494.79 | 494.79514693506195 | yes |
| K5 | Revenue given up per seat per year by a would-have-stayed converter (also the year-one change for a would-have-churned seat that pays all 12 monthly payments and leaves at the 12-month boundary) | `49*12-490` | 98 | 98 | yes |
| K6 | Revenue given up per 8-seat would-have-stayed account per year | `(49*12-490)*8` | 784 | 784 | yes |
| K7 | Annual payment fees on monthly billing, 8-seat account ($392 per charge) | `12*(0.029*392+0.30)` | 140.016 | 140.01600000000002 | yes |
| K8 | Payment fee on a single annual charge, 8-seat account ($3,920) | `0.029*3920+0.30` | 113.98 | 113.98 | yes |
| K9 | Annual fee saving per 8-seat account from annual billing | `12*(0.029*392+0.30)-(0.029*3920+0.30)` | 26.036 | 26.036000000000016 | yes |
| K10 | Check that monthly churn of about 3.38% is the year-one break-even, where expected monthly revenue equals $490 | `49*(1-(1-0.0338)^12)/0.0338` | 490.12 | 490.11841950970717 | yes |
| K11 | Expected year-one revenue per monthly seat for an illustrative low-churn (1% monthly) account | `49*(1-0.99^12)/0.01` | 556.71 | 556.7141285909673 | yes |
| K12 | Year-one revenue lost per seat by converting an illustrative 1%-monthly-churn account to $490 | `49*(1-0.99^12)/0.01-490` | 66.71 | 66.71412859096733 | yes |
| K13 | Monthly-equivalent churn implied by the pilot's 91% 12-month retention | `1-0.91^(1/12)` | 0.007828 | 0.007828420342483211 | yes |
| K14 | Expected number of churned accounts in the n=40 pilot at 91% retention | `40*(1-0.91)` | 3.6 | 3.5999999999999988 | yes |
| K15 | Approximate 95% margin of error (normal approximation, superseded by the Wilson interval K43/K44) on the pilot's 91% retention, n=40 | `1.96*sqrt(0.91*0.09/40)` | 0.0887 | 0.08868864639851033 | yes |
| K16 | Revenue given up per seat across the whole base per year if all 30% of converters would have stayed (before fees) | `0.3*98` | 29.4 | 29.4 | yes |
| K17 | Net revenue given up per would-have-stayed seat per year after per-seat fee savings | `98-(12*(0.029*392+0.30)-(0.029*3920+0.30))/8` | 94.7455 | 94.74549999999999 | yes |
| K18 | Year-one revenue change per seat from converting an average-churn (3.2%) seat to $490 | `490-49*(1-0.968^12)/0.032` | -4.795 | -4.79514693506195 | yes |
| K19 | Undiscounted monthly LTV per seat at 3.2% monthly churn | `49/0.032` | 1531.25 | 1531.25 | yes |
| K20 | Annual renewal rate at which annual LTV 490/(1-r) equals monthly LTV for a 3.2%-churn converter | `1-490/(49/0.032)` | 0.68 | 0.6799999999999999 | yes |
| K21 | Undiscounted monthly LTV per seat at an illustrative 1% monthly churn | `49/0.01` | 4900 | 4900 | yes |
| K22 | Break-even annual renewal rate for an illustrative 1%-churn converter | `1-490/(49/0.01)` | 0.9 | 0.9 | yes |
| K23 | Break-even annual renewal rate for a converter churning at the pilot-implied 0.78% monthly | `1-490*(1-0.91^(1/12))/49` | 0.92172 | 0.9217157965751679 | yes |
| K24 | Monthly churn above which a 91% annual renewal rate gives higher LTV than monthly billing | `(1-0.91)*49/490` | 0.009 | 0.008999999999999996 | yes |
| K25 | 12-month monthly-billing retention at 0.9% monthly churn | `0.991^12` | 0.89719 | 0.8971888214154765 | yes |
| K26 | Undiscounted annual LTV per seat at a 91% renewal rate | `490/(1-0.91)` | 5444.44 | 5444.444444444446 | yes |
| K27 | Expected 24-month revenue per monthly seat at 3.2% churn | `49*(1-0.968^24)/0.032` | 829.71 | 829.7063837114368 | yes |
| K28 | Renewal rate at which 24-month annual revenue 490*(1+r) equals 24-month monthly revenue at 3.2% churn | `49*(1-0.968^24)/0.032/490-1` | 0.69328 | 0.6932783341049731 | yes |
| K29 | Expected 24-month revenue per monthly seat at an illustrative 1% churn | `49*(1-0.99^24)/0.01` | 1050.18 | 1050.177110044628 | yes |
| K30 | Maximum 24-month revenue per annual seat (100% renewal) | `2*490` | 980 | 980 | yes |
| K31 | Expected year-one monthly revenue of a seat that churns within 12 months, at 3.2% churn | `(49*(1-0.968^12)/0.032-588*0.968^12)/(1-0.968^12)` | 299.56 | 299.5575362051453 | yes |
| K32 | Year-one gain per seat from converting a would-have-churned seat to $490 (no refund) | `490-(49*(1-0.968^12)/0.032-588*0.968^12)/(1-0.968^12)` | 190.44 | 190.4424637948547 | yes |
| K33 | Break-even share of converters who would have stayed, at which year-one gains and losses cancel | `190.44/(98+190.44)` | 0.6602 | 0.6602412980169186 | yes |
| K34 | Year-one change per base seat at 10% conversion, all converters would have stayed | `0.1*(-98)` | -9.8 | -9.8 | yes |
| K35 | Year-one change per base seat at 20% conversion, all converters would have stayed | `0.2*(-98)` | -19.6 | -19.6 | yes |
| K36 | Year-one change per base seat at 10% conversion, 90% of converters would have stayed | `0.1*(0.9*(-98)+0.1*190.44)` | -6.9156 | -6.915600000000001 | yes |
| K37 | Year-one change per base seat at 20% conversion, 90% of converters would have stayed | `0.2*(0.9*(-98)+0.1*190.44)` | -13.8312 | -13.831200000000003 | yes |
| K38 | Year-one change per base seat at 30% conversion, 90% of converters would have stayed | `0.3*(0.9*(-98)+0.1*190.44)` | -20.7468 | -20.7468 | yes |
| K39 | Year-one change per base seat at 10% conversion, 50% of converters would have stayed | `0.1*(0.5*(-98)+0.5*190.44)` | 4.622 | 4.622 | yes |
| K40 | Year-one change per base seat at 20% conversion, 50% of converters would have stayed | `0.2*(0.5*(-98)+0.5*190.44)` | 9.244 | 9.244 | yes |
| K41 | Year-one change per base seat at 30% conversion, 50% of converters would have stayed | `0.3*(0.5*(-98)+0.5*190.44)` | 13.866 | 13.866 | yes |
| K42 | Year-one change per base seat at 30% conversion when converters mirror the blended 3.2% churn | `0.3*(490-49*(1-0.968^12)/0.032)` | -1.4385 | -1.4385440805185852 | yes |
| K43 | Wilson 95% interval lower bound for the pilot's 91% retention, n=40 | `((0.91+1.96^2/80)-1.96*sqrt(0.91*0.09/40+1.96^2/6400))/(1+1.96^2/40)` | 0.78206 | 0.7820569207517788 | yes |
| K44 | Wilson 95% interval upper bound for the pilot's 91% retention, n=40 | `((0.91+1.96^2/80)+1.96*sqrt(0.91*0.09/40+1.96^2/6400))/(1+1.96^2/40)` | 0.96609 | 0.9660909570628997 | yes |
| K45 | Upper-bound illustrative time value per seat of receiving $490 upfront rather than spread monthly (average 5.5-month advance), at an assumed 8% annual cost of capital; assumes the monthly counterfactual pays all 12 months, so it overstates the value for an expected seat paying about 10.1 months (K4) | `490*0.08*5.5/12` | 17.967 | 17.96666666666667 | yes |
| K46 | Expected year-one monthly revenue of a seat that churns within 12 months, at an illustrative 1% hazard (tenured would-have-churned converter) | `(49*(1-0.99^12)/0.01-588*0.99^12)/(1-0.99^12)` | 312.633 | 312.63287344213586 | yes |
| K47 | Year-one gain per seat from converting a would-have-churned seat at a 1% hazard to $490 (no refund) | `490-(49*(1-0.99^12)/0.01-588*0.99^12)/(1-0.99^12)` | 177.367 | 177.36712655786414 | yes |
| K48 | Break-even would-have-stayed share of converters when would-have-churned converters churn at a 1% hazard | `177.367/(98+177.367)` | 0.64411 | 0.6441113132655693 | yes |
| K49 | Year-one change per base seat at 30% conversion, 50% would have stayed, with would-have-churned converters at a 1% hazard | `0.3*(0.5*(-98)+0.5*177.367)` | 11.905 | 11.905049999999997 | yes |
| K50 | Converted accounts needed to estimate month-12 renewal within ±5 points (95% confidence), conservatively at p=0.8 | `1.96^2*0.8*0.2/0.05^2` | 245.86 | 245.86239999999998 | yes |
| K51 | Converted accounts needed to estimate month-12 renewal within ±3 points (95% confidence) near p=0.9 | `1.96^2*0.9*0.1/0.03^2` | 384.16 | 384.16 | yes |
| K52 | Accounts per arm to detect a 2-point difference in the share still paying at month 19, after all converters' first renewal (53.9% holdout vs 55.9% offered arm; illustrative 20% uptake x 10-point converter lift; two-sided 5%, 80% power) | `(1.96+0.8416)^2*(0.539*0.461+0.559*0.441)/0.02^2` | 9713 | 9713.0519231872 | yes |
| K53 | Year-one change per seat for a would-have-churned converter who would have paid 11 months before leaving | `490-11*49` | -49 | -49 | yes |
| K54 | Year-one change per seat for a would-have-churned converter who would have paid 1 month before leaving | `490-49` | 441 | 441 | yes |
| K55 | Illustrative holdout baseline: share of monthly accounts still paying at month 19 at blended 3.2% monthly churn | `0.968^19` | 0.53905 | 0.5390533990397439 | yes |
| K56 | Arm-level difference in share still paying produced by an illustrative 10-point retention lift among converters at 20% uptake | `0.2*0.10` | 0.02 | 0.020000000000000004 | yes |

## Alternatives

- **Launch at $490 (16.7%, 'two months free') as a randomized or holdout-controlled test on a subset of accounts:** It uses a common market discount (E6, E7) and produces the missing causal and renewal evidence (E14, E17). Primary read: an intention-to-treat comparison of cumulative revenue per account and the share still paying at about month 19, after all first renewals, between offered and holdout arms; randomization keeps this free of selection. Detecting an illustrative 2-point arm-level difference (20% uptake x 10-point converter lift) needs about 9,700 accounts per arm (K52, K55, K56). If the base is smaller, the fallback is converters' month-12 renewal, measured on at least about 246 converted accounts (K50), against 1 - 10c with c taken from holdout accounts matched to the converters on tenure band and seat count (K20, K22, K23). The packet does not give the customer count, so feasibility must be checked. Timeline: enrollment over months 0-6 (E2), an interim read at month 6, renewals from month 12 to month 18, and a final read at about month 19. It limits cannibalization exposure to the test cohort. It is preferred over a full launch.
- **Launch at $441 (a true 25% discount, as the memo intended):** Each would-have-stayed converter would then cost $147 per seat instead of $98. It sits at the high end of market practice (E7, E8), and deeper discounts attract less committed buyers who renew worse (E11). E6's note that lower-priced plans discount more means it is not unreasonable, but on this evidence it is inferior to $490 unless tested as a separate arm.
- **Smaller discount, e.g. $539 ('one month free', 8.3%):** This is the second most common discount level (E6). It halves the cannibalization cost per would-have-stayed seat to $49, but uptake is likely lower. It is reasonable if the test shows mostly tenured, low-churn converters.
- **Offer annual billing only to new or early-tenure customers, or at the point of a cancellation attempt:** It targets the cohort where churn is concentrated (E13) and avoids discounting already-loyal accounts. Its value rests on a tension. The roughly $190 per seat year-one gain (K32) arises only if accounts that would have churned actually prepay the full $490 and receive no refund. Yet self-selection evidence says low-commitment accounts are the least likely to prepay upfront (E11). Uptake may therefore be very low. Accounts that do take it at a cancellation moment may push for refunds, which a no-refund policy must withstand (E19). It fits the value mechanism best on paper but is unproven, and it should be a separate test arm rather than the default.
- **Annual commitment billed monthly (12-month contract, monthly invoices) at a smaller discount:** A common B2B alternative, though the packet has no evidence on its uptake or retention effect. It keeps the in-term commitment while asking for no upfront cash, so it may suit early-tenure accounts that will not prepay. A smaller discount (e.g. the 8.3% level, E6) would cut cannibalization. It gives up the upfront cash and time value (E20, K45) and the fee saving, because there are still 12 charges (E15). Enforcing payment for the rest of the term after a customer cancels is harder than keeping a prepayment. It is worth testing as an arm if prepay uptake is low.
- **Do not launch. Invest in onboarding or early-life retention instead:** If churn is concentrated in the first 90 days (E13), fixing onboarding addresses churn directly without discounting loyal customers. The tradeoff is losing the cash-flow benefits of prepayment (E20).

## Tradeoffs

- Upfront cash and in-term lock-in, versus about $98 per seat per year given up on every would-have-stayed converter (K5, E20).
- Higher uptake through deeper discounts or annual-by-default presentation, versus a worse converter mix and lower renewal (E11).
- Strict no-refund terms protect the lock-in and the year-one gain from would-have-churned converters, but they may add friction to the sale and run into consumer-protection rules in some jurisdictions (E18, E19, K32).
- In-term retention will look excellent by construction, so the test's success metric must be measured after renewal: the randomized offered-versus-holdout comparison of revenue per account and share still paying at about month 19, or, as a fallback, converters' month-12 renewal against 1 - 10c with c from tenure- and seat-matched holdout accounts, never the holdout's blended churn (E17, K20, K22).
- A test large enough to decide (K50, K52) delays the scale decision to about month 19, versus acting now on a pilot that cannot separate selection from effect (E4).

## Edge cases and failure modes

- Mostly tenured, low-churn accounts convert, so the plan cuts revenue with little effect on churn (E11, E13; K12, K38).
- If the pilot's 91% was in-term retention, a renewal cliff at month 12 may be hidden. If it was a renewal rate, retention on a hand-picked cohort may not carry over to self-selected converters. Either way the pilot figure can mislead (E4, E17).
- An 8-seat account cuts seats mid-term and demands a refund. A generous policy erodes the benefit (E18).
- An account adds seats mid-term without proration rules, so expansion revenue is lost until renewal (E18).
- Seat churn and contraction inside accounts differ from the 3.2% logo churn, so per-seat estimates are off (E3).
- International cards or invoice/ACH payment change the fee comparison (E15).
- Contract modifications create deferred-revenue remeasurement errors (E20).
- A no-refund policy conflicts with local consumer-protection law in some markets (E19).
- Annual customers churn at renewal in a batch, which makes revenue lumpier and forecasts harder.
- The customer base is too small to power the randomized comparison (about 9,700 accounts per arm under illustrative assumptions, K52), so the team must rely on the matched-c renewal fallback, which still carries selection on unrecorded criteria (E4, E11), or the test stays inconclusive and the team launches anyway on the pilot.

## Counterarguments

- **Industry data consistently shows annual plans retain far better (92% vs 68%), so the plan will cut churn.** — That gap is observational and confounded by self-selection (E10, E11). Our own 67.7% versus the pilot's 91% resembles it (K3, E10), but the resemblance does not show how the gap splits between selection and a real effect. The industry gap may itself contain a causal part, and one vendor matched analysis claims one (E12). The honest position is that the pilot is not proof of an effect, not that there is no effect. What matters is whether converters' renewal beats 1 - 10c at their own counterfactual churn (K20, K22), and only a controlled test can show that.
- **If the pilot's 91% is a month-12 renewal rate, it already clears the 68% break-even, so launch.** — It clears the blended threshold (K20), but the pilot accounts were tenured and hand-picked (E4). Their relevant break-even is 1 - 10c at their own counterfactual churn. 91% beats it only if tenured monthly churn exceeds about 0.9% a month (K24, K25), which is unknown (E14). Even a tenure-matched comparison would not remove the sales-picking layer of selection (E4, E11). The Wilson interval of 78-97% (K43, K44) also straddles the 90% threshold for a 1%-churn account (K22). It is a strong reason to run the test, not to skip it.
- **Annual prepay causally removes involuntary churn from failed card payments, independent of selection.** — Eleven fewer charges a year is a plausible mechanism, but the packet has no evidence on payment-failure rates; E15 covers only fee rates. Its size depends on the share of the 3.2% churn that is involuntary, which the packet does not report. It should be measured in the data pull and the test, but it cannot be credited without data.
- **Even if converters are loyal, locking them in for a year guarantees revenue and cash.** — A loyal account would have paid more than the $490 it now locks in (illustrative: $556.71 at 1% monthly churn, K11, K12). Over 24 months it cannot be recovered even at 100% renewal (K29, K30). The cash-timing benefit is real but small, at most about $18 per seat at an illustrative 8% cost of capital (K45, E20).
- **The memo's 25% figure comes from benchmarks that call it the sweet spot.** — The plan is not 25% off (K1), the memo cites no benchmark (E1), and no conversion benchmark could be verified (E9). Market data shows 16.7% is the most common level (E6).
- **Payment-fee savings and fewer failed payments partly offset the discount.** — The fee saving is about $26 per 8-seat account per year, against $784 given up by a would-have-stayed account (K9, K6). The failed-payment effect has no evidence in the packet (see above).
- **A 19-month test is too slow; competitors already offer annual plans.** — The test does not withhold annual billing from the market. Every offered account in the test can buy it, and a 6-month interim read on uptake and the predicted converter mix (K33, K48) allows the offer to be narrowed early. What waits for the post-renewal read at about month 19 is only the decision to scale to the whole base, which is where the cannibalization risk sits (K16).

## Practical implications

- Correct the memo: market the plan as '2 months free' (16.7%), not '25% off' (E5, E8).
- Use $490 as the test price rather than cutting to $441. A deeper discount raises cannibalization to $147 per would-have-stayed seat and may worsen converter quality (E7, E11). Test a deeper arm only if uptake at $490 is too low (E6).
- Before any launch, confirm whether the pilot's 91% is in-term retention or the month-12 renewal rate, what refund terms applied, and how sales chose the 40 accounts (E4).
- Pull 12-month retention for monthly customers by tenure band and seat count, the share of churn that is involuntary, and the active customer count. The count decides whether a powered randomized comparison is feasible, and the tenure and seat-count retention feeds both the month-6 interim read and the fallback threshold (E14, K52).
- Run the plan as a randomized offer against a holdout, treating accounts as the unit. Size the primary comparison on a post-renewal outcome, not in-term retention (E17). Uptake dilutes the arm-level effect: at an illustrative 20% uptake, a 10-point retention lift among converters moves the share still paying at month 19 by only about 2 points (K56) from about 53.9% at blended churn (K55), which needs about 9,700 accounts per arm (K52); lower uptake or a smaller lift needs more. Per-account revenue variance is not in the packet, so the revenue comparison cannot be sized directly and the retention sizing serves as a proxy. Separately, target at least about 246 converted accounts so month-12 renewal is known within ±5 points (K50), or about 384 for ±3 points near 90% (K51). If the base cannot supply the randomized sample, rely on the matched-c fallback rule below and accept a wider uncertainty band and residual selection (E4, E11).
- Timeline and interim rule. Months 0-6: enroll (E2). At month 6, read uptake, refund and seat-reduction requests, and the converters' mix by tenure band and seat count. Estimate the converters' would-have-stayed share as the average of each converter's predicted 12-month retention on monthly billing, taken from the historical retention of accounts with the same tenure band and seat count (E14) and checked against the holdout's observed churn in those bands over its first six months. If that predicted share exceeds about 64-66% (K33, K48), do not widen the offer beyond the test cohort; consider moving new enrollment to $539 or to a targeted arm. This gate covers year one only and is an early warning, not a verdict: the scale decision is taken solely by the final rule, so a pool that trips this gate can still be scaled if it clears the final rule, and one that passes can still be stopped. If uptake is negligible, test the framing or an annual-commitment-billed-monthly arm. Months 12-18: converters' first renewals fall due. About month 19: final read.
- Final success rule. Primary (intention-to-treat): at about month 19, counting every randomized account whether or not it converted, scale only if the offered arm is ahead of the holdout on cumulative revenue per account and on the share still paying, with the confidence interval for the revenue difference excluding a loss. Randomization makes this comparison free of selection. Fallback, if the base cannot power it (K52): scale only if converters' month-12 renewal, with its lower confidence bound, exceeds 1 - 10c, where c is the monthly churn of holdout accounts matched to the converters on tenure band and seat count. Do not use the holdout's blended churn: it gives a threshold near 68% (K20), whereas a tenured pool at 1% or 0.78% churn needs about 90% or 92% (K22, K23). Matching removes only observable selection, so treat a fallback pass as weaker evidence than a randomized one (E4, E11). Do not use in-term retention as the success metric (E17).
- Adopt standard terms: prorated seat adds, no mid-term refunds on reductions (credit at renewal), and cancellation effective at term end. Check local consumer-protection rules (E18, E19).
- Set up deferred-revenue accounting and contract-modification handling before launch (E20).
- Consider steering a separate test arm to newer accounts or to cancellation-intent moments, but expect low prepay uptake there (E11, E13, K32).

## Remaining uncertainty

- The definition of the pilot's 91% retention (in-term vs month-12 renewal), the pilot's refund terms, and the criteria sales used to pick accounts (E4). This needs the company's internal data.
- This company's retention for tenured monthly customers, and its churn by tenure and segment (E14). This needs the company's internal data.
- The true causal effect of annual billing on B2B seat-based churn: E11 (selection) conflicts with E12 (matched effect). E11 is more directly relevant to the pilot's selection problem. E12 offers larger-scale matching but its method is unseen and its customer base is likely consumer, so the conflict remains unresolved.
- The actual conversion rate and converter mix at $490 (E2, E9).
- The renewal rate for annual customers at month 12, relative to the 1 - 10c break-even (E17, K20).
- The share of churn that is involuntary (payment failure), which annual prepay might remove. The packet has no evidence on it.
- The active customer count, which decides whether a test can reach the sample sizes in K50-K52.
- When would-have-churned converters would have left, which moves their year-one value between +$441 and -$98 per seat (K54, K53, K5).
- Seat-level versus logo-level churn and in-account seat changes for 8-seat accounts (E3).
- Payment method mix (card, ACH or invoice) for annual deals (E15).
- The constant-hazard churn model is a simplification. Early-concentrated churn would make the case against discounting tenured accounts stronger (E13, E16).
- E9 UNKNOWN: No verifiable benchmark was found for the share of B2B SaaS customers who convert from monthly to annual plans at a given discount, so the memo's 30%-within-6-months assumption remains unsupported. Search results contained only inconsistent vendor claims, for example about 15% annual adoption when monthly is the default versus 35-45% when annual is the default, with no traceable methodology. Recurly's research reports discount prevalence and trial conversion, not adoption of annual plans.
- E14 UNKNOWN: Neither the supplied documents nor the web research gives this company's 12-month retention for monthly customers with more than a year of tenure, or its churn broken down by tenure or segment.

## Further research that could change the conclusion

- Confirming that the pilot's 91% is a month-12 renewal rate, together with tenured monthly churn above about 0.9% a month, would make the pilot more encouraging. It would justify prioritizing and enlarging the controlled test, not replacing it. Sales hand-picked the pilot accounts, a layer of selection that tenure-matching does not remove (E4, E11; K24, K25).
- If tenured monthly customers retain well below 91% (for example about 70-75%), the pilot gap would be larger than tenure alone explains. That is consistent with a real effect but still not proof, because of the sales-picking selection. It would raise the expected payoff of the test rather than justify skipping it (E4, E14).
- A randomized annual-offer test in which the offered arm leads the holdout on revenue per account and on the share still paying at about month 19 would support launching; if the base cannot power that, converters' month-12 renewal above 1 - 10c with c from tenure- and seat-matched holdout accounts would support it more weakly. A month-6 predicted would-have-stayed share well below about 64-66% would be an early positive sign (K20, K22, K33, K48, K52).
- Evidence that a large share of the 3.2% is involuntary churn would strengthen the causal case for annual prepay.
- Data showing that churn is spread evenly across tenure rather than concentrated early would reduce the cannibalization concern (E13).
- A survey or fake-door test showing which accounts (by tenure and seat count) intend to take $490 would bound the converter mix before the full test.
- Primary ProfitWell/Paddle or Recurly reports on monthly-to-annual conversion and annual renewal rates for B2B SaaS at roughly $49 per seat (E9, E10).
- Peer-reviewed or methodologically transparent evidence on annual-billing treatment effects in B2B SaaS (E11, E12).

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | The growth memo (Oct 2026) states the current plan is $49 per seat per month billed monthly and the proposed annual plan is $490 per seat per year paid upfront. It describes this as 'a 25% discount versus monthly, which benchmarks suggest is the sweet spot for annual conversion'. It names no benchmark source. | pricing-memo.md |
| E2 | VERIFIED | fixture_read | The memo assumes 30% of monthly customers convert to annual within 6 months. It gives no source, data or segmentation for that figure. | pricing-memo.md |
| E3 | VERIFIED | fixture_read | Finance data (trailing 12 months): monthly logo churn for monthly-billed customers is 3.2% per month. The average customer has 8 seats. The payment processing fee is 2.9% of each charge plus $0.30 per charge. | churn-data.md |
| E4 | VERIFIED | fixture_read | A 2025 pilot cohort of 40 annual accounts had 91% 12-month logo retention. The source notes that sales hand-picked these accounts from customers who had already been customers for over a year. | churn-data.md |
| E5 | INFERRED | fixture_read | Arithmetic from the memo figures: $49 x 12 = $588 per year. $490 / $588 = 0.8333, so the discount is about 16.7% (exactly two months free), not 25%. A true 25% discount would be $441 per year. | pricing-memo.md |
| E6 | INFERRED | search_result | Recurly's SaaS subscription-plan benchmark research reports that the most popular annual-plan discount is 16.7%, which maps to a 'two months free' offer, and that the next most common is 8.3% (one month free). It also reports that lower-priced plans tend to carry larger annual discounts and higher-priced plans the smallest. | https://recurly.com/research/saas-benchmarks-for-subscription-plans |
| E7 | CORROBORATED | search_result | Vendor and secondary pricing sources describe a typical annual-subscription discount of 15-20%, and say most companies that discount stay in that band. | https://www.getmonetizely.com/faqs/what-s-the-standard-discount-percentage-for-annual-versus-monthly-subscriptions-in-saas |
| E8 | INFERRED | search_result | Some larger vendors use deeper annual discounts. DocuSign's standard annual discount is reported at 20-25% and HubSpot offers up to 25% on certain tiers, while Zoom sits at about 15-20%. A Monetizely piece also cites an unverified ProfitWell finding that framing the discount as 'two months free' produced 30% higher conversion than an equivalent percentage discount. | https://www.getmonetizely.com/articles/why-does-docusigns-annual-discount-strategy-work-so-well |
| E9 | UNKNOWN | none | No verifiable benchmark was found for the share of B2B SaaS customers who convert from monthly to annual plans at a given discount, so the memo's 30%-within-6-months assumption remains unsupported. Search results contained only inconsistent vendor claims, for example about 15% annual adoption when monthly is the default versus 35-45% when annual is the default, with no traceable methodology. Recurly's research reports discount prevalence and trial conversion, not adoption of annual plans. | none |
| E10 | CORROBORATED | search_result | Observational industry data shows annual plans retain better than monthly plans. Baremetrics reports annual plans retain 92% of customers versus 68% for monthly. ProfitWell/Paddle, drawing on data from about 2,500 subscription companies, reports that annual plans reduce churn substantially and that quarterly and annual customers had significantly better retention and LTV than monthly customers. | https://baremetrics.com/blog/annual-vs-monthly-pricing-better-retention |
| E11 | INFERRED | search_result | Much of the annual-plan retention advantage reflects selection, not the plan itself. A RevenueCat analysis (quoted by Churnkey) says yearly plans retain better 'not because users are inherently more loyal, but because higher upfront commitment filters for stronger need'. It warns that pushing more users onto annual plans through defaults or deeper discounts adds the least committed buyers, who renew below the existing annual rate. | https://churnkey.co/growth/library/monthly-to-annual-conversion |
| E12 | INFERRED | search_result | Churnkey's library reports that across 50,000 matched subscriber pairs, subscribers on annual billing stayed an average of 189 days longer and were worth an average of $146 more each than their monthly 'twins'. It states that the matching controls for selection. | https://churnkey.co/growth/library/monthly-to-annual-conversion |
| E13 | CORROBORATED | search_result | Industry sources say SaaS churn is concentrated early in the customer lifecycle. One cites an Optifai study of 939 B2B SaaS companies (Q2 2025 to Q1 2026) finding that 70% of churn happens in the first 90 days. Another reports that 43% of SMB customer losses occur within the first quarter after purchase. | https://usetandem.ai/blog/customer-onboarding-statistics-2026 |
| E14 | UNKNOWN | none | Neither the supplied documents nor the web research gives this company's 12-month retention for monthly customers with more than a year of tenure, or its churn broken down by tenure or segment. | none |
| E15 | CORROBORATED | search_result | Stripe's standard US rate is 2.9% + 30 cents per successful domestic card charge, with +1.5% for international cards and +1% for currency conversion. This matches the fee structure in the churn data. | https://www.nerdwallet.com/business/software/learn/stripe-fees |
| E16 | INFERRED | fixture_read | Derived from E3: at 3.2% monthly churn, 12-month retention is 0.968^12, about 67.7%, and expected paid months in year one are (1 - 0.968^12)/0.032, about 10.10. That is about $495 in expected revenue per monthly seat in year one, roughly equal to the $490 annual price. A converter who would have stayed all 12 months loses $98 per seat in year one. A converter who would have churned early adds revenue. | churn-data.md |
| E17 | INFERRED | search_result | Annual-plan churn tends to be back-loaded: almost everyone is kept through year one, and the loss comes at renewal. | https://adapty.io/blog/why-churn-rate-looks-different-what-youre-measuring/ |
| E18 | CORROBORATED | search_result | Common SaaS practice for annual plans: seats added mid-term are prorated to the end of the annual term (examples: Intercom, Pipedrive). Seat removals mid-term usually get no cash refund, only credits or a reduction at renewal (examples: Qase, Koalendar, Pipedrive). | https://www.intercom.com/help/en/articles/8367468-understand-how-billing-works-for-a-monthly-or-annual-subscription |
| E19 | INFERRED | search_result | Cancellation of a prepaid annual subscription commonly stops renewal without refunding the current term. For example, Ramp's terms (via a clause-tracking database) let the customer use the service until the end of the current term with no renewal. Some vendors, such as Appxite, allow a prorated refund only within the first 7 days. | https://conductatlas.com/platform/ramp/ramp-terms-of-service/prorated-charge-for-seats-added-mid-billing-period/ |
| E20 | CORROBORATED | search_result | Under ASC 606, cash from an upfront annual SaaS prepayment is booked as a contract liability (deferred revenue) and recognized over time, typically straight-line across the subscription term. Mid-contract modifications such as upgrades, downgrades and extensions require remeasurement. | https://www.numeric.io/blog/revenue-recognition-saas |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 10 web search(es), 1 fetch attempt(s), 2 supplied document(s) read.
- search: "SaaS annual plan discount benchmark percentage "2 months free" typical annual discount 2025" (18 results)
- search: "annual vs monthly billing churn rate B2B SaaS benchmark annual contracts lower churn" (18 results)
- search: "percentage of SaaS customers choosing annual plan when offered discount conversion rate benchmark" (18 results)
- search: "annual plan retention self-selection bias loyal customers choose annual cannibalization monthly revenue" (10 results)
- search: "SaaS churn concentrated in first 90 days early-life churn by customer tenure cohort" (10 results)
- search: "Stripe pricing 2.9% + 30¢ per successful card charge US" (20 results)
- search: "SaaS annual subscription mid-term seat additions proration true-up refund policy annual prepaid cancellation" (15 results)
- search: "ASC 606 annual upfront SaaS subscription deferred revenue recognized ratably over term" (10 results)
- search: "ProfitWell annual plans churn lower than monthly study retention by tenure monthly subscribers churn decreases with age" (17 results)
- search: "what share of SaaS subscribers are on annual plans vs monthly ProfitWell proportion annual plans SMB" (19 results)
2. **Sources inspected:**
- pricing-memo.md (fixture_read)
- churn-data.md (fixture_read)
   Cited from search snippets only (not opened):
- https://recurly.com/research/saas-benchmarks-for-subscription-plans
- https://www.getmonetizely.com/faqs/what-s-the-standard-discount-percentage-for-annual-versus-monthly-subscriptions-in-saas
- https://www.getmonetizely.com/articles/why-does-docusigns-annual-discount-strategy-work-so-well
- https://baremetrics.com/blog/annual-vs-monthly-pricing-better-retention
- https://churnkey.co/growth/library/monthly-to-annual-conversion
- https://usetandem.ai/blog/customer-onboarding-statistics-2026
- https://www.nerdwallet.com/business/software/learn/stripe-fees
- https://adapty.io/blog/why-churn-rate-looks-different-what-youre-measuring/
- https://www.intercom.com/help/en/articles/8367468-understand-how-billing-works-for-a-monthly-or-annual-subscription
- https://conductatlas.com/platform/ramp/ramp-terms-of-service/prorated-charge-for-seats-added-mid-billing-period/
- https://www.numeric.io/blog/revenue-recognition-saas
3. **Checks executed:**
- Evidence registry validation: 20 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 4 draft(s)
- Calculation K1 re-executed: (1 - 490/(49*12))*100 = 16.666666666666664 (claimed 16.6667) → match
- Calculation K2 re-executed: 49*12*0.75 = 441 (claimed 441) → match
- Calculation K3 re-executed: 0.968^12 = 0.67686847547098 (claimed 0.67687) → match
- Calculation K4 re-executed: 49*(1-0.968^12)/0.032 = 494.79514693506195 (claimed 494.79) → match
- Calculation K5 re-executed: 49*12-490 = 98 (claimed 98) → match
- Calculation K6 re-executed: (49*12-490)*8 = 784 (claimed 784) → match
- Calculation K7 re-executed: 12*(0.029*392+0.30) = 140.01600000000002 (claimed 140.016) → match
- Calculation K8 re-executed: 0.029*3920+0.30 = 113.98 (claimed 113.98) → match
- Calculation K9 re-executed: 12*(0.029*392+0.30)-(0.029*3920+0.30) = 26.036000000000016 (claimed 26.036) → match
- Calculation K10 re-executed: 49*(1-(1-0.0338)^12)/0.0338 = 490.11841950970717 (claimed 490.12) → match
- Calculation K11 re-executed: 49*(1-0.99^12)/0.01 = 556.7141285909673 (claimed 556.71) → match
- Calculation K12 re-executed: 49*(1-0.99^12)/0.01-490 = 66.71412859096733 (claimed 66.71) → match
- Calculation K13 re-executed: 1-0.91^(1/12) = 0.007828420342483211 (claimed 0.007828) → match
- Calculation K14 re-executed: 40*(1-0.91) = 3.5999999999999988 (claimed 3.6) → match
- Calculation K15 re-executed: 1.96*sqrt(0.91*0.09/40) = 0.08868864639851033 (claimed 0.0887) → match
- Calculation K16 re-executed: 0.3*98 = 29.4 (claimed 29.4) → match
- Calculation K17 re-executed: 98-(12*(0.029*392+0.30)-(0.029*3920+0.30))/8 = 94.74549999999999 (claimed 94.7455) → match
- Calculation K18 re-executed: 490-49*(1-0.968^12)/0.032 = -4.79514693506195 (claimed -4.795) → match
- Calculation K19 re-executed: 49/0.032 = 1531.25 (claimed 1531.25) → match
- Calculation K20 re-executed: 1-490/(49/0.032) = 0.6799999999999999 (claimed 0.68) → match
- Calculation K21 re-executed: 49/0.01 = 4900 (claimed 4900) → match
- Calculation K22 re-executed: 1-490/(49/0.01) = 0.9 (claimed 0.9) → match
- Calculation K23 re-executed: 1-490*(1-0.91^(1/12))/49 = 0.9217157965751679 (claimed 0.92172) → match
- Calculation K24 re-executed: (1-0.91)*49/490 = 0.008999999999999996 (claimed 0.009) → match
- Calculation K25 re-executed: 0.991^12 = 0.8971888214154765 (claimed 0.89719) → match
- Calculation K26 re-executed: 490/(1-0.91) = 5444.444444444446 (claimed 5444.44) → match
- Calculation K27 re-executed: 49*(1-0.968^24)/0.032 = 829.7063837114368 (claimed 829.71) → match
- Calculation K28 re-executed: 49*(1-0.968^24)/0.032/490-1 = 0.6932783341049731 (claimed 0.69328) → match
- Calculation K29 re-executed: 49*(1-0.99^24)/0.01 = 1050.177110044628 (claimed 1050.18) → match
- Calculation K30 re-executed: 2*490 = 980 (claimed 980) → match
- Calculation K31 re-executed: (49*(1-0.968^12)/0.032-588*0.968^12)/(1-0.968^12) = 299.5575362051453 (claimed 299.56) → match
- Calculation K32 re-executed: 490-(49*(1-0.968^12)/0.032-588*0.968^12)/(1-0.968^12) = 190.4424637948547 (claimed 190.44) → match
- Calculation K33 re-executed: 190.44/(98+190.44) = 0.6602412980169186 (claimed 0.6602) → match
- Calculation K34 re-executed: 0.1*(-98) = -9.8 (claimed -9.8) → match
- Calculation K35 re-executed: 0.2*(-98) = -19.6 (claimed -19.6) → match
- Calculation K36 re-executed: 0.1*(0.9*(-98)+0.1*190.44) = -6.915600000000001 (claimed -6.9156) → match
- Calculation K37 re-executed: 0.2*(0.9*(-98)+0.1*190.44) = -13.831200000000003 (claimed -13.8312) → match
- Calculation K38 re-executed: 0.3*(0.9*(-98)+0.1*190.44) = -20.7468 (claimed -20.7468) → match
- Calculation K39 re-executed: 0.1*(0.5*(-98)+0.5*190.44) = 4.622 (claimed 4.622) → match
- Calculation K40 re-executed: 0.2*(0.5*(-98)+0.5*190.44) = 9.244 (claimed 9.244) → match
- Calculation K41 re-executed: 0.3*(0.5*(-98)+0.5*190.44) = 13.866 (claimed 13.866) → match
- Calculation K42 re-executed: 0.3*(490-49*(1-0.968^12)/0.032) = -1.4385440805185852 (claimed -1.4385) → match
- Calculation K43 re-executed: ((0.91+1.96^2/80)-1.96*sqrt(0.91*0.09/40+1.96^2/6400))/(1+1.96^2/40) = 0.7820569207517788 (claimed 0.78206) → match
- Calculation K44 re-executed: ((0.91+1.96^2/80)+1.96*sqrt(0.91*0.09/40+1.96^2/6400))/(1+1.96^2/40) = 0.9660909570628997 (claimed 0.96609) → match
- Calculation K45 re-executed: 490*0.08*5.5/12 = 17.96666666666667 (claimed 17.967) → match
- Calculation K46 re-executed: (49*(1-0.99^12)/0.01-588*0.99^12)/(1-0.99^12) = 312.63287344213586 (claimed 312.633) → match
- Calculation K47 re-executed: 490-(49*(1-0.99^12)/0.01-588*0.99^12)/(1-0.99^12) = 177.36712655786414 (claimed 177.367) → match
- Calculation K48 re-executed: 177.367/(98+177.367) = 0.6441113132655693 (claimed 0.64411) → match
- Calculation K49 re-executed: 0.3*(0.5*(-98)+0.5*177.367) = 11.905049999999997 (claimed 11.905) → match
- Calculation K50 re-executed: 1.96^2*0.8*0.2/0.05^2 = 245.86239999999998 (claimed 245.86) → match
- Calculation K51 re-executed: 1.96^2*0.9*0.1/0.03^2 = 384.16 (claimed 384.16) → match
- Calculation K52 re-executed: (1.96+0.8416)^2*(0.539*0.461+0.559*0.441)/0.02^2 = 9713.0519231872 (claimed 9713) → match
- Calculation K53 re-executed: 490-11*49 = -49 (claimed -49) → match
- Calculation K54 re-executed: 490-49 = 441 (claimed 441) → match
- Calculation K55 re-executed: 0.968^19 = 0.5390533990397439 (claimed 0.53905) → match
- Calculation K56 re-executed: 0.2*0.10 = 0.020000000000000004 (claimed 0.02) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://recurly.com/research/saas-benchmarks-for-subscription-plans — getaddrinfo ENOTFOUND recurly.com. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does not
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G2 unresolved: The supplied data has no tenure-matched monthly control group (retention of monthly customers with more than a year of tenure), and no outside source can supply it. External evidence on whether annual billing causes lower churn conflicts: E11 attributes the gap to selection, E12 claims a matched effect. The pilot (n=40, hand-picked) cannot separate cause from selection.
- Knowledge gap G3 unresolved: There is no internal breakdown of the 3.2% churn by tenure or segment. Only directional industry evidence (E13) suggests churn is concentrated early.
- Knowledge gap G4 unresolved: Only the break-even framing (E16) and fee arithmetic (E15) could be computed. Sensitivity at 10%, 20% and 30% conversion needs the converter mix (would-have-stayed versus would-have-churned) and renewal rates, which are not available. The 24-month view depends on unknown renewal behavior (E17).
- Knowledge gap G5 unresolved: The memo's 30% conversion assumption and its 'benchmarks' are unsourced. No verifiable industry benchmark for monthly-to-annual conversion was found (E9). Primary Recurly and ProfitWell reports could not be fetched (WebFetch failed: recurly.com not resolvable under the network policy), so no further fetches were attempted.
- Knowledge gap G6 unresolved: The company's intended refund, cancellation and seat true-up terms are not in the supplied documents. Only market examples were found (E18, E19).
5. **Independent validation status:** Graded by separate grader process (eval-grader (general-purpose subagent, claude-opus-5-5), prompts v2); total 100/100; critical failures: none. Grader is the same model family as the agent.
6. **Remaining uncertainty:** 13 item(s), listed above.
7. **Revisions:** 3
- cycle 1 (reanalysis): [coverage/major] D1 [criteriaAssessments C3; verdict; practicalImplications item 5; calculations (no LTV or 24-month calc)] The decision objective and C3 ask about net revenue and LTV, and G4 asks for a 24-month view. The draft only works out year-one break-even (K4, K10-K12) and says any LTV gain 'has to come in year two and later' without putting a number on it. The missing calculation is simple and decides the case. Monthly LTV at 3.2% churn is 49/0.032 = about $1,531, and annual LTV is 490/(1-r) for annual renewal rate r. The plan is LTV-neutral at r of about 68% for an average-churn converter. For a 1%-churn tenured converter, monthly LTV is about $4,900, so r must be at least about 90%. Without this renewal-rate threshold the test's success criterion is incomplete. The draft's vague 'renewal gains must recover about $94.75 per seat per year' cannot be acted on.; [coverage/major] D2 [criteriaAssessments C3; claims CL11; calculations K16] G4 asks for sensitivity at 10%, 20% and 30% conversion across converter mixes. The draft gives one extreme case: 30% conversion, all would-have-stayed (K16 = $29.40 per seat). It has no scenario grid with mixed shares of would-have-churned converters, so the decision-maker cannot see how the result moves with the two key unknowns. A grid can be computed with no new data, using the per-seat deltas the draft already has (-$98 for a stayer, roughly +$5 for a blended converter, gains for early churners).; [reasoning_validity/major] D3 [criteriaAssessments C2 (mechanisms), verdict, edgeCasesAndFailureModes[1], tradeoffs[3], correctedUserAssumptions[1]] The draft states as fact that the pilot's 91% is in-term retention inflated by prepaid lock-in, and that renewal 'was never measured' (C2 mechanisms, edgeCasesAndFailureModes item 2, tradeoffs item 4, verdict). Packet E4 explicitly flags the definition as unclear. A prepaid 12-month term should show near-zero in-term logo churn, so 9% churn within the term is odd. The 2025 cohort's '12-month retention' may well be the month-12 renewal rate. If it is, 91% exceeds the roughly 68% LTV break-even renewal rate (see D1) and is materially favorable evidence, even allowing for selection. The draft resolves an open ambiguity in the direction that supports its conclusion, without justification.; [reasoning_validity/major] D4 [counterarguments[0].response; CL8] The first counterargument response says the company's 67.7% versus the pilot's 91% 'reproduces the same generic gap ... which is what selection alone would produce'. That does not follow. An observational gap that matches an industry observational gap says nothing about how it splits between selection and treatment, because the industry gap may itself contain a causal part (E12). Packet E10 says only that this 'suggests' the pilot is not proof of causation. The draft turns 'not proof of an effect' into 'consistent with no effect', which strawmans the strongest pro-launch argument.
- cycle 2 (reanalysis): [reasoning_validity/major] D1 [furtherResearchThatCouldChangeConclusion[0], [1]; compare verdict and C2] furtherResearchThatCouldChangeConclusion items 1-2 say that confirming the pilot's 91% is a renewal rate, together with tenured monthly churn above about 0.9% (or tenured monthly retention of about 70-75%), 'would make the pilot favorable evidence and support a broader launch' and 'would imply a real causal effect'. That treats tenure-matching as enough to remove selection. Per E4, sales hand-picked the pilot accounts, which adds a second selection layer on top of tenure, and the draft itself says in C2 and CL6 that selection beyond observables cannot be ruled out (E11, the E12 limitations). This also contradicts the verdict, which allows scaling only after a randomized or holdout-controlled test. A decision-maker could skip the test after a quick internal data pull.; [decision_usefulness/major] D2 [verdict (Recommendation); practicalImplications[4], [5]; alternatives[0]] The recommendation ties scale-up to a measured month-12 renewal rate beating 1 - 10c. That metric cannot be observed for at least 12 months after enrollment, and enrollment itself runs up to 6 months per E2. The draft gives no test size, though at n=40 the Wilson interval is 78-97% (K43, K44), which cannot separate the 68%/90%/92% thresholds the draft sets. It also gives no interim leading indicators (uptake rate, converter tenure mix versus the 66% would-have-stayed threshold in K33, in-term seat contraction) and no interim decision rule. The decision-maker does not learn what to do in the next 12-18 months or how many accounts the test needs.
- cycle 3 (reanalysis): [reasoning_validity/critical] D1 [verdict step (4); practicalImplications[6] ('Final success rule'); alternatives[0]; tradeoffs[3]] The scale-up rule says to scale if month-12 renewal beats 1 - 10 x the holdout's measured monthly churn. That rule brings back the selection bias the draft warns about everywhere else. The break-even derived in K20/K22 uses c, the converter's own counterfactual monthly churn. A randomized holdout's average churn is the blended base rate (about 3.2%), so the threshold comes out near 68%. The draft itself argues that converters are likely tenured, lower-churn accounts, whose break-even is about 90-92% (K22, K23). Under the stated rule, a renewal rate of about 70-89% would pass even though it destroys LTV for a 1%-churn converter pool. The practical-implications bullet lists 68/90/92% as alternatives, but the operative rule in the verdict and in practicalImplications[6] fixes c as holdout churn. A correct rule would either (a) compare revenue per offered account against revenue per holdout account (intention-to-treat, the proper use of randomization), or (b) estimate c from holdout accounts matched to the converters' characteristics, such as tenure and seat count.; [reasoning_validity/major] D2 [K52; claim CL20; practicalImplications[4]; alternatives[0]; edgeCasesAndFailureModes[last]] K52 sizes the test to detect a 5-point difference in 12-month logo retention between offered and holdout arms (68% vs 73%). There are two problems. First, 12-month logo retention in the offered arm is pushed up mechanically by prepaid in-term lock-in, which the draft says elsewhere must not be the success metric (E17, practicalImplications[6]). Second, at 10-30% uptake, a 5-point difference between arms means converters would need a retention gain of about 17-50 points, so the sizing does not match a plausible effect size. Sizing the test on per-account revenue or retention measured after renewal (for example at 24 months) would match the draft's own decision logic. The stated feasibility figure of about 1,302 accounts per arm, and the conclusion drawn from it, are therefore unreliable.; [decision_usefulness/major] D3 [verdict step (3); practicalImplications[5]; furtherResearchThatCouldChangeConclusion[2]] The month-6 interim rule says to pause if more than about 64-66% of converters 'would have stayed'. That counterfactual cannot be observed. The draft substitutes an undefined proxy, 'tenured accounts with no churn-risk signals', without saying how that proxy maps to would-have-stayed probability. The 64-66% threshold is also a year-one break-even only (K33, K48). Across a lifetime the plan can still lose value at a lower stayed share when renewal falls short of 1 - 10c, and gain value at a higher one when it exceeds it. As written, the interim gate cannot be put into practice and may conflict with the lifetime rule.
8. **Final quality gates:**
- PASS coverage: [minor/reviewer] D5 [remainingUncertainty; practicalImplications item on confirming the pilot] The draft never notes that the source does not state the price or discount the 2025 pilot accounts paid. Extrapolating the pilot's retention to a $490 (16.7%) offer depends on that price. The draft lists the pilot's definition, refund terms and selection criteria as unknowns but omits its price.
- PASS evidence_sufficiency: [minor/reviewer] D4 [C2 assessment; CL6; K14, K43, K44] 91% retention on exactly 40 accounts is not possible as a logo count: 36/40 = 90% and 37/40 = 92.5%. The draft computes '3.6 churned accounts' (K14) and a Wilson interval on p=0.91, n=40 without noting the inconsistency. The inconsistency itself suggests that the denominator, the weighting (seat or revenue) or the definition differs from what is stated. That strengthens the draft's 'definition unclear' point, but it is not used, and the interval figures treat the data as exact.
- FAIL reasoning_validity: [major/reviewer] D1 [verdict step (4); practicalImplications 'Final success rule'; alternatives[0]; CL17 vs CL14] The primary success rule is to scale only if the offered arm is ahead on cumulative revenue per account at about month 19, with the CI excluding a loss. That rule conflicts with the draft's own lifetime analysis and with the decision objective (net revenue AND LTV). The draft shows that a 1%-churn converter cannot break even within 24 months even at 100% renewal ($980 vs $1,050.18, K29/K30). Its LTV break-even for such a converter is 90% renewal (K22). So for the tenured, low-churn converter pool the draft expects, the 19-month revenue comparison is built to reject the plan, even in cases where renewal above 1-10c makes lifetime LTV positive. The primary rule and the fallback (renewal > 1-10c) can therefore give opposite answers on the same data, and the draft does not say which governs or why. A truncated revenue horizon is labelled 'free of selection' but is biased against the very outcome it is meant to judge. | [major/reviewer] D2 [verdict step (4) fallback; practicalImplications sample-size item and 'Final success rule'; CL20; K50/K51] The fallback rule is not able to decide what it is meant to decide. It needs the lower confidence bound of converters' month-12 renewal to exceed 1-10c, measured on about 250 converted accounts (K50, ±5 points). The relevant thresholds for a tenured pool are 90-92% (K22, K23). With ±5-point precision, observed renewal would have to be about 95-97% to pass, so a true 92-94% renewal, which is LTV-positive, would usually fail. The threshold 1-10c also multiplies the estimation error in c, taken from matched holdout accounts, by 10. An error of 0.2 points in monthly churn moves the threshold by 2 points. The draft sizes only the renewal estimate and ignores the uncertainty in c and in the difference. So 'at least about 250 accounts' is presented as sufficient when it is not. | [minor/reviewer] D3 [verdict step (3); practicalImplications 'Timeline and interim rule'; K33/K48] The month-6 interim gate (do not widen the offer if predicted would-have-stayed share > ~64-66%) trips for essentially any realistic converter pool. Even a pool that exactly mirrors the blended base has a would-have-stayed share of 67.7% (K3), which is above the gate. Any tenured pool, the expected case, will be far above it. The gate therefore carries almost no information, and the draft does not note this. | [minor/reviewer] D6 [K52, K55; CL20; practicalImplications sample-size item] The test's power calculation (K52, K55) uses blended 3.2% churn for the holdout baseline (53.9% still paying at month 19). The test population is existing accounts, and the draft itself argues that churn is concentrated in new accounts (E13). Using the blended rate misstates the baseline, and therefore the required sample, for a sample drawn from the existing base.
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability
