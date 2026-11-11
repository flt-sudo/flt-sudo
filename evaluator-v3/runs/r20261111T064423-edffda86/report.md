# Evaluation: EUR 8M receivable due 15 June 2027. Rate forecast and hedge amount

## Verdict

1. **Nobody can reliably say where EUR/USD will be in June 2027, and the policy says that question shouldn't drive the decision.** Treasury Policy v3, §4.2, says: "Hedge ratios are not to be varied based on management's views of future exchange rates." The treasurer's idea of staying unhedged if she expects the euro to strengthen is the kind of view-based change the policy forbids.
2. **The policy number is 75%, not 50%.** The 50% rule comes from Policy v1 (2021). Policy v3 was board-approved on 22 April 2025 and says it "supersedes v1 and v2". The receivable meets every v3 §4.1 test:
   - it is confirmed;
   - it is worth about USD 9 to 9.4M, well above the USD 1M threshold;
   - it matures in about 7 months (11 Nov 2026 to 15 Jun 2027), within the 12-month limit.
3. **Recommendation:** sell **EUR 6,000,000 forward**, value 15 June 2027, leaving EUR 2,000,000 unhedged. Going below 75%, whether to 50% or to nothing, is a deviation under §4.3 and needs **Audit Committee approval** first.
4. **Don't plan around the bank's 1.1810 forward.** It is an *indicative* quote dated 25 Sep 2026, and the quote itself says it is "valid on the date of issue" only. Market reports from early November put spot near 1.11–1.12, well below the quote's 1.1650. A live forward is therefore likely around 1.12–1.13. Get a live, dealable quote.

## Evaluation criteria
- **Which policy applies:** whether the governing version is correctly identified.
- **Scope:** whether this exposure meets the §4.1 conditions.
- **Governance:** whether the treasurer's preference is allowed under §4.2 and §4.3.
- **Pricing:** whether the forward quote is current and reasonable.
- **Risk:** how the range of USD outcomes compares across hedge ratios.
- **Practicalities:** execution, accounting and alternatives.

## Detailed analysis

### 1. Which policy governs
- **v1 (2021-03):** hedge 50% of confirmed receivables above USD 1M. This is where the user's "50%" comes from.
- **v3 (2025-04-22, board-approved):** hedge 75% using forwards, for receivables above USD 1M with 12 months or less to maturity. It expressly supersedes v1 and v2.
- **Conclusion:** v3 is the binding rule. Using 50% would under-hedge by EUR 2M against the board's own policy. I have not seen v2, but since v3 supersedes it, that doesn't matter. I can't confirm that no v4 exists; the treasurer should check.

### 2. Does §4.1 apply?
| Test | Fact | Result |
|---|---|---|
| Confirmed receivable | "confirmed EUR 8M" | Met |
| Above USD 1M | EUR 8M × ~1.12 ≈ USD 9.0M | Met |
| Maturity 12 months or less | about 7 months from today (about 7.2 months from the 6 Nov data) | Met |
| Instrument | Forward contracts | Forward sale of EUR |

One ambiguity: v3 doesn't say whether "maturity of 12 months or less" is measured from today or from the invoice date. Measured from today, the test is clearly met. If the invoice was raised more than 12 months before June 2027, someone should confirm how the policy is read in practice. I think that is unlikely to matter.

### 3. The forecasting question
- **Forecasts are unreliable.** Exchange rates over periods of months to a year are close to a random walk. Since Meese and Rogoff (1983), studies have found that model forecasts rarely beat "no change" consistently, and published bank forecasts disagree widely. A forecast is not a sound basis for an unhedged USD 9M position.
- **The forward is not a forecast either.** The forward premium comes from interest rate parity: forward = spot × (1 + i_USD·t) / (1 + i_EUR·t).
  - The Sep quote's 1.1810 / 1.1650 is a 1.37% premium over about 0.72 years, which implies roughly a 1.9% annual USD–EUR rate gap. That was plausible then.
  - Reported October 2026 settings are Fed 3.75–4.00% and ECB deposit rate 2.50%, a gap of roughly 1.3–1.5%.
- **What this means for the company.** As a USD-based seller of EUR, you *earn* the forward premium. Hedging locks in a rate above spot, so it doesn't cost you anything up front, and the hedge isn't "expensive".
- **The real choice.** The decision is how much variance in the USD result to accept, not a bet on direction. The policy has already set that tolerance at 25% open.

### 4. Is the quote current?
- The quote's spot was 1.1650 on 25 Sep. Reported closes were about 1.114 on 6 Nov, and the pair traded near 1.12 in early November. These come from secondary market sites, so they need confirming.
- **My estimate of a live forward (an estimate, not a quote).** Using spot ≈ 1.115, t ≈ 214/360, and a gap of ≈ 1.4%, the forward points are about +0.009. That puts the live forward near **1.12–1.13**.
- **Why it matters.** Planning with 1.1810 would overstate hedged proceeds on EUR 6M by about USD 330–370k (6M × ~0.055–0.06). Get firm quotes from the bank and preferably one or two competing banks, and check the bank's margin against mid-market forward points.

### 5. Scenario analysis
I've assumed an illustrative forward of 1.125. Replace it with the live rate.

| Spot on 15 Jun 2027 | 0% hedged (USD) | 50% hedged (USD) | 75% hedged (USD) |
|---|---|---|---|
| 1.05 | 8.40M | 8.70M | 8.85M |
| 1.12 | 8.96M | 8.98M | 8.99M |
| 1.20 | 9.60M | 9.30M | 9.15M |
| 1.25 | 10.00M | 9.50M | 9.25M |
| Spread from 1.05 to 1.25 | 1.60M | 0.80M | 0.40M |

