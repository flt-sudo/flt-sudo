# Evaluation: Choosing between Portcullis API Gateway 5.2 and Lattice Service Mesh 3.x (sidecar mode) for 14 Go microservices, given an mTLS compliance mandate, a per-tenant edge rate-limiting requirement and a checkout latency budget

**Decision objective:** Pick which single networking component to adopt this quarter. It has to meet the hard compliance requirement R1 (mTLS on ALL east-west traffic between the 14 services by the 2027-06-30 audit) and the hard checkout limit R3 (at most 10 ms added p99 across edge plus 5 internal hops). It should also cover R2 (per-tenant rate limiting and API key auth at the edge) and be something 3 platform engineers can run. The decision also needs to check whether the either/or framing is right: whether Lattice's node-proxy mode, or adopting one product now and the other later, would meet the requirements better than either option as stated.

## Verdict

Neither framed option meets both hard requirements with confidence, so the either/or framing is wrong. Portcullis 5.2 alone fails R1. It does not proxy service-to-service traffic and offers mTLS only from the gateway to the first upstream (E2, E1). Lattice in sidecar mode fails R3 on the summed estimate from the internal mTLS STRICT measurement: 2.6 ms x 5 hops = 13 ms before any edge cost, and 13.8 ms with a 0.8 ms edge, against a 10 ms budget (E5, E1, K1, K2). That failure is likely but not proven. A sum of per-hop p99s equals the end-to-end p99 only when hops are fully correlated, and it usually overstates it when hops are independent with well-behaved tails (E13, E15, E18). This point is weaker than it looks, because E5's 'added p99 per hop' is probably a difference of p99s and not the p99 of the added delay, so those quantile results apply only loosely (E5, E18). The true end-to-end sidecar p99 could therefore be lower or higher. The best-supported choice this quarter is Lattice Service Mesh in node-proxy mode, with conditions. It has been GA since 3.2, and the platform team's note says it gives the same mTLS identity guarantees as sidecar mode (E6). It measured 0.9 ms per hop with mTLS STRICT, which sums to about 4.5 ms over 5 internal hops (E5, K4). In the recommended configuration Portcullis is not at the edge this quarter, so the edge is Lattice ingress or an existing edge, and its latency is unknown (E7). How much that edge may add depends on two unresolved readings: whether E5's 'per hop' counts one node proxy or two on a cross-node call (E5), and whether R3 means 5 or 6 proxied segments (E19). On the summed figure the edge may add up to 5.5 ms with one proxy per hop and 5 segments (K10), 4.6 ms with one proxy and 6 segments (K15, K16), and only 1.0 ms with two proxies and 5 segments (K12, K13). With two proxies and 6 segments the internal sum is 10.8 ms, which breaks R3 before any edge cost (K14). So the node-proxy pass on the summed figure is robust only under the one-proxy reading. The 5.3 ms total with a 0.8 ms Portcullis edge (K5) applies only to the later phased combination, under the one-proxy, 5-segment reading. Two conditions must be confirmed before committing. (a) The auditor must accept node-proxy mTLS, meaning per-workload certificates, rotation and STRICT enforcement. Today this rests only on an internal note (E6), supported by an Istio analogy (E10). (b) An end-to-end test of the full edge plus checkout chain must confirm R3. That test also settles the per-hop and segment-count readings in practice. The summed figure is not a guaranteed upper bound: rare per-hop spikes below 1% can compound across hops and push the end-to-end p99 above the sum (E14, E16, E18). Node-proxy Lattice does not cover R2. The only documented Lattice ingress feature is per-route rate limiting, with no per-tenant limits or API key auth (E4). Definition used throughout: 'one option' means one product the team adopts and runs this quarter. Lattice node-proxy and sidecar are modes of the same product. Portcullis plus in-app go-spiffe mTLS is not a single product. It also needs a SPIRE deployment (a Workload API server the team must run) plus code changes in all 14 services (E8), and no document says whether SPIRE counts against the one-option limit (E12). Ranked fallbacks, given that R1 has a hard audit date of 2027-06-30 while R2 has no stated deadline (E1): (1) Default: Lattice node-proxy now, and Portcullis at the edge in a later quarter for R2, if phasing is allowed (E12). (2) If the one-option limit is firm and R2 is wanted this quarter, still choose Lattice node-proxy and escalate the R2 gap, because R1 and R3 are hard and R2 is not. If R2 is made a hard requirement for this quarter, no single product in the packet covers R1, R2 and R3. The only Portcullis route that covers R1 adds SPIRE (E2, E8). Choose Portcullis plus go-spiffe/SPIRE only if stakeholders confirm SPIRE does not count as a second option. Otherwise the requirements conflict and must be escalated. The effort, latency and audit acceptance of this route are unquantified. (3) If the auditor rejects node-proxy, run the end-to-end test in sidecar mode. If sidecar's end-to-end p99 including the edge is at most 10 ms, choose Lattice sidecar. Otherwise choose Portcullis plus go-spiffe/SPIRE, subject to the same SPIRE confirmation. (4) If the decision is held strictly to the two options as stated, compare Lattice sidecar with the Portcullis option in both forms. Portcullis alone fails the hard R1 requirement outright (E2). Portcullis plus go-spiffe/SPIRE is admissible only if SPIRE does not count as a second option. Lattice sidecar likely fails R3 on the summed estimate (CL2), but that is not proven and can be tested before committing (E18). So do not adopt sidecar on the summed figures. Run the sidecar end-to-end test first. If it passes, choose Lattice sidecar: it enforces R1 centrally and meets R3 as measured. If it fails, the R3 breach is a measured violation of a hard limit. Portcullis plus go-spiffe/SPIRE fills R1 with in-app code whose risks are unquantified but not known failures, so choose it if SPIRE is allowed. If SPIRE is not allowed and sidecar fails, neither framed option meets both hard requirements. In that case the framing itself must be escalated, which is the case for node-proxy mode.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** Lattice sidecar adds only 0.4 ms p99 per hop, so latency is not a concern.
  **Correction:** 0.4 ms was measured with mTLS and telemetry off at 1 KB and 1,000 rps. With mTLS STRICT and checkout payloads, sidecar adds 2.6 ms per hop. That sums to 13 ms over 5 hops, which exceeds the 10 ms budget on the summed estimate. An end-to-end measurement is still needed to confirm it. [E3, E5, E1, E18]
- **Assumption:** The choice is strictly between Portcullis and Lattice in sidecar mode.
  **Correction:** Neither framed option is shown to meet both R1 and R3. Lattice node-proxy mode (GA since 3.2) is a viable third configuration of the same product. A phased approach is not ruled out by any document. [E2, E5, E6, E12]
- **Assumption:** Either option on its own can meet both the mTLS mandate and per-tenant edge rate limiting.
  **Correction:** Portcullis has no east-west mTLS. Lattice has documented per-route limiting only, with no per-tenant limits or API key auth. Neither covers both R1 and R2 alone on the evidence. [E2, E4]
- **Assumption:** Checkout added latency is the per-hop figure times 5, with no edge cost.
  **Correction:** R3 explicitly includes the edge, so edge latency must be added. That is about 0.8 ms for Portcullis at 2 KB, and unknown for Lattice ingress. Whether the internal path has 5 or 6 proxied segments is ambiguous. Summed p99s are also not a guaranteed bound in either direction. [E1, E2, E7, E18, E19]

