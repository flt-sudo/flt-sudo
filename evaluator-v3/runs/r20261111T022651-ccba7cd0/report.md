# Evaluation: Proposal to replace bcrypt (cost 12) with single-iteration salted SHA-256 for customer password storage in the auth service

**Decision objective:** Decide whether to approve, reject or modify the proposal to switch customer password hashing from bcrypt cost 12 to single-iteration salted SHA-256. The decision depends on two things: whether the switch keeps password storage secure enough against offline cracking if the database leaks, and whether bcrypt's real compute cost is large enough to justify any change. If cost does matter, the evaluation should find a cheaper option that keeps a slow, memory-hard or adaptive hash in place (for example tuning the bcrypt cost, Argon2id, rate limiting, or capacity changes) instead of dropping to a fast hash.

## Verdict

Reject the proposal as written. Single-iteration salted SHA-256 would make offline cracking of a leaked database about 625,000x cheaper per CPU core by the memo's own timings. At GPU scale the estimate is about 13.5 million times cheaper per RTX 4090, extrapolated from a cost-5 bcrypt benchmark. OWASP explicitly calls fast hashes such as SHA-256 unsuitable for password storage. The financial case also fails. The memo's 1,000-core figure comes from a 60x unit error: 4,000 logins per minute at 0.25 CPU-s needs about 16.7 cores, not 1,000. Observed telemetry (48 vCPU at 41% peak, about 19.7 busy vCPU) agrees with the corrected figure. At public AWS list prices, the bcrypt hashing load is worth about $543/month. If finance still wants a saving, the fallback is to keep an adaptive hash. Options are bcrypt cost 11 (about 8.3 cores at peak, still above the OWASP minimum of 10, though it halves attacker cost per guess) or Argon2id (about 12 cores at the benchmarked 64 MiB, t=3), plus right-sizing the 48 vCPU cluster and edge rate limiting. Use upward rehash-on-login, never the memo's downgrade migration.

**Confidence:** high  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** SHA-256 is a stronger, more modern algorithm than bcrypt for password storage because its output is 256 bits against bcrypt's 184 bits.
  **Correction:** Password-storage strength comes from cost per guess (work factor or memory hardness), not digest length. OWASP calls SHA-256 unsuitable for password storage. Against the proposed construction, attackers would guess about 625,000x faster per core and about 13.5 million times faster per GPU. [E5, E7, E8, E9]
- **Assumption:** At a peak of 4,000 logins per minute, bcrypt needs about 1,000 CPU cores.
  **Correction:** 4,000 per minute is about 66.7 per second. At 0.25 CPU-s each that is about 16.7 cores, 60x lower than the memo's figure. Observed busy capacity of about 19.7 vCPU (48 at 41%) is consistent with the corrected figure. [E1, E2, E3]
- **Assumption:** bcrypt is burning too much CPU and is a significant compute cost.
  **Correction:** Hashing uses about 16.7 cores at peak within a 48 vCPU cluster that peaks at 41%. At public AWS list prices that is about $543/month of a cluster costing about $1,564/month. These are order-of-magnitude proxies. [E2, E3, E11]
- **Assumption:** Approving the switch would meaningfully reduce compute spend.
  **Correction:** The most it can save is the hashing share, about $543/month at list price, and less if the cluster is not resized. Secure alternatives such as bcrypt-11 (about $271/month saved) or right-sizing capture part of that without giving up offline protection. [E3, E11, E2]

## Criteria

### C1 Resistance to offline cracking after a database breach (weight 35)

The proposal fails this criterion decisively. Single-iteration salted SHA-256 takes 0.0004 ms per verify against 250 ms for bcrypt-12 on the same production core. That is a 625,000x cut in attacker cost per guess per core (K7). On GPUs the gap is wider. An RTX 4090 runs sha256($salt.$pass), the exact construction the memo proposes, at about 19,450.8 MH/s. Extrapolated bcrypt cost 12 on the same card is about 1.44 kH/s (K8). The per-GPU speed-up is therefore about 13.5 million times (K9). The salt still defeats precomputed tables and forces per-user work, but each guess becomes nearly free. Low-entropy customer passwords would fall to dictionary and rule-based attacks soon after a breach. [E1, E3, E5, E7, E8, E6]

*Mechanisms:* Passwords are low-entropy inputs, so an attacker who holds the hash file searches a small candidate space. What protects them is the cost of each guess. bcrypt's adaptive work factor doubles the work per cost step and makes each guess expensive. A single SHA-256 is designed to be fast and maps well onto massively parallel GPU hardware. A per-user salt only stops guesses from being shared across users or precomputed. It does not make each guess slower.

*Strengths:*
- The salt in the proposal still prevents rainbow-table and cross-user batch attacks.

*Weaknesses:*
- About 625,000x cheaper guessing per CPU core by the memo's own timings (E1, E3, K7).
- About 13.5 million times cheaper per RTX 4090 against the proposed sha256(salt+password) construction (E7, E8, K9).
- The memo's migration rewrites each active user's bcrypt hash into the fast format at next login. The most active accounts lose protection first, and a breach during migration would expose a mixed-format database (E1, E6).
- No tunable cost factor, so the protection cannot be raised as hardware gets faster (E9).

### C2 Correctness of the CPU cost claim (recomputed core requirement) (weight 20)

