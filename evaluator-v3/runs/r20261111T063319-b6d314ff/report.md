# Evaluation: FX hedging decision for a confirmed EUR 8M receivable due 15 June 2027 (US company, USD functional currency), including the requested EUR/USD point forecast for June 2027

**Decision objective:** Decide what share of the EUR 8M receivable to hedge, with which instrument, and on what terms, in line with the board-approved treasury policy currently in force. The treasurer's plan to hedge depending on whether she thinks the euro will strengthen needs checking against the policy, since policy v3 s.4.2 appears to rule out changing hedge ratios based on rate views. The requested June 2027 rate forecast can't be answered as a point estimate. It can only be framed as the forward rate, which reflects interest-rate differentials and is not a forecast, plus a range of possible outcomes.

## Verdict

Hedge 75% of the receivable, which is EUR 6.0M (K1), with an outright EUR/USD forward contract for value 15 June 2027. This follows Treasury Policy v3 s.4.1 (E1). v3 is board-approved (2025-04-22) and states that it supersedes v1 and v2. The 50% figure in the request comes from the superseded v1 (E4, E5). The user's statement could also point to a governance gap, for example v3 never adopted, later rescinded, or changed by the unsupplied v2. That has to be checked before execution (E20). The receivable appears to meet the s.4.1 conditions: it is confirmed, it is about USD 9M equivalent, well above the USD 1M threshold (K6), and it matures in about 216 days, within 12 months (K10, E19). Policy v3 s.4.2 forbids changing the hedge ratio because of management's views on exchange rates (E2). So the treasurer's plan to stay unhedged if she expects the euro to strengthen is not allowed. Any departure from 75% or from forwards needs Audit Committee approval under s.4.3 (E3), and no such approval was found (E20). The requested June 2027 EUR/USD point forecast cannot be reliably determined. Random-walk and professional-forecaster research shows that point forecasts at this horizon have no dependable accuracy (E13, E14). The forecast question can only be framed as the forward plus a range of outcomes. The forward premium has the sign covered interest parity predicts. It is a price shaped by interest-rate differentials, not a market forecast that the euro will rise (E11, E12). The 2026-09-25 bank quote (spot 1.1650, forward 1.1810) is stale and indicative only (E6). Spot has since fallen to about 1.12, and the latest reported close was lower still at 1.1142 on 6 Nov (E8). USD proceeds must therefore be locked in from a live dealable quote. As an illustration only, an interest-parity forward from 1.12 spot is about 1.1291, giving about USD 6.77M on EUR 6M, against USD 7.086M implied by the stale quote (K3, K9, K11, K19). Using the 1.1142 print would lower the illustrative figure further. No implied volatility was found (E17). Under a clearly labelled assumed 8% annualised volatility, a 1-sigma range for June 2027 spot around 1.12 is about 1.051 to 1.189 (K16-K18). Across that range, total USD proceeds are about USD 8.88M to 9.15M with the 75% hedge, against about USD 8.41M to 9.51M unhedged (K20-K24, K6). Confidence is moderate, not high, for three reasons: v3's status and authenticity have not been confirmed against governance records (E20), no live forward or implied volatility was available (E17), and the receivable's timing, credit lines and hedge-accounting election are unknown (E21).

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** The treasury policy requires hedging 50% of exposures.
  **Correction:** The 50% figure is from v1 (2021). v3 (board-approved 2025-04-22) supersedes it and requires 75% for this receivable, which is EUR 6M, using forwards. This is subject to confirming that v3 is in force and was not rescinded (E20). [E1, E4, E5, E20]
- **Assumption:** It is possible to know where EUR/USD will be in June 2027.
  **Correction:** A reliable point forecast cannot be determined. At this horizon, models and professional forecasters generally do not beat a random walk, and forecasts disagree widely. The question can only be framed as the forward plus a range of outcomes. [E13, E14, E15]
- **Assumption:** Whether to hedge can depend on whether the euro is expected to strengthen.
  **Correction:** v3 s.4.2 forbids varying hedge ratios on exchange-rate views. Any deviation requires Audit Committee approval under s.4.3. [E2, E3]
- **Assumption:** The forward premium over spot means the market expects the euro to rise.
  **Correction:** The sign of the premium is consistent with the USD-EUR interest-rate differential under covered interest parity. Its size is only partly explained by policy rates, and the remainder may be margin or term-rate effects. It is not an expectation of appreciation. [E11, E12]
- **Assumption:** The bank's forward quote (1.1810, spot 1.1650) is usable for the decision.
  **Correction:** The quote is dated 2026-09-25, indicative, and valid only on its issue date. Spot has since fallen to about 1.12 (1.1142 at the 6 Nov close). A live dealable quote is needed. [E6, E8]

## Criteria

### C1 Compliance with the treasury policy in force (hedge ratio, instrument, governance) (weight 30)

v3 governs. s.4.1 requires hedging 75% of each confirmed foreign-currency receivable above USD 1M equivalent with maturity of 12 months or less, using forwards (E1). That means EUR 6M (K1), not the EUR 4M (K2) a 50% ratio would give. s.4.2 bars view-based changes to the ratio (E2). s.4.3 requires Audit Committee approval for any deviation (E3). The v1 50% rule (E4) is superseded under v3's own header (E1). The user's 50% premise (E5) matches v1, not v3. Because the user is an insider, the premise could also signal a governance gap (v3 not adopted or rescinded, or v2 changing the rules). This cannot be ruled out from the packet (E20). [E1, E2, E3, E4, E5, E19, E20]

*Mechanisms:* Treasury policies use a fixed hedge ratio and ban view-based changes so that treasury cannot take speculative currency positions without board-level oversight. The supersession clause makes the most recent board-approved version govern. The Audit Committee approval step routes any exception to the oversight body instead of leaving it to treasurer discretion.

*Strengths:*
- v3 text is VERIFIED from the supplied file and states explicitly that it supersedes v1 and v2 (E1)
- The ratio, instrument and governance rules are all explicit (E1, E2, E3)
- The receivable appears to meet every s.4.1 condition (E19, K6, K10)

*Weaknesses:*
- v3's authenticity and board approval have not been confirmed against minutes or governance records (E20)
- v2 was not supplied, and no later version, rescission or exception could be ruled out (E4, E20)
- The v3 file is an excerpt. Definitions and counterparty limits are not visible (E1)

