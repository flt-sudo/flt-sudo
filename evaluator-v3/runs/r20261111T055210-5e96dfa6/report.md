# Evaluation: Retention effect of the redesigned onboarding flow (experiment ONB-27) for use in next year's revenue forecast

**Decision objective:** Decide what 30-day retention uplift, if any, finance should build into next year's revenue forecast for the redesigned onboarding flow, stated as an absolute and relative effect with an uncertainty range, and decide how much the forecast should depend on it. This includes deciding whether the reported '+18%' figure is a valid input, or whether it should be replaced by the concurrent A/B estimate (treatment 44.2% vs control 41.0%), which on first reading is about +3.2pp absolute, roughly +7.8% relative.

## Verdict

Do not use the '+18%' figure. It is a relative before/after change that compares the treatment arm's 44.2% with an undocumented Q2 all-user baseline of 37.5%. It is not the experiment's causal estimate. The Q2 baseline ends before the pricing and plan change that launched for all users on 2026-07-01, while the treatment measurement period starts on that date. The comparison therefore straddles the pricing launch as well as differences in period and population. Replace it with the concurrent randomised ONB-27 estimate: +3.2pp absolute in 30-day retention (41.0% to 44.2%), about +7.8% relative. The approximate 95% CI is +0.4pp to +6.0pp absolute (about +1.0% to +14.7% relative), with p about 0.025. The approximate 80% CI is +1.4pp to +5.1pp. Recommended single planning figure: +1.4pp absolute (about +3.4% relative), which is the lower bound of the 80% interval. Under the normal approximation the effect exceeds this value with about 90% probability. Two reasons support planning below the unbiased point estimate of +3.2pp. First, the result is only just significant. Second, the readout does not confirm a fixed-horizon ITT analysis, and peeking would make it more fragile. The choice also puts the figure in the range where a winner's-curse adjustment would plausibly land. Choosing it is still a finance-policy judgement about how much to penalise over-forecasting relative to under-forecasting. The evidence does not settle that judgement. If finance prefers an unbiased central forecast, it should use +3.2pp instead. Use coherent scenarios: stress 0pp, base/planning +1.4pp, upside +3.2pp. Do not plan on the +5.1pp or +6.0pp upper bounds or on 18%. Apply the uplift only to new cohorts that go through the new flow, and only to day-30 retention. The revenue effect cannot be determined from the evidence. There is no data on the revenue model's sensitivity to retention, the share of revenue from new cohorts, or whether the effect lasts beyond day 30. The forecast should therefore depend on this effect only weakly. Confidence differs by question. It is high that the 18% figure is not a valid causal input. It is moderate to low for the size of the effect, given the wide CI and undocumented analysis practices. It is low for any revenue figure, which cannot be computed from the evidence. Four things would resolve the remaining questions: confirmation of a fixed-horizon ITT analysis, day-60/90 retention by arm, a per-arm pricing-interaction check, and finance's own retention-to-revenue sensitivity.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** The redesigned onboarding flow lifted 30-day retention by 18%.
  **Correction:** The 18% is a relative before/after change against a Q2 all-user baseline. The causal randomised estimate is +3.2pp absolute, or about +7.8% relative, with a 95% CI of about +0.4 to +6.0pp. [E4, E5, E1, E2, E11]
- **Assumption:** A retention lift justifies raising next year's revenue forecast.
  **Correction:** A day-30 retention lift does not by itself establish a revenue increase. The revenue model's sensitivity, the share of revenue from new cohorts and the persistence of the effect are unknown. Any uplift should be scenario-based and modest: planning figure +1.4pp, stress 0pp, upside +3.2pp. [E12, E10, E2]
- **Assumption:** The product team's report reflects the primary analysis of the pre-registered experiment.
  **Correction:** The PM slide does not use the concurrent control arm, so it is a different, non-causal analysis. The pre-registered primary contrast is treatment vs control in ONB-27. [E4, E1]

## Criteria

### C1 Causal validity of the effect estimate (weight 30)

Only ONB-27 gives a causal estimate. It used user-level 50/50 randomisation over the same period (2026-07-01 to 2026-08-31), so both arms faced the same season and the same signup mix. The pricing change is reported as launching 'for all users', which implies both arms were exposed, but there is no per-arm exposure data to confirm it. The PM slide's 18% compares the treatment arm with a Q2 all-user baseline, so it mixes the onboarding effect with period, population and pricing differences. The control arm alone is 3.5pp above the Q2 baseline, about 52% of the slide's 6.7pp gap, and none of that 3.5pp comes from the new flow. [E1, E4, E5, E6, E3, E8, E12]

*Mechanisms:* Randomisation balances concurrent shocks such as pricing, seasonality and channel mix across arms, so the difference between arms removes them. A before/after comparison cannot do this, because anything that changed between Q2 and Q3 is credited to the new flow. The control arm rising from 37.5% to 41.0% without the new flow shows that such shifts were present.