The memo's core count is wrong by a factor of 60. It multiplies 4,000 logins per minute by 0.25 CPU-s and labels the result core-seconds per second, giving 1,000 (K1). Converting the rate to per-second gives 66.7 verifies/s x 0.25 s, about 16.7 cores at peak (K2). That is 60x lower (K12). The observed cluster is 48 vCPU at 41% peak, about 19.7 busy vCPU (K3). This fits the corrected figure and could not support the memo's figure. At c7i.xlarge on-demand list pricing, the whole 48 vCPU cluster is about $1,564/month (K10). The bcrypt-12 hashing share is about $543/month (K11). Even removing hashing completely would save only a few hundred dollars per month at list price. [E1, E2, E3, E4, E11]

*Mechanisms:* The error is a per-minute versus per-second unit mix-up. Telemetry gives an independent check: 1,000 cores of real demand could not run on a 48 vCPU cluster at 41% utilisation.

*Strengths:*
- The corrected figure is cross-checked by two independent sources, the benchmark plus traffic arithmetic (E2, E3) and observed CPU utilisation (E2).

*Weaknesses:*
- The metrics do not separate hashing CPU from other auth-service work, so the 19.7 busy vCPU is an upper bound on hashing (E2).
- vCPU is not the same as a physical core, and only one month of telemetry is available (E2, E4).
- The dollar figures use public AWS list prices as a proxy. The company's actual cloud and pricing are unknown (E11).

### C3 Alignment with current standards and compliance expectations (weight 15)

The proposal conflicts with OWASP and, on the available snippets, with NIST SP 800-63B-4. OWASP says fast general-purpose hashes such as SHA-256 are 'not suitable for password storage'. It recommends Argon2id, scrypt, bcrypt (minimum work factor 10) or PBKDF2-HMAC-SHA256 at 600,000 iterations. NIST 800-63B-4 requires a password hashing scheme that takes a salt and a cost factor, with the cost set 'as high as practical'. Single-iteration SHA-256 has no cost factor. PCI DSS 8.3.2 requires 'strong cryptography' and names no specific KDF, so a PCI finding would depend on how the auditor reads that phrase. Auditors commonly benchmark against OWASP and NIST norms. Overall the change would probably draw an audit finding, and it would weaken the company's position after a breach. [E5, E9, E10]

*Mechanisms:* Standards define acceptable password storage by resistance to offline guessing, which means a cost factor or memory hardness. Digest strength is not the test. A scheme with no work factor fails that test by construction.

*Strengths:*
- The current bcrypt cost 12 setup and both proposed alternatives (bcrypt 11, Argon2id 64 MiB t=3) meet OWASP minimums (E5).

*Weaknesses:*
- The NIST and PCI text come from search snippets only and were not fetched in full (E9, E10).
- Whether PCI applies to this service is unknown, and no SOC 2 guidance was gathered (E10).
- Sources disagree on whether bcrypt and Argon2 count as NIST-'approved'. This matters if FIPS alignment is required, in which case PBKDF2 is the conservative choice (E9, E5).

### C4 Validity of the 'stronger 256-bit algorithm' security argument (weight 10)

The '256-bit is stronger' argument does not hold. Digest length governs collision and preimage resistance against random, high-entropy inputs. Password cracking does not attack the digest. It enumerates likely passwords and hashes each one. Neither 184 nor 256 output bits is the bottleneck. The bottleneck is how many guesses per second the attacker can compute. On that measure SHA-256 is about 625,000x weaker per CPU core (K7) and about 13.5 million times weaker per GPU (K9). OWASP and NIST both place password-hashing strength in work factor and cost, not output size. [E1, E5, E7, E8, E9]

*Mechanisms:* The attacker's work equals the size of the candidate password space times the cost per guess. Output length only matters if the attacker tries to brute-force the digest itself, and no one does that against passwords.

*Strengths:*
- SHA-256 is a sound general-purpose hash for integrity and signatures. That role is not password storage.

*Weaknesses:*
- The memo's argument ('SHA-256 is 256 bits, so SHA-256 is strictly stronger') confuses digest size with resistance to guessing (E1).

### C5 Cost-effectiveness of alternatives that keep a slow hash (weight 12)

If cost reduction is still wanted, secure options exist that cost little. bcrypt cost 11 (125 ms) halves hashing CPU to about 8.3 cores at peak (K4), saving roughly $271/month at list price (K15). It stays above OWASP's minimum of 10 but makes each offline guess 2x cheaper (K16). Argon2id at m=64 MiB, t=3 (180 ms) needs about 12 cores at peak (K5). It is OWASP's first choice, it is memory-hard, which narrows the GPU advantage, and it still uses less CPU than bcrypt-12. Right-sizing is also possible: peak busy capacity is about 19.7 of 48 vCPU, leaving about 28.3 vCPU idle at peak (K17). Whether to reclaim that depends on burst headroom (see C6). Session or token caching reduces how often passwords are verified, but the packet has no data to size that saving. [E3, E4, E5, E11, E2]

*Mechanisms:* Hashing CPU scales linearly with verifies per second times cost per verify. Savings can come from a moderately cheaper adaptive hash, fewer password verifies, or fewer idle machines. None of these gives up the work factor.

*Strengths:*
- Every alternative keeps an OWASP-compliant adaptive or memory-hard hash (E5).
- Argon2id adds memory hardness, which bcrypt and SHA-256 lack (E5, E3).

*Weaknesses:*
- Dollar savings are small in every case, a few hundred dollars per month at list price, so the business case for any change is weak (E11).
- Argon2id at 64 MiB needs RAM per concurrent verify: about 768 MiB at peak concurrency and about 5,760 MiB under an unmitigated burst (K18, K19).
- Benchmark hardware and library versions are not stated (E3).

### C6 Resilience to online attack load and denial of service (weight 8)

