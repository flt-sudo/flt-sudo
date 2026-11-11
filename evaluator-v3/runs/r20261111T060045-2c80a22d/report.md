# Should Finance Use the "+18% Retention" Figure From Onboarding v2?

## Verdict

**No. Finance should not use +18%.** That number comes from comparing two different time periods. The trial's own control group (the randomised A/B test, ONB-27) shows a lift of **+3.2 percentage points**, from 41.0% to 44.2%. That is about **+7.8% relative**. The 95% confidence interval runs from roughly +0.4 to +6.0 pp, or about +1% to +15% relative, and p ≈ 0.025.

For the plan I recommend:

- **Base case: about +2 pp (about +5% relative).** This is the trial result pulled down to allow for a borderline result from a small, under-powered test.
- **Upside: +3.2 pp** (the raw trial estimate).
- **Downside: about 0 pp.**

**Confidence:** We can be moderately confident the effect is real and positive. We should have low confidence in how big it is. None of the evidence tells us whether a day-30 lift carries through to revenue over the forecast horizon.

## What a good answer needs to settle

1. **Is there a fair comparison?** Randomised and run at the same time, or before-and-after?
2. **How precise is the estimate?** Confidence interval and significance.
3. **Is it biased?** Sample-ratio mismatch, winner's curse, novelty effects, which users were enrolled.
4. **Does it apply to the forecast?** Population, the pricing change that launched alongside it, and how a day-30 lift turns into revenue.
5. **How should the four sources be weighted?** Each can only show certain things.

## Analysis of each source

### 1. A/B test readout (ONB-27): the only source that can show cause and effect

| Arm | n | Retained | Rate |
|---|---|---|---|
| Control | 2,400 | 984 | 41.0% |
| Treatment | 2,350 | 1,039 | 44.21% |

My calculations from the reported counts:

- **Absolute difference:** +3.21 pp. Standard error (unpooled) is 1.434 pp, giving z ≈ 2.24 and a two-sided **p ≈ 0.025**. The pooled test gives the same result.
- **95% CI for the absolute difference:** +0.40 pp to +6.02 pp.
- **Relative lift:** risk ratio 1.078, or **+7.8%**. The 95% CI on the log scale is 1.009 to 1.152, i.e. **+0.9% to +15.2%**.
- **Sample-ratio check:** 2,400 vs 2,350 against an expected 2,375/2,375 gives chi-square ≈ 0.53 and p ≈ 0.47. There is no sign that randomisation broke.
- **Pre-registration:** 30-day retention was the pre-registered primary metric with a two-sided test. That is good practice and lowers the risk of cherry-picking.
- **Pricing change:** It launched on 2026-07-01, the same day the trial started, and applied to all users. Both arms got it, so it does **not** bias the difference between arms. It does mean the effect was measured under the new pricing.

Even the top of the 95% CI (+15.2% relative) is below the PM's +18%. The trial's own data is statistically inconsistent with the slide's figure.

### 2. PM summary slide: the +18% is an error

The slide calculates 44.2% / 37.5% = 1.179, i.e. "+18%". It has three problems:

- **Wrong baseline.** It compares the treatment arm with a **Q2 historical baseline** (37.5%) instead of the trial's own control group (41.0%). The control group, which used the old flow, was already 3.5 pp above Q2. That 3.5 pp is about half of the slide's 6.7 pp gap, and it has nothing to do with onboarding. Likely causes are the July 1 pricing and plan change, seasonality (Jul–Aug vs Q2), and differences in user mix.
- **Different populations.** The baseline is labelled "all users". The trial covered enrolled users, presumably new sign-ups, so the comparison may not be like for like.
- **Relative vs absolute is ambiguous.** "+18% retention" could be read as 18 percentage points. The underlying gap is 6.7 pp, of which only about 3.2 pp can be attributed to onboarding.

Effect on the forecast: if finance's model scales with relative retention, using 18% instead of about 7.8% overstates the onboarding effect by about **2.3×**. Against the base case of about 5%, it is about **3.6×**.

### 3. User interviews (n=8): useful for design, not for measuring the effect

6 of 8 users found the checklist helpful. The sample is tiny and there is no control group. Interviewees were recruited **from users who completed onboarding**, a survivorship bias that leaves out exactly the people who churn. This tells us something about how the flow feels to use. It cannot back up any retention number. The 2 of 8 who said it "felt long" is a small warning sign about friction for some users.

### 4. Support-ticket trend: confounded, little weight

Onboarding tickets fell 12% (1,240 → 1,090) between Q2 and Q3. Three problems:

- It is a before-and-after comparison.
- It is not adjusted for user volume.
- The source itself notes the pricing and plan change launched for **all** users on 2026-07-01.

It is also unclear whether the new flow reached all users in Q3 or only the 50% treatment arm. If only half the users saw the new flow, the ticket drop is even less attributable to it. At most this is weak circumstantial support.

## Why plan below the trial's point estimate (+3.2 pp)