### C2 Correct handling of the EUR/USD forecast question (weight 15)

A reliable June 2027 point forecast cannot be produced. At 1-12 month horizons a random walk forecasts major dollar rates as well as structural and time-series models (E13). Professional forecasters as a group do not beat it (E14). Short-horizon forecasts disagree widely, for example about 1.068 vs about 1.131 for end-November 2026 (E15). The forward premium on the old quote (about 1.37% over 263 days, about 1.91% annualised: K4, K5) has the sign covered interest parity predicts, because USD rates are above EUR rates (E9, E10, E11). Its size is only partly explained by the policy-rate gap. Parity at policy rates gives about 1.1765 against the quoted 1.1810 (K8), so most but not all of the premium is accounted for. The rest may be bank margin or term-rate expectations (E11). Either way the premium is not an expectation of euro appreciation (E12). The forecast question is therefore framed as the forward (illustratively about 1.1291 from current spot, K19) plus a range of outcomes (about 1.051 to 1.189 at 1 sigma under an assumed 8% volatility, K17, K18; see C4). In any case, s.4.2 makes a rate view irrelevant to the hedge ratio (E2). [E2, E9, E10, E11, E12, E13, E14, E15, E17]

*Mechanisms:* Covered interest parity is a no-arbitrage identity. The forward equals spot adjusted by the interest differential, so a higher-yielding USD means EUR/USD forwards trade above spot. Empirically the forward is a biased predictor of future spot (the Fama puzzle), and exchange-rate surprises at this horizon are dominated by news that cannot be forecast.

*Strengths:*
- The forecast-accuracy literature is CORROBORATED (E13, E14)
- The CIP mechanism is CORROBORATED (E12), and the sign checks out against current policy rates (E9, E10, E11)

*Weaknesses:*
- The literature evidence is from search snippets. The original studies used older data and other currency pairs (E13, E14)
- One cited paper suggests the sign of the Fama coefficient changed after the GFC (E12)
- The size of the quoted premium is not fully reconciled with policy rates. Matched-tenor rates are needed (E11, K8)
- The outcome range rests on an assumed volatility, not a market quote (E17)

### C3 Accuracy and freshness of hedge pricing inputs (weight 15)

The Northbridge quote (spot 1.1650, forward 1.1810, value 2027-06-15, dated 2026-09-25) is marked 'indicative only; valid on the date of issue' (E6). Spot was about 1.12 in early November 2026 (E8), about 3.86% below the quoted spot (K7). The latest reported close in E8 is 1.1142 on 6 Nov, slightly below 1.12, so the rounded 1.12 slightly flatters current levels. The stale quote implies USD 7.086M on EUR 6M (K3). That figure is unusable. A rough parity check on the old quote, using mid policy rates, gives a fair forward of about 1.1765 against the quoted 1.1810 (K8). This suggests the bank's points may include a margin or reflect term-rate expectations (E11). It is not conclusive because policy rates are not matched-tenor OIS rates (E9, E10). An illustrative parity forward from 1.12 spot over 216 days is about 1.1291 (K19), giving about USD 6.77M (K9). That is about USD 0.31M less than the stale figure (K11). Starting from the 1.1142 print would make both the illustrative proceeds lower and the gap to the stale figure larger. [E6, E8, E9, E10, E11]

*Mechanisms:* Forward outright = spot + forward points. Spot moves pass almost one-for-one into the outright, so a spot fall of about 4.5 big figures makes the old outright meaningless. The points themselves depend on the term interest differential and the dealer's credit and margin charges.

*Strengths:*
- The value date in the quote matches the receivable due date (E6)
- The spot staleness is CORROBORATED by several reported closes (E8)

*Weaknesses:*
- No live dealable forward, no bid/ask and no separate forward points are available (E6, E8)
- The parity checks use policy rates, not 7-month OIS or deposit rates (E9, E10, E11)
- The current spot comes from search summaries, and no 11 Nov 2026 rate was found. The latest print (1.1142) is below the rounded 1.12 used in the illustrations (E8)

### C4 Quantified USD outcome range: hedged vs unhedged (weight 15)

No numeric 7-month or 1-year implied volatility was found (E17). The only information is qualitative: 3-month implied vol has recently declined (E16). To give the treasurer a sense of typical outcome sizes, this section uses a clearly labelled assumed volatility of 8% annualised. That is an assumption, not market data. Over 216 days it gives a 1-sigma move of about 6.15% (K16), so June 2027 spot ranges from about 1.051 to 1.189 around 1.12 (K17, K18). Under a roughly normal approximation, about two-thirds of outcomes would fall in that band. Hedged proceeds are 6M x F plus 2M x spot at maturity, with F the illustrative parity forward of about 1.1291 (K19). Across the band they are about USD 8.88M at 1.051, USD 9.01M at 1.12 and USD 9.15M at 1.189 (K20, K21, K22). Unhedged proceeds (8M x spot at maturity) are about USD 8.41M, USD 8.96M and USD 9.51M (K23, K6, K24). The 1-sigma band is therefore about USD 0.28M wide hedged and about USD 1.10M wide unhedged (K25, K26). In sensitivity terms, each 0.01 move in EUR/USD changes proceeds by USD 20,000 hedged and USD 80,000 unhedged (K12, K13). A wider ±0.10 stress range (about 1.45 sigma under the assumed vol) gives spreads of USD 0.4M and USD 1.6M (K14, K15). All levels must be recomputed from a live forward and a market implied-vol quote. [E8, E9, E10, E11, E16, E17]

*Mechanisms:* Locking in 75% at the forward rate removes three-quarters of the exchange-rate exposure, so the spread of USD outcomes shrinks in proportion. The cost is giving up the gain on the hedged portion if the euro rises. Under a random-walk view the centre of the distribution is current spot. Volatility times the square root of time sets the width.

*Strengths:*
- The scenario levels and sensitivities are exact arithmetic on stated inputs and do not depend on a forecast (K12-K26)
- Showing proceeds at specific rates makes the hedged-vs-unhedged tradeoff concrete

*Weaknesses:*
- The 8% volatility is an assumption, not a market quote, so the band's probability content is illustrative only (E16, E17)
- The forward used (about 1.1291) is a policy-rate parity proxy, not a dealable price (E9, E10, E11)
- Centring on 1.12 ignores the lower 1.1142 print (E8)