*Strengths:*
- Concurrent randomised control with a pre-registered primary metric (30-day retention) and a two-sided test (E1)
- The pricing change is reported as applying to all users, which implies both arms were exposed, so its main effect would cancel in the A/B difference. Per-arm exposure is not confirmed (E6)
- No sample-ratio mismatch (E3, E8)

*Weaknesses:*
- No per-arm pricing-exposure data or treatment-by-pricing interaction analysis (E12, E6)
- The readout does not state ITT, how pricing-exposed users were handled, or the retention definition (E1)
- The Q2 baseline definition is undocumented, so the 3.5pp control-vs-Q2 rise cannot be split among pricing, season and definitions (E4, E5)

### C2 Arithmetic and metric-definition consistency (weight 15)

The 18% recomputes as 44.2/37.5 - 1 = 17.9% relative, which matches the slide's rounding, on an absolute change of +6.7pp. It is relative, not absolute, and it is built on a non-concurrent, differently defined population. Recomputed from the raw A/B counts: control 984/2400 = 41.00%, treatment 1039/2350 = 44.21%, a difference of +3.21pp absolute and +7.84% relative. The slide's relative figure is about 2.3 times the randomised relative estimate. Applying 18% to the 41.0% control base would imply about +7.4pp, again about 2.3 times the measured +3.2pp. [E4, E5, E1, E2, E11]

*Mechanisms:* Two separate errors would push the number up as it moves into revenue. First, the wrong comparator inflates the numerator, because the period, population and pricing shift is counted as effect. Second, the label '+18% retention' can be misread as 18pp absolute, which would be more than five times the measured effect.

*Strengths:*
- The slide's arithmetic is internally consistent (17.9% rounds to 18%) (E4, E5)
- The A/B counts recompute exactly to the reported 41.0% and 44.2% (E1, E2)

*Weaknesses:*
- The retention definition in the Q2 baseline is undocumented, so it may differ from ONB-27's definition (E4, E5)
- The readout does not define 30-day retention either (E1)

### C3 Statistical precision and robustness of the A/B result (weight 20)

With about 4,750 users, the effect is statistically significant but imprecise. The unpooled SE is about 1.43pp, giving a Wald 95% CI of about +0.40pp to +6.02pp (+1.0% to +14.7% relative) and an 80% CI of about +1.37pp to +5.05pp. The pooled z is about 2.24, two-sided p about 0.025. The 95% lower bound is close to zero. The SRM check passes (chi-square about 0.53, p about 0.47, far from Microsoft's p < 0.0005 threshold). The readout does not confirm a fixed-horizon analysis, and peeking at results inflates false positives, so p about 0.025 is fragile if the test was monitored and stopped early. An estimate that only just clears significance is also more likely than not to overstate the true effect (winner's curse). This supports planning below the point estimate, for example at the 80% lower bound. [E1, E2, E3, E8, E9]

*Mechanisms:* The standard error of a difference between proportions shrinks only with the square root of sample size. At about 2,375 per arm and a base rate near 41%, this puts the 95% half-width near 2.8pp, almost as large as the effect itself. Repeated looks at the result raise the chance of crossing p < 0.05 by luck. Selecting results because they are significant biases the reported magnitude upward when power is modest.

*Strengths:*
- Pre-registered primary metric and two-sided test (E1)
- Balanced split, with no evidence of SRM (E3, E8)
- The CI excludes zero under a normal approximation (E2)

*Weaknesses:*
- Wide interval: the 95% upper bound is about 15 times the lower bound (E2)
- Stopping rule, peeking, analysis date and ITT are not documented (E1, E9)
- The readout does not say whether users enrolled near 2026-08-31 were observed for a full 30 days (E1)
- These are hand calculations with a normal approximation, not the official analysis. The relative interval simply divides the absolute bounds by a fixed control rate and ignores uncertainty in that rate (E2)

### C4 Generalisability to next year's user base and to revenue (weight 20)

The estimate applies to July–August 2026 signups, measured at day 30, in a period when the new pricing was in place. Whether it holds for next year's cohorts, other seasons or channels, pricing regimes or longer horizons is not established. The evidence also does not say whether the current pricing will continue. There is no day-60/90 ONB-27 data. The general literature on effects that change over time (novelty or primacy) concerns mainly existing users reacting to a changed experience. New signups never saw the old flow, so that evidence transfers poorly here. The more relevant persistence risk for new users is that the treatment and control retention curves converge after day 30, so a day-30 gap does not become a lasting gap in retained users. The link from retention to revenue (the model's sensitivity to retention and the share of revenue from new cohorts) is entirely unknown. The revenue uplift therefore cannot be quantified, and only a scenario-based, modest allowance is defensible. A template for the translation, with every input unknown from this evidence: incremental revenue = next-year new signups x share passing through the new flow x delta day-30 retention x downstream revenue per extra day-30-retained user x a persistence factor (1 = no convergence after day 30, 0 = full convergence). [E1, E6, E10, E12]