The 2025 credential-stuffing burst of about 30,000 attempts per minute was 7.5x normal peak (K13). At bcrypt-12, the burst would need about 125 cores if it all reached the hashing tier (K6). The current cluster has 48 vCPU. The metrics say the burst was 'mitigated by rate limiting at the edge' but do not say how much traffic reached verification. Edge rate limiting is therefore the actual DoS control, and the answer to attack load is rate limiting plus capacity planning, not cheap hashes. For comparison, an unmitigated burst would need about 62.5 cores at bcrypt-11 (K14) and about 90 cores at Argon2id (K20). OWASP itself warns that very high work factors can enable DoS, which argues for a sane cost setting, not for removing the cost. [E2, E4, E5]

*Mechanisms:* A slow hash raises the server's cost per login attempt as well as the attacker's cost per offline guess. Online attack load is best capped before it reaches the hashing tier, with per-IP and per-account limits at the edge. Fast hashes would remove this DoS pressure only by giving up all offline protection.

*Strengths:*
- Edge rate limiting has already handled a 7.5x burst in practice (E2).

*Weaknesses:*
- How much attack traffic reaches the hashing tier, and the rate-limit configuration, are unknown (E2).
- Right-sizing the cluster down would cut the headroom that protects against rate-limit bypass (E2, E4).

## Key claims

- **CL1** (material): Switching to single-iteration salted SHA-256 makes each offline password guess about 625,000x cheaper per CPU core, using the memo's own benchmark figures (250 ms vs 0.0004 ms). [E1, E3, K7]
- **CL2** (material): On one RTX 4090, the proposed sha256($salt.$pass) construction runs at about 19,450.8 MH/s. bcrypt cost 12, extrapolated from the measured cost-5 rate of 184.0 kH/s, runs at about 1.44 kH/s. The attacker speed-up is therefore about 13.5 million times. This is an estimate, not a measured cost-12 benchmark. [E7, E8, K8, K9]
- **CL3** (material): OWASP states that fast general-purpose hashes such as SHA-256 are not suitable for password storage, and it recommends Argon2id, scrypt, bcrypt (work factor at least 10) or PBKDF2-HMAC-SHA256 with 600,000 iterations. [E5]
- **CL4** (material): The memo's figure of about 1,000 cores comes from a unit error. 4,000 logins per minute at 0.25 CPU-s needs about 16.7 cores at peak, which is 60x lower than the memo's figure. [E1, E2, E3, K1, K2, K12]
- **CL5** (material): Observed telemetry (48 vCPU at 41% peak, about 19.7 busy vCPU) is consistent with the corrected requirement of about 16.7 cores and rules out a 1,000-core demand. On the E1/E2 contradiction, the measured metrics are more reliable than the memo's derived figure. [E2, E1, K3]
- **CL6** (material): Output digest length (256 vs 184 bits) does not determine password-hashing strength. What determines it is the cost per guess against low-entropy input, and that is the property OWASP and NIST set requirements for. The memo's 'strictly stronger' claim is wrong, and OWASP (authoritative, directly on point) outweighs the memo's bare assertion in the E1/E5 contradiction. [E1, E5, E9, K7, K9]
- **CL7**: At AWS c7i.xlarge on-demand list pricing (about $0.1785/hour per 4 vCPU), the whole 48 vCPU auth cluster costs about $1,564/month, and the bcrypt-12 hashing share at peak is worth about $543/month. These are order-of-magnitude proxies, not the company's actual spend. [E11, E2, E3, K10, K11]
- **CL8**: NIST SP 800-63B-4 (search snippets) requires passwords to be salted and hashed with a password hashing scheme that takes a cost factor, set as high as practical. Single-iteration SHA-256 has no cost factor. [E9]
- **CL9**: PCI DSS 8.3.2 requires 'strong cryptography' for stored authentication factors and does not name a KDF. A PCI finding against SHA-256 would therefore depend on auditor interpretation, and whether PCI applies to this service cannot be determined from the packet. [E10]
- **CL10**: bcrypt cost 11 would cut peak hashing CPU to about 8.3 cores, saving about $271/month at list price. It still meets OWASP's minimum work factor of 10, but each offline guess becomes 2x cheaper for an attacker. [E3, E5, E11, K4, K15, K16]
- **CL11**: Argon2id at m=64 MiB, t=3, p=1 (180 ms) needs about 12 cores at peak, less CPU than current bcrypt-12, and it is OWASP's first-choice algorithm, which exceeds OWASP's minimum parameters. [E3, E5, K5]
- **CL12** (material): The memo's migration (verify bcrypt at next login, then re-store as sha256(salt+password)) uses OWASP's rehash-on-login mechanism in reverse. It progressively replaces strong hashes with weak ones, starting with the most active users. The recommended pattern is upward rehash-on-login to a stronger scheme. [E1, E6]
- **CL13**: An unmitigated 30,000/min credential-stuffing burst (7.5x normal peak) at bcrypt-12 would need about 125 cores against a 48 vCPU cluster. How much of the 2025 burst actually reached the hashing tier after edge rate limiting cannot be determined from the packet. [E2, E4, K6, K13]
- **CL14**: The packet cannot show what share of the cluster's 19.7 busy vCPU is password hashing, or whether October 2026 is a representative peak month. [E2]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Reproduce the memo's (erroneous) figure: 4,000 logins/min treated as per second x 0.25 CPU-s | `4000 * 0.25` | 1000 | 1000 | yes |
| K2 | Correct peak bcrypt-12 core requirement: (4,000/60) verifies per second x 0.25 CPU-s | `4000 / 60 * 0.25` | 16.67 | 16.666666666666668 | yes |
| K3 | Observed busy vCPU at peak: 48 vCPU x 41% | `48 * 0.41` | 19.68 | 19.68 | yes |
| K4 | Peak cores for bcrypt cost 11 at 0.125 CPU-s per verify | `4000 / 60 * 0.125` | 8.333 | 8.333333333333334 | yes |
| K5 | Peak cores for Argon2id (m=64 MiB, t=3) at 0.18 CPU-s per verify | `4000 / 60 * 0.18` | 12 | 12 | yes |
| K6 | Cores needed if an unmitigated 30,000/min burst reached bcrypt-12 hashing | `30000 / 60 * 0.25` | 125 | 125 | yes |
| K7 | Per-core attacker speed-up from bcrypt-12 (250 ms) to SHA-256 (0.0004 ms), using the internal benchmark | `250 / 0.0004` | 625000 | 625000 | yes |
| K8 | Extrapolated RTX 4090 bcrypt cost-12 rate in kH/s: cost-5 rate 184.0 kH/s divided by 2^7 | `184.0 / 2^7` | 1.4375 | 1.4375 | yes |
| K9 | Per-GPU attacker speed-up: sha256($salt.$pass) at 19,450.8 MH/s divided by extrapolated bcrypt-12 rate in H/s | `19450.8 * 10^6 / (184.0 * 10^3 / 2^7)` | 13531000 | 13530991.304347826 | yes |
| K10 | Monthly on-demand list cost of 48 vCPU as 12 c7i.xlarge instances at $0.1785/hour x 730 hours | `48 / 4 * 0.1785 * 730` | 1563.66 | 1563.6599999999999 | yes |
| K11 | Monthly list-price value of the bcrypt-12 peak hashing load (about 16.7 cores at 4 vCPU per $0.1785/hour instance) | `(4000 / 60 * 0.25) / 4 * 0.1785 * 730` | 543 | 542.9375 | yes |
| K12 | Factor by which the memo overstates the core requirement | `1000 / (4000 / 60 * 0.25)` | 60 | 59.99999999999999 | yes |
| K13 | Ratio of the 2025 credential-stuffing burst to normal peak login rate | `30000 / 4000` | 7.5 | 7.5 | yes |
| K14 | Cores needed if an unmitigated 30,000/min burst reached bcrypt-11 hashing | `30000 / 60 * 0.125` | 62.5 | 62.5 | yes |
| K15 | Monthly list-price saving from moving bcrypt-12 to bcrypt-11 (8.33 fewer cores at peak) | `(4000 / 60 * 0.125) / 4 * 0.1785 * 730` | 271.5 | 271.46875 | yes |
| K16 | Attacker speed-up per guess from lowering bcrypt cost 12 to 11 (250 ms vs 125 ms) | `250 / 125` | 2 | 2 | yes |
| K17 | Idle vCPU at peak: 48 minus busy 48 x 0.41 | `48 - 48 * 0.41` | 28.32 | 28.32 | yes |
| K18 | Approximate Argon2id concurrent memory at peak in MiB: verifies/s x 0.18 s x 64 MiB | `4000 / 60 * 0.18 * 64` | 768 | 768 | yes |
| K19 | Approximate Argon2id concurrent memory in MiB under an unmitigated 30,000/min burst | `30000 / 60 * 0.18 * 64` | 5760 | 5760 | yes |
| K20 | Cores needed if an unmitigated 30,000/min burst reached Argon2id hashing at 0.18 s | `30000 / 60 * 0.18` | 90 | 90 | yes |

