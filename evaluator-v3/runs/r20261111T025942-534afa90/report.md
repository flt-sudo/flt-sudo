# Evaluation: Proposed migration of the production Kubernetes cluster from 40 x n4.large to 20 x n4.xlarge nodes on Nimbus Cloud

**Decision objective:** Decide whether to approve the node migration (40 x n4.large to 20 x n4.xlarge) this month. That means checking three things: whether it actually lowers compute cost, whether it keeps enough capacity and resilience for production, and whether some other action (such as right-sizing requests or cutting node count) would do better on cost than a change of node shape. The claimed 50% / ~$2,800 saving and the 72% utilization figure are premises to test, not facts to accept.

## Verdict

Do not approve the 40 x n4.large to 20 x n4.xlarge migration as a cost-saving measure this month. At Nimbus list prices both fleets cost 5,606.40 USD/month, so the net change is zero, not the claimed 50% / ~$2,803 saving. The $2,803 figure is exactly half of current spend, which is consistent with the n4.xlarge rate being left out of the calculation. The 72% 'utilization' matches CPU requested of allocatable. Actual CPU use is 31% on average and 44% at p95. The cluster is over-reserved rather than busy. Consolidation frees only about 5 vCPU of daemonset overhead (about 3.1% of the 160 vCPU fleet). It also doubles the share of capacity lost when one node fails or drains (2.5% to 5%), and it means draining all 40 nodes, with extra cost for every hour the two pools overlap. A better option is to cut the n4.large count on the current shape, but only after checking request peaks first. Assume requests are evenly spread, set an illustrative ceiling of 80-85% requested of allocatable, and require that ceiling to hold after losing one node (N+1). Today's 72% CPU / 68% memory average requests would then need about 35-37 nodes. Removing 3-5 nodes would save about 420-701 USD/month at list price (7.5-12.5% of spend). That figure has low confidence. It rests on 30-day average requests, and rollout surges or HPA scale-out could push requests higher, so first pull peak or max request data and run zone-spread and PDB checks. Going further means lowering requests toward observed use. Lowering CPU requests alone stops paying off at about 33 nodes under the same N+1 rule, because memory requests would then be the limit. Discounted commitments are a later step once the right capacity is known. One thing could change the cost result: an account-specific discount that applies to n4.large and n4.xlarge differently. No such discount appears in the packet. Invoices or the billing export would settle it.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** The production cluster is 72% utilized.
  **Correction:** 72% matches CPU requested of allocatable (30d avg). Actual CPU used is 31% avg / 44% p95, and memory used is 39% avg against 68% requested. [E1, E4]
- **Assumption:** Replacing 40 n4.large with 20 n4.xlarge halves compute cost.
  **Correction:** At list price both fleets cost 5,606.40 USD/month. n4.xlarge costs exactly twice n4.large for twice the resources, so the cost is unchanged. [E2, E3]
- **Assumption:** The migration saves about $2,800/month (~$2,803).
  **Correction:** 2,803.20 is half of current spend, which is consistent with ignoring the doubled n4.xlarge rate. The list-price saving is 0 USD/month. [E1, E3]
- **Assumption:** Bigger nodes are more efficient.
  **Correction:** Only marginally. Consolidation frees about 5 vCPU of daemonset overhead (about 3.1% of 160 vCPU) plus a small, unquantified kubelet/system-reserved gain, and saves money only if capacity is removed. [E5, E8]
- **Assumption:** The cluster is mostly idle (SRE claim).
  **Correction:** Largely supported by use: 31% avg / 44% p95 CPU and 39% avg memory. But the window is only 30 days, with no memory p95 or peak data, so 'mostly idle' should be confirmed over a longer window before deep cuts. [E4, E14]

## Criteria

### C1 Verified net compute cost change (weight 30)

The claimed saving does not hold at list price. Current fleet: 40 x 0.192 x 730 = 5,606.40 USD/month. Proposed fleet: 20 x 0.384 x 730 = 5,606.40 USD/month. The cost ratio is 1.0 and the net change is 0 USD/month. The claimed ~$2,803 equals 5,606.40 / 2 = 2,803.20. That is what you get if the proposed fleet is priced at the old 0.192 USD/h per node, so the doubled n4.xlarge rate was ignored. Total resources are the same in both setups (160 vCPU / 640 GiB). The FinOps report shows no arithmetic to support any other reading. [E1, E2, E3, E13]

*Mechanisms:* The n4 family is priced linearly at 0.048 USD per vCPU-hour, with memory scaling in the same ratio. Changing node shape without changing total vCPU and memory therefore cannot change list spend. Spend only falls if total provisioned capacity falls or the unit price falls through discounts or commitments.

*Strengths:*
- The price sheet is VERIFIED and gives explicit hourly rates and the 730 h/month basis (E2).
- The recalculation is simple, reproducible and matches the claimed figure exactly as half of current spend (E3).

*Weaknesses:*
- Only list on-demand prices are available. Account-specific discounts, CUDs and invoices were not supplied (E13).
- How FinOps produced the $2,803 figure is inferred from the numbers matching; the report does not show its method (E1, E3).

### C2 Correct interpretation of utilization (requested vs used) (weight 20)

The 72% figure matches cpu_requested_pct_of_allocatable (30d avg) exactly. Actual CPU use is 31% avg and 44% p95. Memory is 68% requested and 39% used on average. FinOps and SRE are both partly right, but about different things. Requests are what limit scheduling, so the cluster looks 72% 'full' to the scheduler. Usage measures real work, and by that measure much of the reserved capacity sits idle. The gap between p95 use and requests is 28 percentage points of CPU allocatable. [E1, E4, E6, E14]

*Mechanisms:* The Kubernetes scheduler places pods by summing requests against node allocatable and ignores actual usage (E6). Inflated requests therefore use up schedulable capacity without consuming CPU. Waste shows up as the gap between requested and used. Request levels set how many nodes the current workloads need: some headroom exists at today's requests, and removing more nodes than that requires lowering requests.

*Strengths:*
- The SRE export is VERIFIED and separates requested from used metrics (E4).
- The scheduler behaviour is CORROBORATED by Kubernetes documentation (E6).