### C5 Exposure and hedge-structure fit (amount, timing, settlement risk) (weight 15)

The structure is a EUR 6M forward selling EUR for USD, for value 15 June 2027, matching the receivable's due date (E1, E6). The customer's payment history, contract terms, bank credit lines and hedge-accounting election are all unknown (E21). Those facts decide whether a fixed-date forward, a window forward or a later extension or FX swap is the right tool for late payment. E18 separates two cases: a recognised receivable, and a forecasted sale that has not yet been recognised. Once the receivable is recognised, its remeasurement and the forward's mark-to-market both generally go through earnings and largely offset each other. That makes hedge accounting often optional for a receivable hedge. This offset point is general accounting background, not packet evidence. If hedge accounting is wanted, for example to cover a pre-recognition forecasted sale or to manage how forward points are presented, ASC 815 designation and documentation must be in place when the forward is executed. Forward points may be excluded from the effectiveness assessment (E18). [E1, E6, E18, E21]

*Mechanisms:* Matching the amount and value date means the forward's EUR delivery is funded by the receivable's cash. A payment timing mismatch creates a funding gap that an FX swap or forward extension can roll. For a recognised receivable, remeasurement of the receivable and the forward's fair-value change broadly offset in earnings. Hedge-accounting documentation matters most for the forecasted-transaction phase and for how forward points are presented.

*Strengths:*
- The value date in the quote already matches the due date (E6)
- Hedging 75% rather than 100% leaves EUR 2M of headroom against partial non-payment (K1)

*Weaknesses:*
- Timing and amount certainty, credit lines and accounting election are unknown (E21)
- ASC 815 guidance was seen only in search snippets (E18). Whether the receivable is already recognised is not stated in the packet

### C6 Transparency of reasoning and limits (weight 10)

The governing clauses are cited (v3 s.4.1, s.4.2, s.4.3: E1, E2, E3). The arithmetic is shown in K1-K26. Assumptions are labelled, including the 8% volatility used for the scenario bands. The things that cannot be known are stated: the June 2027 spot, current implied volatility, the live forward, governance confirmation, and receivable and credit details (E17, E20, E21). [E1, E2, E3, E17, E20, E21]

*Mechanisms:* Separating policy-mandated facts from market inputs, labelled assumptions and unknowns lets a reviewer check each layer independently.

*Strengths:*
- Every number is reproducible from stated inputs

*Weaknesses:*
- The illustrative pricing and scenario figures depend on policy-rate proxies and an assumed volatility. They must be replaced with live data (E9, E10, E17)

## Key claims

