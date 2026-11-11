# Lease vs. Buy: Corvid S4 Sequencer (Quote Q-88412)

## Verdict

**The controller's memo is wrong on the arithmetic and wrong on the reasoning, so don't approve the lease on its basis.**

1. **Arithmetic.** $11,500 × 48 = **$552,000**, not about $480,000. Before discounting, the lease costs $72,000 more than the purchase price. It costs **$90,000 more** than buying once you count the $72,000 of service the purchase needs and the $90,000 resale.
2. **"Free financing."** Discounted at the 8% cost of capital, the lease carries an implied financing rate of about **7.5%** a year. That is slightly cheaper than 8%, but it is not free (0%).
3. **Strict 48-month comparison.** In present value (PV) terms the lease is cheaper by about **$5,000**, about 1% of the deal. That margin is smaller than the uncertainty in the $90,000 resale estimate.
4. **The lab's actual 6-year need.** The lease has no purchase option and the equipment goes back at month 48, so leasing leaves a 24-month gap. Buying and keeping the instrument for 72 months is cheaper unless that gap can be covered for less than about **$3,600–$5,900 a month**, including service. That is roughly a third to half of the current lease rate.

**Recommendation: buy**, if the lab really expects to use the instrument for 6 years and can get service after year 4 at roughly $1,500 a month. Lease only if there is a real chance the instrument will be obsolete or not needed after 4 years. The 70% early-termination penalty weakens that argument too.

---

## Inputs and assumptions

| Item | Buy | Lease |
|---|---|---|
| Upfront | $480,000 (t=0) | $0 |
| Monthly | $1,500 service, paid in arrears (required for warranty) | $11,500 in arrears, service included |
| Term | Owned | 48 months; returned at end; no purchase option |
| End value | $90,000 expected resale at month 48 | None |
| Exit | Sell any time (resale risk) | Early termination costs 70% of remaining payments |

- The discount rate is 8%/12 = 0.6667% a month, with cash flows at month-end. Taxes are ignored, as the finance assumptions say.
- Discount factors at that rate:
  - 48-month annuity factor a₄₈ = **40.962**
  - month-48 discount factor v⁴⁸ = **0.72692**
  - 72-month annuity factor a₇₂ = **57.035**
  - month-72 discount factor v⁷² = **0.61977**

## Numbers for the CFO

### 1. Undiscounted totals (this is where the memo goes wrong)

| | Buy | Lease |
|---|---|---|
| Equipment / payments | $480,000 | $552,000 |
| Service (48 × $1,500) | $72,000 | included |
| Less resale | –$90,000 | – |
| **Net cash cost** | **$462,000** | **$552,000** |

### 2. Present value over 48 months at 8% (the right comparison)

| | Buy | Lease |
|---|---|---|
| Upfront | $480,000 | – |
| PV of monthly payments | $1,500 × 40.962 = $61,443 | $11,500 × 40.962 = $471,063 |
| PV of resale | –$90,000 × 0.72692 = –$65,423 | – |
| **PV cost** | **$476,020** | **$471,063** |
| Equivalent monthly cost | $11,621 | $11,500 |

**Over the 48 months the lease is cheaper by about $4,957 in PV, about $121 a month.**

### 3. What the lease really charges for financing

Take out the service so the two options are like for like. The lease then charges $10,000 a month for equipment, and the lessee gives up the $90,000 resale. The rate at which $480,000 = $10,000 × a₄₈(r) + $90,000 × v⁴⁸(r) is about **7.53% a year**.

That rate sits just below the 8% hurdle, which is why the lease comes out slightly ahead. If the lab's true marginal borrowing or opportunity cost is below about 7.5%, buying wins even on the 48-month basis.

### 4. Sensitivity on the 48-month comparison

| Change | Buy PV | Lease PV | Cheaper option (margin) |
|---|---|---|---|
| Base case (resale $90k, 8%) | $476,020 | $471,063 | Lease (+$4,957) |
| Resale $60k | $497,828 | $471,063 | Lease (+$26,765) |
| Resale **$96.8k (breakeven)** | ≈$471,063 | $471,063 | Equal |
| Resale $120k | $454,213 | $471,063 | Buy (+$16,850) |
| Discount rate 7.5% | $475,301 | $475,617 | Buy (+$316) |
| Discount rate 7.0% | $474,566 | $480,252 | Buy (+$5,686) |
| Discount rate 0% | $462,000 | $552,000 | Buy (+$90,000) |

The result flips if resale beats $90,000 by only about $6,800, or if the discount rate is half a point lower. Neither option is clearly better on the 48-month basis.

### 5. The 6-year horizon (the decisive analysis)

The lab expects to use the instrument for at least 72 months, but the lease ends at month 48 with no purchase option.

- **Buy and hold for 72 months:** PV = $480,000 + $1,500 × 57.035 – R₇₂ × 0.61977 = **$565,552 – 0.61977 × R₇₂**, where R₇₂ is the resale value at year 6.
- **Lease, then bridge for 24 months at X a month:** PV = $471,063 + X × (57.035 – 40.962) = **$471,063 + 16.073 × X**.

