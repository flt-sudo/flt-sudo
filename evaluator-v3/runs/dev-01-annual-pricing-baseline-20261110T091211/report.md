# Evaluation: Launching a $490/year annual plan against $49/month

## 1. Verdict

**Don't launch on the proposal as written. Launch only after fixing it, and as a measured experiment.**

- **The discount is wrong.** $49 × 12 = $588 a year. $490 is a **16.7% discount**, which is "two months free". It is not 25%. A true 25% discount would be **$441**. Advertising $490 as "25% off" would overstate the saving and could expose the company to misleading-pricing complaints.
- **The price is reasonable.** 16.7% is the most common SaaS annual discount (Recurly), inside the usual 15–20% range. So $490 is a sensible price. The memo is wrong about the number it quotes, not about the price.
- **The churn claim has no reliable support.** The only evidence that annual plans retain better is a hand-picked pilot of 40 tenured accounts. That evidence is too biased to project "substantially lower churn". By my calculations, if the customers who switch are mostly the loyal ones, the plan could *reduce* revenue.

**Recommendation:** Launch $490 as "2 months free" (about 17% off). Never call it 25%. Offer it first in a controlled way: to new sign-ups at checkout, and/or a randomized offer to existing monthly customers with a holdout group. Judge it on incremental net revenue retention against that holdout, not on how many customers switch.

## 2. Evaluation criteria
1. Whether the pricing claim (25%) is arithmetically correct and safe to advertise.
2. Unit economics: net revenue per customer over 12 months and lifetime, after payment fees.
3. Whether the evidence supports "cuts churn substantially": is the effect real, or just self-selection?
4. Effect on the whole customer base: cannibalization versus retention gain at the assumed 30% conversion.
5. Secondary effects: cash flow, fees, revenue recognition, seat changes, refunds.
6. How the price compares with market norms.

## 3. Inputs (from the memo and the churn data)
| Input | Value |
|---|---|
| Monthly price | $49/seat/month → $588/seat/year |
| Annual price | $490/seat/year, paid upfront |
| Seats per customer | 8 → $392 monthly charge, $3,920 annual charge |
| Monthly logo churn | 3.2%/month (trailing 12 months, all monthly customers) |
| Payment fees | 2.9% + $0.30 per charge |
| Pilot annual retention | 91% over 12 months, n = 40, hand-picked customers with more than a year of tenure |
| Conversion assumption | 30% of monthly customers switch within 6 months (no source given) |

## 4. Detailed analysis

### 4.1 The discount figure
- (588 − 490) / 588 = **16.7%**.
- $588 / $490 = 1.20. Monthly costs 20% *more* than annual, which is a different statement from "25% off".
- To give 25% off you would charge 0.75 × 588 = **$441**.
- The memo's reason for the price ("benchmarks say 25% is the sweet spot") therefore doesn't fit the price it proposes. If 25% really were needed to get 30% conversion, then $490 would convert less than the memo expects. If 16.7% is enough, the "25%" story is just mislabelled. Either way, the 30% conversion assumption has no stated source.

### 4.2 What current churn implies
- 12-month retention on monthly billing = 0.968^12 = **67.7%**. That is 32.3% annual logo churn. (Churn compounds, so 3.2% × 12 = 38.4% is not the right figure.)
- A new monthly customer is expected to pay for (1 − 0.968^12) / 0.032 = **10.10 of the next 12 months**.

### 4.3 Revenue per customer (8 seats), net of payment fees
| Scenario | Monthly billing | Annual billing at $490 | Difference |
|---|---|---|---|
| **Average customer, first 12 months** (expected churn) | $3,958 gross − $118 fees = **$3,841** | $3,920 − $114 = **$3,806** | −$35 (−0.9%) |
| **Customer who would have stayed all year anyway** | $4,704 − $140 = **$4,564** | **$3,806** | **−$758 (−16.6%)** |
| Fees per full year | $140.02 (12 charges) | $113.98 (1 charge) | annual saves $26 |

How to read this:
- **For a typical customer, $490 upfront is worth about the same as monthly billing over the first year.** Most of the discount is paid for by the fact that a prepaid customer can't churn during the year. (A monthly customer is expected to pay about $495 per seat over 12 months, very close to $490.)
- **For a customer who would have stayed anyway, the discount is a straight loss of about $758 a year.** That is the cannibalization risk.

### 4.4 Lifetime value and break-even renewal rates
Net monthly revenue per customer is $392 × 0.971 − $0.30 = $380.33. I use simple constant-churn lifetime value, net of fees, undiscounted, with gross margin left out because we don't have it.