## Criteria

### C1 East-west mTLS coverage (R1 compliance) (weight 30)

Portcullis alone cannot meet R1. It covers only the gateway to the first upstream and does not proxy east-west traffic (E2). Lattice in either mode is the only option in the packet that provides mTLS on every hop as a platform feature. Node-proxy mode is documented internally as giving the same mTLS identity guarantees as sidecar mode (E6), but whether the audit will accept it is not established. Portcullis plus go-spiffe/SPIRE could provide east-west mTLS with rotating SVIDs (E8), but enforcement would depend on code in each service. [E1, E2, E5, E6, E8, E10, E11]

*Mechanisms:* A mesh moves mTLS into a proxy layer: a sidecar per pod, or a shared proxy per node. Identity issuance, rotation and STRICT enforcement are then set by central policy rather than by application code. A north-south gateway sits only on the edge path, so traffic between services never passes through it and gets no mTLS from it. A node-proxy mesh can still present per-workload identities if the shared proxy holds a separate certificate for each workload identity. Istio ztunnel does this (E10), but nothing shows Lattice does.

*Strengths:*
- Lattice sidecar and node-proxy modes were both tested with mTLS STRICT on (E5)
- Internal note says node-proxy gives the same mTLS identity guarantees as sidecar (E6)
- go-spiffe streams updated X.509-SVIDs, so rotation in the in-app route needs no manual steps (E8)

*Weaknesses:*
- Portcullis has no east-west proxying (E2)
- Per-workload certificates in node-proxy mode are not confirmed for Lattice. E10 is only an analogy
- Auditor criteria for mTLS evidence are not defined (E1 limitations)
- The in-app route needs code changes in all 14 services plus running SPIRE, and its effort is not quantified (E8)

### C2 Checkout-path added p99 latency against the 10 ms budget (R3) (weight 25)

On the summed per-hop estimate from the internal mTLS STRICT test, Lattice sidecar mode exceeds R3: 13 ms over 5 hops even with zero edge cost (K1), and 13.8 ms with a 0.8 ms edge (K2). For sidecar to fit on the sum, the per-hop cost would have to be at most 2 ms with no edge cost (K11), or at most 1.84 ms with a 0.8 ms edge (K8). The sum is exact under full correlation and usually overstates the end-to-end p99 for independent, well-behaved tails (E13, E15, E18). E5's per-hop figures are probably differences of p99s, though, so this applies only loosely (E5, E18). The sidecar failure is therefore likely but not proven, and it needs an end-to-end measurement. Node-proxy sums to 4.5 ms over 5 internal hops under the one-proxy-per-hop reading (K4). In the recommended this-quarter configuration the edge is not Portcullis and its latency is unknown (E7). The edge headroom depends on the combined per-hop and segment-count readings: 5.5 ms with one proxy and 5 segments (K10), 4.6 ms with one proxy and 6 segments (K16), 1.0 ms with two proxies and 5 segments (K13). With two proxies and 6 segments the internal sum is 10.8 ms, which fails R3 with zero edge cost (K14). With a 0.8 ms Portcullis edge (the phased combination, one-proxy 5-segment reading), the sum is 5.3 ms (K5). The node-proxy pass is also not proven: if per-hop delay has rare large spikes, the end-to-end p99 can exceed the sum (E14, E16, E18). The vendor's 0.4 ms (2 ms over 5 hops, K3) was measured with mTLS and telemetry off, so it does not apply to R1-compliant operation (E3). [E1, E2, E3, E5, E7, E9, E13, E14, E15, E16, E18, E19]

*Mechanisms:* Each proxy adds handshake, encryption and decryption, L7 parsing and telemetry work on every hop. Larger payloads (6-40 KB against 1 KB) and higher rps (3,500 against 1,000) raise the per-hop cost (E3, E5). The internal sidecar figure is 6.5 times the vendor figure (K9). Sidecar mode puts proxies on both the client side and the server side of every hop. Node-proxy shares one proxy per node and does coarser L7 work (E6), which plausibly explains its lower cost. A cross-node call may still pass through two node proxies, and E5 does not say whether its 'per hop' figure covers one or both (E5). How per-hop p99s combine depends on the shape of the tails and on correlation (E18). (a) Fully correlated hops: the end-to-end p99 equals the sum (E13). (b) Independent hops with smooth tails: the end-to-end p99 is usually below the sum, so the sum is conservative (E15). (c) Independent hops with rare large spikes below 1% per hop: the spikes are invisible in each hop's p99 but compound across hops, so the end-to-end p99 can be well above the sum (E14, E16, E18). These results concern quantiles of the delays themselves. E5's 'added p99 per hop' is probably a difference of p99s (with mesh minus without), which is not the p99 of the added delay, so (a) to (c) apply to it only indirectly and the sum-is-conservative argument rests on weaker ground (E5, E18). K7 shows that across 5 independent hops only about 95.1% of requests avoid every hop's 1% tail. That measures how often a request meets at least one slow hop. It does not by itself show whether the sum overstates or understates the end-to-end p99. The packet's E14 and E15 disagree on how often case (c) matters in practice. Both are search-snippet sources and both can hold under different distributional conditions, so the disagreement cannot be settled for Lattice without per-hop histograms, which the packet does not have (E18). Node-proxy co-locates hops on shared proxies, which pushes it toward partial correlation, between cases (a) and (b) (E18).

*Strengths:*
- The internal test matches R1 conditions (mTLS STRICT, telemetry on, checkout payloads) (E5)
- Under the one-proxy, 5-segment reading, node-proxy's 4.5 ms internal sum leaves up to 5.5 ms for the edge (K4, K10)

*Weaknesses:*
- No end-to-end edge plus checkout-chain measurement exists for any option, so neither the sidecar fail nor the node-proxy pass is proven (E7, E18)
- The internal test reports no sample size, variance or repetitions, and does not say how 3,500 rps compares with production peak (E5)
- Lattice ingress latency is unknown, and the Portcullis 0.8 ms edge figure is from 2 KB payloads (E2, E7)
- If 'per hop' in E5 counts only one proxy, and a cross-node hop goes through two node proxies, the node-proxy internal sum is 9.0 ms over 5 segments (K12), leaving only 1.0 ms for whatever edge is used (K13)
- R3 may mean 5 or 6 proxied segments (E19). Combined with the two-proxy reading, 6 segments give 10.8 ms internal, which breaks R3 before any edge cost (K14)

### C3 Per-tenant rate limiting and API key auth at the edge (R2) (weight 20)

Portcullis meets R2 natively with API keys, OAuth2 and per-consumer and per-tenant rate limiting (E2). Lattice has documented per-route rate limiting at ingress only, with no mention of per-tenant limits or API key auth (E4). A Lattice-only choice therefore leaves R2 unmet or unproven. Public documentation is not available to settle this (E11). [E2, E4, E11]

*Mechanisms:* Per-tenant limiting needs the edge to identify the caller, for example from an API key, and to keep counters per tenant. Per-route limiting counts per path regardless of who calls, so it cannot enforce tenant quotas or authenticate keys.

*Strengths:*
- Portcullis has native per-tenant limiting and API key auth (E2)

