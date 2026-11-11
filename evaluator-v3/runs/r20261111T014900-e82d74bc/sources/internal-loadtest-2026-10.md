# Internal load test - Lattice Mesh 3.4 on staging (platform team, 2026-10-21)

Config: mTLS STRICT, telemetry on, realistic checkout payloads (6-40 KB), 3,500 rps.

| Mode | Added p99 latency per hop |
|---|---|
| Sidecar proxy | 2.6 ms |
| Node-proxy (per-node shared proxy) mode | 0.9 ms |

Notes: node-proxy mode is GA since Lattice 3.2; it provides the same mTLS identity guarantees but L7 policies are coarser.
