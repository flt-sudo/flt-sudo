# Evaluation: Lumen Trace Replacement Proposal

## Verdict

**Switching does not make financial sense on the terms provided. Do not sign before quarter-end.** The ROI sheet has a 10x arithmetic error. Using Lumen Trace's own published rate, 42 TB of monthly ingest costs **$14,700 a month, not $1,470**. That is **$2,800 a month (23.5%) more** than the current $11,900 invoice. Instead of saving 88%, the switch would cost roughly **$33,600 more per year** under the required 12-month commitment. Signing now could also mean paying both vendors at once until the current contract renews on 2027-03-01.

## Evaluation criteria

1. **Arithmetic correctness.** Does the ROI sheet apply the vendor's own pricing correctly?
2. **Fit to requirements.** Does the offer cover the 30-day compliance retention without extra charges?
3. **Total commitment exposure.** What does the 12-month minimum lock in?
4. **Timing.** How does signing this quarter interact with the current contract's renewal date?
5. **Source reliability.** The ROI sheet was prepared by Lumen Trace's sales team, so it is not independent.

## Detailed analysis

### 1. The core error: 42 TB is 42,000 GB, not 4,200 GB

The pricing page says "1 TB = 1,000 GB for billing". So:

| Step | ROI sheet (vendor) | Correct |
|---|---|---|
| Monthly ingest | 42 TB | 42 TB |
| Converted to GB | **4,200 GB** | **42,000 GB** |
| x $0.35/GB | $1,470 | **$14,700** |
| vs. current $11,900 | -88% | **+23.5%** |

The sheet drops one zero when converting TB to GB. Every downstream figure, including the "88% saving" headline, comes from that one mistake.

### 2. Retention costs

- Compliance requires 30 days of retention (usage report), and Lumen includes 30-day hot retention.
- So the extended-retention charge ($0.02 per GB-month beyond 30 days) adds **$0** at current requirements.
- Retention neither helps nor hurts the comparison today. It only becomes a risk if retention needs grow (see edge cases).

### 3. Quantitative comparison

| Metric | Current vendor | Lumen Trace (corrected) | Difference |
|---|---|---|---|
| Monthly | $11,900 | $14,700 | +$2,800 |
| 12-month commitment | $142,800 | $176,400 | **+$33,600** |
| Effective $/GB | ~$0.283 | $0.35 | +23.5% |

**Break-even points:**
- **Ingest:** Lumen only becomes cheaper if monthly ingest falls below $11,900 / $0.35 = **34,000 GB (34 TB)**. That is a 19% drop from today's volume.
- **Price:** To match current spend at 42 TB, Lumen would need to charge **$0.2833/GB or less**, about a 19% discount off list.
- **To deliver the claimed 88% saving:** the price would have to be about **$0.0425/GB**, roughly 88% below their published rate. Nothing in the materials supports that.

### 4. Timing and the "lock in the price" pressure

- The current contract renews **2027-03-01**.
- If you sign before the end of this quarter (2026-12-31) and Lumen billing starts right away, you could pay both vendors for January and February 2027. Running both for two months would add up to about **$29,400** of Lumen spend on top of the existing invoices. This depends on your current contract's termination terms and when Lumen's billing would start, neither of which is in the materials.
- "Locking in" a price that is 23.5% higher than what you pay now is not an advantage.
- The renewal date is your real negotiating leverage, and it is still more than three months away. Rushing gives that leverage up.

## Strengths of the proposal

- The pricing structure is simple and transparent: one per-GB rate with 30-day retention included. That makes the error easy to verify and the cost predictable.
- Retention matches the compliance requirement, so there are no hidden retention charges at current needs.
- Pure per-GB pricing could become cheaper if ingest volume drops sharply, for example through log sampling, filtering, or dropping noisy sources.

## Weaknesses and risks