*Weaknesses:*
- The only Lattice R2 evidence is the absence of a feature from a performance whitepaper, which does not prove the feature is missing (E4)
- No product documentation can be found publicly (E11)

### C4 Operational burden for a 3-engineer platform team (weight 15)

Portcullis alone is the lightest to run, but it does not solve R1. Adding the in-app go-spiffe route to it means changing code in 14 services and running SPIRE (E8). Lattice sidecar adds a proxy per pod for every service. Node-proxy shares one proxy per node, which should reduce injection and upgrade work, but the packet does not quantify this. Running both products later adds a second control surface for the same 3 engineers (E1). [E1, E2, E5, E6, E8]

*Mechanisms:* Operational load grows with the number of proxy instances, the number of code paths that handle certificates, and the number of products to upgrade and debug. A central mesh keeps certificate handling in one control plane. The in-app route spreads it across 14 codebases.

*Strengths:*
- Node-proxy has fewer proxy instances than sidecar (E5, E6)
- A gateway is a single component (E2)

*Weaknesses:*
- No evidence quantifies operating effort for any option
- Coarser L7 policies in node-proxy mode may push some policy work back into apps, and which policies are lost is not described (E6)

### C5 Delivery timeline and phasing feasibility (weight 10)

R1 has a hard date of 2027-06-30 (E1). R2 has no stated deadline in requirements.md, which makes R2 the requirement that can be deferred more safely. Adopting the mesh in node-proxy mode now and Portcullis later fits the dates better than the reverse, because Portcullis first would leave R1 depending on an unquantified in-app build before the audit. The 'one option this quarter' limit comes only from the user's request, and whether phasing is allowed is unconfirmed (E12). If the limit is firm, the verdict's ranked fallbacks apply: Lattice node-proxy stays first unless R2 becomes a hard requirement for this quarter. [E1, E12]

*Mechanisms:* The requirement with the compliance date and the broadest change (all 14 services) should start first, so there is time for rollout, STRICT enforcement and collecting audit evidence. The edge gateway is a single component that can be added later.

*Strengths:*
- 'By Q2' in the request matches the 2027-06-30 audit date (E12, E1)
- Nothing in the fixtures rules out adding the second product later (E12)

*Weaknesses:*
- Phasing is not confirmed by any document (E12)
- No date for R2 is given, so the business tolerance for deferring it is unknown (E1)

## Key claims

- **CL1** (material): Portcullis 5.2 alone cannot satisfy R1, because it does not proxy service-to-service traffic and offers mTLS only from the gateway to the first upstream. [E2, E1]
- **CL2** (material): On the summed per-hop estimate from the internal mTLS STRICT measurement, Lattice sidecar mode exceeds R3: 2.6 ms x 5 = 13 ms before the edge, and 13.8 ms with a 0.8 ms edge, both above 10 ms. The sum is exact only for fully correlated hops and usually overstates the end-to-end p99 for independent, well-behaved tails. Because E5's per-hop figures are probably differences of p99s, that result applies only loosely. The failure is likely but not proven until the end-to-end p99 is measured. [E5, E1, E2, E7, E13, E15, E18, K1, K2]
- **CL3** (material): The vendor's 0.4 ms per-hop figure (2 ms over 5 hops) does not represent R1-compliant operation, because it was measured with mTLS and telemetry disabled at 1 KB payloads and 1,000 rps. The internal figure is 6.5 times higher. [E3, E5, K3, K9]
- **CL4** (material): On the summed approximation, Lattice node-proxy mode adds about 4.5 ms over 5 internal hops if E5's 'per hop' covers one node proxy. In the recommended this-quarter configuration the edge latency is unknown, and the edge headroom depends on two unresolved readings. It is 5.5 ms with one proxy and 5 segments, 4.6 ms with one proxy and 6 segments (internal 5.4 ms), and 1.0 ms with two proxies and 5 segments (internal 9.0 ms). With two proxies and 6 segments the internal sum is 10.8 ms, which fails R3 with zero edge cost. The 5.3 ms total and 4.7 ms headroom apply only if Portcullis (0.8 ms datasheet figure) is the edge, as in the later phased combination, under the one-proxy, 5-segment reading. [E5, E7, E1, E2, E19, K4, K10, K15, K16, K12, K13, K14, K5, K6]
- **CL5** (material): Summed per-hop p99s are not a guaranteed bound in either direction. They equal the end-to-end p99 for fully correlated hops, usually overstate it for independent hops with well-behaved tails, and can understate it when per-hop delay has rare large spikes that compound across hops. These quantile results apply only indirectly to E5, whose 'added p99 per hop' is probably a difference of p99s rather than the p99 of the added delay, so even the 'usually conservative' case is weakly supported here. Across 5 independent hops about 95.1% of requests avoid every hop's 1% tail, but that figure alone does not settle the direction. R3 must be confirmed for both sidecar and node-proxy modes by an end-to-end checkout-chain test. [E5, E9, E13, E14, E15, E16, E18, K7]
- **CL6** (material): Whether Lattice node-proxy mode meets the auditor's R1 requirements (per-workload certificates, rotation, STRICT enforcement) cannot be determined from the packet. Support is an internal note plus an analogy to Istio ambient mode. [E6, E10, E11]
- **CL7** (material): Whether Lattice ingress supports per-tenant rate limiting and API key authentication cannot be determined. Only per-route rate limiting is documented, and no public documentation exists. [E4, E11]
- **CL8** (material): Portcullis natively meets R2 with API keys, OAuth2 and per-consumer and per-tenant rate limiting. [E2]
- **CL9** (material): Portcullis combined with go-spiffe/SPIRE inside the 14 Go services could technically provide east-west mTLS with automatic SVID rotation. It is the only R1 path for a Portcullis-first choice. Its effort, latency and audit acceptability are not quantified. [E8, E2]
- **CL10** (material): Whether the one-option-this-quarter limit is firm, and whether the second product can be phased in later, cannot be determined from the documents. The limit comes only from the user's request. Whether a SPIRE deployment would count as a second option under that limit also cannot be determined. [E12, E1, E8]
- **CL11**: R3 explicitly includes the edge, so the edge component's latency counts toward the 10 ms budget in addition to the internal hops. Whether R3 means 5 or 6 proxied segments is ambiguous in the fixtures. This analysis uses 5 as its base case, and a 6-segment reading adds one more per-hop increment to every sum. Combined with a two-node-proxy reading of E5, 6 segments put node-proxy at 10.8 ms internal, above R3 before any edge cost. [E1, E5, E19, K14]
- **CL12**: For sidecar mode to fit R3 on the summed estimate, per-hop added p99 would need to be at most 2 ms with zero edge cost, or at most 1.84 ms with a 0.8 ms edge. The measured 2.6 ms is above both. [E5, E1, E2, K11, K8]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Lattice sidecar added p99 over 5 internal hops using the internal 2.6 ms per-hop figure (ms) | `2.6 * 5` | 13 | 13 | yes |
| K2 | Lattice sidecar 5 hops plus a 0.8 ms Portcullis-like edge (ms) | `2.6 * 5 + 0.8` | 13.8 | 13.8 | yes |
| K3 | Vendor sidecar figure over 5 hops (mTLS off) (ms) | `0.4 * 5` | 2 | 2 | yes |
| K4 | Lattice node-proxy added p99 over 5 internal hops, one node proxy per hop (ms) | `0.9 * 5` | 4.5 | 4.5 | yes |
| K5 | Lattice node-proxy 5 hops plus a 0.8 ms Portcullis edge, as in the phased combination, one-proxy reading (ms) | `0.9 * 5 + 0.8` | 5.3 | 5.3 | yes |
| K6 | Headroom under the 10 ms budget for node-proxy plus a 0.8 ms Portcullis edge, as in the phased combination, one-proxy 5-segment reading (ms) | `10 - (0.9 * 5 + 0.8)` | 4.7 | 4.7 | yes |
| K7 | Fraction of requests avoiding every hop's 1% tail across 5 independent hops | `0.99 ^ 5` | 0.951 | 0.9509900498999999 | yes |
| K8 | Maximum sidecar per-hop added p99 that fits 10 ms with a 0.8 ms edge (ms) | `(10 - 0.8) / 5` | 1.84 | 1.8399999999999999 | yes |
| K9 | Ratio of the internal sidecar per-hop figure to the vendor figure | `2.6 / 0.4` | 6.5 | 6.5 | yes |
| K10 | Maximum edge latency that keeps node-proxy within 10 ms on the summed estimate, one proxy per hop, 5 segments (ms) | `10 - 0.9 * 5` | 5.5 | 5.5 | yes |
| K11 | Maximum sidecar per-hop added p99 that fits 10 ms with zero edge cost (ms) | `10 / 5` | 2 | 2 | yes |
| K12 | Pessimistic node-proxy internal sum: two node proxies per hop over 5 segments, no edge (ms) | `0.9 * 2 * 5` | 9 | 9 | yes |
| K13 | Maximum edge latency within 10 ms for node-proxy with two proxies per hop over 5 segments (ms) | `10 - 0.9 * 2 * 5` | 1 | 1 | yes |
| K14 | Node-proxy internal sum with two proxies per hop over 6 segments, no edge (ms) | `0.9 * 2 * 6` | 10.8 | 10.8 | yes |
| K15 | Node-proxy internal sum with one proxy per hop over 6 segments, no edge (ms) | `0.9 * 6` | 5.4 | 5.4 | yes |
| K16 | Maximum edge latency within 10 ms for node-proxy with one proxy per hop over 6 segments (ms) | `10 - 0.9 * 6` | 4.6 | 4.6 | yes |