*Weaknesses:*
- That FinOps used the requested metric is inferred from the matching value; the report does not define its metric (E1, E4).
- Only a 30-day window is available. There is no memory p95, no peak or max data, and no node-pool breakdown (E4).
- E6 comes from search snippets of the documentation, not a direct fetch.

### C3 Real efficiency gain from fewer, larger nodes (weight 15)

Consolidation removes 20 nodes' worth of daemonset overhead: 0.25 x 20 = 5 vCPU. That is about 3.1% of the 160 vCPU total capacity, or about 1.25 n4.large equivalents. Allocatable is somewhat below 160 vCPU, so as a share of allocatable the figure is slightly higher; the exact value is unknown because Nimbus reservations were not supplied. Kubelet and system reservations are regressive on GKE (smaller share on larger nodes), so they add a little more, but probably only a modest amount. The efficiency gain is real but small. It saves nothing unless capacity is actually removed afterwards, and 5 vCPU does not divide into whole n4.xlarge nodes (8 vCPU each). [E4, E5, E8]

*Mechanisms:* Per-node overhead (daemonsets, kubelet, system reserved) repeats on every node, so fewer nodes means less total overhead. The saving scales with the number of nodes removed (20), not with the size of the cluster. Freed allocatable becomes money only when total provisioned capacity drops.

*Strengths:*
- The daemonset figure is measured (0.25 vCPU/node, E4) and the arithmetic is simple (E5).
- The regressive reservation curve is CORROBORATED for GKE as an analogy (E8).

*Weaknesses:*
- Nimbus kubelet/system-reserved values and total allocatable are unknown, and memory overhead was not quantified (E5, E8).
- The pod-size distribution was not supplied, so bin-packing effects cannot be assessed (E5).
- E8 is GKE-specific and taken from snippets.

### C4 Availability and blast-radius risk (weight 15)

At 20 nodes, one node is 5% of capacity, against 2.5% at 40 nodes. Each failure or drain therefore displaces twice as many pods. Request headroom is adequate for losing one node in either layout, assuming requests are evenly spread. With one node lost, requests rise to about 73.8% of remaining allocatable at 40 nodes and about 75.8% at 20 nodes. Both figures hold total requests and per-node allocatable fixed. They ignore the roughly 5 vCPU of daemonset requests (and some system reserve) that consolidation would free, so the 20-node figure is slightly conservative. The difference is small and does not change the conclusion. Zone layout, PDBs, anti-affinity rules and replica counts are unknown, so zone-failure survivability cannot be determined. On a change with no cost benefit, the added blast radius is pure downside. [E4, E9, E10, E13]

*Mechanisms:* Larger nodes concentrate pods, so a single node event removes a bigger share of capacity and of replicas. Fewer nodes also make zone balancing and anti-affinity placement harder, and they make autoscaling steps coarser (E9).

*Strengths:*
- The blast-radius effect is CORROBORATED by practitioner guidance (E9). The per-node share is simple arithmetic.

*Weaknesses:*
- The cluster's zones, PDBs, anti-affinity rules and replica counts were not supplied (E13).
- The N+1 arithmetic assumes requests are spread evenly across nodes, uses the 30-day average request level, and ignores the overhead freed by consolidation.

### C5 Alternative savings options (right-sizing, node reduction, autoscaling, commitments) (weight 15)

There are two steps to real savings. (1) Cut node count on the current n4.large shape, within existing request headroom, once request peaks have been checked. Assume requests are spread evenly, per-node allocatable stays the same, and the request ceiling must still hold after one node is lost (N+1). At steady state, holding CPU requests at or below an illustrative 85% of allocatable needs 40 x 72 / 85 = about 33.9 nodes. Under N+1 the fleet minus one node must still cover that, so the fleet needs 35 nodes. With one of the 35 lost, CPU requests reach about 84.7% of remaining allocatable, inside the ceiling. Memory needs 40 x 68 / 85 = 32 nodes at steady state (33 with N+1), so CPU is the limit. About 5 nodes could go, saving 700.80 USD/month at list price (12.5% of spend). At a more conservative 80% ceiling, steady state needs 36 nodes and N+1 needs 37. That means removing 3 nodes and saving 420.48 USD/month (7.5%). The sizing treats all 72% of requested CPU as load that moves to the remaining nodes. Part of it is the 0.25 vCPU/node daemonset request, which disappears with each removed node, so the estimate is slightly conservative. That effect is a small fraction of one node's capacity. (2) Lower requests toward observed use plus a headroom policy, then remove more nodes. Under the same N+1 rule at 85%, lowering CPU requests alone stops helping once memory requests become the limit at about 33 nodes: a total of 7 nodes removed and 981.12 USD/month. Going beyond that needs memory right-sizing, and memory p95 is unknown, so no figure can be given. A cluster autoscaler alone will remove few nodes at today's requests. Its default scale-down test needs node requests below 50% of allocatable, and the cluster averages 72% CPU and 68% memory requested. Commitments should be bought only on the reduced baseline. All of these figures are illustrative and have low confidence. The 80-85% ceilings are assumptions rather than an agreed policy. They rest on 30-day average requests, and peaks from rollout surges or HPA scale-out would reduce the safe cut. Both steps beat the shape change, which saves zero at list price. The generic 30-50% savings range in E12 is vendor material and is not used as an estimate here. [E2, E4, E6, E7, E10, E12, E13]

*Mechanisms:* Spend scales with provisioned node capacity. How many nodes are needed depends on total requests against the chosen request ceiling, held after losing one node, and the binding resource (CPU now, memory once CPU is right-sized) sets the floor. Some nodes can go within today's headroom, and more only once requests drop. Commitments lower the unit price, so they should be sized after node reduction to avoid locking in excess capacity.

*Strengths:*
- Request-based scheduling and request-based autoscaler scale-down are CORROBORATED (E6, E7).
- The illustrative node-reduction figures come from VERIFIED request percentages and list prices (E2, E4).