## Alternatives

- **Keep bcrypt cost 12 as is (status quo):** Peak hashing needs about 16.7 cores (K2) inside a 48 vCPU cluster at 41% peak (K3). Hashing is worth about $543/month at list price (K11). It is OWASP-compliant and offers about 13.5 million times more GPU resistance per guess than the proposal (K9). There is no migration risk.
- **bcrypt cost 11:** About 8.3 cores at peak (K4), saving roughly $271/month at list price (K15). It stays above OWASP's minimum of 10 (E5) but halves attacker cost per guess (K16). Existing hashes would move to cost 11 on next login. This is a modest saving at a real but bounded security cost.
- **Argon2id (m=64 MiB, t=3, p=1):** About 12 cores at peak (K5), less CPU than bcrypt-12. It is OWASP's first choice and memory-hard, which narrows the GPU advantage. It needs about 768 MiB of RAM at peak concurrency (K18) and is a library and format change, with migration by upward rehash-on-login (E6).
- **PBKDF2-HMAC-SHA256 at 600,000 iterations:** The OWASP option for FIPS-140 environments (E5). Relevant only if NIST or FIPS 'approved' status is required (E9). The packet has no CPU benchmark for it, so its core cost cannot be compared.
- **Right-size the cluster and rely on edge rate limiting:** About 28.3 vCPU sits idle at peak (K17), so some capacity might be reclaimed without touching the hash. This has to be weighed against burst headroom, because an unmitigated 30,000/min burst at bcrypt-12 would need about 125 cores (K6) and rate-limit effectiveness has not been measured (E2).
- **Proposed single-iteration salted SHA-256:** Hashing CPU drops to nearly zero, but the saving is at most about $543/month at list price (K11). Offline guessing becomes about 625,000x cheaper per core (K7) and about 13.5 million times cheaper per GPU (K9), and the scheme conflicts with OWASP (E5) and NIST (E9). Not acceptable.

## Tradeoffs

