# Platform requirements (approved by CTO, 2026-09)

R1. mTLS for ALL service-to-service (east-west) traffic between the 14 internal services. Audit deadline: 2027-06-30.
R2. Per-tenant rate limiting and API key auth for external (north-south) traffic.
R3. Checkout request path (edge -> 5 internal service hops) may gain at most 10 ms p99 of added infrastructure latency.
R4. Team: 3 platform engineers.