*Mechanisms:* Day-30 retention affects revenue only through new cohorts that pass through the new flow, and only to the extent that extra retained users keep paying. If most revenue comes from existing customers, or the arms' retention curves converge after day 30, the revenue effect is far smaller than the retention headline suggests. A pricing-by-treatment interaction could also change the effect if pricing changes again.

*Strengths:*
- The measured cohorts reflect the pricing in force from 2026-07-01, so the effect is not tied to the pre-launch Q2 pricing (E6, E1)
- General literature flags that short-test effects can change over time and recommends monitoring, though it applies mainly to existing users (E10)

*Weaknesses:*
- No retention-to-revenue sensitivity, no new-cohort revenue share, no retention beyond day 30, no interaction analysis (E12)
- Only two months of signups, one season (E1)
- No evidence on whether the current pricing will continue next year (E6, E12)
- The novelty-effect evidence comes from search snippets only, is not specific to ONB-27 and transfers poorly to new users (E10)

### C5 Corroboration from qualitative and operational evidence (weight 15)

The qualitative and operational evidence offers weak support for the mechanism and none for the size of the effect. Six of the 8 interviewees (75%) found the checklist helpful and 2 found it long. All interviewees had completed onboarding, which excludes users who dropped out, and they were not linked to an arm. Onboarding tickets fell from 1,240 to 1,090 (-12.1%), but the counts are raw, not normalised by user volume, not split by arm, and confounded by the 2026-07-01 pricing launch. Only about half of new users saw the new flow. [E7, E6]

*Mechanisms:* Recruiting only users who finished onboarding (survivorship bias) produces favourable feedback no matter what the effect is. A quarter-on-quarter ticket comparison picks up changes in volume and pricing-page effects that have nothing to do with the onboarding flow.

*Strengths:*
- Consistent in direction with a helpful-checklist mechanism (E7)
- Contains a friction signal: 2 of 8 said the checklist felt long (E7)

*Weaknesses:*
- n=8, survivor-only and not linked to arms (E7)
- Tickets are not normalised and are confounded by pricing (E6)

## Key claims

