# Evaluation: Portcullis API Gateway vs. Lattice Service Mesh (sidecar mode) for 14 Go microservices

## Verdict

**Neither option, as you framed it, meets your approved requirements.**

- **Portcullis** fails R1, the compliance requirement for east-west mTLS. Its datasheet says it "does not proxy service-to-service traffic."
- **Lattice in sidecar mode** fails R3, the checkout latency budget. Your own load test measured 2.6 ms p99 per hop, which comes to about 13 ms over 5 hops against a 10 ms budget.
- The claim that "latency shouldn't be a concern" rests on a vendor benchmark run with **mTLS disabled**. That is the one feature you are buying the mesh for, so the benchmark does not test your configuration.

**Recommendation: choose Lattice this quarter, but deploy it in node-proxy mode, not sidecar mode.**

- Node-proxy mode meets R1. Your load test notes say it gives the same mTLS identity guarantees.
- It meets R3 with headroom: about 4.5 ms over 5 hops, by the conservative sum-of-p99s estimate.
- It addresses R1, the requirement with a fixed audit deadline (2027-06-30).
- It only partly covers R2. Lattice ingress documents **per-route** rate limiting, not **per-tenant**, and API key auth is not mentioned at all.
- Plan for Portcullis (or an equivalent edge gateway) in front of the mesh next quarter to close R2. The combined stack is about 0.8 + 4.5 = 5.3 ms, which stays inside the budget.

If the "ONE option" rule is truly fixed and node-proxy mode is ruled out for some reason, Lattice sidecar mode is still not acceptable without a documented exception to R3. Portcullis alone is only acceptable if you also build mTLS into the Go services themselves (see Alternatives).

## Evaluation criteria (from requirements.md, CTO-approved 2026-09)

| # | Requirement | Type | Weight |
|---|---|---|---|
| R1 | mTLS for all east-west traffic between the 14 services, audit deadline 2027-06-30 | Compliance, hard deadline | Gate (must pass) |
| R2 | Per-tenant rate limiting and API key auth for north-south traffic | Product requirement | High, but can be phased |
| R3 | Checkout path (edge plus 5 internal hops): at most 10 ms added p99 | Hard budget | Gate (must pass) |
| R4 | 3 platform engineers | Capacity constraint | Affects operational feasibility |

I also weighted how good the evidence is. Your internal load test (mTLS STRICT, telemetry on, 6–40 KB payloads, 3,500 rps) matches production conditions far better than the vendor whitepaper (mTLS off, telemetry off, 1 KB payloads, 1,000 rps), so I gave it priority.

## Requirement-by-requirement analysis

### Portcullis Gateway 5.2
- **R1: Fails.** It terminates TLS at the edge and can optionally use mTLS from the gateway to the *first* upstream only. It explicitly does not proxy service-to-service traffic, so the other east-west links (about 4–5 on checkout, more across the mesh) would have no mTLS.
- **R2: Passes.** API keys, OAuth2, and per-consumer and per-tenant rate limiting are listed features.
- **R3: Passes easily.** 0.8 ms p99 at the edge, though measured on 2 KB payloads. Expect somewhat more on 6–40 KB checkout payloads; it is still far inside the budget.
- **R4: Good.** One edge component is much easier for 3 engineers to run than a mesh.

### Lattice Mesh 3.x, sidecar mode (the option as proposed)
- **R1: Passes.** It provides mesh mTLS between all services.
- **R2: Partial.** The ingress supports per-route rate limiting only. Per-tenant limits would need tenant-aware keys such as header- or key-based descriptors; the provided material does not show Lattice supports that. API key auth is not documented.
- **R3: Fails.** See the quantitative analysis below.
- **R4: Heaviest.** You would run sidecars in every pod of 14 services, plus sidecar injection, upgrades, resource overhead, and debugging across two proxies per hop.

### Lattice Mesh 3.4, node-proxy mode (not in your two options, but in your own test data)
- **R1: Passes.** Your test notes say it provides the same mTLS identity guarantees. It has been GA since 3.2.
- **R2: Same partial coverage as sidecar mode.**
- **R3: Passes**, with about 5.5 ms of headroom.
- **R4: Lighter than sidecars.** There is one shared proxy per node instead of one per pod, and services can be onboarded without restarting them for injection. The tradeoff is that each node proxy is shared, so a fault in one affects every pod on that node (see Failure modes).
- **Caveat:** L7 policies are coarser. None of R1–R4 requires fine-grained east-west L7 policy, so this does not violate a requirement today, but it limits future service-to-service authorization by route or method.

## Quantitative analysis (R3)