## Alternatives

- **Portcullis 5.2 alone (as framed):** Fully meets R2 (E2) and adds only about 0.8 ms at the edge, but fails R1 because there is no east-west mTLS (E2). This option is not viable against the hard compliance requirement.
- **Lattice sidecar mode alone (as framed):** Provides mTLS on every hop, but the summed estimate of 13 ms over 5 hops already exceeds the 10 ms R3 budget before the edge (K1). The sum may be conservative, so an end-to-end test could still show a pass (E18). R2 is unproven, with only per-route limits documented (E4). This is the fallback if the auditor rejects node-proxy and an end-to-end test passes.
- **Lattice node-proxy mode now (recommended, conditional):** Expected to meet R1 if the audit accepts it (E6). It meets R3 on the summed estimate only if the unknown edge (Lattice ingress or an existing edge, E7) fits the remaining headroom. That headroom is 5.5 ms under the one-proxy, 5-segment reading (K4, K10), 4.6 ms with 6 segments (K16), and 1.0 ms with two proxies per hop (K13). There is none with two proxies and 6 segments (K14). R2 remains unmet or unproven (E4). It has fewer proxy instances to run than sidecar mode.
- **Lattice node-proxy now, Portcullis at the edge in a later quarter:** Covers R1, R2 and R3 together at an estimated 5.3 ms summed, with 4.7 ms headroom under the one-proxy, 5-segment reading (K5, K6), but requires running two products with 3 engineers. Whether phasing is allowed is not confirmed (E12).
- **Portcullis now plus in-app go-spiffe/SPIRE mTLS:** Meets R2 immediately and could meet R1 (E8). It is not a single product: it needs a SPIRE deployment the team must run plus code changes in all 14 services (E8), and whether SPIRE counts as a second option under the one-option limit is unconfirmed (E12). Its latency, effort and audit acceptance are all unquantified. That makes it a higher risk to the 2027-06-30 date than the mesh route. If SPIRE is confirmed not to count, it is the fallback when R2 is made hard this quarter, or when the auditor rejects node-proxy and sidecar fails an end-to-end test (including in the strict two-option case).

## Tradeoffs

- Node-proxy has lower latency (0.9 against 2.6 ms per hop) but coarser L7 policy (E5, E6)
- Choosing the mesh first protects the compliance date (R1), but leaves R2 tenant limits and API keys unaddressed until a gateway is added or Lattice ingress is confirmed (E1, E4)
- Running both products covers every requirement but roughly doubles the operating surface for 3 engineers (E1)
- The in-app mTLS route avoids a mesh, but spreads certificate and enforcement logic across 14 codebases (E8)

## Edge cases and failure modes

- If E5's 'per hop' counts one proxy and cross-node calls go through two node proxies, the node-proxy internal sum is 9.0 ms over 5 segments (K12). That leaves only 1.0 ms for whatever edge is used (K13)
- The edge in the recommended configuration (Lattice ingress or an existing edge) has unknown latency (E7). For node-proxy to fit on the sum, it must stay at or below 5.5 ms under the most favourable reading (K10), 4.6 ms with 6 segments (K16), and 1.0 ms with two proxies per hop (K13). Portcullis latency at 6-40 KB payloads may also be above its 2 KB datasheet figure of 0.8 ms (E2)
- Correlation between hops does not by itself make the end-to-end p99 worse than the sum. Full correlation makes the two equal (E13). Rare large per-hop spikes below 1% can push the end-to-end p99 above the sum (E14, E16, E18). Node-proxy's shared per-node proxy makes hops partially correlated (E18). Conversely, smooth independent tails could put sidecar's true end-to-end p99 below its 13 ms sum (E15, E18)
- Production peak rps above the tested 3,500 could raise per-hop cost (E5)
- If node-proxy certificates are per node rather than per workload, the auditor may reject it for R1 (E6, E10)
- If tenant limits are needed before a gateway is added, a mesh-only interim leaves tenants without quotas (E4)
- If R3 is read as 6 proxied segments, every summed total rises by one more per-hop increment: node-proxy becomes 5.4 ms internal with one proxy per hop (K15). Combined with the two-proxy reading it becomes 10.8 ms, which breaks R3 before any edge cost (K14, E19)

## Counterarguments

