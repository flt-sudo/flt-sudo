# Evaluation: Forecasting the m7i.large (us-east-1) on-demand price for January 2028 to decide on a 3-year commitment

## 1. Verdict

**No one can know the January 2028 price. The best point estimate is the current list price, about $0.1008/hr (Linux, shared tenancy, us-east-1), unchanged.** I put roughly 80–90% probability on it being exactly $0.1008 in January 2028. Most of the rest goes to a small cut (about 3–10%). A small chance goes to an increase.

**More importantly, the purchase decision should not depend on that number.** A 3-year Savings Plan or Reserved Instance fixes your committed rate on the day you buy. Whatever on-demand costs in January 2028 changes your savings by only a few percent, while the discount itself is roughly 50–55%. What actually drives the outcome is:
1. how many of the 36 months you will really use the capacity (utilization),
2. whether you will still want m7i, or even x86 in us-east-1, through about November 2029,
3. whether the 3-year discount is worth the loss of flexibility compared with a 1-year term.

**Recommendation:** Commit only to the baseline you are confident will run for 36 months, using a **Compute Savings Plan**, not an m7i-specific EC2 Instance Savings Plan or Standard RI. Size it at or below your minimum steady usage. Cover uncertain growth with 1-year terms or on-demand.

## 2. Evaluation criteria
- **Answerability:** can a future list price be forecast with useful precision?
- **Base rates:** how AWS on-demand prices for existing instance types have behaved historically.
- **Current market signals (2026):** memory shortage, GPU price increases, AWS's stated pricing policy.
- **Decision relevance:** how sensitive the commitment's payoff is to the future on-demand price compared with other variables.
- **Risk and flexibility:** lock-in to an instance family, generation, region or architecture.

## 3. Analysis

### 3.1 Current price (as of Nov 2026)
- On-demand m7i.large, us-east-1, Linux: **$0.1008/hr** (DoiT and DevZero pricing pages). That is about $73.58/month at 730 hrs.
- This is the same rate as at the m7i launch in August 2023 (from my own background knowledge). It has not changed in about 3 years.
- 3-year commitment rate: third-party data puts a 3-year No Upfront RI or Instance Savings Plan at about **$0.046/hr (~54% off)**, i.e. about $33.38/month (aws-pricing.com). I could not confirm this against AWS's own price list. A comparable data point is Mumbai, which shows $0.048 for 3-year No Upfront against $0.11 on-demand (Cloud Mercato). **Check the exact rate in the AWS Savings Plans pricing page or Cost Explorer recommendations before you buy.**

### 3.2 How on-demand prices behave
- AWS rarely re-prices an existing instance type's on-demand rate. Savings usually come from launching new generations at similar prices with better performance, not from cutting old SKUs. For example, m5.large and m6i.large have both sat at $0.096 in us-east-1 for years (background knowledge, not re-verified in this run).
- Targeted cuts do happen. A mid-2026 roundup (Spendark) reports 3–7% on-demand cuts for older x86 families (m5/c5/r5) in some regions. A cut to m7i by early 2028 is plausible once it is two generations old (m8i is already on sale), but cuts like this are uncommon and small.
- Increases are historically almost unheard of. AWS raised EC2 Capacity Block (GPU reservation) prices about 15% in January 2026 and about 20% from July 1, 2026 (The Register, InfoQ, ITPro, ConvergeDigest). According to the reporting, an AWS spokesperson said AWS's "commitment to not raise pricing on fixed pricing models like On Demand and Savings Plans remains unchanged."
- Pressure in the other direction: DRAM prices reportedly rose about 90–95% quarter-on-quarter in Q1 2026. OVHcloud warned of 5–10% price increases, and Hetzner raised prices. In my searches through November 2026, none of the big three hyperscalers had announced increases to general-purpose on-demand prices. This is the main upside risk to the forecast, but it has no precedent at AWS for on-demand rates.

### 3.3 Subjective probability distribution for January 2028 (m7i.large, us-east-1, Linux)
| Outcome | Probability | Price |
|---|---|---|
| Unchanged | ~80–90% | $0.1008 |
| Small cut (3–10%) | ~7–15% | ~$0.091–0.098 |
| Increase (memory-driven or policy change) | ~2–5% | ~$0.105–0.11 |

Expected value is about $0.100/hr. These probabilities are my judgement, not the output of a model.

### 3.4 Quantitative sensitivity: why the future price hardly matters
Assumptions: 1 instance, 730 hrs/month, 36 months, 3-year rate about $0.046/hr.
- Committed cost: 0.046 × 730 × 36 ≈ **$1,209**
- On-demand cost at $0.1008 for the whole term: ≈ **$2,649**, so savings ≈ $1,440 (~54%)
- If on-demand were cut 10% from January 2028 (about 22 of the 36 months at $0.0907): on-demand total ≈ $2,487, savings ≈ $1,278 (~49%)
- If on-demand rose 10%: savings ≈ $1,600

**Break-even utilization** is roughly 0.046 / 0.1008 ≈ **46%**. If the capacity runs less than about 46% of the term, the commitment loses money compared with on-demand. A plausible change in on-demand price moves that threshold by only a few percentage points. Changes in utilization, for example a workload moving to Graviton, m8i or another region, or being shut down, move it far more.

