# Proposal: move password hashing to SHA-256

Author: backend lead, 2026-10-28

1. bcrypt output is 184 bits; SHA-256 is 256 bits, so SHA-256 is strictly stronger.
2. bcrypt is CPU-heavy. Peak load = 4,000 logins/min. Each bcrypt verify = 250 ms CPU. 4,000 x 0.25 s = 1,000 core-seconds per second -> ~1,000 cores at peak.
3. SHA-256 verify = 0.0004 ms. Problem solved.
4. Migration: on next login, verify bcrypt and re-store as sha256(salt + password).