- **The vendor benchmark shows 0.4 ms per hop, so sidecar latency is fine.** — That benchmark disabled mTLS and telemetry and used 1 KB at 1,000 rps (E3). R1 requires mTLS, and the internal STRICT test at checkout payloads measured 2.6 ms (E5), giving a summed 13 ms over 5 hops (K1). The internal test is more representative because it runs the required configuration (mTLS STRICT, telemetry on) on the team's own checkout payloads.
- **The internal test may be unreliable, since it reports no sample size or variance, and summed p99s may overstate the end-to-end figure.** — Both points are valid (E5 limitations, E15, E18). With no reported variance, the packet cannot say how likely a measurement error is that would close the gap between 2.6 ms and the 1.84-2 ms per-hop thresholds (K8, K11). The summed estimate is usually conservative for well-behaved independent tails, so sidecar could pass end to end. That argument is weaker here than in the general case: E5's 'added p99 per hop' is probably a difference of p99s, not the p99 of the added delay, so the quantile-additivity results (E13-E15) do not apply directly (E5, E18). This is why the sidecar failure is stated as likely, not proven, and why the end-to-end test should cover sidecar mode as well as node-proxy. Node-proxy is preferred because its summed estimate is within budget under the one-proxy reading, not because sidecar's failure is certain.
- **Node-proxy mode is not one of the two options on the table.** — The decision objective explicitly asks whether node-proxy mode fits better. It is the same product (Lattice 3.x, GA since 3.2) (E6), so adopting it does not add a third vendor. If the two-option framing is held strictly, fallback (4) applies. Portcullis alone fails R1 outright (E2), so the comparison is Lattice sidecar, subject to an end-to-end R3 test, against Portcullis plus go-spiffe/SPIRE if SPIRE is allowed (E8, E12).
- **Portcullis plus go-spiffe solves R1 without a mesh.** — It is technically feasible (E8), but it costs code changes in 14 services plus running SPIRE, has unquantified latency, and relies on each service enforcing STRICT. That is a heavier and riskier path for a 3-engineer team against a fixed audit date. It is also not a single product, because SPIRE is a second component whose status under the one-option limit is unconfirmed (E8, E12). It remains the fallback if R2 must land this quarter, or if sidecar fails an end-to-end test, but only if SPIRE is confirmed not to count as a second option.

## Practical implications

- Do not adopt Lattice in sidecar mode for the checkout path unless an end-to-end test shows its edge plus checkout-chain added p99 is at most 10 ms. On the summed internal estimate it exceeds R3
- Do not adopt Portcullis alone as the R1 solution
- Before committing this quarter, get the auditor (or compliance) to confirm that node-proxy mTLS identity, rotation and STRICT enforcement are acceptable
- Run an end-to-end edge plus full checkout-chain test in both node-proxy and sidecar modes at production peak rps with 6-40 KB payloads, using the actual edge component, and keep per-hop histograms
- Confirm with stakeholders whether Portcullis can be added in a later quarter to cover R2, or get Lattice ingress documentation on per-tenant limits and API keys
- Inventory which L7 policies the 14 services need, to check whether node-proxy's coarser L7 policy is sufficient

## Remaining uncertainty

- Auditor acceptance of node-proxy mTLS rests only on an internal note (E6), and the per-workload identity support is an Istio analogy (E10)
- No end-to-end checkout-chain latency measurement exists for any option. Without per-hop histograms it is unknown whether the summed p99s overstate or understate the true figure (E7, E18). E5's per-hop figures are probably differences of p99s, which further weakens any summation argument (E5, E18)
- The probability sources on p99 summation (E13-E16) are search snippets, and E14 and E15 disagree on how often the sum understates in practice
- The internal test does not report sample size, variance, how 3,500 rps compares with production peak, or whether 'per hop' covers one proxy or two (E5)
- The latency of the edge in the recommended configuration (Lattice ingress or an existing edge) is unknown (E7)
- Whether R3 means 5 or 6 proxied segments is not resolved by the fixtures (E19). Together with the one-or-two-proxy question, this decides whether node-proxy fits on the summed figure at all (K12-K16)
- Lattice ingress support for per-tenant limits and API keys is unknown (E4, E11)
- Portcullis latency at checkout payloads is untested (E2)
- Whether the one-option limit is firm, and whether phasing is allowed, is unconfirmed (E12)
- Whether a SPIRE deployment counts as a second option under the one-option limit is unconfirmed, and this decides whether Portcullis plus go-spiffe is admissible in fallbacks (2) to (4) (E8, E12)
- The products have no public documentation, so all capability claims rest on the supplied fixtures (E11)
- Effort and latency of the in-app go-spiffe route are unquantified (E8)
- Not assessed for lack of packet evidence: a hybrid deployment (sidecar for non-checkout services, node-proxy on the checkout path), and the security cost of a shared per-node proxy holding credentials for many workloads, which could widen the blast radius if compromised and which an auditor may weigh
- E11 UNKNOWN: No public documentation could be found for 'Portcullis API Gateway 5.2' or 'Lattice Service Mesh'. A web search returned no matching products.
- Open question the reviewer judged decisive: What is the measured end-to-end added p99 (edge plus full checkout chain) for Lattice node-proxy and sidecar modes, and for the in-app go-spiffe route if it stays a fallback, at production peak rps with 6-40 KB payloads and the actual edge component?
- Open question the reviewer judged decisive: In the internal load test, does 'per hop' mean one proxy traversal or one service-to-service call, and were the node-proxy calls same-node or cross-node? Does R3 mean 5 or 6 proxied segments?
- Open question the reviewer judged decisive: Will the auditor accept Lattice node-proxy mTLS (per-workload identity, rotation, STRICT enforcement, credential custody in a shared proxy) as meeting R1?
- Open question the reviewer judged decisive: Is the one-option limit firm, would SPIRE count as a second option, and does product need R2 before the June 2027 audit?
- Open question the reviewer judged decisive: What added p99 does Lattice ingress (or the existing edge) contribute, and does it support per-tenant limits and API keys?

## Further research that could change the conclusion

