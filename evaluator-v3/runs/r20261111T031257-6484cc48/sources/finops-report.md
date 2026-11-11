# FinOps recommendation - prod-k8s (2026-10)

- Cluster utilization: 72% (CPU)
- Current: 40 x n4.large
- Proposed: 20 x n4.xlarge
- Estimated saving: 50% of node spend, ~$2,803/month
- Rationale: larger nodes reduce per-node overhead (kubelet, daemonsets).