- Lifetime value on monthly billing at 3.2% churn: 380.33 / 0.032 ≈ **$11,885**.
- Lifetime value on annual billing with renewal rate *r*: 3,806 / (1 − r).
- **Break-even renewal rate for a typical customer: r ≈ 68.0%.** That is almost exactly today's implied 12-month retention (67.7%). So for typical customers, any real improvement in renewal is pure gain. At r = 80%, lifetime value is about $19,000. At the pilot's 91%, it is about $42,300.
- **For self-selected (loyal) customers the comparison flips.** A converter whose real monthly churn would have been *c* breaks even with a 91% annual renewal rate only if c ≥ 380.33 / 42,289 ≈ **0.90%/month**, which is about 89.7% annual retention. Customers who have stayed more than a year often churn far below the 3.2% average, since early-tenure churn dominates blended rates. If they churn at, say, 0.75%/month, their monthly-billing lifetime value is about $50,700, and switching them to annual at 91% renewal *loses* about $8,400 each.

### 4.5 The pilot is biased
The 91% figure comes from 40 accounts that sales hand-picked from customers who had already stayed more than a year. That design has four problems:
- **Survivorship and tenure bias.** These accounts had already passed the high-churn early months. We don't know what the same group's retention would have been on monthly billing, which is the comparison that matters.
- **Selection by sales.** Sales would naturally pick healthy, engaged accounts.
- **Small sample.** With n = 40, 91% is about 36 of 40 retained. A 95% interval is roughly 78–97%.
- **Timing.** Annual customers can only churn at renewal. Early dashboards after an annual push will show churn falling for about 10 months whether or not anything really changed.

So the data shows that annual customers *are* low-churn. It does not show that the annual plan *makes* customers low-churn.

### 4.6 Effect on the whole base at 30% conversion
Per 100 monthly customers, with 30 converting:
- **Worst case (pure cannibalization):** the converters are customers who would have stayed. The loss is about 30 × $758 ≈ **$22,700 a year, roughly 5% of that base's run-rate revenue**, with no retention benefit.
- **Neutral case:** converters look like the average customer and renewal stays near 68%. The effect is roughly zero.
- **Upside case:** converters look like the average customer and the commitment genuinely lifts renewal to 80–90%. Each converter's lifetime value goes from about 1.6× to 3.5× its current level, which is a large gain.
- **Most likely in practice:** a mix. Customers who choose to switch skew toward the loyal end, especially existing customers within 6 months. Annual plans offered at first signup suffer less from this selection.

### 4.7 Secondary effects
- **Cash flow:** at a 10%/year cost of capital, getting the year's revenue upfront is worth about 4% of the year's revenue (about $160 per average customer). That roughly cancels the $35 shortfall in §4.3. It does nothing for the $758 cannibalization loss.
- **Revenue recognition:** under ASC 606, annual prepayments are recognized evenly over the year. The plan improves cash and deferred revenue, not reported revenue.
- **Seats:** annual billing per seat locks in seat counts, which blocks seat reductions (good) but complicates mid-term additions (you need prorated true-ups). A policy for both is needed.
- **Refunds and cancellations:** if annual customers can cancel and get a prorated refund, the "can't churn during the year" benefit largely disappears and the first-year numbers in §4.3 get worse.
- **Fees:** annual billing saves about $26 per customer per year in processing fees. That is minor.

## 5. Strengths and weaknesses of the proposal
**Strengths**
- $490 is a standard, defensible price: "2 months free", the most common SaaS annual discount.
- For a typical customer it costs about nothing in the first year, and it brings upfront cash and lower fees.
- Industry evidence consistently shows annual-billed customers churn less, and some of that is a real commitment effect.

**Weaknesses**
- The headline figure is wrong (16.7%, not 25%).
- The churn evidence is a biased pilot, and the 30% conversion figure has no source.
- It ignores cannibalization of loyal monthly customers.
- It has no test design and no success measure.
- It doesn't address refunds, seat changes or proration.

## 6. Alternatives
| Option | Pros | Cons |
|---|---|---|
| **$490 "2 months free", tested with a holdout** (recommended) | Market-standard price, honest framing, you learn the real effect | Takes 12+ months to see renewals |
| $441 (a true 25% off) | Matches the memo's own rationale | 25% is at the high end of norms; costs about $1,128/year per full-year customer; the plan breaks even only if renewal rises to about 72%+ |
| $529 ("1 month free", about 10% off) | Less cannibalization | Probably lower uptake |
| Annual plan for new sign-ups only | Avoids most self-selection among existing loyal customers | Slower to roll out |
| Targeted retention offers (an annual offer to customers showing churn risk, onboarding fixes for early-tenure churn) | Aims at where the 3.2% churn actually comes from | More work to run |
| Do nothing | No cannibalization | Gives up the commitment effect and the cash |

## 7. Tradeoffs
- **More customers switching vs. less cannibalization.** Deeper discounts bring in more switchers but disproportionately pay customers who would have stayed.
- **Cash now vs. revenue per customer.** Annual brings cash forward but lowers yearly revenue from loyal accounts by 16.7%.
- **Fast rollout vs. learning.** Offering it to everyone at once makes the real effect impossible to measure.