- Auditor review of node-proxy mode. If it is rejected, the choice falls to sidecar mode (if an end-to-end test passes R3) or to Portcullis plus in-app mTLS (if SPIRE is allowed under the one-option limit)
- An end-to-end node-proxy test showing more than 10 ms total. Examples: each hop goes through two proxies, leaving only 1.0 ms for the edge (K12, K13); two proxies over 6 segments (K14); the edge exceeding the available headroom (K10, K16); or rare per-hop spikes compounding (E18)
- An end-to-end sidecar test showing at most 10 ms total. That would make sidecar viable on R3, since the summed estimate may be conservative (E15, E18)
- Lattice ingress documentation confirming per-tenant limits and API keys. That would make Lattice node-proxy a single-product answer
- A sidecar test with tuning (for example telemetry sampling) that brings the per-hop cost below 1.84 ms
- Stakeholder confirmation of whether the one-option limit is firm, whether SPIRE counts as a second option under it, and whether R2 is a hard requirement for this quarter. If R2 is hard and SPIRE does not count, the recommendation moves to Portcullis plus in-app go-spiffe/SPIRE mTLS. If SPIRE does count, no single product in the packet covers R1, R2 and R3, and the requirements conflict
- Requirement-owner confirmation of whether R3 means 5 or 6 proxied segments (E19), and platform-team confirmation of whether E5's 'per hop' covers one or two proxies (E5)
- A quantified estimate of effort and latency for go-spiffe/SPIRE across the 14 services

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | Requirements (approved by CTO, 2026-09): R1 mTLS for ALL service-to-service (east-west) traffic between the 14 internal services, audit deadline 2027-06-30; R2 per-tenant rate limiting and API key auth for external (north-south) traffic; R3 checkout request path (edge -> 5 internal service hops) may gain at most 10 ms p99 of added infrastructure latency; R4 team of 3 platform engineers. | requirements.md |
| E2 | VERIFIED | fixture_read | Portcullis Gateway 5.2 is an edge/north-south API gateway with routing, API keys, OAuth2, and per-consumer and per-tenant rate limiting. It offers TLS termination at the edge and optional mTLS from gateway to first upstream. It does not proxy service-to-service traffic between upstream services. Added latency is 0.8 ms p99 (edge, 2 KB payloads). | portcullis-datasheet.md |
| E3 | VERIFIED | fixture_read | The Lattice Mesh 3.x vendor whitepaper (2026) says the sidecar proxy adds 0.4 ms p99 latency per hop. The test setup was 1 KB payloads, 1,000 rps, mTLS disabled and telemetry disabled. | lattice-vendor-benchmark.md |
| E4 | VERIFIED | fixture_read | The Lattice vendor whitepaper says 'Lattice also supports per-route rate limiting at its ingress component.' It does not mention per-tenant rate limiting or API key authentication. | lattice-vendor-benchmark.md |
| E5 | VERIFIED | fixture_read | The internal load test of Lattice Mesh 3.4 on staging (platform team, 2026-10-21) used mTLS STRICT, telemetry on, realistic checkout payloads (6-40 KB) and 3,500 rps. Added p99 latency per hop was 2.6 ms for sidecar proxy and 0.9 ms for node-proxy (per-node shared proxy) mode. | internal-loadtest-2026-10.md |
| E6 | VERIFIED | fixture_read | Internal test notes: node-proxy mode has been GA since Lattice 3.2. It 'provides the same mTLS identity guarantees' as sidecar mode, but L7 policies are coarser. | internal-loadtest-2026-10.md |
| E7 | INFERRED | fixture_read | Derived arithmetic from E2, E3 and E5, using simple per-hop summation as an approximation: Lattice sidecar (internal) 2.6 ms x 5 = 13 ms, plus edge, exceeds 10 ms. Lattice sidecar (vendor) 0.4 ms x 5 = 2 ms, but measured with mTLS off. Lattice node-proxy 0.9 ms x 5 = 4.5 ms, plus edge (e.g. 0.8 ms if Portcullis is the edge, about 5.3 ms), within 10 ms. Portcullis alone adds about 0.8 ms at the edge, but provides no east-west mTLS. | internal-loadtest-2026-10.md |
| E8 | VERIFIED | fetched | go-spiffe v2 is a Go library that uses the SPIFFE Workload API to set up mTLS between workloads (spiffetls.Listen / spiffetls.Dial with tlsconfig authorizers). Clients and servers keep receiving updated X.509-SVIDs and bundles streamed from the Workload API, so rotation needs no manual intervention. It requires a running SPIRE deployment (or another Workload API implementation) and the SPIFFE_ENDPOINT_SOCKET address. | https://github.com/spiffe/go-spiffe |
| E9 | CORROBORATED | search_result | Tail-latency percentiles do not add exactly across sequential hops. The probability that a request avoids every hop's tail compounds (e.g. 0.99^n), and correlated slowness from shared resources makes independence assumptions optimistic. Sources recommend measuring end to end and keeping per-hop histograms. | https://dev.to/speed_engineer/why-chaining-five-fast-services-gives-you-one-slow-one-3hj3 |
| E10 | INFERRED | search_result | Analogous real-world node-proxy design (Istio ambient mode): ztunnel runs per node and holds a separate certificate per workload identity (service account), so mTLS handshakes use the workload's own SPIFFE identity. ztunnel is L4 only, and L7 policy needs separate waypoint proxies. | https://istio.io/latest/blog/2022/ambient-security/ |
| E11 | UNKNOWN | none | No public documentation could be found for 'Portcullis API Gateway 5.2' or 'Lattice Service Mesh'. A web search returned no matching products. | web search: Portcullis API Gateway 5.2 Lattice Service Mesh node-proxy mode |
| E12 | INFERRED | user_input | The user's request says 'pick ONE of two options this quarter' and that compliance requires mTLS between all internal services 'by Q2'. It frames the choice as Portcullis versus Lattice sidecar and relies on the vendor's 0.4 ms figure. | request |
| E13 | CORROBORATED | search_result | For comonotonic (perfectly positively rank-correlated) random variables, quantiles are exactly additive: the alpha-percentile of the sum equals the sum of the alpha-percentiles. Comonotonicity gives no diversification benefit, and it cannot produce superadditivity. | https://aggregate.readthedocs.io/en/stable/5_technical_guides/5_x_quantiles.html |
| E14 | CORROBORATED | search_result | Quantiles (VaR) are not subadditive in general: the quantile of a sum can exceed the sum of the quantiles, even for independent variables. The classic Embrechts et al. example uses two independent Pareto variables with P(Xi > x) = x^(-1/2), x >= 1 (infinite mean). For these the quantile of the sum exceeds the sum of the quantiles at every level alpha in (0,1). For Pareto-type tails with index beta, the limiting ratio of the VaR of the sum to the sum of the VaRs is n^(1/beta - 1), which is above 1 when beta < 1. Superadditivity can also arise with discrete or mixed distributions. | https://arxiv.org/html/2512.07787v3 |
| E15 | CORROBORATED | search_result | Danielsson et al. show that VaR is subadditive in the relevant tail region for multivariate regularly varying (fat-tailed but finite-mean) returns, and that it is subadditive for all log-concave distributions. They argue subadditivity violations are not a practical concern for typical fat-tailed data. In that regime, the quantile of a sum of independent terms is at or below the sum of their quantiles (a diversification benefit). | https://www.riskresearch.org/files/DanielssonVriesJorgensenSamorodnitskyMandira2005.pdf |
| E16 | CORROBORATED | search_result | Latency practitioner sources say summing each stage's 99th percentile is not guaranteed to upper-bound the end-to-end 99th percentile, and that you cannot reliably estimate end-to-end p99 by summing service p99s unless the path structure and distributions are tightly controlled. Looking at p99s per service underestimates the actual end-to-end p99. They recommend aggregating raw histogram buckets or joined end-to-end traces. | https://tianpan.co/blog/2026-07-05-the-latency-budget-nobody-allocated-across-agent-hops |
| E18 | INFERRED | search_result | Synthesis on how per-hop p99s combine across sequential hops. (a) Fully correlated (comonotonic) hops: the end-to-end p99 equals the sum of the per-hop p99s (E13). (b) Independent hops with smooth, light or moderate tails: the end-to-end p99 is usually below the sum, so the sum is conservative (E15). (c) Independent hops whose delay has rare large spikes with per-hop probability below 1%: the spikes do not appear in any per-hop p99, but they compound across hops (1-(1-p)^n), so the end-to-end p99 can be far above the sum (E9, E14, E16). Illustrative example, not from any source: each hop takes 0.5 ms with probability 0.995 and 20 ms with probability 0.005. Per-hop p99 = 0.5 ms, so the sum over 5 hops = 2.5 ms. But P(at least one spike in 5 independent hops) = 1 - 0.995^5, about 2.5%, which is more than 1%, so the end-to-end p99 is at least 20 ms. (d) Partial correlation, which is likely for node-proxy mode where co-located hops share one proxy, or with shared CPU, GC or network, falls between these cases. Conclusion: the summed p99 is not a guaranteed conservative upper estimate. It is conservative only when the per-hop tails are well-behaved. | https://arxiv.org/html/2512.07787v3 |
| E19 | INFERRED | fixture_read | requirements.md R3 reads exactly 'Checkout request path (edge -> 5 internal service hops)'. The fixtures do not define 'hop'. Reading A: an edge component plus 5 proxied internal segments (edge->S1 counted as the first internal hop, then S1->S2 ... S4->S5), which gives a multiplier of 5 as used in E7. Reading B: 5 service-to-service hops after the edge->S1 segment, which gives 6 proxied segments across 6 services. The internal load test reports only a 'per hop' figure and does not say whether one hop includes both client- and server-side proxies in sidecar mode. No supplied fixture resolves the ambiguity. | requirements.md |