- **CL1** (material): Treasury Policy v3 (board-approved 2025-04-22) supersedes v1 and v2. It requires hedging 75% of confirmed foreign-currency receivables above USD 1M equivalent with maturity of 12 months or less, using forward contracts. [E1]
- **CL2** (material): The required hedge amount is EUR 6M (75% of EUR 8M). The user's 50% premise would give EUR 4M, and that figure comes from the superseded v1 policy. [E1, E4, E5, K1, K2]
- **CL3** (material): The E1 vs E4 contradiction is resolved in favour of v3. It is more recent (2025 vs 2021), it states that it supersedes v1, and it is board-approved. The user's 50% statement (E5) matches v1. Because it comes from an insider, it may point to a governance gap: v3 never adopted, later rescinded, or the rules changed by the unsupplied v2. The resolution therefore depends on the supplied files being genuine and current, which has not been confirmed against governance records. If confirmation cannot be obtained before the trade, executing the EUR 4M that both v1 and v3 require now, and the remaining EUR 2M once v3 is confirmed, limits the risk of trading under the wrong version. [E1, E4, E5, E20, K1, K2, K12]
- **CL4** (material): The receivable appears to fall within s.4.1. It is described as confirmed. Its value at about 1.12 is about USD 8.96M, above USD 1M. It matures about 216 days after 11 Nov 2026, within 12 months. [E19, E8, E1, K6, K10]
- **CL5** (material): The treasurer's plan to stay unhedged if she expects the euro to strengthen breaches v3 s.4.2, which bars varying hedge ratios based on management's exchange-rate views. Any deviation requires Audit Committee approval under s.4.3. [E2, E3, E5]
- **CL6** (material): No evidence was found of a later policy version, an approved exception or an Audit Committee deviation for this exposure. Whether one exists cannot be determined from the packet. [E20]
- **CL7** (material): A reliable point forecast of EUR/USD for June 2027 cannot be determined. At 1-12 month horizons, models and professional forecasters generally do not beat a random walk on point accuracy. [E13, E14, E15]
- **CL8** (material): The forward premium in the old quote (about 1.37% over 263 days, about 1.91% annualised) has the sign covered interest parity predicts, because USD rates exceed EUR rates. Its size is only partly explained by the policy-rate gap: parity at policy rates gives about 1.1765 against the quoted 1.1810, and the rest may be margin or term-rate expectations. The premium is not a market expectation that the euro will rise. [E9, E10, E11, E12, K4, K5, K8]
- **CL9** (material): The 2026-09-25 Northbridge quote is stale and indicative. Spot has fallen from 1.1650 to about 1.12 (about -3.86%), and the latest reported close was lower still at 1.1142 on 6 Nov 2026. So the USD 7.086M implied by EUR 6M x 1.1810 cannot be relied on. The E6 vs E8 contradiction is resolved in favour of E8 for current market levels because E8 is about seven weeks more recent and is corroborated by several reports. E6 remains valid as a record of the September price. [E6, E8, K3, K7]
- **CL10**: A rough parity check using mid policy rates gives a fair forward of about 1.1765 on the old 1.1650 spot, against the quoted 1.1810. The bank's points may include a margin or reflect term-rate expectations, but policy rates are not matched-tenor rates and the rates in force on 2026-09-25 may have differed. [E6, E9, E10, E11, K8]
- **CL11**: As an illustration only, a parity forward from about 1.12 spot over 216 days at mid policy rates is about 1.1291. That would lock in about USD 6.77M on EUR 6M, about USD 0.31M less than the stale-quote figure. Starting from the later 1.1142 close would make the illustrative proceeds lower and the gap larger. The actual amount must come from a live dealable quote. [E8, E9, E10, E11, K9, K11, K19]
- **CL12**: Current numeric EUR/USD implied volatility for a 7-month or 1-year tenor is not available, so market-based probability bands cannot be produced. Any band shown rests on an assumed volatility. [E17, E16]
- **CL13**: With 75% hedged, each 0.01 move in EUR/USD changes total USD proceeds by USD 20,000, against USD 80,000 fully unhedged. Over a hypothetical ±0.10 stress range (about 1.45 sigma under an assumed 8% volatility) the outcome spread is USD 0.4M hedged vs USD 1.6M unhedged. [E1, K12, K13, K14, K15, K16]
- **CL14**: For a recognised EUR receivable, the receivable's remeasurement and the forward's mark-to-market generally both go through earnings and largely offset. This is general accounting background, not packet evidence. Hedge accounting is therefore often optional, and its absence is not a major earnings risk. If hedge accounting is wanted, for example for a pre-recognition forecasted sale, which E18 treats separately, ASC 815 designation and documentation must be in place when the forward is executed. Forward points may be excluded from the effectiveness assessment. [E18]
- **CL15**: The customer's payment reliability, the certainty of the 15 June 2027 timing, bank credit lines for forwards and the company's hedge-accounting election cannot be determined from the packet. [E21]
- **CL16**: Under an assumed (not market-quoted) 8% annualised volatility, a 1-sigma range for June 2027 EUR/USD around 1.12 is about 1.051 to 1.189. Across that range, total USD proceeds are about USD 8.88M / 9.01M / 9.15M with the 75% hedge at the illustrative 1.1291 forward, against about USD 8.41M / 8.96M / 9.51M unhedged. The 1-sigma band is about USD 0.28M wide hedged and about USD 1.10M wide unhedged. [E8, E9, E10, E11, E17, K16, K17, K18, K19, K20, K21, K22, K23, K24, K6, K25, K26]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Required hedge amount under v3 s.4.1 (75% of EUR 8M), in EUR | `0.75 * 8_000_000` | 6000000 | 6000000 | yes |
| K2 | Hedge amount under the superseded v1 50% ratio, in EUR | `0.5 * 8_000_000` | 4000000 | 4000000 | yes |
| K3 | Illustrative USD proceeds on EUR 6M at the stale 1.1810 forward (not dealable) | `6_000_000 * 1.1810` | 7086000 | 7086000 | yes |
| K4 | Forward premium in the 2026-09-25 quote, percent over the period | `(1.1810 / 1.1650 - 1) * 100` | 1.373 | 1.3733905579399242 | yes |
| K5 | Annualised forward premium, percent, over 263 days (2026-09-25 to 2027-06-15, 365-day basis) | `(1.1810 / 1.1650 - 1) * 365 / 263 * 100` | 1.906 | 1.9060363256580697 | yes |
| K6 | USD equivalent of EUR 8M at about 1.12 spot, to check the USD 1M threshold; also unhedged proceeds at the 1.12 centre scenario | `8_000_000 * 1.12` | 8960000 | 8960000 | yes |
| K7 | Percent change from the quoted spot 1.1650 to about 1.12 early-Nov spot | `(1.12 / 1.1650 - 1) * 100` | -3.863 | -3.862660944205998 | yes |
| K8 | Rough parity-implied forward on the old 1.1650 spot, using mid USD policy rate 3.875% and EUR deposit rate 2.50%, 263 days, ACT/360 | `1.1650 * (1 + 0.03875 * 263 / 360) / (1 + 0.025 * 263 / 360)` | 1.1765 | 1.1764926856714177 | yes |
| K9 | Illustrative USD proceeds on EUR 6M at a parity forward from 1.12 spot over 216 days (mid policy rates, ACT/360) | `6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360)` | 6774600 | 6774620.689655174 | yes |
| K10 | Days from 11 Nov 2026 to 15 Jun 2027 (19 remaining in Nov + Dec through May + 15 in June) | `19 + 31 + 31 + 28 + 31 + 30 + 31 + 15` | 216 | 216 | yes |
| K11 | Overstatement of locked-in USD proceeds from using the stale quote versus the illustrative parity forward | `6_000_000 * 1.1810 - 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360)` | 311400 | 311379.31034482643 | yes |
| K12 | USD change in proceeds per 0.01 EUR/USD move on the unhedged EUR 2M residual | `(8_000_000 - 6_000_000) * 0.01` | 20000 | 20000 | yes |
| K13 | USD change in proceeds per 0.01 EUR/USD move if fully unhedged | `8_000_000 * 0.01` | 80000 | 80000 | yes |
| K14 | USD outcome spread over a hypothetical 0.20 EUR/USD stress range (±0.10) with the 75% hedge | `2_000_000 * 0.20` | 400000 | 400000 | yes |
| K15 | USD outcome spread over a hypothetical 0.20 EUR/USD stress range (±0.10) if fully unhedged | `8_000_000 * 0.20` | 1600000 | 1600000 | yes |
| K16 | 1-sigma percent move in EUR/USD over 216 days under an ASSUMED 8% annualised volatility (8% x sqrt(216/365)) | `8 * sqrt(216 / 365)` | 6.154 | 6.154183341657911 | yes |
| K17 | Lower 1-sigma EUR/USD scenario around 1.12 spot under the assumed 8% volatility | `1.12 * (1 - 0.08 * sqrt(216 / 365))` | 1.0511 | 1.0510731465734315 | yes |
| K18 | Upper 1-sigma EUR/USD scenario around 1.12 spot under the assumed 8% volatility | `1.12 * (1 + 0.08 * sqrt(216 / 365))` | 1.1889 | 1.1889268534265687 | yes |
| K19 | Illustrative parity forward rate from 1.12 spot over 216 days (mid policy rates, ACT/360) | `1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360)` | 1.1291 | 1.1291034482758624 | yes |
| K20 | Total USD proceeds with 75% hedge (EUR 6M at illustrative forward + EUR 2M at lower 1-sigma spot) | `6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12 * (1 - 0.08 * sqrt(216 / 365))` | 8876800 | 8876766.982802037 | yes |
| K21 | Total USD proceeds with 75% hedge at the 1.12 centre scenario | `6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12` | 9014600 | 9014620.689655174 | yes |
| K22 | Total USD proceeds with 75% hedge (EUR 6M at illustrative forward + EUR 2M at upper 1-sigma spot) | `6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12 * (1 + 0.08 * sqrt(216 / 365))` | 9152500 | 9152474.39650831 | yes |
| K23 | Unhedged USD proceeds on EUR 8M at the lower 1-sigma spot | `8_000_000 * 1.12 * (1 - 0.08 * sqrt(216 / 365))` | 8408600 | 8408585.17258745 | yes |
| K24 | Unhedged USD proceeds on EUR 8M at the upper 1-sigma spot | `8_000_000 * 1.12 * (1 + 0.08 * sqrt(216 / 365))` | 9511400 | 9511414.82741255 | yes |
| K25 | Width of the 1-sigma USD proceeds band with the 75% hedge (EUR 2M exposed) | `2 * 2_000_000 * 1.12 * 0.08 * sqrt(216 / 365)` | 275700 | 275707.4137062744 | yes |
| K26 | Width of the 1-sigma USD proceeds band if fully unhedged (EUR 8M exposed) | `2 * 8_000_000 * 1.12 * 0.08 * sqrt(216 / 365)` | 1102800 | 1102829.6548250976 | yes |