- **CL1** (material): The '+18%' figure is a relative before/after change (44.2/37.5 - 1 = 17.9%) against a non-concurrent Q2 all-user baseline. It is not the randomised A/B contrast, so it is not a valid input for the causal effect of the new flow. [E4, E5, E1, K9]
- **CL2** (material): The concurrent randomised estimate is control 41.00% vs treatment 44.21%, a difference of +3.21pp absolute and about +7.84% relative. [E1, E2, K1, K2, K3, K4]
- **CL3** (material): The approximate 95% Wald CI for the absolute effect is +0.40pp to +6.02pp, with unpooled SE about 1.43pp. Dividing those bounds by the fixed 41.0% control rate gives about +1.0% to +14.7% relative. That simplification ignores uncertainty in the control rate, so a delta-method or log-ratio interval would differ slightly. The pooled z is about 2.24 (two-sided p about 0.025, per E2), so the effect is significant but imprecise, and the lower bound is near zero. [E2, K5, K6, K7, K8, K15, K16]
- **CL4** (material): The control arm (41.0%) is 3.5pp above the Q2 baseline (37.5%). That is about 52% of the slide's 6.7pp gap, and it occurred without the new flow, consistent with period, population and pricing confounding of the slide. [E5, E4, E1, E6, K10, K11]
- **CL5** (material): The slide's 17.9% relative figure is about 2.3 times the randomised relative estimate of 7.8%. Applying 18% to the 41.0% control base would imply about +7.4pp, versus the measured +3.2pp. [E5, E2, K12, K13]
- **CL6**: No sample-ratio mismatch: 2,400 vs 2,350 against 2,375/2,375 gives chi-square about 0.53 (p about 0.47 per E3), far from the p < 0.0005 threshold. [E3, E8, K14]
- **CL7** (material): The pricing and plan change launched on 2026-07-01 for all users, which implies both arms were exposed. It therefore confounds the before/after slide but not the A/B difference, although no per-arm exposure or interaction analysis exists. [E6, E1, E12]
- **CL8** (material): The revenue effect of the retention uplift cannot be determined from the evidence. There is no data on the revenue model's sensitivity to day-30 retention, the share of next year's revenue from new cohorts, or ONB-27 retention beyond day 30. Finance can apply it through a template: new signups x flow coverage x delta day-30 retention x downstream revenue per extra retained user x a persistence factor. Every input except delta retention is unknown here. [E12]
- **CL9** (material): Whether the day-30 effect persists, shrinks or grows over longer horizons cannot be determined for ONB-27. The general literature shows that short-test effects can change over time, but its novelty mechanism concerns mainly existing users reacting to change. For new signups, the more relevant risk is that the arms' retention curves converge after day 30. [E10, E12]
- **CL10** (material): The p about 0.025 result would be fragile if the test was peeked at or stopped early. The readout does not document a fixed-horizon analysis, ITT, the analysis date or full 30-day observation for late-August enrollees. [E1, E9]
- **CL11**: The ticket drop of 1,240 to 1,090 (-12.1%) and the interviews (6 of 8, 75%, found the checklist helpful) support at most the direction or mechanism, not the size of the effect. Tickets are unnormalised and confounded by pricing. The interviews are n=8, survivor-only and not linked to arms. [E6, E7, K17, K18]
- **CL12** (material): Under the same normal approximation, the 80% CI for the absolute effect is about +1.37pp to +5.05pp. The recommended planning figure of about +1.4pp (about +3.4% relative to the 41.0% control rate) is the 80% lower bound, which the effect exceeds with about 90% probability under that approximation. Choosing it rather than the +3.2pp point estimate is a finance-policy choice about the cost of over-forecasting, not something the evidence determines. [E2, E9, K19, K20, K21]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Control-arm 30-day retention rate | `984/2400` | 0.41 | 0.41 | yes |
| K2 | Treatment-arm 30-day retention rate | `1039/2350` | 0.4421 | 0.4421276595744681 | yes |
| K3 | Absolute A/B difference in retention (proportion) | `1039/2350 - 984/2400` | 0.03213 | 0.032127659574468115 | yes |
| K4 | Relative A/B uplift (treatment/control - 1) | `(1039/2350)/(984/2400) - 1` | 0.07836 | 0.07836014530358071 | yes |
| K5 | Unpooled standard error of the difference | `sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350)` | 0.01434 | 0.014343969136448179 | yes |
| K6 | Wald 95% CI lower bound for absolute difference | `(1039/2350 - 984/2400) - 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350)` | 0.004013 | 0.004013480067029684 | yes |
| K7 | Wald 95% CI upper bound for absolute difference | `(1039/2350 - 984/2400) + 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350)` | 0.06024 | 0.06024183908190654 | yes |
| K8 | Pooled two-proportion z statistic | `(1039/2350 - 984/2400)/sqrt((2023/4750)*(1-2023/4750)*(1/2400+1/2350))` | 2.239 | 2.238849682493038 | yes |
| K9 | PM slide relative change (44.2 vs 37.5) | `44.2/37.5 - 1` | 0.1787 | 0.17866666666666675 | yes |
| K10 | PM slide absolute change in percentage points | `44.2 - 37.5` | 6.7 | 6.700000000000003 | yes |
| K11 | Share of slide gap already present in the control arm (41.0 - 37.5)/6.7 | `(41.0 - 37.5)/(44.2 - 37.5)` | 0.5224 | 0.5223880597014923 | yes |
| K12 | Ratio of slide relative change to randomised relative uplift | `(44.2/37.5 - 1)/((1039/2350)/(984/2400) - 1)` | 2.28 | 2.2800706401766013 | yes |
| K13 | Absolute pp implied by applying 18% relative to the 41.0% control base | `41.0*0.18` | 7.38 | 7.38 | yes |
| K14 | SRM chi-square statistic (1 df) for 2,400 vs 2,350 against 2,375 each | `(2400-2375)^2/2375 + (2350-2375)^2/2375` | 0.5263 | 0.5263157894736842 | yes |
| K15 | Relative 95% CI lower bound (absolute lower bound / fixed control rate) | `((1039/2350 - 984/2400) - 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400)` | 0.00979 | 0.009788975773243131 | yes |
| K16 | Relative 95% CI upper bound (absolute upper bound / fixed control rate) | `((1039/2350 - 984/2400) + 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400)` | 0.1469 | 0.1469313148339184 | yes |
| K17 | Quarter-on-quarter change in onboarding tickets | `1090/1240 - 1` | -0.121 | -0.12096774193548387 | yes |
| K18 | Share of interviewees who found the checklist helpful | `6/8` | 0.75 | 0.75 | yes |
| K19 | Wald 80% CI lower bound for absolute difference (z = 1.2816); recommended planning figure | `(1039/2350 - 984/2400) - 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350)` | 0.01374 | 0.013744428729196127 | yes |
| K20 | Wald 80% CI upper bound for absolute difference (z = 1.2816) | `(1039/2350 - 984/2400) + 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350)` | 0.05051 | 0.050510890419740107 | yes |
| K21 | Planning figure as a relative uplift (80% lower bound / fixed control rate) | `((1039/2350 - 984/2400) - 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400)` | 0.03352 | 0.03352299690047836 | yes |

## Alternatives