**Rejected evidence (not relied on):**
- E17: source not retrieved in this run: web web search: p99 latency percentiles not additive sum of per-hop p99 end-to-end chain independent services

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 7 web search(es), 3 fetch attempt(s), 4 supplied document(s) read.
- search: "Portcullis API Gateway 5.2 Lattice Service Mesh node-proxy mode" (16 results)
- search: "go-spiffe v2 mTLS Go services workload API SVID rotation" (16 results)
- search: "percentile latency not additive p99 multiple hops tail latency compounding microservices" (10 results)
- search: "Istio ambient ztunnel per-workload SPIFFE identity mTLS node proxy L7 waypoint" (16 results)
- search: "value-at-risk not subadditive quantile of sum exceeds sum of quantiles comonotonic additive" (10 results)
- search: "p99 latency percentiles not additive sum of per-hop p99 end-to-end chain independent services" (10 results)
- search: "Embrechts VaR superadditive independent identically distributed example Pareto quantile of sum larger than sum of quantiles" (10 results)
2. **Sources inspected:**
- https://github.com/spiffe/go-spiffe (fetched)
- requirements.md (fixture_read)
- internal-loadtest-2026-10.md (fixture_read)
- lattice-vendor-benchmark.md (fixture_read)
- portcullis-datasheet.md (fixture_read)
   Cited from search snippets only (not opened):
