# Evaluation: Quiver vs. Tessellate for 300M x 768-dim filtered semantic search (p95 < 50 ms at 400 QPS, self-hosted VPC)

## Verdict

**Keep Quiver on the shortlist. Neither reason for dropping it holds up against the attached material.** The 100M-vector cap comes from a documentation page that applies to Quiver 2.x. The changelog says the cap was raised to 1B in 3.0.0. The "4x slower" figure comes from a benchmark published by Tessellate that tested Quiver 2.1, which only had post-filtering. That version was already superseded when the benchmark came out. The only neutral, reproducible benchmark (OpenANN-Bench 2026-09) shows the two engines close together and both under the 50 ms target: Tessellate 31 ms at recall 0.95, Quiver 38 ms at recall 0.97.

**The evidence does not settle the choice.** Neither engine has been tested at 300M vectors, on your filter selectivity, at matched recall, or in your VPC. Tessellate has a modest latency edge in the one neutral test. Quiver has a recall edge in the same test. Decide with a short, structured proof of concept (PoC), described below, not on the current evidence.

## Evaluation criteria

1. **Capacity:** each engine must hold 300M vectors in one logical collection, with headroom for growth.
2. **Filtered-query latency:** p95 (and ideally p99) under 50 ms at 400 QPS sustained, using *your* filter selectivity distribution.
3. **Recall at that latency:** latency only means something when it is compared at the same recall.
4. **Self-hosted VPC deployment:** maturity, operational tooling, failure behaviour.
5. **Evidence quality:** independence, version currency, scale match and reproducibility of each source.
6. **Cost:** memory and node count needed to meet the SLO.

## Detailed analysis

### 1. The "100M vectors per collection" objection is outdated

- `quiver-docs-limits.md` is headed "_Last updated: 2024-06-03 (applies to Quiver 2.x)_".
- `quiver-changelog.md`, 3.0.0 (2026-02-02): "Per-collection limit raised to 1,000,000,000 vectors (sharded collections)."
- 300M is 30% of the new limit, which leaves about 3x room for growth.

**Things to check before relying on this:**
- The raised limit applies to *sharded* collections. Ask Quiver whether sharded collections support every feature you need, especially the new filtered-HNSW index, metadata filters, updates and deletes. Also ask whether there are per-shard limits, for example whether each shard is still capped at 100M.
- The limits page was not updated after a major release. That is a documentation-quality signal worth noting. It also means the 64-metadata-fields limit and 4,096-dimension limit may be outdated too, in either direction. Check the 3.x docs.

### 2. The "4x slower on filtered queries" objection uses an old Quiver version

The Tessellate report (2026-05) compares Tessellate 4.0 against **Quiver 2.1**:
- Quiver 2.1.0 (2024-04-30) introduced metadata filtering as a **post-filter**.
- Quiver 3.0.0 (2026-02-02) introduced **filtered-HNSW**, which applies filters during graph traversal. That was about three months *before* Tessellate published.

**Why the version matters:** with post-filtering at 10% selectivity, the engine has to retrieve roughly 10x more candidates (or retry with a larger result set) to return k results that pass the filter. That cost grows as the filter gets more selective. A 141 ms vs 34 ms gap (4.1x) is what you would expect when a post-filter engine competes with an in-traversal filter engine. It says little about Quiver 3.x.

**Other weaknesses of that benchmark:**
- It was published by the vendor whose product it favours.
- It used 50M vectors, one-sixth of your scale.
- It reports no QPS, no recall and no hardware details.
- No reproducible configuration is published.

It is not admissible evidence for this decision.

### 3. The neutral benchmark is the best evidence available, but it is incomplete

OpenANN-Bench 2026-09 used 200M vectors, 768 dimensions, a 10%-selectivity filter, 400 QPS and identical 3-node clusters, and it publishes reproducible configs.

| Engine | p95 (ms) | Headroom to 50 ms | Recall@10 |
|---|---|---|---|
| Tessellate 4.0 | 31 | 19 ms (38%) | 0.95 |
| Quiver 3.1 | 38 | 12 ms (24%) | 0.97 |