- **Use the PM slide's +18% relative (+6.7pp absolute):** About 2.3 times the randomised relative estimate (17.9% vs 7.8%). It includes period, population and pricing shifts that the control arm also shows (+3.5pp). It is not causal and would overstate the forecast (E4, E5).
- **Use the A/B point estimate (+3.2pp, +7.8% relative) as the planning figure:** This is the best single unbiased estimate from the experiment as reported. However, the result only just clears significance, so the point estimate is more likely to overstate than understate the true effect. Analysis practices (stopping rule, ITT) are unverified and persistence is unknown. It is the right choice if finance wants an unbiased central forecast. Otherwise it serves as the upside scenario (E2, E9, E10).
- **Recommended: use the 80% CI lower bound (+1.4pp, about +3.4% relative) as the planning figure, with 0pp as stress and +3.2pp as upside:** A middle option. It discounts the point estimate for imprecision, possible winner's-curse inflation and unverified analysis practices, without assuming the effect is near zero. The effect exceeds this figure with about 90% probability under the normal approximation. The size of the discount is a finance-policy choice (E2, E9, E12).
- **Use the 95% CI lower bound (+0.4pp, about +1.0% relative) or zero as the planning figure:** Very conservative. It plans on roughly the 2.5th-percentile value and so deliberately biases the forecast down. It is appropriate only if finance treats over-forecasting as much costlier than under-forecasting (E2, E12).
- **Exclude the effect from the forecast until day-60/90 holdout data and the revenue sensitivity are available:** The most defensible option if the forecast needs to be firm. It discards a statistically significant signal, but it avoids building revenue on an unquantified retention-to-revenue link (E12, E10).

## Tradeoffs

- Conservatism vs bias. Planning at +1.4pp rather than +3.2pp lowers the risk of overstating revenue but deliberately biases the forecast below the unbiased estimate. How much to discount is a finance-policy choice about asymmetric loss, which the evidence cannot settle.
- Simplicity vs fidelity. A single point uplift is easy to model, but the evidence supports only a range, and the range is wide relative to the effect (E2).
- Speed vs rigour. Using the effect now forgoes confirming the fixed-horizon/ITT analysis and the longer-horizon retention that could cut or raise the effect (E9, E10).

## Edge cases and failure modes

- Misreading '+18%' as 18pp absolute would overstate the measured effect by more than five times.
- Applying the uplift to all revenue rather than only to new cohorts that see the new flow would inflate the impact. The new-cohort share is unknown (E12).
- If ONB-27 was peeked at or stopped early, the true false-positive risk is above the nominal 5%, and the lower bound may effectively include zero (E9).
- Users enrolled near 2026-08-31 may not have had full 30-day observation. If they were scored early, they could bias rates in either arm (E1).
- A treatment-by-pricing interaction would mean the effect changes if pricing changes again next year (E12).
- Treatment and control retention curves could converge after day 30, so a day-30 gap may not become lasting extra retained users or revenue. Classic novelty decay (E10) is less likely to apply, because new signups never saw the old flow.
- An effect that only just reaches significance with a wide CI may be an overestimate. Replication or a holdout would test this (E2).
- SRM can hide within segments even when the overall split passes (E3).

## Counterarguments

- **The slide's 18% reflects the real-world improvement users experienced from Q2 to Q3, so finance should use it.** — Finance needs the increment caused by the new flow. The control arm, on the old flow, also rose 3.5pp over Q2, so that part would have happened without the redesign. It is not attributable to the redesign (E5, E1).
- **The A/B result is statistically significant, so the full +3.2pp should go into the forecast.** — Significance only means the effect is likely above zero. The 95% CI runs from +0.4pp to +6.0pp, and an estimate that only just clears significance tends to overstate the true effect. The analysis practices (stopping rule, ITT) are undocumented, and persistence and the revenue link are unknown. +3.2pp is a legitimate choice if finance wants an unbiased central forecast. This evaluation recommends it as the upside, with +1.4pp as the planning figure (E2, E9, E12).
- **Falling tickets and positive interviews independently confirm a large effect.** — Tickets are raw counts, not split by arm and confounded by pricing, and only about half of new users saw the new flow. The interviews are n=8 and drawn only from users who completed onboarding. Neither can speak to effect size (E6, E7).
- **The pricing change could have contaminated the A/B result too.** — The pricing change applied to all users, which implies both arms were exposed, so its main effect cancels in the difference. An interaction remains possible, but it has not been tested (E6, E12).

## Practical implications

- Remove the 18% from the forecast inputs. Replace it with ONB-27's +3.2pp absolute / +7.8% relative, always stated with the 95% CI of +0.4 to +6.0pp (+1.0% to +14.7% relative).
- Use one planning figure and three coherent scenarios: stress 0pp (analysis not confirmed or effect does not hold), base/planning +1.4pp (80% lower bound, about +3.4% relative), upside +3.2pp (point estimate). Do not plan on the +5.1pp or +6.0pp upper bounds. Record the choice of +1.4pp over +3.2pp as an explicit finance-policy decision about the cost of over-forecasting.
- Apply the uplift only to new-cohort revenue from users who go through the new flow, using a template such as: incremental revenue = new signups x flow coverage x delta day-30 retention x downstream revenue per extra retained user x a persistence factor. Finance must supply every input except delta retention from its own model.
- Ask the product team to confirm a fixed-horizon ITT analysis, the retention definition, full 30-day observation for late-August enrollees, and per-arm pricing exposure.
- Keep a holdout and track day-60/90 retention by arm, then revise the forecast assumption once persistence is observed.
- Do not cite the ticket drop or the interviews as confirmation of the effect size in forecast documentation.