- Security against financial saving: the most the proposal can save is the hashing share, about $543/month at list price (K11). In return it removes almost all offline-cracking resistance (K7, K9).
- bcrypt cost 11 halves CPU (K4) and also halves attacker cost per guess (K16). Lowering the cost factor is a direct trade with no free lunch.
- Argon2id lowers CPU relative to bcrypt-12 (K5) and adds memory hardness, but it uses RAM per concurrent verify (K18, K19) and requires a migration.
- Right-sizing recovers idle capacity (K17) but reduces headroom for credential-stuffing bursts that get past rate limiting (K6, K13).
- Higher work factors improve offline resistance but raise DoS exposure, which OWASP explicitly notes (E5). Rate limiting, not a weaker hash, is the way to manage that exposure.

## Edge cases and failure modes

- Breach during the memo's migration: the database would hold bcrypt hashes for inactive users and fast SHA-256 hashes for active users, so the most valuable accounts would be the easiest to crack (E1, E6).
- Once accounts are migrated to SHA-256, reversing course requires another rehash-on-login cycle, and accounts that do not log in during the exposure window stay weak (E6).
- Rate-limit bypass, for example through distributed IPs: unmitigated burst load would exceed the 48 vCPU cluster at bcrypt-12 (about 125 cores, K6) and at Argon2id (about 90 cores, K20). Exhausting the hashing tier then becomes a DoS vector (E2, E5).
- Argon2id memory pressure: at 64 MiB per verify, an unmitigated burst implies about 5.6 GiB of concurrent hashing memory (K19). Without concurrency limits this could cause out-of-memory failures.
- Non-hashing CPU: if a meaningful share of the 19.7 busy vCPU is not hashing, then hashing-related savings are smaller than estimated (E2).
- Benchmark validity: the 250 ms bcrypt-12 figure comes from an unstated environment. If production hardware differs, all core counts scale proportionally, but the 60x unit-error conclusion stands (E3).
- Faster attacker hardware: the GPU figures are for a 2022 RTX 4090. Newer GPUs widen the absolute cracking rate against fast SHA-256 even further (E7).

## Counterarguments

- **The salt already stops rainbow tables, so salted SHA-256 is secure enough.** — Salting stops precomputation and shared-guess attacks, but it does not slow individual guesses. With about 19.45 billion salted SHA-256 guesses per second per GPU (E7), targeted dictionary attacks on each user remain cheap. That is why OWASP rejects fast hashes even when salted (E5).
- **SHA-256 has a longer 256-bit output, so it is cryptographically stronger than bcrypt's 184 bits.** — Output length matters only for attacks on the digest itself, such as collisions or preimages of high-entropy data. Password cracking enumerates low-entropy candidates, so cost per guess is what matters. On that measure SHA-256 is about 625,000x weaker per core (K7) and about 13.5 million times weaker per GPU (K9). OWASP and NIST base their requirements on cost factor (E5, E9).
- **bcrypt really does cost about 1,000 cores at peak, which is a large and growing bill.** — The memo applies a per-minute rate as if it were per-second. The correct figure is about 16.7 cores (K2, K12), and observed busy capacity of about 19.7 vCPU on a 48 vCPU cluster confirms it (K3). At list price, hashing costs about $543/month (K11).
- **Slow hashes make us vulnerable to DoS during credential-stuffing attacks.** — This is a real concern, and OWASP warns about excessive work factors (E5). But the 2025 burst was handled by edge rate limiting (E2), which is the right control. Fast hashes would remove DoS pressure only by giving up all offline protection. Capacity and rate limits can be tuned without weakening storage.
- **The hashcat bcrypt figure is only an extrapolation, so the GPU speed-up may be overstated.** — That is true, and the 13.5 million times figure is an estimate (E8). But the per-core ratio from the memo's own internal benchmark is already 625,000x (K7). The conclusion does not depend on the exact GPU multiplier.

## Practical implications

- Do not approve the SHA-256 switch. Return the memo with the corrected core arithmetic (about 16.7 cores, not about 1,000) and the cracking-cost comparison.
- If a compute saving is still required, choose between bcrypt cost 11 (about $271/month saved at list price, 2x cheaper attacker guesses) and Argon2id 64 MiB/t=3 (lower CPU than bcrypt-12 plus memory hardness). Do not choose any fast hash.
- Any migration should be upward rehash-on-login (for example bcrypt to Argon2id). Never use the memo's downgrade path.
- Treat edge rate limiting and capacity headroom as the controls against credential stuffing. Measure how many burst attempts reach the hashing tier before right-sizing the 48 vCPU cluster.
- Instrument hashing CPU separately from other auth-service CPU so future cost discussions rest on measured data.
- Confirm whether PCI DSS or FIPS requirements apply, since FIPS alignment would point to PBKDF2-HMAC-SHA256 at 600,000 iterations rather than Argon2id.

## Remaining uncertainty