### 3.5 Commitment-type tradeoffs
- **Compute Savings Plan (3-year):** slightly smaller discount than an Instance Savings Plan or RI. It applies across instance families, generations, regions, OS, and also Fargate and Lambda. You keep the benefit if you move from m7i to m8i, or to Graviton (m7g/m8g, which are cheaper per vCPU). This is the best fit when you are unsure about the architecture you will run in 2027–2029.
- **EC2 Instance Savings Plan or Standard RI (3-year):** largest discount, but tied to the m7i family in us-east-1. A Standard RI can be resold on the RI Marketplace, subject to its restrictions. An Instance Savings Plan cannot be resold.
- **1-year terms:** smaller discount (about 30–40% is typical) but much less lock-in. Rolling 1-year terms keep the option to pick up future price cuts or new generations.
- **No Upfront vs. All Upfront:** All Upfront adds a few percentage points of discount. Weigh that against your cost of capital.

## 4. Strengths and weaknesses of the question's premise
- **Strength:** looking at the price trajectory is a sensible instinct. A falling on-demand price would erode the value of a commitment.
- **Weakness:** the premise implies a precise forecast is possible. It is not. It also frames the decision around the wrong variable: the price is fairly stable, while utilization and lock-in are not.
- **Weakness:** the timing does not line up. A 3-year commitment bought now runs to about November 2029, so January 2028 is just one point in the term, not its end.

## 5. Counterarguments
- *"The memory shortage could push on-demand up, so lock in now."* This is directionally right, but it only adds a little to an already strong case for committing on proven baseline usage. It does not justify committing more than you need. Savings Plan rates are fixed for the term whatever happens to list prices.
- *"Prices always fall, so wait."* Historically, cuts to an existing SKU's on-demand price have been rare and small, and waiting gives up roughly 54% savings every month. Waiting only pays if your usage is genuinely uncertain.

## 6. Edge cases and failure modes
- The workload shrinks, moves to containers or serverless, or moves region. An Instance Savings Plan becomes a sunk cost, while a Compute Savings Plan keeps much of its value.
- You move to Graviton or m8i for better price-performance. An m7i-locked commitment stops covering you.
- Windows, RHEL or licensed OS, Dedicated tenancy, or other regions have different rates. Everything above assumes Linux, shared tenancy, us-east-1.
- AWS breaks its pricing policy. If that happened, a commitment would protect you, which slightly favours committing your baseline.

## 7. Practical next steps
1. Pull 6–12 months of m7i usage from Cost Explorer and find the minimum steady hourly spend.
2. Look at AWS's Savings Plans purchase recommendations (3-year, No Upfront, Compute) and confirm the actual rates.
3. Commit about 70–90% of the steady-state floor to a 3-year Compute Savings Plan. Cover the rest with 1-year terms or on-demand.
4. Re-check your coverage every quarter, and watch the AWS "What's New" feed and the pricing pages for list-price changes.

## 8. Sources
- [DoiT – m7i.large us-east-1 pricing](https://www.doit.com/compute/spot/us-east-1/m7i.large)
- [DevZero – m7i.large](https://www.devzero.io/instances/aws/m7i.large)
- [aws-pricing.com – m7i.large](https://aws-pricing.com/m7i.large.html)
- [Cloud Mercato – m7i.large pricing](https://pcr.cloud-mercato.com/providers/aws/flavors/m7i.large/pricing)
- [The Register – AWS raises GPU prices 15% (Jan 2026)](https://www.theregister.com/2026/01/05/aws_price_increase/)
- [InfoQ – EC2 ML capacity price hike](https://www.infoq.com/news/2026/01/ec2-ml-capacity-price-hike)
- [ITPro – EC2 Capacity Blocks price increase](https://www.itpro.com/cloud/cloud-computing/aws-amazon-ec2-capacity-blocks-price-increase)
- [ConvergeDigest – ~20% Capacity Block increase from July 2026](https://convergedigest.com/aws-raises-ec2-prices-by-about-20-for-ai-gpu-reservations/)
- [Spendark – AWS pricing changes 2026](https://spendark.com/blog/aws-pricing-changes-2026/)
- [SoftwareSeni – cloud bill cost pass-through 2026](https://softwareseni.com/how-much-will-your-cloud-bill-increase-in-2026-analysing-the-infrastructure-cost-passthrough)
- [DEV Community – Hetzner price increases and the memory crunch](https://dev.to/devopsdaily/hetzner-doubled-its-prices-again-the-ai-memory-crunch-is-why-64b)

## 9. Remaining uncertainty
- I could not read AWS's own pricing pages directly; WebFetch was blocked, so only search results were available. The $0.1008 on-demand rate is consistent across sources. The exact 3-year rate (~$0.046) is a single third-party figure and needs checking.
- The m5/m6i price history and the August 2023 m7i launch price come from my background knowledge and were not re-verified here.
- The probabilities in section 3.3 are my judgement. The 2026 memory shortage is new territory and could change AWS's behaviour.
- I do not know your OS, tenancy, usage profile or plans for moving to other instance types or architectures, and these matter more than the price forecast.

## 10. Self-assessed quality score: 79/100
I could not verify against AWS's primary pricing pages, and the commitment rate rests on one secondary source. The core reasoning should hold either way: the future price is unknowable, and the decision depends on utilization and flexibility, not on the price.