## Remaining uncertainty

- The revenue model's sensitivity to day-30 retention and the share of next year's revenue from new cohorts are unknown (E12).
- Whether the effect persists beyond day 30 is unknown. For new signups the main risk is the arms' retention curves converging, not classic novelty decay (E10, E12).
- The stopping rule, peeking, ITT, analysis date and retention definition are undocumented in the readout (E1, E9).
- There is no analysis of pricing-by-treatment interaction or per-arm exposure, and no evidence on whether the current pricing will continue (E6, E12).
- The Q2 baseline definition is undocumented, so the source of the 3.5pp control-vs-Q2 rise cannot be split among pricing, season, mix and definition (E4, E5).
- The CIs and p-value are hand calculations using a normal approximation, not the official analysis. The relative intervals divide by a fixed control rate (E2).
- The packet contains no prior or replication data, so the size of any winner's-curse adjustment cannot be estimated formally. The +1.4pp planning figure is an interval-based discount, not a formal shrinkage estimate (E2).
- E12 UNKNOWN: No supplied or retrieved evidence covers the revenue model's sensitivity to day-30 retention, the share of next year's revenue from new cohorts, retention beyond day 30 for ONB-27 arms, or any pricing-by-treatment interaction.
- Open question the reviewer judged decisive: What is finance's revenue model sensitivity to day-30 retention, and what share of next year's revenue comes from new cohorts that will go through the new flow?
- Open question the reviewer judged decisive: Does the official ONB-27 analysis confirm a fixed-horizon ITT analysis with no peeking or early stopping, a consistent retention definition, and full 30-day observation for late-August enrollees?
- Open question the reviewer judged decisive: Does the treatment-control gap persist at day 60/90 and in revenue per user by arm, or do the arms' retention curves converge?

## Further research that could change the conclusion

- Day-60/90 retention and revenue per user by ONB-27 arm. Convergence would shrink the forecast allowance, and persistence or growth would support using the point estimate.
- Official pre-registered analysis output confirming a fixed-horizon ITT with no early stopping. If peeking occurred, the result may not be reliable.
- Finance's retention-to-revenue sensitivity and the new-cohort revenue share, needed to turn the uplift into a revenue figure.
- A per-arm pricing-exposure and interaction analysis.
- Segment-level SRM and effect checks by channel and signup week, to test how well the result generalises to next year's cohort mix.
- A replication or extended holdout on later cohorts to narrow the wide CI.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | ONB-27 readout: user-level 50/50 randomisation, 2026-07-01 to 2026-08-31. Control (old flow) 984 of 2,400 retained at day 30 (41.0%). Treatment (new flow) 1,039 of 2,350 (44.2%). Pre-registered primary metric is 30-day retention, two-sided test. | ab-test-readout.md |
| E2 | INFERRED | fixture_read | Recomputed from the E1 counts: control 984/2400 = 41.00%, treatment 1039/2350 = 44.21%. Absolute difference about +3.21pp, relative difference about +7.8% (0.0321/0.41). Unpooled SE about 0.01434, so the Wald 95% CI is about +0.40pp to +6.02pp (about +1.0% to +14.7% relative). Pooled two-proportion z is about 2.24, two-sided p about 0.025. | ab-test-readout.md |
| E3 | INFERRED | fixture_read | Sample-ratio check: 2,400 vs 2,350 against an expected 2,375/2,375 gives chi-square (1 df) of about 0.53, p about 0.47. That is far from any SRM threshold, including Microsoft's p < 0.0005. | ab-test-readout.md |
| E4 | VERIFIED | fixture_read | The PM slide reports 30-day retention of 37.5% (Q2 baseline, all users, old flow) rising to 44.2% (new flow), labelled '+18% retention'. | pm-summary-slide.md |
| E5 | INFERRED | fixture_read | Recomputing the slide: 44.2/37.5 - 1 = 17.9% relative, which rounds to the reported 18%. The absolute change is +6.7pp. The concurrent control arm (41.0%) is itself 3.5pp above the Q2 baseline, so more than half of the slide's 6.7pp gap appears without the new flow. The '18%' is relative, not absolute, and is about 2.3 times the randomised relative estimate of about 7.8%. | pm-summary-slide.md |
| E6 | VERIFIED | fixture_read | Onboarding-related tickets fell from 1,240 in Q2 to 1,090 in Q3 (-12%). A new pricing page and plan change launched on 2026-07-01 for all users. | support-ticket-trend.md |
| E7 | VERIFIED | fixture_read | In n=8 interviews (Aug 2026), 6 of 8 found the new checklist helpful and 2 said it felt long. Interviewees were recruited from users who completed onboarding. | interview-notes.md |
| E8 | VERIFIED | fetched | SRM is a significant difference between configured and observed group sizes and signals survivorship bias. It should be detected with a chi-square test, not by eyeballing the ratio. Microsoft's ExP uses a p < 0.0005 threshold and advises not to trust results with an SRM until the root cause is diagnosed. | https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/ |
| E9 | CORROBORATED | search_result | Repeatedly checking results and stopping when p < 0.05 inflates the false-positive rate well above 5% (for example, about 26% reported for daily checks). Fixed-horizon analysis or sequential methods are needed. | https://docs.statsig.com/experiments/advanced-setup/sequential-testing |
| E10 | CORROBORATED | search_result | Treatment effects measured in short online experiments can change over time. Novelty effects decay, while primacy or learning effects grow, so short tests may misstate long-run impact (Sadeghi et al., Microsoft, Technometrics 2022). | https://arxiv.org/pdf/2102.12893 |
| E11 | INFERRED | user_input | The user's request says finance plans to raise next year's revenue forecast based on the product team's report of an 18% lift in 30-day retention. | request |
| E12 | UNKNOWN | none | No supplied or retrieved evidence covers the revenue model's sensitivity to day-30 retention, the share of next year's revenue from new cohorts, retention beyond day 30 for ONB-27 arms, or any pricing-by-treatment interaction. | none |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 3 web search(es), 2 fetch attempt(s), 4 supplied document(s) read.
- search: "novelty effect online controlled experiments treatment effect decays over time long-term" (10 results)
- search: "sample ratio mismatch chi-squared test A/B experiments Fabijan diagnosing" (10 results)
- search: "peeking at A/B test results inflates false positive rate continuous monitoring" (10 results)
2. **Sources inspected:**
- https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/ (fetched)
- ab-test-readout.md (fixture_read)
- pm-summary-slide.md (fixture_read)
- interview-notes.md (fixture_read)
- support-ticket-trend.md (fixture_read)
   Cited from search snippets only (not opened):