- https://dev.to/speed_engineer/why-chaining-five-fast-services-gives-you-one-slow-one-3hj3
- https://istio.io/latest/blog/2022/ambient-security/
- https://aggregate.readthedocs.io/en/stable/5_technical_guides/5_x_quantiles.html
- https://arxiv.org/html/2512.07787v3
- https://www.riskresearch.org/files/DanielssonVriesJorgensenSamorodnitskyMandira2005.pdf
- https://tianpan.co/blog/2026-07-05-the-latency-budget-nobody-allocated-across-agent-hops
3. **Checks executed:**
- Evidence registry validation: 18 accepted, 1 rejected (source never retrieved / schema), 1 classification downgrade(s)
- Deterministic quality gates over 3 draft(s)
- Calculation K1 re-executed: 2.6 * 5 = 13 (claimed 13) → match
- Calculation K2 re-executed: 2.6 * 5 + 0.8 = 13.8 (claimed 13.8) → match
- Calculation K3 re-executed: 0.4 * 5 = 2 (claimed 2) → match
- Calculation K4 re-executed: 0.9 * 5 = 4.5 (claimed 4.5) → match
- Calculation K5 re-executed: 0.9 * 5 + 0.8 = 5.3 (claimed 5.3) → match
- Calculation K6 re-executed: 10 - (0.9 * 5 + 0.8) = 4.7 (claimed 4.7) → match
- Calculation K7 re-executed: 0.99 ^ 5 = 0.9509900498999999 (claimed 0.951) → match
- Calculation K8 re-executed: (10 - 0.8) / 5 = 1.8399999999999999 (claimed 1.84) → match
- Calculation K9 re-executed: 2.6 / 0.4 = 6.5 (claimed 6.5) → match
- Calculation K10 re-executed: 10 - 0.9 * 5 = 5.5 (claimed 5.5) → match
- Calculation K11 re-executed: 10 / 5 = 2 (claimed 2) → match
- Calculation K12 re-executed: 0.9 * 2 * 5 = 9 (claimed 9) → match
- Calculation K13 re-executed: 10 - 0.9 * 2 * 5 = 1 (claimed 1) → match
- Calculation K14 re-executed: 0.9 * 2 * 6 = 10.8 (claimed 10.8) → match
- Calculation K15 re-executed: 0.9 * 6 = 5.4 (claimed 5.4) → match
- Calculation K16 re-executed: 10 - 0.9 * 6 = 4.6 (claimed 4.6) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://aggregate.readthedocs.io/en/stable/5_technical_guides/5_x_quantiles.html — getaddrinfo ENOTFOUND aggregate.readthedocs.io. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains
- Fetch failed: https://ar.casact.org/?p=264 — getaddrinfo ENOTFOUND ar.casact.org. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does n
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G2 unresolved: No end-to-end measurement of edge plus 5 hops exists for any option. Lattice ingress edge latency is unknown. Portcullis latency at 6-40 KB payloads and checkout rps is untested. In-app mTLS overhead is unknown. The E7 totals are sums of per-hop p99s. Those sums are exact only for fully correlated hops, usually conservative for independent well-behaved tails, and can underestimate with rare per-hop spikes (E13-E18). No per-hop histograms are available to tell which regime applies. The segment count (5 vs 6) implied by R3 is ambiguous in the fixtures (E19). Fetches of aggregate.readthedocs.io and ar.casact.org failed because the hosts are not resolvable in this session (they would need to be allowed in the network settings), so the probability claims rest on search snippets.
- Knowledge gap G3 unresolved: No Lattice ingress documentation was available, and the products are not publicly documented. Per-tenant rate limiting and API key auth in Lattice, in either mode, remain unconfirmed. Only per-route limiting is documented.
- Knowledge gap G4 unresolved: Audit acceptability of node-proxy mode (per-workload certificates, rotation, STRICT enforcement) rests only on an internal note. The specific L7 policies lost in node-proxy mode are not described.
- Knowledge gap G5 unresolved: The internal test reports no sample size, run length, repetitions or variance. It does not say whether the full checkout chain was exercised, how 3,500 rps compares with production peak, or whether 'per hop' covers one or two sidecars.
- Knowledge gap G6 unresolved: No document confirms whether the one-option-per-quarter limit is firm or whether phasing (e.g. node-proxy mesh now, gateway later) is allowed. This needs stakeholder confirmation.
- Knowledge gap G1 unresolved: The in-app go-spiffe/SPIRE route is technically feasible (E8). Engineering effort across 14 services, its latency cost, and auditor acceptance were not quantified.
5. **Independent validation status:** Graded by separate grader process (eval-grader (native agent, claude-opus-5-5), prompts v5); total 86.25/100; critical failures: none. Grader is the same model family as the agent.
6. **Remaining uncertainty:** 19 item(s), listed above.
7. **Revisions:** 2
- cycle 1 (both): [reasoning_validity/major] D1 [CL2, CL5, criteriaAssessments C2 mechanisms, edgeCasesAndFailureModes[2], counterarguments[1], practicalImplications[0]] The draft gets the direction of the p99 summation error wrong. CL5, C2 mechanisms and edgeCasesAndFailureModes item 3 say summed per-hop p99s are 'an approximation, not a bound' and that correlated slowness can make end-to-end p99 'worse than the sum'. For positive latencies with independent hops, the p99 of the sum is normally below the sum of the p99s. Under perfect correlation the two are equal. So the sum is usually the conservative estimate. K7 (0.99^5 = 95.1% of requests avoid every hop's tail) measures how many requests hit at least one slow hop. It does not show the summed p99 is optimistic. This matters for the verdict. CL2 says sidecar mode 'fails R3' at 13 ms / 13.8 ms, but that rests only on summation, and the true end-to-end sidecar p99 could be materially lower, possibly near or under 10 ms. The counterargument response ('a plausible measurement error is unlikely to change the sidecar verdict') ignores this aggregation uncertainty. The sidecar failure should be stated as likely on a conservative sum, not as a finding. The end-to-end test should cover sidecar mode too, not only node-proxy.; [reasoning_validity/major] D2 [verdict; CL4; alternatives[2] ('Lattice node-proxy mode now'); K5, K6] The recommended option ('Lattice node-proxy mode now') does not include Portcullis this quarter. Yet its R3 headroom (5.3 ms total, 4.7 ms headroom, K5/K6) uses Portcullis's 0.8 ms datasheet edge figure. In the recommended configuration the edge would be Lattice ingress or some existing edge, and its latency is unknown (packet E7 limitations). The alternatives entry also quotes '4.5 to 5.3 ms', and the 4.5 ms lower end assumes zero edge cost, which CL11 itself says R3 does not allow. The verdict's '4.7 ms of headroom' is therefore attached to a configuration the draft is not recommending for this quarter. K10 (up to 5.5 ms of edge tolerated) is the correct framing for the recommended option and should replace the headroom figure there.; [decision_usefulness/major] D3 [verdict; furtherResearchThatCouldChangeConclusion[4]; alternatives] The user asked which of TWO options to pick. The draft recommends a third configuration, conditional on two unconfirmed items: auditor acceptance and an end-to-end test. It gives no ranked fallback if the conditions fail or the strict either/or holds. In particular, it never says which product to adopt if the one-product limit is firm, R2 is needed this quarter, or node-proxy is rejected by the auditor. furtherResearch[4] only says this 'would force a choice between leaving R2 or R1 at risk' and does not make that choice. Given R1's hard audit date and R2's lack of a deadline, the draft has what it needs to state a fallback, but it does not.; D1 (remedy both) needs evidence on how per-hop p99s aggregate end to end; D2/D3 reanalysis
- cycle 2 (reanalysis): [reasoning_validity/major] D1 [verdict fallbacks (2) and (4); alternatives[4]; counterarguments[3]; furtherResearchThatCouldChangeConclusion[5]] The new ranked fallbacks treat the Portcullis plus go-spiffe/SPIRE route inconsistently. Fallback (2), alternatives[4] and furtherResearch[5] call it 'the only single-product route in the packet that covers both R1 and R2'. But it needs a SPIRE deployment (a Workload API server the team must run, per E8) plus code changes in all 14 services. Calling it 'single-product' under a one-option-per-quarter limit is not justified, and the draft never checks whether SPIRE would count against that limit. Fallback (4) then drops the route: under the strict two-option framing it ranks Lattice over Portcullis because 'Portcullis alone fails the hard R1 requirement outright (E2)'. If Portcullis plus in-app mTLS counts as the Portcullis option in fallback (2), it should be compared with Lattice sidecar in fallback (4) too. It is not, and sidecar is itself likely to breach the hard R3 limit. Fallback (4) also recommends a configuration the draft expects to fail a hard requirement (CL2), and never says whether a likely R3 breach is better or worse than an R1 gap filled by in-app code. The fallback ladder needs one consistent definition of 'one option' and a direct comparison of sidecar against Portcullis plus go-spiffe in the strict case.; [reasoning_validity/major] D2 [criteriaAssessments C2 weaknesses[3]; edgeCasesAndFailureModes[0], [6]; verdict (K10 framing); CL4, CL11] The draft adds K12 ('with a 0.8 ms edge') and E19 (5 vs 6 segments) but never combines them, and it ties K12 to the Portcullis edge, which the recommended this-quarter setup does not include. I recomputed the numbers. With two node proxies per hop, the internal sum is 0.9 x 2 x 5 = 9.0 ms, so the unknown edge in the recommended setup (Lattice ingress or an existing edge) may add only 1.0 ms, not 5.5 ms (K10). Under the 6-segment reading with two proxies per hop, the internal sum is 0.9 x 2 x 6 = 10.8 ms, which breaks R3 with zero edge cost. With one proxy per hop and 6 segments, it is 5.4 ms, leaving 4.6 ms for the edge. So two ambiguities the draft lists separately can together reverse the node-proxy pass on the summed figure. The verdict's framing that the edge can add 'up to 5.5 ms' therefore overstates the headroom. This is the same kind of problem as prior D2, now appearing in changed material.; D1/D2 major reasoning_validity defects, both remedy reanalysis
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency: [minor/deterministic] 1 evidence classification violation(s) downgraded by registry
- PASS reasoning_validity: [minor/reviewer] D1 [criteriaAssessments C2 mechanisms; C2 weaknesses[3]; edgeCasesAndFailureModes[0]; K12-K14] New text in C2 mechanisms and the K12-K14 scenarios applies the 'two proxies per hop' doubling only to node-proxy mode. E5 (sources/internal-loadtest-2026-10.md) reports both modes in one 'Added p99 latency per hop' column. There are two ways to read that column. (i) It counts one proxy traversal. Then sidecar, which the draft itself says has proxies on both the client and server side of every hop, should be doubled as well, giving 2.6 x 2 x 5 = 26 ms. (ii) It counts one service-to-service hop. Then the node-proxy figure already includes both node proxies on a cross-node call, unless the test only measured same-node calls. The two-proxy node-proxy scenario is only coherent under a third reading: same-node test traffic against cross-node production traffic. The draft never states this reading. The pessimistic node-proxy figures (9.0 and 10.8 ms) are still worth raising, but the asymmetry should be explained. The sidecar conclusion does not change, because doubling only makes sidecar worse. | [minor/reviewer] D2 [verdict fallbacks (3) and (4); alternatives[4]; practicalImplications[3]] The new strict-case fallback (4) prefers Lattice sidecar over Portcullis plus go-spiffe/SPIRE when sidecar passes an end-to-end test. The only reason given is central R1 enforcement. It does not weigh that sidecar leaves R2 unmet while the Portcullis route covers it, or the C4 burden of each route. Fallbacks (3) and (4) also choose Portcullis plus go-spiffe/SPIRE when sidecar fails R3, calling its risks 'unquantified but not known failures'. In-app Go TLS still adds handshake and encryption cost on every one of the 5-6 hops, so R3 is unverified for this route too. practicalImplications asks for end-to-end tests of node-proxy and sidecar only, not of the in-app route. The draft should say that the in-app route also needs an end-to-end R3 test before it is adopted.
- PASS alternatives_counterarguments
- PASS decision_usefulness: [minor/reviewer] D3 [verdict] The verdict has grown into one very long paragraph. It mixes the recommendation, four combined readings of the latency headroom, a definition of 'one option' and a four-level fallback ladder, some of whose branches have their own sub-branches. The decision is still there, but a decision-maker would struggle to pull out the primary recommendation and its two gating conditions. Splitting it into a short headline recommendation, the gating conditions and a separate fallback list would fix this.
- PASS traceability