## Alternatives

- **Hedge 50% (EUR 4M) under v1:** Hedges EUR 2M less than v3 requires and leaves EUR 4M exposed (USD 40,000 per 0.01 move instead of USD 20,000). Non-compliant with v3 s.4.1 unless the Audit Committee approves it under s.4.3 (E1, E3, E4).
- **Stay unhedged on a euro-strengthening view:** Full exposure of USD 80,000 per 0.01 move (K13), and a 1-sigma proceeds band about USD 1.10M wide under the assumed volatility (K26). Explicitly barred by s.4.2 (E2). The view itself has no demonstrated forecasting basis (E13, E14).
- **Hedge 100% with forwards:** Removes all exchange-rate variance but exceeds the 75% ratio. It is also a deviation under s.4.3, and it carries over-hedge risk if the customer pays late or only partly (E3, E21).
- **Use FX options (buy EUR puts) instead of forwards:** Keeps the upside if the euro rises, but costs a premium that cannot be quantified without implied volatility (E17). s.4.1 specifies forwards, so options need Audit Committee approval (E1, E3).
- **Window forward or fixed forward plus later FX swap or extension:** A window forward allows flexibility on settlement timing at some extra cost. A fixed 15 June forward that is rolled by swap if payment slips is cheaper upfront. Which is better depends on payment-history data that is not available (E21).

## Tradeoffs

- The 75% forward gives certainty on EUR 6M of proceeds but gives up any gain on that portion if EUR/USD rises above the locked rate (E1, K12).
- The 25% unhedged residual keeps some upside and gives a cushion against partial non-payment, but leaves about USD 20,000 of exposure per 0.01 move (K12).
- Executing quickly reduces further drift from the stale quote. Waiting for full credit-line and accounting confirmation reduces execution risk (E6, E8, E21).

## Edge cases and failure modes

- The customer pays late. The forward settles on 15 June 2027 without EUR cash to deliver, so an FX swap or extension is needed, and its points reflect the interest differential at that time (E21).
- The customer pays partly or defaults. A EUR 6M forward could exceed the cash received if more than EUR 2M is not paid, leaving an over-hedge exposed to exchange-rate moves (E21, K1).
- The forward is executed before the sale is recognised as a receivable, and no ASC 815 documentation is in place. The forward's mark-to-market then hits earnings with no offsetting remeasurement until the receivable is booked. Once the receivable is recognised, the two broadly offset in earnings, so the accounting risk is mainly in that pre-recognition period (E18).
- No available credit line with the counterparty. The forward cannot be executed as planned (E21).
- A later policy version, a rescission or an approved exception exists that is not in the packet. The 75% conclusion would then change (E20).
- The supplied policy files are not genuine or are misordered. The supersession reasoning fails (E20).
- The bank prices with a wide margin. Checking parity against live OIS rates is needed to detect this (E11).

## Counterarguments

- **The treasurer has good reason to think the euro will strengthen, so hedging locks in a worse rate.** — s.4.2 bars varying the ratio on management views (E2). Professional forecasters generally do not beat a random walk (E14). If she has a strong case, the route is an Audit Committee deviation request under s.4.3 (E3), not a unilateral choice.
- **The forward at 1.1810 is above spot, so the market expects the euro to rise and staying unhedged captures that.** — The sign of the premium is what covered interest parity predicts from the USD-EUR interest differential, and any excess over parity looks like margin or term-rate effects, not a forecast (E11, E12, K8). Forwards are poor predictors of future spot (E12). The quote is also stale, since spot has fallen to about 1.12 (E8).
- **The user is an insider and says the policy is 50%. That may mean v3 was never adopted, was rescinded, or that v2 (not supplied) changed the rules, so v1's 50% may really be in force.** — This is a real possibility that the packet cannot rule out (E20). v2 is missing and v3 has not been checked against board minutes. On the documents supplied, though, v3 is board-approved, later, and explicitly supersedes v1 and v2 (E1, E4). The right step is to confirm v3's status with the policy owner or board minutes before trading. If that cannot be done in time, executing the EUR 4M that both v1 and v3 require (K2) now, and the remaining EUR 2M (K12 basis: EUR 8M - EUR 6M = EUR 2M unhedged under v3, and EUR 6M - EUR 4M = EUR 2M extra) once v3 is confirmed, limits the risk of trading under the wrong version. If v3 is confirmed, that interval is a temporary under-hedge, so confirmation should be fast.
- **Without implied volatility the hedge decision cannot be quantified, so it should wait.** — The policy sets the ratio regardless of volatility (E1, E2). Volatility affects only the scenario illustration and option pricing (E17), not the forward-hedge requirement.

## Practical implications

- Get a live, dealable EUR/USD forward quote for value 2027-06-15 for EUR 6M, ideally from more than one bank, and check the points against matched-tenor EUR and USD OIS rates (E6, E11).
- Do not use the USD 7.086M figure from the 2026-09-25 quote in budgets or forecasts (E6, E8, K3).
- Confirm with the policy owner or board minutes that v3 is in force, was not rescinded, and that no exception exists before execution (E20).
- If the treasurer wants to hedge less than 75% or use options, submit a written deviation request to the Audit Committee under s.4.3 instead of acting unilaterally (E2, E3).
- Complete ASC 815 hedge designation and documentation at or before trade execution if hedge accounting is desired, especially if the sale is not yet recognised as a receivable (E18).
- Confirm credit-line availability with the counterparty and agree in advance how a late payment will be handled (swap or extension) (E21).