*Weaknesses:*
- The 80-85% request ceilings are illustrative assumptions, not a headroom policy from the packet. The figures use 30-day average requests, not request peaks, so the immediate cut is low-confidence until peak or max request data is checked (E4).
- Memory p95 is missing, so the depth of memory right-sizing, and the dollar value of going below about 33 nodes, cannot be determined (E4).
- Uneven request distribution, zone balance and PDBs could reduce how many nodes can actually be removed (E10, E13).
- Whether Nimbus offers an autoscaler or CUDs is unknown (E7, E13).

### C6 Migration execution risk and timing (weight 5)

The migration means draining all 40 nodes while bringing up 20 new ones. Drains go through the Eviction API and honor PDBs, so a PDB that allows zero disruptions can block a drain indefinitely. Topology and zone-spread rules make rescheduling harder. The cutover also costs money while both pools run. At list price each surge n4.xlarge costs 0.384 USD/h, so a full day with all 20 new nodes running beside the old pool adds about 184.32 USD. All of that effort, risk and transition cost buys no list-price saving. Change freezes, upcoming peaks and pending upgrades this month are unknown. Acting this month adds risk with no demonstrated benefit. Removing a few n4.large nodes involves far fewer drains and no surge pool. [E2, E10, E11, E13, E14]

*Mechanisms:* Every drain evicts pods subject to PDBs and needs capacity elsewhere to reschedule them, which usually means running new nodes before the old ones are removed. Rollback means re-provisioning the old node pool and draining again.

*Strengths:*
- Drain and PDB behaviour is CORROBORATED (E10).
- The surge-cost rate comes straight from the VERIFIED price sheet (E2).

*Weaknesses:*
- No cluster-specific PDB, freeze or peak-calendar data (E13).
- How long the overlap lasts is unknown, so the total transition cost depends on the migration plan.
- E10 is blog-sourced and conflicts with the low-authority E11.

## Key claims