- **Winner's curse.** The result only just cleared significance (z ≈ 2.24). If the true effect were exactly 3.2 pp, the test would have had only about 61% power. If the true effect were 2 pp, power would be about 29%. In under-powered tests, results that come out significant tend to overstate the true effect (Kohavi et al.; Netflix/Chou).
- **Illustrative shrinkage.** I applied a sceptical prior, Normal(mean 0, SD 2 pp), which reflects that most onboarding changes have small effects. That prior is my assumption, not fitted to company data. With it, the posterior is about **+2.1 pp (SD 1.2), roughly −0.2 to +4.4 pp**. This is where the base case comes from.
- **Novelty effects and timing.** The trial covered one two-month summer window. Effects of a new flow often fade.
- **Day-30 is not revenue.** The forecast depends on long-run retention and monetisation of **new cohorts only**. A day-30 lift can shrink by day 90 or day 180, and existing customers are not affected at all. The revenue impact therefore scales with the share of next year's revenue that comes from new cohorts.

## Strengths and weaknesses of the evidence

**Strengths**
- Randomised by user, with a pre-registered primary metric.
- Arms are balanced (no sample-ratio mismatch).
- The data has had time to mature: the last enrollees reached day 30 by about Sep 30.
- The effect is directionally positive and statistically significant.

**Weaknesses**
- Small sample (4,750 users), so the interval is wide.
- Significance is borderline.
- Only one trial and one season.
- The effect was measured under a pricing regime that changed at the same moment.
- The headline slide figure is methodologically wrong.
- The supporting qualitative and ticket evidence cannot show cause and effect.

## Counterarguments

- **"The Q2 baseline represents the real old-world state."** It is the right baseline only if nothing else changed. The pricing launch and the control arm's 41.0% show that something else did change.
- **"The Q2 → Q3 rise is real, so count it."** It may well be real and could belong in the forecast. But it should be credited to its actual causes (pricing, seasonality), not to onboarding. And it should be forecast separately so it isn't double-counted.
- **"Shrinkage is too conservative."** That is a fair point if the company's past onboarding trials often replicated at this size. If so, use the raw +3.2 pp. The prior is a judgement call, and that is why I give a range.

## Edge cases and failure modes

- **Treatment may have been diluted.** If some treatment users never actually saw the new flow, the true effect could be a little larger than measured.
- **Interaction with the new pricing.** If the new flow works partly by explaining the new plans, the effect could differ in future pricing regimes.
- **Undisclosed extra metrics or segments.** There was a pre-registered primary metric, but if other metrics or segments were examined, check that the headline wasn't chosen after the fact.
- **Retention vs revenue.** If retained users are mostly free-tier, a retention lift may barely move revenue.

## Recommendations

1. Put **+2 pp absolute (about +5% relative) on day-30 retention for new cohorts** into the plan as the base case, with a range of **0 to +3.2 pp**. Do not apply it to existing customers.
2. Model the effect fading out past day 30 unless longer-horizon trial data shows otherwise. Pull day-60 and day-90 retention for the ONB-27 cohorts, which should be maturing by now.
3. Forecast the pricing and plan change's retention effect separately.
4. Keep a 5–10% holdout on the old flow, or rerun the test at a sample size that can detect about 2 pp with 80% power. That needs roughly **9,500 users per arm**, about 4× ONB-27.
5. Correct the slide, and report results as absolute pp with confidence intervals.

## Remaining uncertainty

- How the trial population was defined (new sign-ups only?) and how traffic was ramped.
- Whether longer-horizon retention and revenue per retained user also improved.
- The company's historical record of onboarding trials replicating, which is needed to set the shrinkage prior properly.
- How the Q2 37.5% baseline was defined.
- All figures are my own recalculations from the reported counts. The rates, 41.0% and 44.2%, match the readout.

## Sources

- Supplied files in /home/user/flt-sudo/evaluator-v3/runs/r20261111T060045-2c80a22d/sources/: ab-test-readout.md, pm-summary-slide.md, interview-notes.md, support-ticket-trend.md
- [Kohavi et al., "Power Analysis is Essential" (arXiv 2512.24521)](https://arxiv.org/pdf/2512.24521)
- [Kohavi, "When Not to Trust a Published A/B Test – an Example"](https://docs.google.com/document/d/1IDcLEr58QoQU2VJPc-TefLMLegdQMnh3/mobilebasic)
- [Netflix/Chou, winner's curse correction (arXiv 2502.08763)](https://pdf.arxiv.org/pdf/2502.08763)
- [Vermeer, "Trustworthy A/B Patterns and the Winner's Curse"](https://www.lukasvermeer.nl/publications/paper/2026/09/02/trustworthy-ab-patterns-and-the-winners-curse.html)

## Self-assessed quality score: 86/100

The core conclusion is well supported by the trial's own counts, and the calculations are reproducible. The shrinkage prior is my assumption, the revenue translation can't be quantified from the supplied evidence, and web fetching was unavailable, so the literature sources were seen only through search summaries.