- How much of the cluster's CPU is password hashing as opposed to other auth work, and whether October 2026 is a representative peak.
- How many of the about 30,000/min 2025 burst attempts reached the hashing tier after edge rate limiting, and the current rate-limit configuration.
- The company's actual cloud provider, instance types and negotiated pricing. The dollar figures are list-price proxies.
- The hardware and library context of the internal 250 ms bcrypt-12 benchmark, which was not externally validated.
- The exact GPU cracking rate for bcrypt cost 12. The 13.5 million times figure is extrapolated from a cost-5 benchmark on 2022 hardware.
- Full text of NIST SP 800-63B-4 and the PCI SSC FAQ (snippets only), whether PCI or SOC 2 scope applies, and whether FIPS alignment is required.
- Open question the reviewer judged decisive: How many verifies per second reached the hashing tier during the 2025 credential-stuffing burst after edge rate limiting? This decides whether right-sizing the 48 vCPU cluster is safe.
- Open question the reviewer judged decisive: Are PCI DSS, SOC 2 or FIPS-140 in scope? FIPS alignment would change the recommended fallback from Argon2id to PBKDF2-HMAC-SHA256.
- Open question the reviewer judged decisive: Measured GPU cracking rates for bcrypt cost 12 and Argon2id (m=64 MiB, t=3) on current hardware, to confirm that Argon2id is not weaker than bcrypt-12 against offline attack.

## Further research that could change the conclusion

- Per-process CPU profiling of the auth service: if hashing were far larger than about 17 cores, the cost case for a secure alternative such as bcrypt-11 or Argon2id would strengthen. It would still not justify a fast hash.
- Rate-limiter logs from the 2025 incident showing verifies per second that reached hashing. These would set the needed headroom and decide whether right-sizing is safe.
- A measured hashcat benchmark of bcrypt cost 12 and Argon2id on current GPUs, to firm up the cracking-cost ratios.
- Confirmation of compliance scope (PCI DSS, SOC 2, FIPS), which could change the preferred algorithm choice between Argon2id, bcrypt and PBKDF2.
- The actual monthly cost of the auth cluster, to replace the list-price proxy.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | The memo states: peak load = 4,000 logins/min; each bcrypt verify = 250 ms CPU; '4,000 x 0.25 s = 1,000 core-seconds per second -> ~1,000 cores at peak'. It also states 'bcrypt output is 184 bits; SHA-256 is 256 bits, so SHA-256 is strictly stronger', SHA-256 verify = 0.0004 ms, and proposes migration 'on next login, verify bcrypt and re-store as sha256(salt + password)'. Memo dated 2026-10-28. | hashing-proposal-memo.md |
| E2 | VERIFIED | fixture_read | Auth service metrics (Oct 2026): peak password logins 4,000 per minute; auth cluster 48 vCPU with peak CPU 41%; 2025 incident: credential-stuffing burst of ~30,000 attempts/min mitigated by rate limiting at the edge. | auth-service-metrics.md |
| E3 | VERIFIED | fixture_read | Internal benchmark of CPU ms per verify on a prod core: bcrypt cost=12: 250; bcrypt cost=11: 125; argon2id m=64MiB t=3 p=1: 180; sha256 salted single iteration: 0.0004. | auth-benchmark.csv |
| E4 | INFERRED | fixture_read | Recomputed from E2 and E3: 4,000 logins/min is 4,000/60 = about 66.7 verifies/s. At 0.25 CPU-s each that is about 16.7 cores busy at peak, not about 1,000. Observed busy capacity is 48 vCPU x 0.41 = about 19.7 vCPU, which fits the corrected figure. With the same arithmetic, bcrypt-11 at 0.125 s needs about 8.3 cores and Argon2id at 0.18 s needs about 12 cores. A 30,000/min burst at bcrypt-12, if it all reached the hashing tier, would need 500 verifies/s x 0.25 s = about 125 cores. | auth-benchmark.csv |
| E5 | VERIFIED | fetched | OWASP Password Storage Cheat Sheet (markdown source) says fast general-purpose hashes such as SHA-256 are 'not suitable for password storage because they allow attackers to perform large numbers of guesses quickly'. Recommended options: Argon2id first choice, minimum 'm=19456 (19 MiB), t=2, p=1'; scrypt 'N=2^17 (128 MiB), r=8 (1024 bytes), p=1'; bcrypt for legacy systems, 'work factor should be as large as verification server performance will allow, with a minimum of 10'; PBKDF2 for FIPS-140, 'PBKDF2-HMAC-SHA256: 600,000 iterations'. Rule of thumb: 'calculating a hash should take less than one second'. It also warns that too high a work factor can enable denial-of-service. | https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md |
| E6 | VERIFIED | fetched | OWASP upgrading legacy hashes: the usual way to raise a work factor is to wait for the user's next login and re-hash 'their password with the new work factor'. Layering (using the existing hash as input to a stronger algorithm, e.g. bcrypt(md5)) 'avoids the need to know the original password; however, it can make the hashes easier to crack', and layered hashes 'should be replaced with direct hashes of the users' passwords next time the user logs in'. | https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md |
| E7 | VERIFIED | fetched | RTX 4090 hashcat v6.2.6 benchmark (Chick3nman gist, created Oct 14 2022): Mode 1400 SHA2-256 '21975.5 MH/s'; Mode 1410 sha256($pass.$salt) '21960.3 MH/s'; Mode 1420 sha256($salt.$pass) '19450.8 MH/s'; Mode 3200 bcrypt [Iterations: 32] '184.0 kH/s'. | https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd |
| E8 | INFERRED | fetched | Scaling E7 to cost 12: bcrypt work doubles per cost step, so cost 12 (4,096 iterations) is 2^7 = 128x the cost-5 work. That gives roughly 184.0/128 = about 1.44 kH/s per RTX 4090. Against about 19,450.8 MH/s for sha256($salt.$pass), the per-GPU attacker speed-up from the switch is on the order of 10^7 (about 13 million x). The memo's own CPU figures give 250/0.0004 = 625,000x per core. | https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd |
| E9 | INFERRED | search_result | NIST SP 800-63B-4: 'Verifiers SHALL store passwords in a form that is resistant to offline attacks. Passwords SHALL be salted and hashed using a suitable password hashing scheme.' 'Password hashing schemes take a password, a salt, and a cost factor as inputs.' 'The chosen cost factor SHOULD be as high as practical without negatively impacting verifier performance. It SHOULD be increased over time.' Their purpose is 'to make each password guess more expensive for an attacker who has obtained a hashed password file'. An approved scheme from the latest SP 800-132 or updated NIST guidelines SHOULD be used. | https://pages.nist.gov/800-63-4/sp800-63b/authenticators |
| E10 | INFERRED | search_result | PCI DSS 4.x Requirement 8.3.2 requires strong cryptography to render all authentication factors unreadable during transmission and storage. The PCI SSC FAQ says: 'Yes. Using strong cryptography to hash the password meets the intent of the PCI DSS Requirement 8.3.2.' Requirement 3.5.1.1 (keyed hashes) applies to PAN, not passwords. | https://www.pcisecuritystandards.org/faq/articles/Frequently_Asked_Question/does-hashing-of-passwords-meet-the-intent-of-pci-dss-requirement-8-3-2 |
| E11 | INFERRED | search_result | AWS c7i.xlarge (4 vCPU) on-demand in us-east-1 is about $0.1785/hour (about $130/month), per pricing aggregators. Spot was about $0.05 to $0.07/hour. | https://calculator.holori.com/aws/ec2/c7i.xlarge/us-east-1 |
| E12 | INFERRED | user_input | The request states that finance wants to approve the switch to cut compute spend, and that the lead calls SHA-256 'a stronger, more modern 256-bit algorithm'. | request |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 9 web search(es), 4 fetch attempt(s), 3 supplied document(s) read.
- search: "OWASP Password Storage Cheat Sheet Argon2id 19 MiB bcrypt work factor 10 PBKDF2-HMAC-SHA256 600,000 iterations" (19 results)
- search: "NIST SP 800-63B-4 passwords SHALL be salted and hashed using a suitable password hashing scheme cost factor" (10 results)
- search: "hashcat RTX 4090 benchmark SHA-256 GH/s bcrypt H/s mode 3200" (17 results)
- search: "PCI DSS 4.0 requirement 8.3.2 strong cryptography passwords hashed keyed cryptographic hash 3.5.1.1" (20 results)
- search: "PCI SSC FAQ does hashing of passwords meet the intent of requirement 8.3.2 salt strong cryptography" (17 results)
- search: "Chick3nman RTX 4090 hashcat benchmark "SHA2-256" "bcrypt $2*$, Blowfish (Unix)" H/s" (19 results)
- search: "OWASP password storage upgrading legacy hashes layering bcrypt(md5) rehash on login" (19 results)
- search: "usnistgov 800-63-4 github sp800-63b passwords "password hashing scheme" "cost factor" Argon2 PBKDF2 salt at least 32 bits" (10 results)
- search: "AWS c7i.xlarge on-demand price per hour us-east-1 4 vCPU" (20 results)
2. **Sources inspected:**
- https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md (fetched)
- https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd (fetched)
- hashing-proposal-memo.md (fixture_read)
- auth-benchmark.csv (fixture_read)
- auth-service-metrics.md (fixture_read)
   Cited from search snippets only (not opened):