## Remaining uncertainty

- Whether v3 is genuinely the board-approved policy in force, and whether a later version, a rescission or an approved exception exists (E20).
- The content of v2, which was not supplied (E4).
- The live spot and forward for value 2027-06-15. The current spot (~1.12, last reported close 1.1142) comes only from search summaries (E8).
- Matched-tenor EUR and USD interest rates, and the rates in force on 2026-09-25. The parity checks use October policy rates as proxies (E9, E10, E11).
- Current 7-month or 1-year EUR/USD implied volatility. The scenario bands use an assumed 8% that may differ materially from market (E17).
- Receivable payment reliability and timing, whether the receivable is already recognised, credit lines and hedge-accounting election (E21, E18).
- Whether s.4.1 maturity is measured from booking or from hedge date. Both appear to be within 12 months (E19).
- E17 UNKNOWN: The current EUR/USD implied volatility for a ~7-month (to June 2027) or 1-year tenor could not be found.
- E20 UNKNOWN: No evidence was found of a policy version later than v3, of an approved exception, or of an Audit Committee deviation request or approval for this exposure. The authenticity of the supplied files and the v3 approval date were not confirmed against governance records.
- E21 UNKNOWN: The customer's payment history and contract terms, the certainty of the 15 June 2027 timing and amount, bank credit lines for forwards, and the hedge-accounting election are all unknown.
- Open question the reviewer judged decisive: Do board minutes or governance records confirm that Treasury Policy v3 (2025-04-22) is in force, with no later version, rescission or Audit Committee exception for this exposure? What did v2 say?
- Open question the reviewer judged decisive: What are the customer's contract terms and payment history? Is there material risk of late or partial payment that would justify a window forward or a smaller hedge through an Audit Committee deviation?

## Further research that could change the conclusion

- Board minutes or governance records showing that v3 is not in force, or a later policy, rescission or approved Audit Committee exception, could change the required hedge ratio (E20).
- Contract terms or customer payment history showing significant risk of late or partial payment could justify a smaller or window-structured forward, through an Audit Committee deviation if it falls below 75% (E21, E3).
- Evidence that the receivable matures more than 12 months out, or is not confirmed, would take it outside s.4.1 (E19).
- Live OIS-based pricing showing the bank's forward points are materially off-market would change the counterparty choice but not the ratio (E11).
- A numeric implied-volatility quote would replace the assumed 8% in the outcome bands and allow option-cost comparisons (E17).

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | Treasury Policy v3, board-approved 2025-04-22, says it supersedes v1 and v2. s.4.1 reads: 'Hedge 75% of each confirmed foreign-currency receivable above USD 1M equivalent with maturity of 12 months or less, using forward contracts.' | treasury-policy-v3-2025.md |
| E2 | VERIFIED | fixture_read | Policy v3 s.4.2: 'Hedge ratios are not to be varied based on management's views of future exchange rates.' | treasury-policy-v3-2025.md |
| E3 | VERIFIED | fixture_read | Policy v3 s.4.3: 'Deviations require Audit Committee approval.' | treasury-policy-v3-2025.md |
| E4 | VERIFIED | fixture_read | Treasury Policy v1 (approved 2021-03): 'FX: hedge 50% of confirmed foreign-currency receivables above USD 1M equivalent.' | treasury-policy-v1-2021.md |
| E5 | INFERRED | user_input | The user says the treasury policy requires hedging 50% of exposures, and that the treasurer would rather stay unhedged if the euro is expected to strengthen. | request |
| E6 | VERIFIED | fixture_read | Northbridge Bank indicative quote dated 2026-09-25: EUR/USD spot 1.1650 and outright forward 1.1810 for value 2027-06-15. It is marked 'Indicative only; valid on the date of issue. Request a live quote to deal.' | bank-forward-quote.md |
| E8 | CORROBORATED | search_result | EUR/USD spot traded around 1.12 in early November 2026. Reported closes: 1.1219 on Thu 5 Nov 2026 and 1.1142 on 6 Nov 2026. Another report has the pair at 1.1220 on 5 Nov after briefly touching 1.13. Commerzbank (early Nov) says EUR/USD has settled around 1.12 after falling from 1.16. EUR/USD opened 2026 at 1.1714. | https://www.poundsterlinglive.com/history/EUR-usd-2026 |
| E9 | CORROBORATED | search_result | At its 29 Oct 2026 meeting the ECB left key rates unchanged: deposit facility 2.50%, main refinancing 2.65%, marginal lending 2.90%. This followed a hike in September 2026. | https://www.banque-france.fr/system/files/2026-10/Monetary_policy_decisions_29-10.pdf |
| E10 | CORROBORATED | search_result | The FOMC held the federal funds target range at 3.75% to 4.00% on 28 Oct 2026, by a 10-2 vote. Cook and Hammack preferred a 25bp hike. The hold followed a 25bp hike in September 2026. Interest on reserve balances stays at 3.90%, effective 29 Oct 2026. | https://stockanalysis.com/news/fed-holds-rates-steady-oct-2026/ |
| E11 | INFERRED | none | The sign of the forward premium is consistent with covered interest parity. USD rates (3.75-4.00%) are above EUR rates (deposit 2.50%), so EUR/USD should trade at a forward premium to spot, as the quote shows (1.1810 vs 1.1650). As a rough check, the quoted premium is about 1.4% over about 263 days, roughly 1.9% annualised. That is somewhat above the ~1.25-1.5pp policy-rate gap, so the bank's points may include a margin or reflect term-rate expectations. | inference from E6, E9, E10 |
| E12 | CORROBORATED | search_result | Covered interest parity is a no-arbitrage identity that links forward points to the interest-rate differential. The forward rate is not an unbiased predictor of future spot (the forward premium / Fama puzzle), and forward rates have little power to forecast spot. | https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/currency-exchange-rates-understanding-equilibrium-value |
| E13 | CORROBORATED | search_result | Meese and Rogoff (1983) found that a random walk forecasts major dollar exchange rates out of sample as well as structural and time-series models at 1 to 12 month horizons. Later work largely confirms this for point-forecast accuracy (RMSE). Some studies find an edge on directional accuracy or at longer horizons. | https://www.nber.org/papers/w1732.pdf |
| E14 | CORROBORATED | search_result | As a group, professional and analyst exchange-rate forecasters generally do not beat naive random-walk forecasts. Few individual forecasters do, and many do significantly worse. There are some exceptions, for example Chilean peso survey forecasts at 2 months. | https://core.ac.uk/works/2818706 |
| E15 | INFERRED | search_result | Short-horizon EUR/USD forecasts vary widely. Two automated forecast sites projected end-November 2026 levels of about 1.068 and about 1.131. Commentary describes EUR/USD as caught between two central banks that are both hiking. | https://30rates.com/eur-usd-forecast-tomorrow-this-week |
| E16 | INFERRED | search_result | Commerzbank (early Nov 2026) says EUR/USD 3-month options-implied volatility has recently declined again. A CME report (late Jan 2026) said EUR/USD volatility was at 1-year and 5-year lows. Tickmill (week of 20 Jan 2026) reported a short-lived spike in 1-12 month implied vol. | https://fxstreet.com/news/euro-policy-risks-could-revive-swings-against-us-dollar-commerzbank-202611020632 |
| E17 | UNKNOWN | none | The current EUR/USD implied volatility for a ~7-month (to June 2027) or 1-year tenor could not be found. | none |
| E18 | INFERRED | search_result | Under ASC 815, hedge designation and documentation must be in place at inception. A hedged forecasted transaction must be probable within the documented hedge period. A FX receivable can be hedged with a single cash flow hedge covering settlement of the receivable, or with a cash flow hedge of the forecasted sale followed by a fair value hedge once the receivable is recognised. Forward points may be excluded from the effectiveness assessment. | https://dart.deloitte.com/USDART/home/codification/broad-transactions/asc815-10/hedge-accounting/chapter-5-foreign-currency-hedges/5-3-foreign-currency-cash-flow |
| E19 | INFERRED | none | The receivable appears to meet the v3 s.4.1 conditions. It is described as confirmed. EUR 8M at ~1.12 is about USD 9M, well above USD 1M. From a hedge placed around Nov 2026 to 15 June 2027 is about 7 months, within 12 months. | inference from E1, E5, E8 |
| E20 | UNKNOWN | none | No evidence was found of a policy version later than v3, of an approved exception, or of an Audit Committee deviation request or approval for this exposure. The authenticity of the supplied files and the v3 approval date were not confirmed against governance records. | none |
| E21 | UNKNOWN | none | The customer's payment history and contract terms, the certainty of the 15 June 2027 timing and amount, bank credit lines for forwards, and the hedge-accounting election are all unknown. | none |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 9 web search(es), 2 fetch attempt(s), 3 supplied document(s) read.
- search: "EUR/USD exchange rate November 2026" (17 results)
- search: "Meese Rogoff exchange rate forecasting random walk" (10 results)
- search: "ECB deposit facility rate decision October 2026" (19 results)
- search: "FOMC federal funds target range decision October 2026" (17 results)
- search: "EUR/USD implied volatility 1-year 2026" (18 results)
- search: "professional exchange rate forecasts accuracy consensus vs forward rate random walk study" (10 results)
- search: "ASC 815 cash flow hedge foreign currency forecasted receivable forward contract documentation requirements" (18 results)
- search: "covered interest parity forward points interest rate differential not forecast of future spot" (10 results)
- search: "EUR/USD implied volatility October 2026 options vols" (18 results)
2. **Sources inspected:**
- bank-forward-quote.md (fixture_read)
- treasury-policy-v3-2025.md (fixture_read)
- treasury-policy-v1-2021.md (fixture_read)
   Cited from search snippets only (not opened):
