# OpenANN-Bench 2026-09 (community benchmark, reproducible configs published)

Dataset: 200M vectors, 768-dim, 10% selectivity filter, 400 QPS, 3-node clusters of identical hardware.

| Engine | Version | Filtered p95 (ms) | Recall@10 |
|---|---|---|---|
| Tessellate | 4.0 | 31 | 0.95 |
| Quiver | 3.1 | 38 | 0.97 |

Not tested above 200M vectors. Results depend heavily on filter selectivity.