- https://pages.nist.gov/800-63-4/sp800-63b/authenticators
- https://www.pcisecuritystandards.org/faq/articles/Frequently_Asked_Question/does-hashing-of-passwords-meet-the-intent-of-pci-dss-requirement-8-3-2
- https://calculator.holori.com/aws/ec2/c7i.xlarge/us-east-1
3. **Checks executed:**
- Evidence registry validation: 12 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 1 draft(s)
- Calculation K1 re-executed: 4000 * 0.25 = 1000 (claimed 1000) → match
- Calculation K2 re-executed: 4000 / 60 * 0.25 = 16.666666666666668 (claimed 16.67) → match
- Calculation K3 re-executed: 48 * 0.41 = 19.68 (claimed 19.68) → match
- Calculation K4 re-executed: 4000 / 60 * 0.125 = 8.333333333333334 (claimed 8.333) → match
- Calculation K5 re-executed: 4000 / 60 * 0.18 = 12 (claimed 12) → match
- Calculation K6 re-executed: 30000 / 60 * 0.25 = 125 (claimed 125) → match
- Calculation K7 re-executed: 250 / 0.0004 = 625000 (claimed 625000) → match
- Calculation K8 re-executed: 184.0 / 2^7 = 1.4375 (claimed 1.4375) → match
- Calculation K9 re-executed: 19450.8 * 10^6 / (184.0 * 10^3 / 2^7) = 13530991.304347826 (claimed 13531000) → match
- Calculation K10 re-executed: 48 / 4 * 0.1785 * 730 = 1563.6599999999999 (claimed 1563.66) → match
- Calculation K11 re-executed: (4000 / 60 * 0.25) / 4 * 0.1785 * 730 = 542.9375 (claimed 543) → match
- Calculation K12 re-executed: 1000 / (4000 / 60 * 0.25) = 59.99999999999999 (claimed 60) → match
- Calculation K13 re-executed: 30000 / 4000 = 7.5 (claimed 7.5) → match
- Calculation K14 re-executed: 30000 / 60 * 0.125 = 62.5 (claimed 62.5) → match
- Calculation K15 re-executed: (4000 / 60 * 0.125) / 4 * 0.1785 * 730 = 271.46875 (claimed 271.5) → match
- Calculation K16 re-executed: 250 / 125 = 2 (claimed 2) → match
- Calculation K17 re-executed: 48 - 48 * 0.41 = 28.32 (claimed 28.32) → match
- Calculation K18 re-executed: 4000 / 60 * 0.18 * 64 = 768 (claimed 768) → match
- Calculation K19 re-executed: 30000 / 60 * 0.18 * 64 = 5760 (claimed 5760) → match
- Calculation K20 re-executed: 30000 / 60 * 0.18 = 90 (claimed 90) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html — getaddrinfo ENOTFOUND cheatsheetseries.owasp.org. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domai
- Fetch failed: https://pages.nist.gov/800-63-4/sp800-63b.html — getaddrinfo ENOTFOUND pages.nist.gov. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does 
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G5 unresolved: No data on how many verifies per minute reached the hashing tier during the 2025 burst after edge rate limiting, and no rate-limit configuration was supplied. The metrics say only that the burst was 'mitigated'. Unmitigated worst case at bcrypt-12 is about 125 cores (E4, inferred).
- Knowledge gap G1 unresolved: Partly unresolved. The metrics do not separate hashing CPU from other auth-service work, and do not show whether October's peak represents the year.
- Knowledge gap G3 unresolved: OWASP was read via the GitHub raw source because cheatsheetseries.owasp.org and pages.nist.gov could not be resolved (both hosts need to be allowed in network settings). NIST and PCI text are from search snippets only. No SOC 2 guidance was retrieved.
- Knowledge gap G4 unresolved: The real dollar cost of the cluster is unknown. Only public AWS list prices were found, as an order-of-magnitude proxy. No external check of the 250 ms bcrypt-12 CPU timing was done.
- Knowledge gap G2 unresolved: No measured hashcat cost-12 bcrypt figure was retrieved; the cost-12 rate is extrapolated from the cost-5 benchmark. No current-generation (e.g. RTX 5090) benchmark was verified.
5. **Independent validation status:** Graded by separate grader process (eval-grader (native agent, claude-opus-5-5), prompts v5); total 100/100; critical failures: none. Grader is the same model family as the agent.
6. **Remaining uncertainty:** 9 item(s), listed above.
7. **Revisions:** 0
- (none)
8. **Final quality gates:**
- PASS coverage: [minor/reviewer] D2 [C2 / C5 assessments; tradeoffs[0]; practicalImplications] The packet asks for compute savings to be compared with breach and compliance exposure (assumptionsToVerify, 'bcrypt is burning too much CPU' and 'Approving the switch would meaningfully reduce compute spend'). The draft gives savings in dollars but treats breach exposure only qualitatively. It gives no order of magnitude, such as incident-response, notification or regulatory costs against about $543/month, for a finance audience. The conclusion is not in doubt, but finance's actual question is only half answered in its own terms. | [minor/reviewer] D6 [C4 assessment; counterarguments[1]] The memo's 'more modern' framing (in the request) is never addressed. Only the digest-length point is rebutted. Briefly noting that SHA-256 (2001) is not a password-hashing design at all, and that OWASP prefers the newer Argon2id, would complete the C4 rebuttal for stakeholders.
- PASS evidence_sufficiency: [minor/reviewer] D4 [C6 strengths[0]; counterarguments[3].response] Edge rate limiting 'has already handled a 7.5x burst in practice' overstates E2, which says only that the burst was 'mitigated by rate limiting at the edge'. The source gives no outcome data, no cluster size at the time, and no count of attempts that reached hashing. The draft admits this elsewhere (CL13), but the C6 strength and the counterargument response ('the 2025 burst was handled by edge rate limiting') present it as an established fact. | [minor/reviewer] D5 [C1 assessment, last sentence] C1 says low-entropy customer passwords 'would fall to dictionary and rule-based attacks soon after a breach'. The packet has no data on the password policy or the entropy of the user population. The direction is sound, but the timing claim has no support.
- PASS reasoning_validity: [minor/reviewer] D1 [verdict; C2 assessment; correctedUserAssumptions[3]; alternatives 'Proposed single-iteration salted SHA-256'; tradeoffs[0]] The draft keeps saying the SHA-256 switch could save 'at most about $543/month' (K11), but it never says plainly that the saving only exists if the 48 vCPU cluster is actually shrunk. The cluster is paid for as provisioned capacity (about $1,564/month, K10). Switching the hash without resizing saves roughly $0. The draft says 'less if the cluster is not resized', which understates this. Resizing also cuts the burst headroom the draft relies on in C6. This weakens the finance case further and should be stated outright.
- PASS alternatives_counterarguments
- PASS decision_usefulness: [minor/reviewer] D7 [CL7 material flag] CL7, the dollar valuation of the hashing load, is marked material:false. It is the figure that answers finance's question ('cut compute spend'). Labelling it immaterial misstates where the decision's sensitivity lies, even though it does not change the reject verdict.
- PASS traceability: [minor/reviewer] D3 [C5 assessment; CL11; alternatives 'Argon2id'; practicalImplications[2]] The draft calls Argon2id (64 MiB, t=3, 180 ms) an 'upward' migration from bcrypt-12 and says memory hardness 'narrows the GPU advantage'. No cited evidence supports either point. E5 as quoted says Argon2id is OWASP's first choice and gives its minimum parameters. E7/E8 contain no Argon2id cracking rate. The draft also sets Argon2id's lower CPU cost (180 vs 250 ms) as a pure gain, without showing that its offline-cracking resistance is at least equal to bcrypt-12. That is plausible, but it is asserted, not evidenced. The claim should be hedged or sourced, since Argon2id is one of the two recommended fallbacks.
