# Platform changelog (excerpt)

2025-02-18 — Sessions migrated from sess-redis-01 to managed Valkey 8 cluster `sessions-prod` (3 shards x 1 primary + 1 replica each, multi-AZ, automatic failover). sess-redis-01 decommissioned 2025-03-04.
2025-03-10 — Session TTL reduced from 30d to 14d.
2025-07-22 — Incident INC-2291: failover of shard 2 primary took 41s; ~6% of active sessions saw errors during failover; no logouts. Action item: client retry/backoff on MOVED/failover errors (OPEN).