- https://www.poundsterlinglive.com/history/EUR-usd-2026
- https://www.banque-france.fr/system/files/2026-10/Monetary_policy_decisions_29-10.pdf
- https://stockanalysis.com/news/fed-holds-rates-steady-oct-2026/
- https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/currency-exchange-rates-understanding-equilibrium-value
- https://www.nber.org/papers/w1732.pdf
- https://core.ac.uk/works/2818706
- https://30rates.com/eur-usd-forecast-tomorrow-this-week
- https://fxstreet.com/news/euro-policy-risks-could-revive-swings-against-us-dollar-commerzbank-202611020632
- https://dart.deloitte.com/USDART/home/codification/broad-transactions/asc815-10/hedge-accounting/chapter-5-foreign-currency-hedges/5-3-foreign-currency-cash-flow
3. **Checks executed:**
- Evidence registry validation: 20 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 2 draft(s)
- Calculation K1 re-executed: 0.75 * 8_000_000 = 6000000 (claimed 6000000) → match
- Calculation K2 re-executed: 0.5 * 8_000_000 = 4000000 (claimed 4000000) → match
- Calculation K3 re-executed: 6_000_000 * 1.1810 = 7086000 (claimed 7086000) → match
- Calculation K4 re-executed: (1.1810 / 1.1650 - 1) * 100 = 1.3733905579399242 (claimed 1.373) → match
- Calculation K5 re-executed: (1.1810 / 1.1650 - 1) * 365 / 263 * 100 = 1.9060363256580697 (claimed 1.906) → match
- Calculation K6 re-executed: 8_000_000 * 1.12 = 8960000 (claimed 8960000) → match
- Calculation K7 re-executed: (1.12 / 1.1650 - 1) * 100 = -3.862660944205998 (claimed -3.863) → match
- Calculation K8 re-executed: 1.1650 * (1 + 0.03875 * 263 / 360) / (1 + 0.025 * 263 / 360) = 1.1764926856714177 (claimed 1.1765) → match
- Calculation K9 re-executed: 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) = 6774620.689655174 (claimed 6774600) → match
- Calculation K10 re-executed: 19 + 31 + 31 + 28 + 31 + 30 + 31 + 15 = 216 (claimed 216) → match
- Calculation K11 re-executed: 6_000_000 * 1.1810 - 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) = 311379.31034482643 (claimed 311400) → match
- Calculation K12 re-executed: (8_000_000 - 6_000_000) * 0.01 = 20000 (claimed 20000) → match
- Calculation K13 re-executed: 8_000_000 * 0.01 = 80000 (claimed 80000) → match
- Calculation K14 re-executed: 2_000_000 * 0.20 = 400000 (claimed 400000) → match
- Calculation K15 re-executed: 8_000_000 * 0.20 = 1600000 (claimed 1600000) → match
- Calculation K16 re-executed: 8 * sqrt(216 / 365) = 6.154183341657911 (claimed 6.154) → match
- Calculation K17 re-executed: 1.12 * (1 - 0.08 * sqrt(216 / 365)) = 1.0510731465734315 (claimed 1.0511) → match
- Calculation K18 re-executed: 1.12 * (1 + 0.08 * sqrt(216 / 365)) = 1.1889268534265687 (claimed 1.1889) → match
- Calculation K19 re-executed: 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) = 1.1291034482758624 (claimed 1.1291) → match
- Calculation K20 re-executed: 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12 * (1 - 0.08 * sqrt(216 / 365)) = 8876766.982802037 (claimed 8876800) → match
- Calculation K21 re-executed: 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12 = 9014620.689655174 (claimed 9014600) → match
- Calculation K22 re-executed: 6_000_000 * 1.12 * (1 + 0.03875 * 216 / 360) / (1 + 0.025 * 216 / 360) + 2_000_000 * 1.12 * (1 + 0.08 * sqrt(216 / 365)) = 9152474.39650831 (claimed 9152500) → match
- Calculation K23 re-executed: 8_000_000 * 1.12 * (1 - 0.08 * sqrt(216 / 365)) = 8408585.17258745 (claimed 8408600) → match
- Calculation K24 re-executed: 8_000_000 * 1.12 * (1 + 0.08 * sqrt(216 / 365)) = 9511414.82741255 (claimed 9511400) → match
- Calculation K25 re-executed: 2 * 2_000_000 * 1.12 * 0.08 * sqrt(216 / 365) = 275707.4137062744 (claimed 275700) → match
- Calculation K26 re-executed: 2 * 8_000_000 * 1.12 * 0.08 * sqrt(216 / 365) = 1102829.6548250976 (claimed 1102800) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://ecb.europa.eu/press/pr/date/2026/html/ecb.mp261029~9a493adf17.en.html — getaddrinfo ENOTFOUND ecb.europa.eu. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does n
- Fetch failed: https://federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm — getaddrinfo ENOTFOUND federalreserve.gov. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or d
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G1 unresolved: Supplied v3 says it supersedes v1/v2 and sets 75%, but nothing supplied confirms this against board minutes or governance records, v2 was not supplied, and no information on later versions or exceptions exists.
- Knowledge gap G3 unresolved: Whether an Audit Committee deviation has been requested or granted is internal information and not available.
- Knowledge gap G4 unresolved: No live dealable EUR/USD forward for value 2027-06-15 and no matched-tenor EUR/USD OIS rates were obtained. Spot (~1.12 in early Nov 2026) comes from search snippets only. WebFetch to ecb.europa.eu and federalreserve.gov failed because those hosts are not allowed in this session's network settings, so no further fetches were tried.
- Knowledge gap G5 unresolved: No numeric current EUR/USD implied volatility for a ~7-month or 1-year tenor was found, so volatility-band scenarios need a market-data or bank quote.
- Knowledge gap G6 unresolved: Receivable payment history, contract terms, credit lines and hedge-accounting election are internal and unavailable. ASC 815 guidance was seen only in search snippets.
5. **Independent validation status:** NOT INDEPENDENTLY VALIDATED. Only the in-pipeline adversarial review (same model family, fresh context) and deterministic checks were applied.
6. **Remaining uncertainty:** 12 item(s), listed above.
7. **Revisions:** 1
- cycle 1 (reanalysis): [coverage/major] D1 [criteriaAssessments C4; CL12, CL13; K12-K15; verdict] C4 asks for a quantified range of USD outcomes, hedged vs unhedged. The draft gives only sensitivities (USD 20k vs 80k per 0.01) and outcome spreads (USD 0.4M vs 1.6M) over an arbitrary ±0.10 band. It never shows USD proceeds at any rate, e.g. hedged = 6M x F + 2M x S_T vs unhedged = 8M x S_T at S_T = 1.02 / 1.12 / 1.22. The decision objective also asks for the forecast question to be framed as the forward plus a range of possible outcomes. No range of rates is given beyond the hypothetical ±0.10. Since no live implied vol was found (E17), the draft could have used a clearly labelled assumed vol, e.g. 7-9% annualised. That gives a 1-sigma move of about 5.4-6.9% over about 0.59 years, roughly ±0.06-0.08 around 1.12. Instead the ±0.10 band is not tied to any likelihood, so the treasurer cannot see how big a typical outcome is.
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency
- PASS reasoning_validity: [minor/reviewer] D1 [CL3; counterarguments item 3] Draft 2 adds a fallback for the case where v3 can't be confirmed before the trade: execute EUR 4M now and the remaining EUR 2M once v3 is confirmed. Review-1 D5 proposed this, so the draft is not at fault for including it, but the review's suggestion was incomplete. If v3 is in force, holding back EUR 2M is itself a hedge below 75%. Under s.4.3 that is a deviation needing Audit Committee approval, and the draft never says so. It also never weighs the opposite error. If v1 turned out to govern, hedging EUR 6M would be an over-hedge, and whether that breaches v1 is unknown. The draft calls the delay 'a temporary under-hedge' and says it 'limits the risk', without showing that it does. It should either record the interim under-hedge as a deviation (for example by getting quick Audit Committee sign-off or confirmation) or explain why under-hedging is the safer error. | [minor/reviewer] D3 [criteriaAssessments C4; CL16; K21 vs K6] The new C4 scenarios centre future spot on 1.12 (random walk), but the hedged leg is valued at the 1.1291 parity forward. At the centre, hedged proceeds (K21, USD 9,014,620) therefore exceed unhedged (K6, USD 8,960,000) by about USD 54.6k. The draft doesn't explain this. A reader could take it as hedging having a positive expected payoff, when the gap is just the forward carry and the choice of centring convention. If the distribution were centred on the forward instead, the two centres would be equal. The draft should state this, or show both centrings.
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability: [minor/reviewer] D2 [CL3 calculationIds; counterarguments item 3 response] K12 is the USD sensitivity calculation ((8M-6M) x 0.01 = USD 20,000). Draft 2 cites it as the 'basis' for the EUR 2M residual and the EUR 2M top-up in the staged-execution text, and adds it to CL3's calculationIds. K12 does not compute either EUR figure. The EUR 2M figures come from K1 minus K2, or a new calculation such as 8M - 6M.