- https://docs.statsig.com/experiments/advanced-setup/sequential-testing
- https://arxiv.org/pdf/2102.12893
3. **Checks executed:**
- Evidence registry validation: 12 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 2 draft(s)
- Calculation K1 re-executed: 984/2400 = 0.41 (claimed 0.41) → match
- Calculation K2 re-executed: 1039/2350 = 0.4421276595744681 (claimed 0.4421) → match
- Calculation K3 re-executed: 1039/2350 - 984/2400 = 0.032127659574468115 (claimed 0.03213) → match
- Calculation K4 re-executed: (1039/2350)/(984/2400) - 1 = 0.07836014530358071 (claimed 0.07836) → match
- Calculation K5 re-executed: sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350) = 0.014343969136448179 (claimed 0.01434) → match
- Calculation K6 re-executed: (1039/2350 - 984/2400) - 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350) = 0.004013480067029684 (claimed 0.004013) → match
- Calculation K7 re-executed: (1039/2350 - 984/2400) + 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350) = 0.06024183908190654 (claimed 0.06024) → match
- Calculation K8 re-executed: (1039/2350 - 984/2400)/sqrt((2023/4750)*(1-2023/4750)*(1/2400+1/2350)) = 2.238849682493038 (claimed 2.239) → match
- Calculation K9 re-executed: 44.2/37.5 - 1 = 0.17866666666666675 (claimed 0.1787) → match
- Calculation K10 re-executed: 44.2 - 37.5 = 6.700000000000003 (claimed 6.7) → match
- Calculation K11 re-executed: (41.0 - 37.5)/(44.2 - 37.5) = 0.5223880597014923 (claimed 0.5224) → match
- Calculation K12 re-executed: (44.2/37.5 - 1)/((1039/2350)/(984/2400) - 1) = 2.2800706401766013 (claimed 2.28) → match
- Calculation K13 re-executed: 41.0*0.18 = 7.38 (claimed 7.38) → match
- Calculation K14 re-executed: (2400-2375)^2/2375 + (2350-2375)^2/2375 = 0.5263157894736842 (claimed 0.5263) → match
- Calculation K15 re-executed: ((1039/2350 - 984/2400) - 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400) = 0.009788975773243131 (claimed 0.00979) → match
- Calculation K16 re-executed: ((1039/2350 - 984/2400) + 1.96*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400) = 0.1469313148339184 (claimed 0.1469) → match
- Calculation K17 re-executed: 1090/1240 - 1 = -0.12096774193548387 (claimed -0.121) → match
- Calculation K18 re-executed: 6/8 = 0.75 (claimed 0.75) → match
- Calculation K19 re-executed: (1039/2350 - 984/2400) - 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350) = 0.013744428729196127 (claimed 0.01374) → match
- Calculation K20 re-executed: (1039/2350 - 984/2400) + 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350) = 0.050510890419740107 (claimed 0.05051) → match
- Calculation K21 re-executed: ((1039/2350 - 984/2400) - 1.2816*sqrt((984/2400)*(1-984/2400)/2400 + (1039/2350)*(1-1039/2350)/2350))/(984/2400) = 0.03352299690047836 (claimed 0.03352) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://arxiv.org/abs/2102.12893 — getaddrinfo ENOTFOUND arxiv.org. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does not e
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G3 unresolved: The ticket note says the pricing change launched for all users on 2026-07-01, which implies both arms were exposed. There is no per-arm pricing exposure data or interaction analysis. Q2 vs control-arm definitional comparability (37.5% vs 41.0%) cannot be verified because the Q2 baseline is undocumented.
- Knowledge gap G4 unresolved: The readout does not state ITT, the stopping rule or peeking, the analysis date, the retention definition, or whether users enrolled near 2026-08-31 were observed for a full 30 days. Only the SRM check could be performed (passed).
- Knowledge gap G5 unresolved: No internal data on revenue share from new cohorts, the revenue model's sensitivity to retention, or ONB-27 retention beyond day 30. The general novelty-effect literature could only be seen via search snippets because arxiv.org is not reachable in this session's network settings.
- Knowledge gap G6 unresolved: Tickets are not normalised by user volume or split by arm, and interviews are not linked to arms. Neither can speak to effect size, only (weakly) to direction or mechanism.
5. **Independent validation status:** NOT INDEPENDENTLY VALIDATED. Only the in-pipeline adversarial review (same model family, fresh context) and deterministic checks were applied.
6. **Remaining uncertainty:** 11 item(s), listed above.
7. **Revisions:** 1
- cycle 1 (reanalysis): [decision_usefulness/major] D1 [verdict; practicalImplications[1]; alternatives[1]-[2]; tradeoffs[0]] The request asks what retention effect finance should use, and the draft never commits to one planning number. The verdict offers a base case 'at or near the CI lower bound (about +0.4pp, or zero)'. practicalImplications then lists 'base at zero or about +0.4pp, central or upside at +3.2pp, and a stress case at zero', which makes the base case and the stress case the same and leaves +3.2pp as both 'central' and 'upside'. That scenario set is incoherent. The choice of the 95% lower bound as the base case is also never justified. The draft calls +3.2pp 'the best single causal estimate', yet planning on the 2.5th-percentile value biases the forecast down on purpose. The only support is an asymmetric-loss assertion ('costs less than overstating revenue'), which no evidence backs and which is a finance-policy choice the draft should flag, not assume. It also skips the obvious middle options: a shrunk or winner's-curse-adjusted central estimate (for example about +1.5 to +2.5pp), or an 80% interval.
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency: [minor/reviewer] D3 [C4 assessment; CL9; edgeCasesAndFailureModes[5]; remainingUncertainty[1]] The new C4 and CL9 text says novelty effects concern 'mainly existing users' and that, for new signups, 'the more relevant risk is that the arms' retention curves converge after day 30'. This was added in response to review-1 D3. No packet evidence supports it: E10 is snippet-only and does not draw this distinction. The draft states it as fact and still cites E10. It is reasonable domain reasoning, but it should be labelled as the evaluator's inference, not as evidence-backed. (Review-1 asked for this distinction without requiring a source, so this is a minor wording issue, not a fault for following that review.)
- PASS reasoning_validity: [minor/reviewer] D2 [verdict; CL12; alternatives[2]] The draft says the effect exceeds +1.4pp 'with about 90% probability under the normal approximation'. That reads a frequentist 80% interval as a posterior probability, which implicitly assumes a flat prior. The same draft also argues that the point estimate is probably inflated (winner's curse). If that shrinkage holds, the flat-prior 90% overstates the probability. The two statements pull against each other and the draft does not reconcile them. Finance may read '90%' as a calibrated probability. The draft should label it as a flat-prior or naive figure, or replace it with a statement about one-sided confidence. I recomputed the figures in K19-K21 and they are correct: 0.03213 - 1.2816 x 0.01434 = 0.01375; the upper bound is 0.05051; 0.01375/0.41 = 3.35%.
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability: [minor/reviewer] D1 [verdict; C3 assessment/mechanisms; CL12 evidenceIds; alternatives[1]-[2]; counterarguments[1]] A main reason draft-2 gives for planning at +1.4pp is the winner's curse: 'an estimate that only just clears significance is also more likely than not to overstate the true effect', and the figure 'puts the figure in the range where a winner's-curse adjustment would plausibly land'. No packet evidence supports either statement. CL12 and alternatives[2] cite E9 for the discount, but E9 covers peeking and false-positive inflation, not inflated effect sizes. The point is statistically reasonable under modest power. Still, the size of any adjustment is unquantified, a gap the draft itself admits in remainingUncertainty[6], so 'plausibly land' claims more than the evidence supports. The draft should either say this rests on general statistical reasoning with no cited evidence, or drop the 'plausibly land' wording.