## 8. Edge cases and failure modes
- Early dashboards show churn "falling" for 10 months simply because annual customers can't churn yet. Success gets declared too early, and then renewal season disappoints.
- Prorated refunds let annual customers cancel mid-year, which erases the retention benefit.
- Seat expansion is billed only at renewal, so expansion revenue arrives late.
- Customers who would have shrunk their seat count are locked in, which may produce larger downgrades or churn at renewal.
- Marketing the plan as "25% off" invites customer complaints or regulator attention.
- Sales pushes the annual plan on its best accounts to hit a conversion target, which maximizes cannibalization.

## 9. Counterarguments, and my response
- *"Annual customers churn far less, and every benchmark says so."* The direction is well supported. But published gaps (for example roughly 8% vs. 32% annual churn) mix the effect of the plan with the type of customer who picks it. This company's own pilot is a clear example of that mixing.
- *"Even with no retention gain, we lose almost nothing in year one."* True for typical customers (−0.9%). Not true for the loyal customers who are most likely to switch (−16.6%).
- *"The cash flow is worth it."* It's worth about 4%, which doesn't cover heavy cannibalization.

## 10. Practical next steps
1. Fix the copy: "$490/year: 2 months free (save 17%)."
2. Offer the annual plan at checkout to all new sign-ups. For existing customers, send a randomized offer (for example 50/50, with the holdout never shown the offer). Don't let sales hand-pick accounts.
3. Primary measure: net revenue per customer over 12–24 months, for the offered group versus the holdout (intent-to-treat), broken down by tenure. Secondary measures: conversion rate, and renewal rate at month 12.
4. Before launch, decide the refund policy (preferably no prorated refunds after a short grace period) and the seat true-up policy.
5. Ask Finance for monthly churn broken down by tenure. In particular, find the monthly-billing churn of accounts with more than 12 months of tenure. That is the right comparison for the pilot's 91%. If it is below about 0.9%/month, the pilot shows no gain at all.

## 11. Sources
- Pricing memo (Growth, Oct 2026) and churn data (Finance, trailing 12 months), both supplied with the request.
- [Recurly: SaaS benchmarks for subscription plans](https://recurly.com/research/saas-benchmarks-for-subscription-plans). 16.7% is the most common annual discount; 8.3% is second.
- [InnerTrends: lessons from 100 SaaS companies on yearly discounts](https://www.innertrends.com/blog/saas-pricing-strategies)
- [Monetizely: standard annual vs. monthly discount](https://www.getmonetizely.com/faqs/what-s-the-standard-discount-percentage-for-annual-versus-monthly-subscriptions-in-saas)
- [GrowthSpree: B2B SaaS annual contract discount benchmarks 2026](https://www.growthspreeofficial.com/blogs/b2b-saas-annual-contract-length-multi-year-discount-benchmarks-2026-impact-on-retention-payback). Agency marketing content; says discounts above 25% typically over-discount.
- [ChartMogul: billing cycles](https://chartmogul.com/saas-metrics/billing-cycles/)
- [Baremetrics: annual vs. monthly pricing and retention](https://baremetrics.com/blog/annual-vs-monthly-pricing-better-retention)
- [Beancount: annual vs. monthly billing, cash, churn and deferred revenue](https://beancount.io/blog/2026/10/15/annual-vs-monthly-billing-saas-founders-cash-churn-deferred-revenue-guide). Source of the point that churn looks artificially low after an annual push.
- [David Cummings: economic value of annual contracts](https://davidcummings.org/2011/11/29/the-economic-value-of-annual-contracts-for-saas-startups/)

Note: web pages could not be fetched (the environment's network policy blocked them). The benchmark figures above come from search-result summaries, and many of them are vendor blogs whose methods I could not check.

## 12. Remaining uncertainty
- **Gross margin is unknown.** The lifetime values are revenue net of fees, not profit. Including margin scales the values but does not change any break-even point.
- **Churn by tenure is unknown.** This is the most important missing number (§4.4, §10.5).
- **I assumed churn is constant at 3.2%.** Real churn usually falls with tenure, which strengthens the self-selection concern.
- **Refund and seat policies for the annual plan aren't stated.**
- **The 30% conversion figure and the claimed "25% sweet spot" benchmark have no source.**
- **The pilot interval (about 78–97%) is a rough binomial estimate.**

## Self-assessed quality score: 74/100
The arithmetic, the unit economics and the selection-bias critique are solid and checked against the supplied data. The score is held down by missing margin and tenure-level churn data, by the simple constant-churn lifetime value model, and by external benchmarks that I could only see as search snippets, not verify against their original sources.