The budget is at most 10 ms added p99 across the edge plus 5 internal hops.

| Configuration | Per-hop p99 | Hops | Mesh total | Edge component | Estimated added p99 | Within 10 ms? |
|---|---|---|---|---|---|---|
| Lattice sidecar (vendor figure) | 0.4 ms | 5 | 2.0 ms | Lattice ingress (unmeasured) | ~2 ms + ingress | Not applicable: mTLS was off |
| **Lattice sidecar (your test)** | 2.6 ms | 5 | **13.0 ms** | + ingress | **≥13 ms** | **No (30%+ over)** |
| Lattice sidecar, if "5 hops" means 4 links | 2.6 ms | 4 | 10.4 ms | + ingress | ≥10.4 ms | No |
| **Lattice node-proxy (your test)** | 0.9 ms | 5 | **4.5 ms** | + ingress | ~4.5 ms + ingress | **Yes** |
| Portcullis + Lattice node-proxy | 0.9 ms | 5 | 4.5 ms | 0.8 ms | **~5.3 ms** | **Yes (~47% headroom)** |
| Portcullis + Lattice sidecar | 2.6 ms | 5 | 13.0 ms | 0.8 ms | ~13.8 ms | No |
| Portcullis only | — | — | 0 | 0.8 ms | ~0.8 ms | Yes, but fails R1 |

Notes on the arithmetic:

- **The vendor figure is 6.5x lower than yours (0.4 vs 2.6 ms).** The gap is easy to explain:
  - mTLS was off in the vendor test, so no handshake or record encryption cost.
  - Payloads were 1 KB versus 6–40 KB, so less proxy buffering and encryption.
  - Telemetry was off, so no span or metric emission.
  - Load was 1,000 vs 3,500 rps, so less queueing at p99.

  Your test is the relevant number. The vendor figure should be set aside for this decision.
- **Adding p99s together is a deliberately conservative heuristic.** If the hops' tail latencies were independent, the true end-to-end added p99 would be lower than 13 ms. Under load, though, tails tend to be correlated: they share CPU, garbage collection, and noisy neighbours on the same nodes. The sidecar result could land somewhat under 13 ms, but it would have to drop more than 23% just to reach the limit, with no room left for the edge or for growth. Node-proxy, at about 4.5 ms even by the conservative sum, is robustly inside the budget.
- **Ingress latency is not measured** in any of the provided sources. That leaves the Lattice-only totals somewhat uncertain, but node-proxy has more than 5 ms of slack to absorb it.

## Strengths and weaknesses

**Portcullis**
- Strengths: covers R2 completely; very low edge latency; simple to operate; mature gateway feature set (OAuth2, API keys).
- Weaknesses: cannot satisfy R1 at all, and R1 is the compliance gate with a fixed audit date.

**Lattice (sidecar)**
- Strengths: covers R1 fully; fine-grained L7 policy.
- Weaknesses: breaks the hard checkout latency budget in your own test; heaviest operational and resource load for a 3-person team; R2 coverage is incomplete.

**Lattice (node-proxy)**
- Strengths: covers R1; meets R3 comfortably; lower operational and resource overhead than sidecars; GA for at least two minor versions.
- Weaknesses: coarser L7 policy; a single node proxy is shared by every pod on the node; R2 coverage is still incomplete.

## Alternatives and comparisons

1. **Lattice node-proxy now, Portcullis at the edge next quarter (recommended).** Meets R1, R3 and eventually R2, at about 5.3 ms total. Doing them in sequence fits a 3-person team: get mTLS done well before the June 2027 audit, then add the gateway.
2. **Portcullis now, with mTLS built into the Go services themselves.** Go's `crypto/tls` plus SPIFFE/SPIRE or cert-manager-issued certificates can provide east-west mTLS with very little latency over persistent connections. This satisfies R2 and R3 immediately and may satisfy R1. The costs:
   - code changes across 14 services;
   - certificate rotation and trust-bundle distribution handled in each service;
   - harder to prove "ALL traffic" to an auditor, because there is no central enforcement or strict mode;
   - a significant ongoing burden for 3 engineers.

   This is viable if mesh adoption is politically or technically blocked, but it is weaker than option 1 on proving compliance.
3. **Lattice sidecar, as proposed.** Not recommended. It fails R3 on your own data.
4. **Sidecars everywhere except the checkout path, with node-proxy on checkout.** This is possible if both modes can run in one cluster, but it adds complexity with no requirement driving it.

## Tradeoffs