- The headline ROI figure is wrong by an order of magnitude.
- At current volume, the real cost is higher than what you pay today.
- The 12-month minimum commitment locks in that higher cost: about $176,400.
- Pricing is purely linear, so costs rise directly with ingest growth. There are no tiers or volume discounts on the published page.
- The ROI sheet comes from the vendor's sales team and was not independently checked. Given the size of the error, any other figures Lumen supplies should be checked independently.

## Edge cases and failure modes

- **TB vs TiB:** if your 42 TB figure is actually measured in binary units (TiB, about 1,099.5 GB each), billable ingest would be about 46,180 GB, or about **$16,163 a month**. That makes the gap wider. Confirm how your current tool measures volume.
- **Ingest growth:** at 10% annual growth, Lumen's cost rises to about $16,170 a month, and the gap widens if your current contract has flat or tiered pricing.
- **Retention creep:** if compliance or incident-response needs grow to 90 days, the extra 60 days at $0.02/GB-month on about 42,000 GB per monthly cohort adds about **$1,680 a month** once steady state is reached (about 84,000 GB held beyond 30 days).
- **Migration costs not counted:** re-instrumenting agents, rebuilding dashboards and alerts, retraining staff, and possibly running both platforms during the cutover. None of this appears in the ROI sheet, and all of it makes the case worse.
- **Unknowns about the current contract:** whether $11,900 is a flat fee or volume-based, and whether a renewal price increase is planned. If the incumbent is planning a large increase, run the comparison again against the new price.

## Counterarguments considered

- *"Lumen may offer a better negotiated price than list."* Possible. But it would need to be about 19% below list just to break even, and much lower to justify migration costs. Get that in writing as a formal quote with the volume calculation shown. Don't rely on the ROI sheet.
- *"Features or performance might justify paying more."* That is a legitimate but separate argument. It should be made openly as "we'd pay 23.5% more for X", not presented as an 88% saving.
- *"We plan to cut ingest."* If you can credibly get below 34 TB a month, Lumen becomes competitive. But the same reduction would probably also lower your current bill, so compare both vendors at the reduced volume.

## Practical recommendations

1. **Tell your director the ROI sheet has a 10x error.** Show the one-line calculation: 42,000 GB x $0.35 = $14,700.
2. **Don't sign this quarter.** There is no price advantage worth locking in, and a deadline before the 2027-03-01 renewal only reduces your leverage.
3. **Ask Lumen for a corrected, formal quote** with the volume calculation spelled out, including any committed-use discount.
4. **Use the corrected Lumen quote to negotiate the incumbent's renewal.** Get competing quotes from one or two other vendors too.
5. **Before any switch, build a full cost model:** licensing, migration effort, any period running both platforms, expected ingest growth, and retention needs.
6. **Check the measurement units and the current contract's terms:** decimal vs binary TB, the termination notice period, and the renewal price.

## Sources

- `sources/lumen-pricing-page.md`: $0.35/GB, 1 TB = 1,000 GB, 30-day retention included, $0.02/GB-month extended retention, 12-month minimum commitment.
- `sources/lumen-roi-sheet.md`: prepared by Lumen sales; contains the 4,200 GB error.
- `sources/current-usage-report.md`: 42 TB/month, 30-day compliance retention, $11,900/month, renewal on 2027-03-01.
- I did no web research. The materials are internal, and the conclusion depends only on arithmetic using the vendor's own published rates.

## Remaining uncertainty

- Whether Lumen offers negotiated pricing below list. This is the only thing that could change the verdict on licensing cost alone.
- The current contract's termination terms and renewal price.
- How the 42 TB figure is measured (decimal vs binary) and how fast ingest is growing.
- Non-price factors such as features, reliability and support, which were outside the materials provided.

## Self-assessed quality score: 90/100

The central finding is a deterministic arithmetic check against the vendor's own pricing, so I have high confidence in it. Points are deducted because there is no information on the current contract's terms, Lumen's negotiated pricing, migration costs, or non-financial factors.