- **Latency ratio:** Quiver is 38/31 ≈ 1.23x slower, not 4x.
- **The comparison is not at matched recall.** Quiver returns about 40% fewer misses at k=10 (3% vs 5% miss rate). HNSW-family engines trade recall for latency through search-breadth parameters such as ef. Quiver tuned down to 0.95 recall, or Tessellate tuned up to 0.97, could narrow or reverse the gap. The benchmark does not say which way.
- **It did not test Quiver 3.2,** the release that made VPC Helm deployment GA.
- **It was not run above 200M vectors.** The report itself warns that "results depend heavily on filter selectivity."

## Quantitative analysis: scaling from 200M to 300M

**Raw vector memory:**
- float32: 300M × 768 × 4 B ≈ **922 GB**.
- int8 or scalar quantization: ≈ 230 GB.
- PQ: far less, at some cost to recall.

**HNSW graph overhead,** assuming roughly M=16 (32 links at layer 0, 4 B ids): about 300M × 32 × 4 B ≈ 38 GB, plus upper layers, metadata indexes and IDs. Allow on the order of **1.0–1.1 TB for full-precision, memory-resident data, before replication.** On 3 nodes that is about 330–370 GB of RAM per node, or about 100M vectors per node, compared with about 67M per node in the benchmark.

**Latency at 1.5x the data:**
- In-memory HNSW search cost grows roughly logarithmically with N. ln(100M)/ln(67M) ≈ 1.02, so the pure algorithmic increase is small.
- The real risk is memory bandwidth, cache misses, and whether data still fits in RAM. If vectors spill to disk or an SSD tier, p95 can jump sharply.
- Adding nodes reduces per-node work but increases scatter-gather fan-out. Fan-out worsens tail latency because p95 becomes the maximum across shards.

**Rough projection:** assume a 10–30% p95 increase at the same node count and full in-memory residency. That gives Tessellate about 34–40 ms and Quiver about 42–49 ms. Quiver's margin could close at 300M on 3 nodes, while Tessellate's is more robust. This is an estimate, not a measurement, and it is the main thing the PoC must test.

**Filter selectivity:**
- At 10% selectivity, in-traversal filtering works well.
- At 0.1–1% selectivity, HNSW graphs filtered during traversal can lose connectivity. Engines then fall back to brute force or pre-filtering, and latency and recall behave very differently from one engine to another.
- Your real filter distribution, especially its most selective tail, could matter more than anything in either benchmark.

## Strengths and weaknesses

**Quiver**
- *Strengths:*
  - Higher recall in the neutral test.
  - Within the SLO at 200M.
  - Documented 1B collection limit.
  - Filtered-HNSW, which filters during traversal.
  - Official VPC Helm chart.
- *Weaknesses:*
  - Less latency headroom (12 ms).
  - Docs appear stale.
  - VPC Helm GA dates only from 2026-07, about 4 months ago, so it is operationally young.
  - Sharded-collection constraints are unverified.
  - The neutral benchmark tested 3.1, not 3.2.

**Tessellate**
- *Strengths:*
  - Lowest latency in both benchmarks.
  - Larger headroom.
  - Consistent 31–34 ms across 50M and 200M, which suggests good scaling.
- *Weaknesses:*
  - Lower recall in the neutral test.
  - The attached material says **nothing** about its collection or vector limits, self-hosting or VPC support, or its filtering mechanism.
  - Its own published benchmark compared against an outdated competitor version, which lowers confidence in its vendor claims.

## Comparisons and alternatives

- If neither engine meets the SLO at 300M in the PoC, fall back to:
  - partitioning by a high-cardinality filter key (for example tenant or document type) into separate collections;
  - adding quantization with re-ranking;
  - scaling out nodes.
- Established engines such as Qdrant, Milvus, Weaviate, Vespa and OpenSearch k-NN are reasonable controls if the shortlist can be widened. They have published approaches to filtered HNSW. I did not evaluate them here.
- **Name collision:** a web search for "Quiver vector database" returns an unrelated embedded Rust/Python library (PyPI `quiver-vector-db`), not a clustered server with Helm charts. When researching externally, make sure sources refer to the right product. I found no public information on "Tessellate" or on this Quiver product, so all claims above rest on the attached documents.

## Tradeoffs

- **Latency headroom vs. recall:**
  - Tessellate gives more SLO margin.
  - Quiver gives better answers at its operating point.
  - Which matters more depends on how much retrieval quality drives downstream relevance, for example RAG answer quality.