- **Compliance vs. product timing.** If you can only pick one thing this quarter, R1 has a hard external deadline and R2 does not. That favours the mesh first.
- **Policy granularity vs. latency.** Node-proxy gives up fine-grained L7 east-west policy to save about 1.7 ms per hop. Your requirements only call for the latency.
- **Simplicity vs. coverage.** Portcullis is the simplest option, but on its own it leaves a compliance gap.

## Edge cases and failure modes

- **Hop definition.** Whether "5 internal service hops" means 5 or 4 proxied links does not change the sidecar verdict (13 or 10.4 ms, both over budget).
- **Pods on the same node.** Under node-proxy, calls between pods on the same node may go through one proxy instead of two. Check whether the 0.9 ms figure assumed calls across nodes, and whether same-node traffic is still mTLS-encrypted. That second point matters for R1 audit evidence.
- **Blast radius of the node proxy.** A crash or overload of one node proxy affects every pod on that node. You need resource limits, a disruption budget, and an alert on the proxy itself.
- **Connection churn.** If any Go clients open a new connection per request, mTLS handshakes will inflate p99 under either mesh mode. Make sure HTTP keep-alive and connection pooling are in use.
- **Retries.** Mesh-level retries can multiply tail latency on checkout. Align retry budgets with the 10 ms limit.
- **Growth.** The tests were at 3,500 rps. Peak traffic (sales, Black Friday) may push the per-hop p99 higher, and node-proxy's headroom is what protects you there.
- **Bypass routes.** For R1, the audit will need proof that *all* traffic is in strict mTLS mode, including jobs, cron, and anything not running in the mesh.

## Counterarguments

- *"The vendor says 0.4 ms."* That test excluded mTLS and telemetry and used tiny payloads at low load. It does not describe the configuration R1 requires. Your test does.
- *"Adding p99s overstates the end-to-end latency."* Possibly. But sidecar mode would have to come in more than 23% below the sum just to tie the budget, before counting the edge. Measure checkout end-to-end before relying on that.
- *"Node-proxy wasn't one of the two options."* It is the same product, it is GA, and it is in your own test. Picking Lattice with a different deployment mode still honours "pick ONE."
- *"Product wants rate limiting now."* The Lattice ingress's per-route limits can be a stopgap, or the Go services can enforce per-tenant limits temporarily, until a gateway is added.

## Practical implications and next steps

1. Pick Lattice 3.4+ in node-proxy mode with mTLS STRICT. Record why sidecar mode was rejected (R3, your 2026-10-21 test) for the architecture decision log.
2. Run an end-to-end checkout load test (edge plus 5 hops, real payloads, at or above peak rps) to replace the sum-of-p99s estimate. Include the Lattice ingress.
3. Check with Lattice whether its ingress can rate-limit per tenant (by header or API key descriptor) and whether it supports API key auth. If not, budget Portcullis for next quarter.
4. Collect audit evidence for R1: strict-mode mTLS on every workload, same-node traffic encryption, and no plaintext exceptions.
5. Re-test after enabling any additional Lattice features, especially telemetry sampling and retries.

## Sources

- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T020546-e9295c16/sources/requirements.md`: R1–R4.
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T020546-e9295c16/sources/portcullis-datasheet.md`: no east-west proxying; 0.8 ms p99; per-tenant rate limits.
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T020546-e9295c16/sources/lattice-vendor-benchmark.md`: 0.4 ms p99 with mTLS and telemetry disabled; per-route ingress rate limiting.
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T020546-e9295c16/sources/internal-loadtest-2026-10.md`: 2.6 ms sidecar vs 0.9 ms node-proxy under mTLS STRICT.
- No web research was done. Portcullis and Lattice appear to be fictional or internal product names, so outside sources would not have been reliable. General points (sidecar vs. per-node proxy tradeoffs, p99s not adding linearly, Go-native mTLS via SPIFFE) come from general engineering knowledge.

## Remaining uncertainty

- The internal results come from a single test with no variance or confidence interval reported, and no explicit hop topology (same-node vs. cross-node).
- Lattice ingress latency, and whether it supports per-tenant limits or API key auth, are unknown.
- Whether node-proxy mode encrypts same-node traffic, and whether auditors accept it for R1, has not been verified.
- Portcullis's 0.8 ms was measured on 2 KB payloads; it will be higher on checkout-sized payloads.
- The true end-to-end p99, as opposed to the sum of per-hop p99s, has not been measured.

## Self-assessed quality score: 82/100

The analysis is grounded in every provided source and the latency arithmetic is explicit. The flawed vendor premise is identified and explained, and the recommendation offers a path that satisfies all the requirements. The score is held back because there is no external verification (the products appear to be fictional), the latency estimate relies on summing p99s rather than an end-to-end measurement, and Lattice's R2 capability remains uncertain.