- **CL1** (material): At Nimbus list prices the current fleet (40 x n4.large) and the proposed fleet (20 x n4.xlarge) each cost 5,606.40 USD/month, so the migration's net list-price cost change is zero (ratio 1.0). [E2, E3, K1, K2, K3]
- **CL2** (material): The claimed ~$2,803/month saving equals exactly half of current spend (2,803.20 USD). This is consistent with pricing the 20 new nodes at the old n4.large rate, so the doubled n4.xlarge rate was ignored. The FinOps report shows no arithmetic that would support any other derivation. [E1, E3, K4]
- **CL3** (material): Nimbus n4 pricing is linear at 0.048 USD per vCPU-hour for both n4.large and n4.xlarge, so changing node shape cannot reduce list spend unless total capacity changes. [E2, K5, K6]
- **CL4** (material): The FinOps 72% figure matches the SRE metric cpu_requested_pct_of_allocatable (30d avg), not CPU used. Used CPU is 31% avg and 44% p95, a 28-percentage-point gap between p95 use and requests. [E1, E4, K7]
- **CL5** (material): Scheduling, and request-based autoscaler scale-down, depend on requests rather than actual usage. Request levels therefore set how many nodes can be removed. A limited number can go within today's request headroom (see CL15), but deeper capacity cuts, and autoscaler-driven scale-down below the default 50% threshold, require lowering inflated requests first. [E4, E6, E7, K16, K19]
- **CL6** (material): Consolidating from 40 to 20 nodes frees about 5 vCPU of daemonset overhead. That is about 3.1% of the 160 vCPU total capacity (slightly more as a share of the unknown, smaller allocatable), or about 1.25 n4.large equivalents, far below the claimed 50%. [E4, E5, K8, K9, K10]
- **CL7**: Kubelet/system reservations are regressive with node size on GKE, so larger nodes recover slightly more allocatable. The amount for Nimbus cannot be quantified from the packet. [E8]
- **CL8** (material): Halving the node count doubles the capacity share lost per node failure or drain, from 2.5% to 5%. [E9, K11, K12]
- **CL9**: Assuming requests are spread evenly and total requests stay fixed, losing one node raises CPU requests to about 73.8% of remaining allocatable at 40 nodes and about 75.8% at 20 nodes. Single-node loss fits within request headroom in both layouts. The 20-node figure ignores the roughly 5 vCPU of daemonset requests that consolidation frees, so it slightly overstates saturation. [E4, E9, K13, K14]
- **CL10**: Zone-failure survivability, PDB constraints and minimum safe node count cannot be determined, because zone layout, PDBs, anti-affinity rules and replica counts were not supplied. [E13]
- **CL11** (material): Whether account-specific discounts or commitments apply differently to n4.large and n4.xlarge cannot be determined. The zero-saving result is established at list price only. [E13, E2]
- **CL12** (material): Right-sizing requests toward observed use, followed by node removal, is the route to savings beyond the immediate node cut. At an illustrative 85% request ceiling, memory requests (68%) need 32 nodes at steady state, so 33 nodes if the ceiling must hold after losing one node. Lowering CPU requests alone therefore stops helping at about 33 nodes. That caps the illustrative saving at 7 nodes, or 981.12 USD/month at list price. Savings below 33 nodes cannot be determined without memory p95, peak data and a headroom policy. The generic 30-50% vendor range (E12) is not specific to this cluster and is not relied on. [E2, E4, E12, E13, K17, K24]
- **CL13**: Node drains during migration go through the Eviction API and honor PDBs, so restrictive PDBs can block or slow the migration. The single contrary source (E11) is low-authority and less reliable. [E10, E11]
- **CL14**: Whether the 30-day window includes peak events, and whether memory rather than CPU will limit node reduction after CPU right-sizing, cannot be determined precisely from the packet. Memory is 68% requested and 39% used on average, with no p95. [E4, E13]
- **CL15** (material): Assume requests are spread evenly, per-node allocatable stays the same, and an illustrative request ceiling of 80-85% of allocatable must still hold after losing one node (N+1). Today's average requests (72% CPU, 68% memory) then need about 35-37 n4.large nodes, with CPU as the limit. At 85%, steady state needs about 33.9 nodes, so N+1 needs 35. Losing one of the 35 leaves CPU requests at about 84.7% of remaining allocatable. At 80%, steady state needs 36 nodes, so N+1 needs 37. Removing 3-5 nodes would save about 420.48-700.80 USD/month at list price (7.5-12.5% of current spend). The sizing treats the 0.25 vCPU/node daemonset request as load that moves to the remaining nodes, although it disappears with each removed node, so the estimate is slightly conservative. The estimate rests on 30-day average requests and has low confidence. Before acting, check it against peak or max request data, including rollout surges and HPA scale-out, and run zone-spread and PDB checks. [E2, E4, E10, E13, K15, K16, K17, K18, K19, K20, K21, K22, K23]
- **CL16**: Running the new pool alongside the old one during the cutover adds list cost of 0.384 USD/h per surge n4.xlarge. That is about 184.32 USD for each full day all 20 new nodes overlap the old pool, which adds a transition cost to a change with no steady-state saving. [E2, E10, K25]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Monthly list cost of current fleet: 40 n4.large at 0.192 USD/h for 730 h (USD) | `40 * 0.192 * 730` | 5606.4 | 5606.4 | yes |
| K2 | Monthly list cost of proposed fleet: 20 n4.xlarge at 0.384 USD/h for 730 h (USD) | `20 * 0.384 * 730` | 5606.4 | 5606.4 | yes |
| K3 | Ratio of proposed to current monthly list cost (1 means no saving) | `(20 * 0.384 * 730) / (40 * 0.192 * 730)` | 1 | 1 | yes |
| K4 | Half of current monthly spend, compared with the claimed ~$2,803 saving (USD) | `40 * 0.192 * 730 / 2` | 2803.2 | 2803.2 | yes |
| K5 | n4.large price per vCPU-hour (USD) | `0.192 / 4` | 0.048 | 0.048 | yes |
| K6 | n4.xlarge price per vCPU-hour (USD) | `0.384 / 8` | 0.048 | 0.048 | yes |
| K7 | Gap between CPU requested (72%) and CPU used p95 (44%) of allocatable, in percentage points | `72 - 44` | 28 | 28 | yes |
| K8 | Daemonset CPU freed by removing 20 nodes at 0.25 vCPU/node (vCPU) | `0.25 * 20` | 5 | 5 | yes |
| K9 | Freed daemonset CPU as a percentage of total fleet vCPU capacity (160), not of allocatable | `0.25 * 20 / 160 * 100` | 3.125 | 3.125 | yes |
| K10 | Freed daemonset CPU in n4.large (4 vCPU) equivalents | `0.25 * 20 / 4` | 1.25 | 1.25 | yes |
| K11 | Capacity share lost per node at 40 nodes (%) | `100 / 40` | 2.5 | 2.5 | yes |
| K12 | Capacity share lost per node at 20 nodes (%) | `100 / 20` | 5 | 5 | yes |
| K13 | CPU requests as % of remaining allocatable after losing 1 of 40 nodes (even distribution, fixed total requests) | `72 / (100 - 2.5) * 100` | 73.8 | 73.84615384615385 | yes |
| K14 | CPU requests as % of remaining allocatable after losing 1 of 20 nodes (even distribution, fixed total requests, ignores freed daemonset overhead) | `72 / (100 - 5) * 100` | 75.8 | 75.78947368421053 | yes |
| K15 | Monthly list saving per n4.large node removed (USD) | `0.192 * 730` | 140.16 | 140.16 | yes |
| K16 | n4.large nodes needed to keep current CPU requests (72% of 40 nodes' allocatable) at or below an illustrative 85% ceiling at steady state. Under N+1 the fleet minus one node must cover this, so n - 1 >= 33.88 and the fleet needs 35 nodes | `40 * 72 / 85` | 33.88 | 33.88235294117647 | yes |
| K17 | n4.large nodes needed to keep current memory requests (68% of 40 nodes' allocatable) at or below an illustrative 85% ceiling at steady state. Under N+1 the fleet needs 33 nodes | `40 * 68 / 85` | 32 | 32 | yes |
| K18 | Monthly list saving from removing 5 n4.large nodes (40 to 35, N+1 at 85% ceiling) (USD) | `5 * 0.192 * 730` | 700.8 | 700.8 | yes |
| K19 | n4.large nodes needed to keep current CPU requests at or below an illustrative 80% ceiling at steady state. Under N+1 the fleet needs 37 nodes, and losing one of them leaves exactly this 80% level | `40 * 72 / 80` | 36 | 36 | yes |
| K20 | Monthly list saving from removing 3 n4.large nodes (40 to 37, N+1 at 80% ceiling) (USD) | `3 * 0.192 * 730` | 420.48 | 420.4800000000001 | yes |
| K21 | CPU requests as % of remaining allocatable after losing 1 of 35 n4.large nodes (even distribution); at or below the 85% ceiling | `40 * 72 / 34` | 84.71 | 84.70588235294117 | yes |
| K22 | Saving from removing 5 of 40 nodes as % of current list spend | `5 / 40 * 100` | 12.5 | 12.5 | yes |
| K23 | Saving from removing 3 of 40 nodes as % of current list spend | `3 / 40 * 100` | 7.5 | 7.5 | yes |
| K24 | Monthly list saving from removing 7 n4.large nodes (40 to 33, memory-bound floor at 85% ceiling with N+1) (USD) | `7 * 0.192 * 730` | 981.12 | 981.12 | yes |
| K25 | Extra list cost per full day of running all 20 new n4.xlarge nodes alongside the old pool during cutover (USD) | `20 * 0.384 * 24` | 184.32 | 184.32 | yes |

## Alternatives

- **Approve the migration as proposed (20 x n4.xlarge):** List-price saving 0 USD/month (5,606.40 vs 5,606.40). It frees about 5 vCPU of overhead but removes no capacity. It doubles per-node blast radius (2.5% to 5%), requires draining 40 nodes, and adds about 184.32 USD for each full day of dual-pool overlap. Worse than the status quo on risk and equal on cost (E2, E3, E5, E9).
- **Status quo (keep 40 x n4.large):** Same 5,606.40 USD/month at list price, with no migration risk and the smaller blast radius. Does nothing about the requested-vs-used gap (72% vs 44% p95 CPU) (E3, E4).
- **Reduce n4.large count now on the current shape, without right-sizing:** Illustrative, with requests evenly spread and an 80-85% request ceiling that must hold after losing one node: drop from 40 to about 35-37 nodes, saving 420.48-700.80 USD/month at list price (7.5-12.5%). CPU requests are the limit (35 nodes at 85% with N+1, against 33 for memory). Losing one of 35 nodes leaves CPU requests at about 84.7% of remaining allocatable. Only a handful of nodes need draining, no surge pool is needed, and the 2.5%-per-node blast radius stays roughly the same. Low confidence: it rests on 30-day average requests, so it should wait for peak or max request data, and it requires zone and PDB checks (E2, E4, E10, E13).
- **Right-size requests toward observed p95 use plus headroom, then remove more n4.large nodes:** Goes beyond the immediate cut. At an 85% ceiling with N+1, lowering CPU requests alone stops helping at about 33 nodes because memory requests then bind: 7 nodes removed, 981.12 USD/month at list price. Deeper savings need memory right-sizing, which cannot be sized without memory p95. Each n4.large removed saves 140.16 USD/month. Keeping the 4-vCPU shape also keeps finer reduction steps (E2, E4, E6).
- **Enable a cluster autoscaler:** At 72% CPU / 68% memory requested, above the usual 0.5 scale-down threshold, few nodes would qualify for removal until requests are lowered. Best used after right-sizing. Availability on Nimbus is unknown (E7, E13).
- **Committed-use or reserved pricing:** Lowers the unit price instead of capacity. It should be sized on the reduced baseline to avoid committing to idle capacity. Nimbus commitment terms were not supplied (E2, E13).

## Tradeoffs

- Fewer, larger nodes give about 5 vCPU less daemonset overhead, at the cost of twice the capacity share lost per node event and coarser 8-vCPU scaling steps (E5, E9).
- Cutting n4.large nodes delivers a quick, modest saving (about 420-701 USD/month) but shrinks request headroom: even with N+1 sizing, losing one of 35 nodes reaches about 84.7% CPU requested. A lower ceiling keeps more headroom and saves less (E4).
- Aggressive right-sizing toward p95 use frees the most capacity but leaves less burst headroom. The 30-day window may miss peaks, and memory p95 is unknown (E4, E12).
- Buying commitments early locks in a lower price on capacity that may be excess. Waiting until after node reduction delays the discount but sizes it correctly (E13).
- A slower, more careful migration lowers drain risk but lengthens the dual-pool overlap, adding about 184.32 USD for each full day of overlap with no steady-state saving to offset it (E2, E10).
- Acting this month meets the requester's timeline (E14), but the shape change carries execution risk and no list-price benefit (E3, E10).

## Edge cases and failure modes

- A PDB with zero allowed disruptions, or single-replica workloads, can block drains indefinitely during the migration or a node reduction (E10).
- Pods with large requests may fit better on 8-vCPU nodes. Bin-packing could slightly favour n4.xlarge, but the pod-size distribution was not supplied (E5).
- If the cluster spans 3 zones, neither 20 nor 35 or 37 nodes divides evenly. Uneven zone capacity combined with maxSkew topology constraints could leave pods Pending after a node or zone loss (E10, E13).
- Requests may be unevenly spread, or may peak above the 30-day average (rollouts, HPA scale-out). Either would mean fewer nodes can be removed safely than the illustrative 3-5 (E4).
- Memory may limit node reduction once CPU requests are lowered: 68% of memory is requested, and memory p95 is unknown (E4).
- An account discount specific to n4.large (or n4.xlarge) would make the migration cost more (or less) than list price suggests (E13).
- Lowering requests below real peaks causes CPU throttling, or OOM kills if memory requests and limits are cut too far. The 30-day window may not include seasonal peaks (E4).
- Using kubectl drain with eviction disabled or forced deletion would bypass PDBs and risk outages. This is the scenario behind the E11 claim (E10, E11).

## Counterarguments

- **Bigger nodes are inherently more efficient because per-node overhead is shared.** — True but small here. Daemonset overhead freed is 5 vCPU, about 3.1% of capacity. It only becomes savings if capacity is removed, and the proposal keeps 160 vCPU (E5, K8, K9).
- **The cluster is 72% utilized, so it is not over-provisioned.** — 72% is CPU requested of allocatable. Actual use is 31% avg and 44% p95, so the cluster is over-reserved. Requests limit scheduling, but they are the thing to reduce (E4, E6).
- **Negotiated discounts might make n4.xlarge cheaper per vCPU than n4.large.** — Possible, but no discount evidence was supplied, and the list sheet is exactly linear. Even then, the saving would be far below 50% unless the discount gap were very large. Invoices or the billing export would settle it (E2, E13).
- **Halving node count is fine because request headroom (28%) easily absorbs one node loss.** — For a single node, yes: about 75.8% of remaining allocatable at 20 nodes. But zone loss, PDBs and anti-affinity are unknown. With no cost benefit, any added blast radius is uncompensated risk (E9, E13, K14).
- **The SRE claim that the cluster is mostly idle may be overstated if peaks are missing from the 30-day window.** — Fair. The window and missing memory p95 are real limits. That argues for a longer data window before deep right-sizing, and for a conservative ceiling in any immediate node cut. It does not argue for the shape change, which saves nothing regardless (E4, E3).

## Practical implications

- Reject or withdraw the migration as a cost measure. Ask FinOps to correct the saving estimate to 0 USD/month at list price and to state which utilization metric the report uses.
- Before cutting any nodes, pull peak or max requested CPU and memory (including rollout surges and HPA scale-out) and the per-node request distribution from the dashboard. If peaks support it, consider removing about 3-5 n4.large nodes (to 35-37), sized so the request ceiling still holds after losing one node, and check zone balance and PDBs. That is worth about 420-701 USD/month at list price. If peaks are well above the 30-day average, cut fewer nodes or none. Remove nodes one at a time and watch for Pending pods.
- Report utilization as both requested and used (avg and p95) for CPU and memory, so FinOps and SRE work from the same metrics.
- Start a request right-sizing exercise (for example VPA in recommendation mode) targeting observed p95 plus an agreed headroom for both CPU and memory, then remove further n4.large nodes in 140.16 USD/month steps. Memory requests will cap the gains at about 33 nodes (with N+1 at an 85% ceiling) unless memory is right-sized too.
- After node reduction, evaluate a cluster autoscaler (if Nimbus supports one) and commitments sized to the reduced baseline.
- Before any node reduction, audit PDBs, zone spread and replica counts so drains do not block and zone-loss capacity is preserved.

## Remaining uncertainty

- Account-specific discounts, CUDs or invoices could make the real costs differ from list price; none were supplied (E13).
- Which metric the FinOps report used is inferred from the 72% value matching; the report does not state it (E1, E4).
- There is no memory p95, no peak or max data, and only a 30-day window. Safe right-sizing depth and the savings below about 33 nodes are therefore unknown (E4).
- The 80-85% request ceilings and the N+1 rule behind the immediate node-reduction estimate are illustrative assumptions, not an organizational headroom policy. Those estimates use 30-day average requests and assume an even spread; the request distribution and request peaks were not supplied, so the 3-5 node figure has low confidence (E4).
- Nimbus kubelet/system-reserved values, total allocatable and the pod-size distribution are unknown, so the full consolidation gain and bin-packing effects are unquantified (E5, E8).
- How long the dual-pool overlap would last is unknown, so the total transition cost of the migration cannot be computed.
- Zone layout, PDBs, anti-affinity rules, replica counts, change freezes and upcoming peaks are unknown (E13).
- Official Kubernetes and GKE docs were seen only through search snippets (E6, E8).
- E13 UNKNOWN: No information was supplied on account-specific discounts, committed-use or reserved pricing, invoices, node-pool configuration, autoscaling history, zone layout, PDBs, change freezes or upcoming peak events.
- Open question the reviewer judged decisive: Do invoices or the billing export show a different effective per-vCPU rate for n4.xlarge than for n4.large (negotiated discounts, CUDs, sustained-use pricing)?

## Further research that could change the conclusion

- Billing export or invoices showing a materially different effective per-vCPU rate for n4.xlarge than for n4.large.
- The FinOps report author confirming a different cost model or metric basis for the 72% and $2,803 figures.
- A 90-day or longer usage window including peak events, with memory p95 and per-node request distribution, to size both the immediate node cut and later right-sizing.
- Pod request-size distribution showing large pods that fragment badly on 4-vCPU nodes, which would strengthen the bin-packing case for n4.xlarge.
- Nimbus documentation on kubelet/system-reserved formulas, autoscaler support and commitment pricing.
- Cluster PDB, zone and replica inventory, plus the change-freeze calendar for this month.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | The FinOps report (2026-10) states: cluster utilization 72% (CPU); current 40 x n4.large; proposed 20 x n4.xlarge; estimated saving '50% of node spend, ~$2,803/month'; rationale 'larger nodes reduce per-node overhead (kubelet, daemonsets)'. The report does not say which CPU metric (requested or used) the 72% is, and it shows no cost arithmetic. | finops-report.md |
| E2 | VERIFIED | fixture_read | The Nimbus price sheet lists on-demand rates: n4.large has 4 vCPU and 16 GiB at 0.192 USD/h; n4.xlarge has 8 vCPU and 32 GiB at 0.384 USD/h; n4.2xlarge has 16 vCPU and 64 GiB at 0.768 USD/h. A note says to use 730 hours per month for estimates. The sheet shows no discounts, commitments or sustained-use pricing. | nimbus-price-sheet.csv |
| E3 | INFERRED | fixture_read | Calculated from the price sheet: 40 x 0.192 x 730 = 5,606.40 USD/month for the current fleet, and 20 x 0.384 x 730 = 5,606.40 USD/month for the proposed one. The net list-price change is 0 USD/month. The claimed ~$2,803 equals 5,606.40 / 2 = 2,803.20. That fits an error where the old per-node price (0.192) was applied to 20 nodes, or where the doubled n4.xlarge rate was left out. Total resources are the same in both setups: 160 vCPU / 640 GiB. | nimbus-price-sheet.csv |
| E4 | VERIFIED | fixture_read | The SRE dashboard export reports: cpu_requested_pct_of_allocatable 72 (30d avg); cpu_used_pct_of_allocatable 31 (30d avg); cpu_used_pct_of_allocatable_p95 44 (30d); mem_requested_pct_of_allocatable 68 (30d avg); mem_used_pct_of_allocatable 39 (30d avg); daemonset_cpu_per_node_vcpu 0.25. | sre-dashboard-export.csv |
| E5 | INFERRED | fixture_read | Calculated: daemonset overhead freed by going from 40 to 20 nodes = 0.25 vCPU x 20 nodes = 5 vCPU, which is 5/160 = about 3.1% of total vCPU (about 1.3 n4.large-equivalents). Kubelet/system-reserved savings come on top of that and are expected to be small (see E8). | sre-dashboard-export.csv |
| E6 | CORROBORATED | search_result | Kubernetes docs (per search snippet): the scheduler checks, for each resource type, that the sum of requests of containers already scheduled on a node stays below the node's capacity (allocatable). It does this even when actual usage is low, so scheduling is driven by requests, not usage. | https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/ |
| E7 | CORROBORATED | search_result | Cluster Autoscaler marks a node as a scale-down candidate when the sum of CPU and memory requests of its pods is below a utilization threshold (default 0.5 of allocatable, set with --scale-down-utilization-threshold). The test uses requests, not actual usage, and pods must be movable without violating PDBs or affinity rules. | https://github.com/Azure/AKS/issues/3348 |
| E8 | CORROBORATED | search_result | Managed Kubernetes (GKE) reserves CPU on a tiered, regressive scale (6% of the first core, 1% of the next core, with smaller tiers beyond per a third-party source). Larger nodes therefore lose a slightly smaller share to system reservations, but the difference is modest. | https://docs.cloud.google.com/kubernetes-engine/docs/concepts/plan-node-sizes?hl=en |
| E9 | CORROBORATED | search_result | Fewer, larger nodes increase blast radius: each node failure or drain removes a larger share of capacity and pods. They also cut repeated DaemonSet overhead, but can be harder to handle during upgrades and outages. Smaller nodes give finer autoscaling increments. | https://itnext.io/architecting-kubernetes-clusters-choosing-a-worker-node-size-b3729cc0c78f |
| E10 | CORROBORATED | search_result | Node drains honor PodDisruptionBudgets through the Eviction API. A PDB allowing zero disruptions can block a drain indefinitely. Topology spread constraints (e.g. maxSkew 1 on topology.kubernetes.io/zone) and anti-affinity handle placement, while PDBs protect it during drains and autoscaler scale-down. | https://oneuptime.com/blog/post/2026-02-20-kubernetes-pod-disruption-budgets/view |
| E11 | INFERRED | search_result | One source says kubectl drain bypasses the Eviction API and therefore ignores PDBs. | https://www.resumelens.org/blog/kubernetes/pod-disruption-budgets |
| E12 | CORROBORATED | search_result | Vendor and practitioner guides recommend right-sizing requests toward observed usage (e.g. P95, using VPA in recommendation mode or Kubecost request sizing). They report typical savings of 30-50% on over-provisioned resources, but only when nodes are actually removed afterwards. | https://oneuptime.com/blog/post/2026-01-06-kubernetes-right-size-cluster/view |
| E13 | UNKNOWN | none | No information was supplied on account-specific discounts, committed-use or reserved pricing, invoices, node-pool configuration, autoscaling history, zone layout, PDBs, change freezes or upcoming peak events. | none |
| E14 | INFERRED | user_input | The requester wants to decide on the migration this month. The SRE team says the cluster is mostly idle. | request |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 6 web search(es), 3 fetch attempt(s), 3 supplied document(s) read.
- search: "Kubernetes scheduler ensures sum of resource requests of scheduled containers is less than node capacity" (10 results)
- search: "GKE reserved resources kube-reserved CPU per node larger nodes allocatable percentage" (15 results)
- search: "Kubernetes fewer larger nodes vs many smaller nodes trade-offs node failure impact blast radius" (15 results)
- search: "Kubernetes right-sizing resource requests overprovisioning cost savings cluster autoscaler bin packing requests vs usage" (19 results)
- search: "cluster autoscaler FAQ scale-down sum of cpu and memory requests of all pods below 50% of node allocatable" (17 results)
- search: "Kubernetes PodDisruptionBudget node drain topology spread constraints zones voluntary disruptions" (19 results)
2. **Sources inspected:**
- finops-report.md (fixture_read)
- nimbus-price-sheet.csv (fixture_read)
- sre-dashboard-export.csv (fixture_read)
   Cited from search snippets only (not opened):
- https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/
- https://github.com/Azure/AKS/issues/3348
- https://docs.cloud.google.com/kubernetes-engine/docs/concepts/plan-node-sizes?hl=en
- https://itnext.io/architecting-kubernetes-clusters-choosing-a-worker-node-size-b3729cc0c78f
- https://oneuptime.com/blog/post/2026-02-20-kubernetes-pod-disruption-budgets/view
- https://www.resumelens.org/blog/kubernetes/pod-disruption-budgets
- https://oneuptime.com/blog/post/2026-01-06-kubernetes-right-size-cluster/view
3. **Checks executed:**
- Evidence registry validation: 14 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 3 draft(s)
- Calculation K1 re-executed: 40 * 0.192 * 730 = 5606.4 (claimed 5606.4) → match
- Calculation K2 re-executed: 20 * 0.384 * 730 = 5606.4 (claimed 5606.4) → match
- Calculation K3 re-executed: (20 * 0.384 * 730) / (40 * 0.192 * 730) = 1 (claimed 1) → match
- Calculation K4 re-executed: 40 * 0.192 * 730 / 2 = 2803.2 (claimed 2803.2) → match
- Calculation K5 re-executed: 0.192 / 4 = 0.048 (claimed 0.048) → match
- Calculation K6 re-executed: 0.384 / 8 = 0.048 (claimed 0.048) → match
- Calculation K7 re-executed: 72 - 44 = 28 (claimed 28) → match
- Calculation K8 re-executed: 0.25 * 20 = 5 (claimed 5) → match
- Calculation K9 re-executed: 0.25 * 20 / 160 * 100 = 3.125 (claimed 3.125) → match
- Calculation K10 re-executed: 0.25 * 20 / 4 = 1.25 (claimed 1.25) → match
- Calculation K11 re-executed: 100 / 40 = 2.5 (claimed 2.5) → match
- Calculation K12 re-executed: 100 / 20 = 5 (claimed 5) → match
- Calculation K13 re-executed: 72 / (100 - 2.5) * 100 = 73.84615384615385 (claimed 73.8) → match
- Calculation K14 re-executed: 72 / (100 - 5) * 100 = 75.78947368421053 (claimed 75.8) → match
- Calculation K15 re-executed: 0.192 * 730 = 140.16 (claimed 140.16) → match
- Calculation K16 re-executed: 40 * 72 / 85 = 33.88235294117647 (claimed 33.88) → match
- Calculation K17 re-executed: 40 * 68 / 85 = 32 (claimed 32) → match
- Calculation K18 re-executed: 5 * 0.192 * 730 = 700.8 (claimed 700.8) → match
- Calculation K19 re-executed: 40 * 72 / 80 = 36 (claimed 36) → match
- Calculation K20 re-executed: 3 * 0.192 * 730 = 420.4800000000001 (claimed 420.48) → match
- Calculation K21 re-executed: 40 * 72 / 34 = 84.70588235294117 (claimed 84.71) → match
- Calculation K22 re-executed: 5 / 40 * 100 = 12.5 (claimed 12.5) → match
- Calculation K23 re-executed: 3 / 40 * 100 = 7.5 (claimed 7.5) → match
- Calculation K24 re-executed: 7 * 0.192 * 730 = 981.12 (claimed 981.12) → match
- Calculation K25 re-executed: 20 * 0.384 * 24 = 184.32 (claimed 184.32) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ — getaddrinfo ENOTFOUND kubernetes.io. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does n
- Fetch failed: https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/ — getaddrinfo ENOTFOUND kubernetes.io. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does n
- Fetch failed: https://docs.cloud.google.com/kubernetes-engine/docs/concepts/plan-node-sizes?hl=en — getaddrinfo ENOTFOUND docs.cloud.google.com. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, o
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G1 unresolved: Account-specific discounts, CUDs and invoices were not supplied, and Nimbus Cloud pricing could not be checked publicly. The result is valid at list price only.
- Knowledge gap G2 unresolved: No memory p95, no peak or max data, and no window longer than 30d. Node-pool coverage of the dashboard is unconfirmed, and so is which metric the FinOps report used (inferred from the matching value).
- Knowledge gap G3 unresolved: Nimbus kubelet/system-reserved values and the pod-size distribution are unknown. The direct fetches of kubernetes.io and docs.cloud.google.com failed because the hosts are not in the session's allowed network domains, so official docs were seen only via snippets. Those hosts would need to be allowed to verify directly.
- Knowledge gap G4 unresolved: The cluster's zones, PDBs, anti-affinity rules and replica counts were not supplied. Only general guidance is available.
- Knowledge gap G5 unresolved: Savings for specific alternatives cannot be computed without memory p95, a headroom policy, autoscaler availability on Nimbus, and Nimbus CUD pricing.
- Knowledge gap G6 unresolved: No information on change freezes, upcoming peaks or pending upgrades.
5. **Independent validation status:** Graded by separate grader process (eval-grader (native agent, claude-opus-5-5), prompts v5); total 88.75/100; critical failures: none. Grader is the same model family as the agent.
6. **Remaining uncertainty:** 10 item(s), listed above.
7. **Revisions:** 2
- cycle 1 (reanalysis): [alternatives_counterarguments/major] D1 [CL5; criteriaAssessments C5; alternatives (no 'reduce n4.large count now' option); practicalImplications] The draft says that, until requests are lowered, nodes cannot safely be removed and autoscaling 'will remove few nodes'. From that it concludes that right-sizing must come first (CL5, C5 assessment, 'Right-size ... then remove' alternative). The draft's own numbers contradict this. CPU requests are 72% of allocatable, about 115 of 160 vCPU. Memory requests are 68%, about 435 of 640 GiB. CL9 already finds that single-node loss fits inside the 28% request headroom. So the cluster can drop some nodes now, before any right-sizing. At an illustrative 85% request ceiling, CPU needs about 34 nodes and memory about 32. That means about 6 n4.large nodes could go, roughly 6 x 140.16 = ~840 USD/month at list price, subject to N+1, zone and PDB checks. The decision objective names 'cutting node count' as a separate alternative. The draft never assesses a direct node reduction on the current shape, and it gives no cluster-specific estimate, even an illustrative one, for any alternative. It leans instead on a generic vendor figure of 30-50% (E12). The decision-maker is left without the one quantified, low-risk option that could be acted on this month.; D1 major alternatives_counterarguments (direct node reduction omitted), remedy reanalysis
- cycle 2 (reanalysis): [reasoning_validity/major] D1 [verdict; CL15; CL12; criteriaAssessments C5; alternatives 'Reduce n4.large count now'; tradeoffs[1]; practicalImplications[1]; K16, K18, K21, K24] The new immediate node-cut estimate (CL15, C5 step 1, the 'Reduce n4.large count now' alternative, the verdict and practicalImplications) is inconsistent with its own safety condition. The draft sets an illustrative 85% request ceiling and sizes the fleet to the steady state: 40 x 72 / 85 = 33.88, so 34 nodes. It then shows (K21) that losing one node at 34 takes CPU requests to 87.3%, which breaches the ceiling the draft itself chose. It still presents 6 nodes / 840.96 USD/month as 'provided N+1 ... checks pass'. On the draft's own numbers, N+1 at 34 nodes fails an 85% ceiling. If the ceiling has to hold after losing one node, the fleet must satisfy (n-1) >= 33.88, so n = 35 and 5 nodes can go (700.80 USD/month). At 80%, (n-1) >= 36, so n = 37 and 3 nodes can go (420.48 USD/month). The N+1-consistent range is therefore 3-5 nodes, about 420-701 USD/month (7.5-12.5%), not 4-6 nodes and 561-841 USD/month (10-15%). The same flaw affects CL12's memory-bound floor: 32 nodes is exactly 85% memory requested at steady state, and N+1 at 31 nodes gives about 87.7%. The prior review (review-1 D1) proposed the ~6 nodes / ~840 USD figure without applying N+1, so the draft inherited the error by following it. The figure the review proposed was itself optimistic. Even so, the draft added and computed K21 and should have reconciled it. This is a production cluster, so the headline figure in the verdict overstates the safe immediate saving by about one node.; D1 major reasoning_validity (N+1 inconsistency), reanalysis; D3 minor needs internal request-peak data that web research cannot supply
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency
- PASS reasoning_validity
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability: [minor/reviewer] D1 [calculations K16, K17, K19; CL15; CL12] Draft-3 adds N+1 node counts (35 nodes at 85%, 37 at 80%, 33 as the memory floor). These counts appear only in the purpose text of K16, K17 and K19. The claimedResult of each calculation is still the steady-state value (33.88, 32, 36). The rounding step, n = ceil(steady-state) + 1, has no calculation entry of its own. A checker that recomputes the K expressions therefore cannot confirm the counts that drive the headline 3-5 node / 420.48-700.80 USD figure. The derivation is correct: (n-1) >= 33.88 gives 35, (n-1) >= 36 gives 37, and (n-1) >= 32 gives 33. K21 checks the 35-node case at 84.71%. There is no matching check for 37 nodes at 80% or 33 nodes at 85% memory, although both work out to exactly the ceiling (2880/36 = 80%, 2720/32 = 85%).