| Resale assumed at year 6 (R₇₂) | Buy-and-hold PV | Breakeven bridge cost X |
|---|---|---|
| $0 | $565,552 | $5,879/mo |
| $40,000 | $540,761 | $4,336/mo |
| $60,000 | $528,366 | $3,565/mo |

- If the bridge costs the same $11,500 a month, the lease path costs about **$655,900 in PV**. Buy-and-hold beats it by **$90,000–$127,000**.
- Short-term rental or a 2-year extension of a used instrument is unlikely to cost under $4,000–$6,000 a month. The vendor quote offers no extension at all.
- On a monthly-equivalent basis, buy-and-hold for 72 months costs about **$9,400–$9,900 a month**, against $11,500 for the lease.

## Evaluation criteria

- **Present-value cost** at the stated 8% rate and conventions. This is the main test.
- **Fit to the planned period of use** (6 years, not 4).
- **Sensitivity and risk:** resale, discount rate, obsolescence, ability to exit, service cost.
- **Liquidity and accounting effects.** These come second, because the 8% rate already prices the cash.

## Strengths and weaknesses

**Lease**
- It has no upfront cash outlay.
- Service is bundled at a fixed price for 4 years.
- The vendor carries the resale and obsolescence risk, which matters in fast-moving sequencing technology.
- It is marginally cheaper over 48 months.
- But it is not free (about 7.5% implied rate) and is effectively non-cancellable. Exiting at month 24 would cost 0.7 × 24 × $11,500 = **$193,200**.
- It also fails to cover the 6-year need, and the lab has no negotiating leverage at month 48.

**Buy**
- It is cheaper over any period longer than about 4 years.
- The lab can sell or redeploy the instrument at any time.
- But the lab carries the resale risk (the $90,000 is an estimate).
- Service pricing after month 48 is not quoted.
- And it uses $480,000 of cash or debt capacity now.

## Counterarguments considered

- **"The lease preserves cash."** True, but the 8% discount rate already charges for the cash. Preserving cash only adds value if the lab is capital-rationed, meaning its marginal use of cash earns well above 8%. If so, the CFO should apply that higher rate, which favours the lease.
- **"Operating leases stay off the balance sheet."** Not under ASC 842 or IFRS 16. A 48-month lease is recognised as a right-of-use asset and lease liability. Covenant or optics arguments for the lease are weaker than they used to be. Please confirm this with your auditors.
- **"Sequencers become obsolete quickly."** This is the strongest case for leasing. If a replacement at month 48 is likely anyway, the 48-month comparison applies and the lease's roughly $5,000 advantage plus its transfer of resale risk make it reasonable. But that conflicts with the stated plan to use the instrument for at least 6 years.

## Edge cases and failure modes

- **Resale below about $97,000** favours the lease over 48 months. Get a used-market or vendor buy-back quote to firm up the $90,000.
- **Service cost for years 5–6** could exceed $1,500 a month. Even at $3,000 a month, buy-and-hold for 72 months still beats a lease-and-bridge path at any realistic bridge price.
- **Ending use early:** if the project ends at month 24, the lease penalty of about $193,000 is likely worse than selling a 2-year-old owned unit.
- **Vendor flexibility:** ask for a purchase option at month 48 or a 72-month lease. Either could change the answer, and the analysis above gives the price levels at which each would win.

## Practical next steps

1. Correct the record: the lease totals $552,000, not $480,000, and it is not free financing.
2. Ask the vendor for three things:
   - a 72-month lease rate (to beat buy-and-hold, it needs to be under about $9,400–$9,900 a month including service)
   - a fair-market-value purchase option at month 48
   - a quote for service in years 5–6
3. Firm up the resale estimates for years 4 and 6.
4. Confirm the discount rate with the CFO. The decision changes at about 7.5%.

## Remaining uncertainty

- The resale values at years 4 and 6 are estimates.
- Service pricing after month 48 is unknown.
- The bridge or replacement cost for years 5–6 is unknown.
- The true marginal cost of capital and any capital rationing are unknown.
- Taxes are excluded as instructed. Depreciation against deductible lease payments could change the answer for a taxable entity.
- The ASC 842 / IFRS 16 point comes from general knowledge and was not checked against a source in this run.
- Discount factors were computed by hand, to within about ±$10 on the PVs.

## Sources

- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T032622-3e757f0e/request.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T032622-3e757f0e/sources/vendor-quote.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T032622-3e757f0e/sources/controller-memo.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T032622-3e757f0e/sources/finance-assumptions.md`
- No web research was done; the calculations are standard annuity and present-value arithmetic.

## Self-assessed quality score: 88/100

The memo errors are caught, the PV calculations follow the stated conventions, and the analysis includes the implied rate, the breakevens and the 6-year horizon. Points are lost because the factors were computed by hand, the accounting point was not checked against a source, and the 6-year conclusion rests on assumed bridge and resale values.