- **Volatility.** EUR/USD implied volatility is typically about 7–8% a year (an assumption; I didn't check the live figure). Over about 0.6 years, that is about a 5.8% one-standard-deviation move.
  - Fully unhedged, one standard deviation is about **±USD 520k**.
  - At 75% hedged, it is about **±USD 130k**.
- **Gains and losses on the hedge.** The 75% hedge still keeps 25% of any euro upside. Its "opportunity loss" only arises if the euro rises, and in that case the hedged amount still delivers the locked-in USD.

## Strengths and weaknesses of the options
- **75% forward (complies with policy).**
  - Strengths: follows the policy; no up-front premium; earns the forward points; much less variance; the board approved this level of risk.
  - Weaknesses: gives up 75% of the upside if the euro strengthens. If the customer pays late or short, the company faces a mismatch and must roll or close out the forward.
- **50% (v1 rate).**
  - This breaks v3 with no clear governance basis. It is only acceptable with Audit Committee approval.
- **Unhedged (the treasurer's preference).**
  - This breaks §4.2, because it is driven by a market view, and needs approval under §4.3.
  - It concentrates risk of about USD 1.6M across a plausible range.
  - It exposes the treasurer personally if the euro falls.

## Alternatives
- **Options or collars.** Buying a EUR put, or a zero-cost collar, would keep the upside the treasurer wants while setting a floor. However, §4.1 says "using forward contracts", so options would also need Audit Committee approval. A put also costs a premium, which I'd estimate at roughly 2–2.5% of notional for an at-the-money 7-month put, and this should be checked with the bank. If the treasurer feels strongly, this is the right way to raise it with the Committee, rather than simply not hedging.
- **Layered or partial execution.** Booking the EUR 6M in tranches over a few days is fine for execution, as long as the full 75% is in place promptly.
- **Natural hedge.** If the company has EUR payables around June 2027, netting them could change the exposure. Whether net exposure counts under the policy would need confirming.

## Edge cases and failure modes
- **Late or partial payment.** The forward settles on 15 June regardless. Consider a window forward, or agree roll procedures with the bank in advance.
- **Customer credit risk.** A forward does not protect against non-payment and could leave an open short-EUR position. Check the German customer's credit standing and whether trade credit insurance makes sense.
- **Hedge accounting (ASC 815).** To get hedge accounting rather than marking the forward to market through P&L, the hedge must be documented formally at inception. Speak to the auditors before trading.
- **Counterparty limits and ISDA/CSA.** Confirm that the bank's credit line and any collateral terms cover a forward of about USD 6.75M.
- **Policy version.** If a newer policy, or a Committee resolution, exists after v3, it would take precedence.

## Counterarguments
- *"The euro looks set to strengthen."* That may be right, but the policy deliberately takes such views out of the decision. Even if she is right, 25% of the upside is kept.
- *"Hedging locks in a loss if the euro rises."* That is only true compared with hindsight. The forward is above spot, so it locks in more USD than converting at today's rate would.
- *"Policy says 50%."* That was the 2021 policy, and it has been superseded.

## Practical next steps
1. Correct the internal understanding: the hedge ratio is 75%, under v3 §4.1.
2. Request live, dealable forward quotes for selling EUR 6,000,000 for USD, value 15 June 2027, from Northbridge and at least one other bank.
3. Prepare hedge documentation (ASC 815) before trading.
4. If the treasurer wants a hedge below 75%, or options, she should submit a written deviation request to the Audit Committee and not act until it is approved.
5. Monitor the payment date, and agree roll or close-out procedures with the bank.

## Sources
- Run documents: `/home/user/flt-sudo/evaluator-v3/runs/r20261111T064423-edffda86/sources/treasury-policy-v3-2025.md`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T064423-edffda86/sources/treasury-policy-v1-2021.md`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T064423-edffda86/sources/bank-forward-quote.md`
- [Poundsterling Live: Euro-U.S. Dollar History 2026](https://www.poundsterlinglive.com/history/EUR-usd-2026)
- [TradingNews: EUR slips to 1.1220](https://www.tradingnews.com/news/eur-slips-to-112220-as-dollar-rebounds-from-dxy-101-20)
- [ECB euro reference rate, USD](https://www.ecb.europa.eu/stats/policy%5Fand%5Fexchange%5Frates/euro%5Freference%5Fexchange%5Frates/html/eurofxref-graph-usd.en.html)
- [Family Wealth Report: ECB, US Fed hold rates](https://www.familywealthreport.com/article.php/ECB%2C-US-Fed-Hold-Rates%3B-Lagarde-To-Step-Down-%E2%80%93-Wealth-Managers-React?id=209230)
- [Newsquawk: ECB deposit rate 2.50%](https://www.newsquawk.com/headlines/european-deposit-facility-rate-250-vs-exp-25-prev-250)
- [Admiral Markets: ECB meeting October 2026](https://admiralmarkets.com/analytics/traders-blog/ecb-meeting-october-2026)
- Meese, R. and Rogoff, K. (1983), "Empirical exchange rate models of the seventies", *Journal of International Economics*. Cited from memory, not fetched.

## Remaining uncertainty
- **Market data:** current spot and rates come from secondary web sources that partly contradict each other, for example on the Fed's 2026 path. The live forward of 1.12–1.13 is my estimate, not a quote.
- **Volatility and option premium:** both are assumptions I did not check against live data.
- **Policy documents:** no v2 or any later amendment was provided. How the 12-month maturity test is read in practice is not specified.
- **Unknown facts:** the customer's credit standing and any offsetting EUR flows.

## Self-assessed quality score: 84/100
The policy conclusion, the 75% / EUR 6M amount and the governance points come straight from the documents and are high-confidence. The market context and the estimated live forward rely on lower-quality secondary sources and my own approximations, so they carry moderate uncertainty. This score is my own assessment, not an independent check.
