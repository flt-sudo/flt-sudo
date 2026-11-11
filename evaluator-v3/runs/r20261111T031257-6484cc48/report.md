# Evaluation: Proposed migration of prod-k8s from 40 x n4.large to 20 x n4.xlarge nodes

## 1. Verdict

**Do not approve the migration as proposed.** The claimed saving of about $2,800/month comes from an arithmetic error. Using the attached Nimbus price sheet, 20 x n4.xlarge costs exactly the same as 40 x n4.large: **$5,606.40/month either way, a saving of $0.** The $2,803 figure is exactly half of current spend, which is what you get if the 20 new nodes are priced at the n4.large rate.

The "72% utilized" figure is also mislabeled. The SRE export shows that 72% is **CPU requested** (reserved by pod specs). Actual **CPU used** is 31% on a 30-day average and 44% at p95. FinOps and SRE are each half right:
- The cluster is not 72% busy.
- The scheduler does see it as 72% full, so you cannot just remove half the nodes without changing workload requests.

The real cost lever is **rightsizing pod requests and then shrinking node count**, not changing node size. A request-neutral node reduction is worth roughly $840/month. Request rightsizing could plausibly be worth about $1,400–1,700/month, but that number is illustrative and needs per-workload data.

The migration itself may be worth doing later for operational reasons, but it should not be approved this month on cost grounds.

## 2. Evaluation criteria

1. **Cost arithmetic:** does the claimed saving follow from the price sheet?
2. **Utilization interpretation:** what does "72%" actually measure, and does it support the proposal?
3. **Efficiency mechanism:** how much does "bigger nodes are more efficient" (per-node overhead) actually deliver?
4. **Capacity and scheduling feasibility:** will workloads still fit, with headroom?
5. **Reliability and operational risk:** blast radius, drain disruption, pod density, zone resilience.
6. **Alternatives:** is there a better way to reach the cost goal?
7. **Decision timing:** is there enough evidence to act this month?

## 3. Detailed analysis

### 3.1 Cost arithmetic (the decisive finding)

From `nimbus-price-sheet.csv`, using 730 hours/month:

| Config | Unit $/h | $/node-month | Nodes | $/month | vCPU | GiB |
|---|---|---|---|---|---|---|
| Current: n4.large | 0.192 | 140.16 | 40 | **5,606.40** | 160 | 640 |
| Proposed: n4.xlarge | 0.384 | 280.32 | 20 | **5,606.40** | 160 | 640 |
| Difference | | | | **0.00** | 0 | 0 |

- Pricing is perfectly linear. Every size costs $0.048 per vCPU-hour and $0.012 per GiB-hour, so changing node size cannot by itself change cost for the same total capacity.
- How the $2,803 figure was produced: $5,606.40 / 2 = $2,803.20 = 20 x $140.16. In other words, 20 nodes x the **n4.large** price. The analyst halved the node count but kept the old unit price. The report's "50% of node spend, ~$2,803/month" exactly matches this error.
- The proposal also keeps total capacity identical (160 vCPU and 640 GiB in both cases), so it is a reshaping, not a reduction.

### 3.2 What "72% utilized" actually means

From `sre-dashboard-export.csv`, 30-day window:

| Metric | Value |
|---|---|
| CPU requested / allocatable (avg) | **72%** (this is FinOps' number) |
| CPU used / allocatable (avg) | **31%** |
| CPU used / allocatable (p95) | **44%** |
| Memory requested / allocatable (avg) | 68% |
| Memory used / allocatable (avg) | 39% |
| DaemonSet CPU per node | 0.25 vCPU |

How this works in practice:
- The Kubernetes scheduler places pods based on **requests**, not on actual usage.
- So at 72% CPU requested and 68% memory requested, about 28–32% of allocatable capacity is free *from the scheduler's point of view*. That is fairly full for a production cluster that needs to absorb node failures, rollouts (surge pods) and autoscaling.
- Actual usage is far lower. CPU requests are about 2.3x the average usage (72/31) and about 1.6x the p95 (72/44). Memory requests are about 1.7x average usage (68/39).
- The waste is therefore **over-requesting by workloads**, not too many nodes for the work being reserved.

This reconciles the two teams. SRE is right that the hardware is mostly idle. FinOps' number reflects reservations, and calling it "utilization" is wrong. Neither number supports the conclusion that halving node count halves cost.

### 3.3 The "bigger nodes are more efficient" mechanism, quantified

The rationale (lower per-node overhead from kubelet, system reservations and DaemonSets) is real but small, and it only saves money if you then remove capacity.

**DaemonSets:**
- 40 nodes x 0.25 vCPU = 10 vCPU. 20 nodes x 0.25 vCPU = 5 vCPU. That frees 5 vCPU, about 3.1% of 160 vCPU.
- At $0.048/vCPU-h x 730 h = $35.04 per vCPU-month, 5 vCPU is worth about **$175/month in theory**.
- That is only realized if you remove capacity. The smallest unit you can remove after migrating is one n4.xlarge (8 vCPU, $280.32/month).

**System/kubelet reservations:**
- On many managed Kubernetes services these are tiered, so a larger node gives a slightly higher allocatable fraction.
- Example: older GKE formulas reserve 6% of the first core, 1% of the second, 0.5% of cores 3–4 and 0.25% above that. Memory reservations are also tiered, at 25% of the first 4 GiB and then declining.
- Newer GKE versions cap CPU reservation at 1 vCPU or less on standard node pools.
- Nimbus Cloud's actual rules are not in the sources. Read `allocatable` from `kubectl get node -o yaml` on one node of each type to get the real delta. It is likely a low single-digit percentage.

**Bin-packing:**
- Larger nodes reduce fragmentation for pods with large requests, which can recover a few percent more.

**Best case:** after migrating to 20 xlarge nodes, the freed overhead might let you drop to 19 nodes, saving **$280/month (about 5%)**. That is roughly what dropping 2 n4.large nodes today would save ($280.32), with no migration. Workload requests are about 0.72 x 160 − 10 ≈ 103 vCPU; on 38 n4.large nodes that is (103 + 9.5)/152 ≈ 74% requested.

### 3.4 Capacity feasibility of the proposal

- The proposal keeps capacity the same, so requested workloads will still fit.
- It is not a capacity reduction and creates no headroom problem by itself.
- The risk is operational, covered in section 6.

## 4. Strengths and weaknesses of the FinOps recommendation

**Strengths**
- It correctly identifies the cluster as a cost-optimization candidate.
- The per-node overhead argument is directionally valid.
- Consolidating onto fewer, larger nodes is a legitimate pattern when per-node costs such as licensing, per-node agents or IP limits are significant.

**Weaknesses**
- Pricing arithmetic error: the saving is $0, not $2,803.
- It mislabels request reservation as "utilization" and ignores the 31% used / 44% p95 figures.
- It confuses node *shape* with node *count*. Cost is driven by total provisioned vCPU/GiB under linear pricing.
- It gives no risk analysis (blast radius, PDBs, pod density, zones, commitments).
- It gives no rollout plan.

## 5. Comparison of alternatives

Estimates are per month and assume on-demand prices from the sheet. Option D's rightsizing targets are assumptions, not measured values.

| Option | Description | Est. node cost | Est. saving | Risk / effort |
|---|---|---|---|---|
| A. Proposal as-is | 20 x n4.xlarge | $5,606 | **$0** | Medium (migration, blast radius) |
| B. A + drop 1 xlarge | 19 x n4.xlarge | $5,326 | ~$280 | Medium |
| C. Request-neutral trim | Shrink n4.large pool until CPU requests ≈ 85% of allocatable: 28.8 node-equivalents / 0.85 → ~34 nodes. Memory: 27.2 / 0.85 → 32 nodes. | ~$4,765 | **~$841** (6 nodes) | Low–medium. Less failure headroom, see section 6 |
| D. Rightsize requests, then shrink | Example: CPU requests cut to about 55% of current allocatable (about 1.25x p95 usage), memory requests to about 50% (about 1.3x avg usage). Then pack at 80% → ~28 nodes | ~$3,925 | **~$1,682** (12 nodes) | Medium effort (VPA recommendations, per-team changes). Lower scheduling risk once done |
| E. Pricing levers | Committed-use or reserved discounts, spot for tolerant workloads | Not quantifiable from sources | Often material | Commitment lock-in. Do this *after* rightsizing to avoid committing to waste |

Notes:
- Option D can be combined with a later move to larger nodes if the per-node overhead gains are verified. Changing node size works best as a refinement *after* rightsizing, not as the primary lever.
- A cluster autoscaler (or Karpenter-style provisioner), if not already enabled, lets the node count track rightsized requests automatically.

## 6. Edge cases, failure modes and risks of the proposal

1. **Blast radius doubles.** One node failure or drain removes 5% of capacity instead of 2.5% and evicts about twice as many pods at once. With 28–32% free request headroom this is survivable, but rollouts and maintenance windows get coarser.
2. **Zone resilience (needs checking).**
   - If the cluster spans 3 zones and is meant to survive a zone loss, the surviving zones hold about 66.7% of capacity.
   - At 72% CPU requested, **the cluster may already be unable to reschedule everything after a zone outage**, with or without this migration.
   - 20 nodes also split unevenly across 3 zones (7/7/6), which makes zone imbalance worse.
   - Any node reduction (options C/D) must account for this.
3. **Pod density limits.** Max pods per node (often 110, and on some clouds limited by IP or ENI) applies per node. Halving node count halves total pod slots (for example 4,400 → 2,200 at 110/node). Check the current pod count, and the per-node pod CIDR or IP allocation, before consolidating.
4. **PodDisruptionBudgets and drain sequencing.** Replacing all nodes means draining 40 nodes. Strict PDBs, single-replica services or local-storage pods can stall the migration or cause outages.
5. **Stranded commitments.** Any reserved or committed discounts tied to n4.large would be stranded. The sources do not say whether any exist.
6. **Topology spread and anti-affinity.** Rules such as "one replica per node" behave differently with half as many nodes and may leave pods unschedulable.
7. **Bursty workloads.** The p95 is 44%, but cluster-level averages hide per-pod and per-node hot spots. Rightsizing (option D) must use per-container usage percentiles, ideally p95/p99 over 30+ days including month-end peaks, not cluster aggregates.
8. **Memory is the riskier dimension.** No memory p95 is provided. Under-requesting memory leads to OOM kills and evictions, not just throttling, so memory cuts should be more conservative than CPU cuts.

## 7. Counterarguments considered

- **"Fewer nodes means less operational overhead (patching, monitoring licenses, per-node agents)."**
  - This is valid if per-node licensing exists (for example, observability or security agents priced per host).
  - That would be a real non-compute saving, but it is not in the FinOps report and should be quantified separately.
  - It still does not justify the $2,800 claim.
- **"Larger nodes improve bin-packing."**
  - True at the margin, mainly for large pods.
  - Under linear pricing, the saving is capped by the overhead and fragmentation recovered, likely a few percent ($100–300/month), and it requires dropping nodes afterwards.
- **"SRE's 'mostly idle' means we can just cut nodes."**
  - Not safely. The scheduler sees 72% CPU and 68% memory committed.
  - Cutting below about 34 nodes without lowering requests would leave pods Pending during rollouts or failures.
- **"Maybe FinOps used a different price (discount)."**
  - The sources contain only one price sheet with linear pricing.
  - Any discount would apply proportionally to both sizes and would not create a difference.

## 8. Practical implications and recommended actions

1. **Reject this month's migration request** and return it to FinOps with the corrected arithmetic ($5,606.40 vs $5,606.40).
2. **Relabel the metric.** Report "CPU requested 72% / used 31% (p95 44%)" in future FinOps reviews.
3. **Start a request-rightsizing workstream:**
   - Run VPA in recommendation mode (or an equivalent tool) and collect per-workload p95/p99 CPU and memory usage.
   - Target the largest over-requesting teams first.
4. **Do a low-risk node trim in the meantime**, toward about 34–36 n4.large nodes with an autoscaler. This is worth about $560–840/month, but only after confirming:
   - zone topology and failure-headroom policy;
   - PDBs;
   - pod counts.
5. **Revisit node size later** with measured data:
   - actual `allocatable` per node type on Nimbus;
   - per-node licensing costs;
   - pod-density limits.
   Run it as a canary node pool (for example 2–4 xlarge nodes) rather than a big-bang replacement.
6. **After rightsizing, evaluate committed-use or spot pricing.**

## 9. Quantitative summary

- Current spend: 40 x 0.192 x 730 = **$5,606.40/month**.
- Proposed spend: 20 x 0.384 x 730 = **$5,606.40/month**. Saving: **$0.00**.
- Source of the error: $2,803.20 = 20 x 0.192 x 730.
- DaemonSet overhead freed by the proposal: 5 vCPU ≈ 3.1% of capacity ≈ $175/month in theory, realizable as about $280/month only by dropping one xlarge.
- Request-neutral trim to ~34 n4.large nodes: ~$841/month.
- Illustrative rightsizing to ~28 n4.large nodes: ~$1,682/month.

## 10. Sources

- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T031257-6484cc48/request.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T031257-6484cc48/sources/finops-report.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T031257-6484cc48/sources/nimbus-price-sheet.csv`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T031257-6484cc48/sources/sre-dashboard-export.csv`
- [About GKE node sizing (Google Cloud docs)](https://docs.cloud.google.com/kubernetes-engine/docs/concepts/plan-node-sizes?hl=en): tiered CPU/memory reservations, and the ≤1 vCPU cap on newer versions. Used only as an example of how per-node reservations work; Nimbus rules are unknown.
- [Allocatable memory and CPU in Kubernetes Nodes (learnk8s)](https://learnk8s.io/allocatable-resources): the older tiered reservation formulas.

## 11. Remaining uncertainty

- **Allocatable per node:** Nimbus Cloud's kubelet/system reservation rules are not given. The exact overhead advantage of n4.xlarge is estimated, not measured.
- **Rest of the cluster setup:** zone count and failure policy, pod count and max-pods setting, PDBs, existing autoscaler, and existing commitments are all unknown. Each could change how far node count can safely be cut.
- **Usage detail:** usage data is a cluster-level 30-day aggregate, with no memory p95 and no per-workload breakdown. The option D figures are illustrative only.
- **Non-compute per-node costs:** these (licensing, agents, IPs) could give the consolidation a small real benefit not covered here.
- **Process:** this is a single-pass evaluation. There was no independent verification step, no evidence registry, and no web fetch of full documentation pages. Only one web search was used.

## 12. Self-assessed quality score

**86 / 100.** The central finding (a cost-neutral migration, with the error traced exactly) is checked arithmetically against the provided price sheet, and the utilization mix-up is shown directly in the SRE export. Points are deducted because the savings for the alternatives rest on assumptions about allocatable capacity, topology and per-workload usage that the sources do not provide, and because the score is self-assessed rather than independently verified.
