# Orders DB capacity report (prod-orders-pg, primary)

Generated: 2026-11-02 by platform-sre

## Storage
- Provisioned volume: 2,000 GB (gp-ssd, online-resizable up to 16,000 GB, no downtime)
- Used at month end:

| Month end | Used (GB) |
|---|---|
| 2026-07 | 1,690 |
| 2026-08 | 1,725 |
| 2026-09 | 1,760 |
| 2026-10 | 1,840 |

Note: October includes a one-off 45 GB backfill of the `shipment_events` table (migration ORD-2231). Not expected to recur.

## Compute (30-day p95)
- CPU: 34%
- Write TPS: 2,150 (tested headroom on current instance: 9,000)
- Read replicas: 2, replica lag p99 140 ms
- Connections: 410 / 1,000

## Summary
Storage is the only resource trending toward a limit. Compute and write throughput have >3x headroom.