- **Feature maturity vs. evidence:**
  - Quiver's key enablers (1B collections in 2026-02, VPC GA in 2026-07) are recent.
  - Tessellate's VPC story is simply undocumented here.
- **Cost:** a full-precision, memory-resident 300M deployment is about 1 TB of RAM before replicas. An engine that holds the SLO with quantization could be much cheaper. Compare at equal hardware cost, not only equal node count.

## Edge cases and failure modes to test

- Highly selective filters (≤1%) and compound filters (AND/OR across fields).
- Concurrent ingestion, updates and deletes during query load: index rebuilds, compaction, and tombstone-driven recall decay.
- Node loss or rolling upgrade at 400 QPS. Does p95 stay under 50 ms during rebalancing?
- Burst traffic above 400 QPS, and p99 rather than only p95.
- Cold start and cache warm-up after a restart.
- Growth to 450–600M vectors, to check that headroom holds.

## Counterarguments

- *"The docs are the official source; trust them over a changelog."* The docs page is explicitly dated 2024 and scoped to 2.x. A changelog entry for a major version is more specific and more recent. Still, get written confirmation from Quiver, because docs and changelog disagree.
- *"Even 1.23x slower is slower; pick the fastest."* That comparison is at unequal recall. Below the SLO, extra latency headroom only has value if you expect growth or tail risk, and recall has direct product value.
- *"The neutral benchmark could be gamed too."* Possibly, but its configs are published and can be rerun. That is the right next step anyway.

## Practical implications: what to do to decide

1. **Get vendor confirmations in writing:**
   - Quiver: whether 1B sharded collections support filtered-HNSW and your metadata field count, whether per-shard limits exist, and the 3.x limits page.
   - Tessellate: maximum collection size, VPC self-hosting support and licensing, and its filtering mechanism.
2. **Rerun OpenANN-Bench's published configs on your own hardware.** Use 300M vectors, or a 300M subset plus synthetic growth to 450M. Use Quiver 3.2 and the current Tessellate.
3. **Use your real embeddings and a sampled production filter distribution,** including the most selective 5% of filters.
4. **Measure at matched recall,** for example recall@10 ≥ 0.95 and ≥ 0.97, by plotting each engine's recall-latency curve. Report p95 and p99 at 400 QPS sustained and at 1.5x burst.
5. **Include operational tests:** ingest under load, node failure, upgrades via Helm, backup and restore.
6. **Pass/fail rule:** p95 < 50 ms with ≥ 20% margin (≤ 40 ms) at the target recall, on budgeted hardware. Among engines that pass, choose on recall, then cost, then operational maturity.

Expected effort is about 1–2 weeks of engineering time. That is small relative to the cost of migrating a 300M-vector production index later.

## Sources

- Attached files (primary evidence), all in `/home/user/flt-sudo/evaluator-v3/runs/r20261111T043537-df92dcf8/sources/`:
  - `quiver-docs-limits.md`
  - `quiver-changelog.md`
  - `tessellate-benchmark.md`
  - `openann-bench-2026-09.md`
- Web search, background only:
  - [quiver-vector-db on PyPI](https://pypi.org/project/quiver-vector-db/), an unrelated embedded library with the same name.
  - [Quiver architecture (tfmv.github.io)](https://tfmv.github.io/quiver/advanced/architecture), same unrelated library.
  - [Qdrant: filtered vector search / ACORN](https://qdrant.tech/articles/filtered-vector-search-acorn/index.md), background on how filtered HNSW works.
  - [arXiv 2506.15987 (FCVI)](https://arxiv.org/pdf/2506.15987), background on approaches to filtered ANN.

## Remaining uncertainty

- No evidence at 300M vectors for either engine. The scaling projection above is my estimate only.
- Tessellate's limits, VPC support and filtering design are unknown from the attached material.
- Whether Quiver's sharded collections and 3.2 Helm deployment behave as the changelog implies has not been verified independently.
- The OpenANN hardware specification is not given, so the ~1 TB memory estimate and per-node figures are approximations from first principles.
- Your actual filter selectivity, update rate and recall requirement are unknown, and any of them could change the ranking.
- I could not verify either product against external sources (the web search found no matching product information), so the analysis relies entirely on the attached documents being accurate.

## Self-assessed quality score: 82/100

Main reasons for the deductions: there was no external evidence about either product, the 300M projection is estimated rather than measured, and the run's process had no independent verification step.
