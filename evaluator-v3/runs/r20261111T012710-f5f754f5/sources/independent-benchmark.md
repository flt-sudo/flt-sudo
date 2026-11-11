# Independent broker benchmark (TechBench Labs, 2026-08)
Setup: 1 KB messages, fsync per batch, replication factor 3, 6 nodes, p99 latency target < 50 ms.

| broker | sustained msg/s | p99 latency |
|---|---|---|
| StreamCore 4.0 | 220,000 | 38 ms |
| QueueForge 2.3 | 410,000 | 61 ms |

Note: QueueForge achieved 340,000 msg/s with p99 < 50 ms. StreamCore was CPU bound on replication.
