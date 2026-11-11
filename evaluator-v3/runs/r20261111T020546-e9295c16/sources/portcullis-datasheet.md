# Portcullis Gateway 5.2 - datasheet

- Edge/north-south API gateway: routing, API keys, OAuth2, per-consumer and per-tenant rate limiting.
- TLS termination at the edge; optional mTLS from gateway to first upstream.
- Does not proxy service-to-service traffic between upstream services.
- Added latency: 0.8 ms p99 (edge, 2 KB payloads).
