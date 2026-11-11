# Evaluation: Choosing a low-code internal-tools platform: Formline vs Brickwork (about 30 apps, 12 builders, about 400 end users growing to about 550)

**Decision objective:** Decide which platform, Formline or Brickwork, to standardise on and sign with for about 30 internal tools. The chosen platform must meet three mandatory security and connectivity requirements: SAML SSO plus SCIM, 1-year audit logs, and private connectivity to an on-prem PostgreSQL database with no public IP. Among the platforms that qualify, the decision should rest on the cost at the plan tier that actually meets those requirements, over a 2-year growth horizon. The output should also list the questions that must be answered before signing. IT's '$4,800 vs $6,600, 27% cheaper' premise is to be verified, not assumed.

## Verdict

Brickwork is the preferred candidate. Sign with it only after it confirms three things in writing: that Brickwork Relay supports the on-prem PostgreSQL (E15), that its audit logs cover both app changes and data changes (E12, E14), and that Security approves Relay. Do not sign Formline Team as IT recommends. In the documents supplied, Formline fails the mandatory private-connectivity requirement on every plan, because its data-sources docs only describe connecting to internet-reachable databases through egress-IP allowlisting (E3, E7). Team also lacks SCIM and audit logs (E1, E2). The memo's arithmetic is right ($6,600 per month; 27.3% cheaper), but the comparison is wrong because it sets a non-compliant tier against Brickwork (E6, E8). Brickwork's own compliance is not fully established by the documents. It documents SAML SSO, SCIM and 1-year audit-log retention (E4), and an outbound Relay agent for 'private databases' (E5). But the excerpt neither names PostgreSQL (E15) nor says whether the audit logs record data changes as well as app changes (E12). Formline Enterprise's excerpt is equally silent on audit scope (E13). Analogue vendors' audit logs are usually event-level rather than record-level change history (E16, E17, E18), so this may need a database-side compensating control that Security accepts. On compliant tiers at list price, Brickwork is cheaper now ($6,600 vs $9,500 per month, 30.5% less) and at the 2-year size of about 550 end users ($8,850 vs $9,500 per month, 6.8% less) (E2, E4, E8). The 2-year margin is thin. Brickwork stays cheaper only up to about 593 end users with 12 builders, and any Relay fee, minimum or other surcharge above about $650 per month would close the gap at 550 end users. Formline is excluded on the connectivity gate, not on price. It could come back into the decision only if it confirmed in writing a private connectivity option that Security accepts, and even then its compliant tier would be Enterprise at $9,500 per month. Questions to answer before signing: (1) Formline: is there any private connectivity option on any plan (agent, VPN, PrivateLink, gateway, support for a customer-run site-to-site VPN or tunnel, or self-hosted deployment)? (2) Brickwork Relay: does it support on-prem PostgreSQL, which versions and authentication methods, and does it carry the read and write queries the apps need? Confirm by a proof of concept. Also: ports and protocols, encryption, credential handling, least-privilege scoping, high availability, SOC 2 or ISO 27001 attestations, and whether Relay is on all plans and at what cost. (3) Brickwork: are end users billed as named or monthly-active? Do the 12 builders also need $15 end-user seats? Does 'All plans' mean there are several priced tiers beyond the single rate quoted? Are there minimums or volume discounts? (4) Formline: do builders count toward the user caps, and can SCIM and audit logs be bought as Team add-ons? (5) Both vendors: minimum term, annual vs monthly billing, renewal price caps, app and data export, and SLA. (6) Both vendors: written confirmation that the pricing and feature excerpts are current. (7) Both vendors: what exactly the audit logs record (app and config changes, data changes made through apps, query runs, before and after values). Security should also define whether 'data changes' requires record-level history and whether database-side auditing is an acceptable compensating control.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** Formline costs $4,800 a month flat for our needs.
  **Correction:** $4,800 is the Team plan price, and Team lacks SCIM and audit logs. The lowest Formline tier with those features is Enterprise at $9,500 per month. Even Enterprise has no documented private connectivity. [E1, E2, E3]
- **Assumption:** Brickwork costs $6,600 per month.
  **Correction:** Correct at list price for 12 builders and 400 end users today. It rises to $8,850 per month at about 550 end users. Relay fees, minimums, whether builders also need end-user seats, and named-vs-active counting are unconfirmed. [E4, E8]
- **Assumption:** Formline is 27% cheaper than Brickwork.
  **Correction:** The figure is correct arithmetic only against the non-compliant Team plan. On compliant tiers, Brickwork is 30.5% cheaper today and 6.8% cheaper at about 550 end users. [E6, E8, E2, E4]
- **Assumption:** Both platforms meet the mandatory requirements, so cost decides.
  **Correction:** In the documents supplied, Formline fails the private-connectivity requirement on every plan, and Team also fails on SCIM and audit logs. Brickwork is not fully shown to comply either: PostgreSQL support over Relay and the data-change scope of its audit logs are undocumented. Eligibility, not cost, decides, and Brickwork's eligibility needs written confirmation. [E1, E3, E7, E12, E15]
- **Assumption:** The provided pricing and documentation excerpts are current and complete.
  **Correction:** This could not be verified, because no public documentation for either vendor was found. Written vendor confirmation is needed before signing. [E10]

## Criteria

### C1 Private connectivity to no-public-IP on-prem PostgreSQL (weight 25)

On the documents supplied, Brickwork plausibly passes but has not been shown to pass. Formline fails. Brickwork documents an in-network Relay agent that connects outbound and reaches 'private databases' without inbound firewall rules (E5). But the Brickwork fixture never names PostgreSQL, any supported engine or version, or whether app read and write queries work through Relay (E15). Formline's data-sources docs describe only internet-reachable databases with egress-IP allowlisting, and no private option on any plan, Enterprise included (E3). Requirement 3 explicitly demands private connectivity to an on-prem PostgreSQL with no public IP (E7). So Formline can connect only by making the database internet-reachable, which the requirement forbids. Brickwork's pass depends on written confirmation or a proof of concept of PostgreSQL over Relay. [E3, E5, E7, E10, E11, E15]

*Mechanisms:* An egress-IP allowlist only works if the database has a routable, reachable address. Formline's servers make inbound connections to it, so a database with no public IP cannot be reached unless it is exposed through NAT or port forwarding, which breaks the requirement. An outbound agent turns the connection around. The agent inside the network opens the session to the vendor and queries are passed back over it, so the database never needs a public address or an inbound rule (E5). Other vendors use the same pattern, for example Zoho's Databridge (E11, context only). Whether the agent can actually speak PostgreSQL for the queries the apps need is a separate question that the excerpt does not answer (E15).

*Strengths:*
- Brickwork has a documented mechanism that fits a no-public-IP database (E5)
- The requirement is unambiguous and dated 2026-10 by Security and IT (E7)

*Weaknesses:*
- The Formline evidence is an excerpt. A private option might exist but be undocumented here, and no public Formline docs could be found to check (E3, E10)
- Brickwork's fixture does not name PostgreSQL, versions or read and write support over Relay, so the only remaining candidate's pass on this gate is unconfirmed (E15)
- Security has not yet approved Brickwork Relay, and its plan availability and cost are not documented (E5)

### C2 Identity and audit compliance on the purchased tier (SAML SSO, SCIM, 1-year audit logs) (weight 20)

Requirement 1 (SAML SSO plus SCIM): Brickwork meets it on all plans (E4). Formline meets it only on Enterprise, because Team has SAML but no SCIM (E1, E2). Requirement 2 has two parts, scope ('app and data changes') and retention ('retained 1 year') (E14). Both Brickwork (all plans) and Formline Enterprise document 1-year retention (E2, E4). Neither excerpt says what the logs record (E12, E13). So neither vendor is shown to meet the scope half of requirement 2, and audit scope does not separate them. Formline Team has no audit logs at all (E1), so the tier IT recommended fails requirement 1 (the SCIM half) and requirement 2 outright (E7). [E1, E2, E4, E7, E11, E12, E13, E14, E16, E17, E18]

*Mechanisms:* Vendors commonly reserve SCIM and long audit retention for enterprise tiers, as Retool does with SCIM (E11, context). Formline follows that pattern, so meeting compliance on Formline means a forced tier jump. Brickwork bundles these features into per-seat pricing. In analogue low-code platforms, built-in audit logs are event-level: who ran which query or changed which setting, and when. They are not a record-level history of data changes (E16, E17, E18). If Security reads 'data changes' as row-level change history, neither vendor's '1-year audit logs' can be assumed to satisfy it. Database-side auditing on the on-prem PostgreSQL may then be needed as a compensating control, if Security accepts it (E18, inference).

*Strengths:*
- Both vendors' excerpts say plainly which plans carry SCIM and 1-year audit retention (E1, E2, E4)

*Weaknesses:*
- Neither vendor's excerpt states what the audit logs cover, so the 'app and data changes' half of requirement 2 is unconfirmed for both (E12, E13, E14)
- The requirements document does not define 'data changes' (E14)
- The excerpts do not say whether SCIM or audit logs could be bought as Team add-ons (E1)
- The excerpts are undated and the vendors have not confirmed them in writing (E2, E4, E10)

### C3 Total cost at the compliant tier, now and at 2-year scale (weight 25)

At list prices on compliant tiers, Brickwork is cheaper both now and at 2-year scale. Today: Brickwork $6,600 per month (K1) vs Formline Enterprise $9,500, so Brickwork is 30.5% cheaper (K4). At about 550 end users: Brickwork $8,850 per month (K3) vs $9,500, so 6.8% cheaper (K5), a gap of $650 per month (K10). Annual cost: Formline Enterprise $114,000 (K8), Brickwork $79,200 today (K11) rising to $106,200 at 550 end users (K12). Over 24 months, assuming end users grow linearly from 400 to 550, Brickwork costs about $185,400 (K6) against Formline Enterprise's $228,000 (K7). The memo's 27% figure (K2) is correct arithmetic, but it prices a Formline tier that does not comply. [E2, E4, E6, E7, E8]

*Mechanisms:* Formline's price is a flat step function: $9,500 for up to 1,000 users. Brickwork's price rises linearly at $15 per end user, so its lead shrinks as headcount grows. With 12 builders the two prices meet at about 593 end users (K9). Above that, Formline's flat Enterprise price would be cheaper at list price, provided Formline were eligible.

*Strengths:*
- Every figure follows directly from list prices in the vendor excerpts and the sizing in the requirements (E2, E4, E7, E8)

*Weaknesses:*
- List prices only. Discounts, annual-billing rates, Relay fees and minimums are unknown (E4, E8)
- The 24-month total assumes linear growth, which the evidence does not state (E7)
- At 2-year scale the margin is small, so an undisclosed fee could reverse it (K10)

### C4 Pricing-model fit and scaling risk (seat caps, user definitions, tier thresholds) (weight 10)

Formline Team's 500-user cap would be exceeded within the 2-year horizon whether or not builders count. 550 end users alone exceeds 500, and the total would be 562 if builders count (K13) (E9). So Team cannot last the horizon even on user count. Brickwork has no cap, but its per-seat cost rises steadily. Its unknowns are whether end users are billed as named or monthly-active, which could cut its cost noticeably if billing is by active users, and whether builders also need $15 end-user seats, which would narrow its lead (E4). [E1, E2, E4, E7, E9]

*Mechanisms:* A capped flat plan creates cost cliffs: moving from Team to Enterprise nearly doubles the price, adding $4,700 per month (K14). Per-seat pricing has no cliffs but rises with every hire. How each vendor defines a user decides where the cliffs fall and how steep the per-seat line is: whether builders sit inside or outside the cap, named vs active users, and whether builders also need end-user seats.

*Strengths:*
- The cap arithmetic holds under both readings of whether builders count (E9)

*Weaknesses:*
- Neither vendor defines how users are counted (E4, E7, E9)
- It is not stated whether Brickwork builders also need $15 end-user seats, or whether 'All plans' means several priced tiers beyond the single rate quoted (E4)
- Builder headcount growth is not forecast. Each extra Brickwork builder adds $50 per month (E4, E7)

### C5 Security posture of the connectivity mechanism (weight 10)

Brickwork's outbound-only agent is the stronger posture in principle, because it needs no inbound firewall rules and no public IP (E5). Formline's documented method would require exposing the database to the internet behind an IP allowlist, which is the very exposure requirement 3 forbids (E3, E7). But Relay's security properties are not documented in the packet, so Security cannot approve it yet. [E3, E5, E7, E10, E11]

*Mechanisms:* An outbound agent removes the inbound attack surface. In exchange, a third-party process runs inside the trust boundary with database credentials, and the vendor's cloud becomes a path that can issue queries against internal data. The real risk therefore depends on how the agent stores credentials, what privileges it holds, how it encrypts traffic and how it is updated, and on the vendor's own security controls. None of that is documented here (E5).

*Strengths:*
- Documented outbound-only design with no inbound rules (E5)
- This is an established pattern in the market (E11, context only)

*Weaknesses:*
- No details on ports and protocols, encryption, credential handling, high availability or attestations (E5)
- No public Brickwork Relay documentation could be found to cross-check (E10)

### C6 Contract and vendor terms (commitment, price protection, exit and data portability) (weight 10)

Cannot be determined. No evidence covers either vendor's minimum term, billing cadence, renewal price caps, app and data export, or SLA (E10, unresolved gap G6). This criterion cannot currently tell the vendors apart, and it must be settled in negotiation before signing. [E10]

*Mechanisms:* Standardising about 30 apps on one platform creates high switching costs. Without renewal caps or export rights, the vendor can raise prices at renewal. A percentage uplift hits a flat fee and a per-seat fee alike. The difference is that Brickwork's base grows with headcount, so its uplift is applied to a rising base, while Formline Enterprise's base stays fixed up to its cap.

*Strengths:*
- (none)

*Weaknesses:*
- There is no evidence for either vendor (E10)

## Key claims

- **CL1** (material): In the documentation supplied, Formline supports only internet-reachable databases through egress-IP allowlisting and describes no private connectivity option on any plan. It therefore fails mandatory requirement 3 (private connectivity to a no-public-IP on-prem PostgreSQL). [E3, E7]
- **CL2** (material): Brickwork documents a Relay agent that runs inside the customer network and connects outbound, reaching private databases without inbound firewall rules. In the documents supplied, this plausibly satisfies requirement 3, but not definitively. The fixture does not name PostgreSQL, versions, or read and write support through Relay. A pass needs written confirmation or a proof of concept, plus Security approval. [E5, E7, E15]
- **CL3** (material): Formline Team ($4,800 per month), the plan IT recommends, includes SAML SSO but not SCIM or audit logs. The lowest Formline tier with SCIM and 1-year audit logs is Enterprise at $9,500 per month. [E1, E2, E7]
- **CL4** (material): Brickwork includes SAML SSO, SCIM and audit logs with 1-year retention on all plans, priced at $50 per builder and $15 per end user per month. As documented, this meets requirement 1 and the retention half of requirement 2. The excerpt does not show the scope half ('app and data changes'). [E4, E12, E14]
- **CL5** (material): The memo's arithmetic is correct: Brickwork is $6,600 per month for 12 builders and 400 end users, and Formline Team is 27.3% cheaper than that. But the comparison is invalid, because Formline Team does not comply. [E4, E6, E8, E1, K1, K2]
- **CL6** (material): On compliant tiers today, Brickwork ($6,600 per month) is 30.5% cheaper than Formline Enterprise ($9,500 per month). At about 550 end users, Brickwork ($8,850 per month) is 6.8% cheaper, a gap of $650 per month. [E2, E4, E7, E8, K1, K3, K4, K5, K10]
- **CL7**: At list prices with 12 builders, Brickwork stays cheaper than Formline Enterprise up to about 593 end users. Past that point, Formline's flat Enterprise price would be lower. [E2, E4, K9]
- **CL8**: Assuming end users grow linearly from 400 to 550, Brickwork's 24-month list cost is about $185,400, against $228,000 for Formline Enterprise. [E2, E4, E7, K6, K7]
- **CL9**: Even if Formline Team were compliant, growth to about 550 end users would exceed its 500-user cap whether or not builders count (562 users if they do). That would force Formline onto Enterprise within the 2-year horizon. [E1, E7, E9, K13]
- **CL10** (material): The available evidence cannot determine several points: whether Formline offers an undocumented private connectivity option; whether Brickwork Relay supports on-prem PostgreSQL (versions, read and write); whether Relay has extra fees or is limited to certain plans; and what Relay's security properties are. No public documentation for either vendor could be found to check the excerpts. [E10, E3, E5, E15]
- **CL11**: Contract terms (minimum term, billing cadence, renewal caps, export and portability, SLA) cannot be determined for either vendor from the evidence. [E10]
- **CL12**: How users are counted cannot be determined from the evidence: whether builders count toward Formline's caps, whether Brickwork bills named or active end users, whether Brickwork builders also need end-user seats, and whether Brickwork's 'All plans' covers several priced tiers. [E4, E7, E9]
- **CL13** (material): The evidence cannot determine whether either Brickwork's or Formline Enterprise's audit logs capture data changes as well as app changes, as requirement 2 specifies. Neither excerpt states what is logged, and the requirement does not define 'data changes'. Analogue vendors suggest platform audit logs are typically event-level, not record-level change history. [E12, E13, E14, E16, E17, E18]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Brickwork monthly list cost today: 12 builders at $50 plus 400 end users at $15 | `12*50 + 400*15` | 6600 | 6600 | yes |
| K2 | IT memo's percentage saving of Formline Team over Brickwork today, as % of Brickwork cost | `(6600 - 4800) / 6600 * 100` | 27.27 | 27.27272727272727 | yes |
| K3 | Brickwork monthly list cost at 2-year scale: 12 builders at $50 plus 550 end users at $15 | `12*50 + 550*15` | 8850 | 8850 | yes |
| K4 | Brickwork saving vs Formline Enterprise today, as % of Formline Enterprise cost | `(9500 - 6600) / 9500 * 100` | 30.53 | 30.526315789473685 | yes |
| K5 | Brickwork saving vs Formline Enterprise at about 550 end users, as % of Formline Enterprise cost | `(9500 - 8850) / 9500 * 100` | 6.842 | 6.842105263157896 | yes |
| K6 | Brickwork 24-month list cost assuming linear growth from 400 to 550 end users (average of start and end monthly cost times 24) | `(6600 + 8850) / 2 * 24` | 185400 | 185400 | yes |
| K7 | Formline Enterprise 24-month list cost | `9500 * 24` | 228000 | 228000 | yes |
| K8 | Formline Enterprise annual list cost | `9500 * 12` | 114000 | 114000 | yes |
| K9 | End-user count at which Brickwork (12 builders) equals Formline Enterprise $9,500 per month | `(9500 - 12*50) / 15` | 593.3 | 593.3333333333334 | yes |
| K10 | Monthly gap between Formline Enterprise and Brickwork at about 550 end users (maximum extra Brickwork fee before parity) | `9500 - (12*50 + 550*15)` | 650 | 650 | yes |
| K11 | Brickwork annual list cost today | `(12*50 + 400*15) * 12` | 79200 | 79200 | yes |
| K12 | Brickwork annual list cost at about 550 end users | `(12*50 + 550*15) * 12` | 106200 | 106200 | yes |
| K13 | Total users at 2-year scale if builders count toward Formline caps | `12 + 550` | 562 | 562 | yes |
| K14 | Monthly price step from Formline Team to Enterprise | `9500 - 4800` | 4700 | 4700 | yes |

## Alternatives

- **Formline Team at $4,800 per month (IT's recommendation):** This is not a valid option. It lacks SCIM and audit logs (E1), it has no documented private connectivity (E3), and it would exceed its 500-user cap at about 550 end users (E9). Its $1,800 per month saving over Brickwork today comes from leaving out required features.
- **Formline Enterprise at $9,500 per month:** Meets requirement 1 and the retention half of requirement 2 (E2), though its audit-log scope is unstated (E13). It still has no documented private connectivity (E3), so it fails the gate. Even if Formline confirmed a private option, it would cost $2,900 per month more than Brickwork today and $650 per month more at about 550 end users (K4, K5, K10). It only becomes cheaper above about 593 end users (K9).
- **Brickwork per-seat with Relay:** The only option in the documents supplied that may meet all three requirements. It documents requirement 1 and the retention half of requirement 2 (E4) and plausibly requirement 3 (E5). Audit-log scope (E12) and PostgreSQL support over Relay (E15) are unconfirmed. It costs $6,600 per month today and $8,850 at about 550 end users (K1, K3). It depends on Security approving Relay, on those two confirmations, and on there being no material Relay fee.
- **Formline with the database exposed to the internet behind an egress-IP allowlist, or reached through a customer-run VPN, tunnel or self-hosted deployment:** Exposing the database directly violates requirement 3, which requires no public IP (E7), so it is not permissible without a formal change to the requirements by Security. Formline's docs describe no VPN, gateway or customer-tunnel option (E3). The packet has no evidence on self-hosted or on-prem deployment for either vendor. These routes are therefore open questions for Formline and Security, not documented options.
- **Reopen the shortlist to other vendors with outbound agents and bundled SCIM:** Other vendors offer the outbound-agent pattern (E11, context only), but the packet holds no pricing or compliance evidence for them, so they cannot be compared here.

## Tradeoffs

- Brickwork's per-seat price has no cliffs but rises by $15 for every end user and $50 for every builder. Formline's flat Enterprise price is predictable up to 1,000 users but starts higher (E2, E4).
- Brickwork's outbound Relay avoids inbound exposure, but it puts vendor-controlled software, holding database credentials, inside the network (E5).
- Brickwork's cost lead shrinks from 30.5% today to 6.8% at about 550 end users, so the cost benefit of choosing it falls over time (K4, K5).

## Edge cases and failure modes

- A Brickwork Relay fee or plan restriction above about $650 per month would wipe out Brickwork's list-price lead at about 550 end users (K10), although Formline would still fail connectivity.
- Growth beyond about 593 end users, or extra builders, would make Brickwork dearer at list price than Formline Enterprise (K9).
- If Brickwork bills named users (with no active-user discount), SCIM-provisioned accounts for occasional users would all be charged. Deprovisioning discipline would then affect cost directly (E4).
- Security might reject Relay (for example over credential handling or a missing SOC 2 report). That would leave no compliant option in the shortlist (E5).
- Formline might confirm an undocumented private option in writing. Formline Enterprise would then become eligible, and the decision would turn on cost and on how Relay compares with Formline's option (E3).
- A Relay with no high-availability setup would make a single agent host a single point of failure for all 30 apps (E5 has no HA detail).
- The excerpts may be out of date. They could not be checked against public vendor pages (E10).

## Counterarguments

- **Formline is 27% cheaper, as IT calculated.** — The arithmetic is correct (K2), but it prices Formline Team, which lacks SCIM and audit logs and has no documented private connectivity (E1, E3). On compliant tiers, Brickwork is 30.5% cheaper today (K4).
- **Formline probably has a private connector that simply isn't in the excerpt.** — That is possible. The excerpt is partial and no public docs could be found (E3, E10). Formline might also accept a customer-run site-to-site VPN or tunnel, or offer self-hosted deployment, but the packet documents none of these (E3). A requirement cannot be passed on an assumption. Formline must confirm in writing and Security must accept the mechanism. Even then, Formline's compliant price is $9,500 per month (E2).
- **Formline's flat pricing protects against growth, while Brickwork's per-seat cost keeps rising.** — That is true in principle, but the crossover is about 593 end users (K9), above the 2-year forecast of about 550 (E7). It only matters if Formline also passes the connectivity gate.
- **Putting a vendor agent inside the network is itself a security risk.** — Agreed. That is why approval of Relay is a condition of signing. Still, the alternative documented for Formline is internet exposure of the database, which requirement 3 rules out (E3, E5, E7).

## Practical implications

- Do not sign Formline Team. It fails requirement 1 (SCIM), requirement 2 and requirement 3 in the documents supplied (E1, E3).
- Put Brickwork Relay through a security review: ports and protocols, encryption, credential storage, least privilege, high availability and attestations (E5). Run a proof of concept that confirms Relay can reach the on-prem PostgreSQL with the read and write queries the apps need (E15).
- Get written confirmation from Brickwork of exactly what its audit logs record, and ask Security to define whether 'data changes' requires record-level history. If it does, decide whether database-side auditing on the PostgreSQL is an acceptable compensating control (E12, E14, E18).
- Get a written Brickwork quote that confirms Relay inclusion and cost, how end users are counted, whether builders need end-user seats, minimums and discounts. Any Relay fee above about $650 per month would cancel the list-price lead at 2-year scale (K10).
- Send Formline a written question about private connectivity on any plan, including customer-run VPN or tunnel support and self-hosted deployment. Treat Formline as ineligible unless it answers yes and Security accepts the mechanism (E3).
- Negotiate renewal price caps and app and data export rights before standardising 30 apps. Brickwork's per-seat base grows with headcount, so an uncapped renewal uplift applies to a rising base (E4, E10).
- Budget about $79,200 a year for Brickwork now, rising to about $106,200 at 550 end users, at list price (K11, K12).

## Remaining uncertainty

- Whether Formline offers an undocumented private connectivity option, or would support a customer-run VPN or tunnel or self-hosted deployment (E3, E10).
- Whether Brickwork Relay supports on-prem PostgreSQL, which versions, and read and write queries from apps (E15).
- Whether either vendor's audit logs capture data changes as well as app changes, and how Security defines 'data changes' (E12, E13, E14).
- Relay's security properties, plan availability and cost (E5).
- For Brickwork: how end users are counted (named or active), whether builders need end-user seats, whether 'All plans' means several priced tiers, and any minimums or discounts. For Formline: whether builders count toward its caps, and whether SCIM and audit logs can be bought as Team add-ons (E1, E4, E9).
- Contract terms for both vendors (E10).
- Whether the excerpts are current. None could be checked publicly (E10).
- Builder headcount growth and the actual end-user path to 550 (E7).
- E10 UNKNOWN: No public web presence for 'Formline' (low-code internal tools) or 'Brickwork Relay' turned up. Searches returned only other vendors (Retool, Appsmith, ToolJet, Zoho Creator and others).
- Open question the reviewer judged decisive: Does Brickwork Relay support the on-prem PostgreSQL version and authentication method in use, with the read/write queries the apps need (confirmed by a proof of concept)?
- Open question the reviewer judged decisive: What exactly do Brickwork's audit logs record, how does Security define 'data changes', and would Security accept database-side auditing (e.g. pgAudit or triggers) as a compensating control?
- Open question the reviewer judged decisive: Will Security approve Relay once ports, encryption, credential handling, HA and attestations are disclosed?
- Open question the reviewer judged decisive: Does Formline offer, on any plan, a private connectivity option that Security accepts?

## Further research that could change the conclusion

- Formline confirming in writing a private connectivity option that Security accepts. That would make Formline Enterprise eligible and turn the decision on cost and contract terms.
- Security rejecting Brickwork Relay, or a proof of concept showing that Relay cannot serve the on-prem PostgreSQL. Either would leave no compliant option in the shortlist.
- Either vendor confirming that its audit logs do not capture data changes, with Security not accepting a database-side compensating control. That could disqualify the affected vendor on requirement 2.
- Brickwork disclosing Relay fees, minimums, builder end-user seats or enterprise-tier gating that add more than about $650 per month at 2-year scale.
- Growth forecasts beyond about 593 end users or substantially more builders, which would favour Formline Enterprise on cost if it were eligible.
- Negotiated discounts or annual-billing pricing from either vendor that shift the cost gap.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | Formline Team plan: $4,800/month flat, up to 500 users. Includes SAML SSO. No mention of SCIM or audit logs on Team. | formline-pricing-and-docs.md |
| E2 | VERIFIED | fixture_read | Formline Enterprise plan: $9,500/month flat, up to 1,000 users. Adds SCIM provisioning, audit logs (1-year retention), priority support. | formline-pricing-and-docs.md |
| E3 | VERIFIED | fixture_read | Formline Data sources docs: 'Connect to any database reachable over the internet. Add Formline's egress IPs to your allowlist.' No private connectivity option (agent, VPN, PrivateLink, on-prem gateway) is described for any plan, including Enterprise. | formline-pricing-and-docs.md |
| E4 | VERIFIED | fixture_read | Brickwork pricing: $50 per builder per month + $15 per end user per month. All plans include SAML SSO, SCIM, audit logs (1-year retention). | brickwork-pricing-and-docs.md |
| E5 | VERIFIED | fixture_read | Brickwork docs: the 'Brickwork Relay' agent runs inside your network and connects outbound to Brickwork, enabling access to private databases without inbound firewall rules. | brickwork-pricing-and-docs.md |
| E6 | VERIFIED | fixture_read | IT memo: 'Formline $4,800 flat vs Brickwork 12x$50 + 400x$15 = $6,600. Formline is 27% cheaper. Recommend Formline Team plan.' | it-memo.md |
| E7 | VERIFIED | fixture_read | Mandatory requirements (Security + IT, 2026-10): (1) SAML SSO and SCIM provisioning; (2) audit logs of app and data changes retained 1 year; (3) connect to on-prem PostgreSQL with no public IP via private connectivity. Sizing: 12 builders, about 400 end users, growing to about 550 end users in 2 years. | requirements.md |
| E8 | INFERRED | fixture_read | Arithmetic check. Brickwork today is 12 x $50 + 400 x $15 = $600 + $6,000 = $6,600/month, which matches the memo. (6,600 - 4,800) / 6,600 = 27.3%, so the '27% cheaper' figure is arithmetically correct, but only against Formline Team, which is not compliant. On compliant tiers today, Formline Enterprise is $9,500 vs Brickwork $6,600/month. At about 550 end users, Brickwork is 12 x $50 + 550 x $15 = $8,850/month vs Formline Enterprise $9,500/month. | brickwork-pricing-and-docs.md |
| E9 | INFERRED | fixture_read | Cap check. If builders count toward Formline user caps, today's total is 12 + 400 = 412 users, under Team's 500 cap. At about 550 end users the total is about 562, which exceeds Team's 500 cap and would force Enterprise (1,000 cap) on user count alone. | formline-pricing-and-docs.md |
| E10 | UNKNOWN | none | No public web presence for 'Formline' (low-code internal tools) or 'Brickwork Relay' turned up. Searches returned only other vendors (Retool, Appsmith, ToolJet, Zoho Creator and others). | web search: Formline / Brickwork Relay |
| E11 | INFERRED | search_result | For context only, from search snippets about other vendors: Zoho Creator's Databridge is an agent installed on the private network that makes an outbound-only connection to route queries to private databases. Retool bundles SCIM only with Enterprise subscriptions. | https://help.zoho.com/portal/en/community/topic/introducing-databridge-securely-connect-your-private-systems-with-creator-apps?page=1 |
| E12 | VERIFIED | fixture_read | Brickwork's audit-log scope is not stated. The full Brickwork fixture mentions audit logs only once, as 'All plans include SAML SSO, SCIM, audit logs (1-year retention).' It does not say what is logged: app or config changes, data changes made through apps (row-level inserts, updates or deletes), query executions, or before and after values. The only thing it states is the 1-year retention. | brickwork-pricing-and-docs.md |
| E13 | VERIFIED | fixture_read | Formline's audit-log scope is not stated. The full Formline fixture mentions audit logs only once, on the Enterprise plan: 'Adds SCIM provisioning, audit logs (1-year retention), priority support.' It does not say whether the logs cover app or config changes, data changes made through apps, or query executions. Team has no audit logs. | formline-pricing-and-docs.md |
| E14 | VERIFIED | fixture_read | Requirement 2 reads exactly: 'Audit logs of app and data changes, retained 1 year (mandatory)'. The requirements document does not define 'data changes', for example as row-level edits made through apps, with or without before and after values, or as query execution events. | requirements.md |
| E15 | VERIFIED | fixture_read | Brickwork Relay's PostgreSQL support is not stated. The full Brickwork fixture describes Relay only as 'enabling access to private databases without inbound firewall rules.' PostgreSQL is not named, and neither are supported database engines or versions, or whether read and write queries from apps work through Relay. The word 'PostgreSQL' does not appear anywhere in the Brickwork fixture. | brickwork-pricing-and-docs.md |
| E16 | INFERRED | search_result | Retool, an analogue vendor: according to a search snippet summarising Retool's docs, Retool automatically logs user actions 'such as query runs and password resets', recording the user, the action and the timestamp. Admins can configure the logs to exclude query parameters and request bodies. Retool Cloud keeps audit logs for one year. A Retool community thread on tracking database record changes points to audit logs or a chained logging query as a workaround. The snippet summary says the audit logs do not capture the data that queries read or changed, so record-level change history needs application-level logging. | https://docs.retool.com/org-users/guides/monitoring/audit-logs |
| E17 | INFERRED | search_result | ToolJet, an analogue vendor: according to a search snippet of ToolJet's docs (3.5.0-LTS), audit logs include a DATA_QUERY_RUN event that is 'logged whenever a data source is added, a query is created, or whenever a query is run either from the query editor or from the launched app'. Other events include APP_VIEW, APP_DELETE and GROUP_CREATE/UPDATE/DELETE. The snippets do not say whether query parameters or changed data values are stored. | https://docs.tooljet.com/docs/3.5.0-LTS/security/audit-logs/ |
| E18 | INFERRED | search_result | Inference: low-code internal-tool platforms' built-in audit logs typically capture platform-level events: app edits, permission and settings changes, logins, and query executions with user and timestamp. They typically do not keep a record-level history of data changes with before and after values. That usually needs database-side auditing (for example PostgreSQL triggers or pgAudit) or app-level logging. So '1-year audit logs' in either vendor's excerpt cannot be assumed to meet the 'data changes' part of requirement 2. | https://docs.retool.com/org-users/guides/monitoring/audit-logs |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 4 web search(es), 1 fetch attempt(s), 4 supplied document(s) read.
- search: ""Brickwork Relay" agent private database low-code" (17 results)
- search: "Formline low-code internal tools platform pricing Enterprise SCIM" (19 results)
- search: "Retool audit logs capture queries run data changes user actions" (16 results)
- search: "ToolJet audit logs what events are logged app data query" (20 results)
2. **Sources inspected:**
- requirements.md (fixture_read)
- formline-pricing-and-docs.md (fixture_read)
- brickwork-pricing-and-docs.md (fixture_read)
- it-memo.md (fixture_read)
   Cited from search snippets only (not opened):
- https://help.zoho.com/portal/en/community/topic/introducing-databridge-securely-connect-your-private-systems-with-creator-apps?page=1
- https://docs.retool.com/org-users/guides/monitoring/audit-logs
- https://docs.tooljet.com/docs/3.5.0-LTS/security/audit-logs/
3. **Checks executed:**
- Evidence registry validation: 18 accepted, 0 rejected (source never retrieved / schema), 0 classification downgrade(s)
- Deterministic quality gates over 2 draft(s)
- Calculation K1 re-executed: 12*50 + 400*15 = 6600 (claimed 6600) → match
- Calculation K2 re-executed: (6600 - 4800) / 6600 * 100 = 27.27272727272727 (claimed 27.27) → match
- Calculation K3 re-executed: 12*50 + 550*15 = 8850 (claimed 8850) → match
- Calculation K4 re-executed: (9500 - 6600) / 9500 * 100 = 30.526315789473685 (claimed 30.53) → match
- Calculation K5 re-executed: (9500 - 8850) / 9500 * 100 = 6.842105263157896 (claimed 6.842) → match
- Calculation K6 re-executed: (6600 + 8850) / 2 * 24 = 185400 (claimed 185400) → match
- Calculation K7 re-executed: 9500 * 24 = 228000 (claimed 228000) → match
- Calculation K8 re-executed: 9500 * 12 = 114000 (claimed 114000) → match
- Calculation K9 re-executed: (9500 - 12*50) / 15 = 593.3333333333334 (claimed 593.3) → match
- Calculation K10 re-executed: 9500 - (12*50 + 550*15) = 650 (claimed 650) → match
- Calculation K11 re-executed: (12*50 + 400*15) * 12 = 79200 (claimed 79200) → match
- Calculation K12 re-executed: (12*50 + 550*15) * 12 = 106200 (claimed 106200) → match
- Calculation K13 re-executed: 12 + 550 = 562 (claimed 562) → match
- Calculation K14 re-executed: 9500 - 4800 = 4700 (claimed 4700) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://docs.retool.com/org-users/guides/monitoring/audit-logs — getaddrinfo ENOTFOUND docs.retool.com. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G1 unresolved: Only the Formline excerpt is available, and it describes internet-reachable databases with egress-IP allowlisting only. No public Formline docs were found. Formline must state in writing whether any private connectivity option (agent, VPN, PrivateLink, gateway, or support for a customer-run tunnel) exists on any plan.
- Knowledge gap G2 unresolved: The fixtures do not say whether SCIM or audit logs can be bought as add-ons to Team. Neither vendor excerpt says what the audit logs cover: app or config changes, data changes made through apps, query runs, or before and after values (E12, E13). Requirement 2 explicitly requires 'app and data changes' (E14). Both vendors must confirm the scope in writing, and Security must define what 'data changes' means. Analogue-vendor evidence (E16 to E18) suggests platform audit logs are usually event-level only.
- Knowledge gap G4 unresolved: No source defines whether builders count toward Formline's caps, whether Brickwork bills named or active end users, whether Brickwork builders also need end-user seats, or any volume discounts or minimums.
- Knowledge gap G5 unresolved: No Brickwork Relay security details (ports, encryption, credentials, HA, SOC 2 or ISO) or pricing and plan inclusion are available. The Brickwork fixture does not name PostgreSQL or any database engine as supported through Relay (E15), so PostgreSQL support, versions and read and write capability need written confirmation or a proof of concept. No public docs were found.
- Knowledge gap G6 unresolved: Neither fixture covers contract terms (minimum term, billing cadence, renewal caps, export and portability, SLA), and no public sources were found.
5. **Independent validation status:** NOT INDEPENDENTLY VALIDATED. Only the in-pipeline adversarial review (same model family, fresh context) and deterministic checks were applied.
6. **Remaining uncertainty:** 13 item(s), listed above.
7. **Revisions:** 1
- cycle 1 (both): [coverage/major] D1 [criteriaAssessments C2; claims CL4; alternatives 'Brickwork per-seat with Relay'; verdict pre-signing question list] The draft says Brickwork fully meets mandatory requirement 2 (C2 assessment, CL4, alternatives 'the only option that meets all three requirements'). The sources do not support that. requirements.md asks for 'Audit logs of app and data changes, retained 1 year'. The Brickwork excerpt only says 'audit logs (1-year retention)' and does not say what is logged. The Formline Enterprise excerpt is the same. Nothing in the packet shows that either vendor logs data changes, which may mean row-level edits made through apps, as well as app and config changes. On a pass/fail gate this is a real gap. The draft does not mention it in C2's weaknesses, and the six pre-signing questions do not include it.; [coverage/major] D2 [criteriaAssessments C1 assessment ('Brickwork passes'); verdict question (2); CL2] Requirement 3 is about on-prem PostgreSQL specifically. The Brickwork source only says Relay enables 'access to private databases'. It does not name PostgreSQL, the versions supported, or whether the queries the apps need will work through Relay. C1 still says 'Brickwork passes on the documents supplied'. That is stronger than CL2's own 'plausibly satisfies' and stronger than the evidence (E5 limitations). The pre-signing questions about Relay cover ports, encryption, attestations and cost, but not confirmed PostgreSQL support over Relay. Whether the only eligible candidate actually passes the gate rests on this point.
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency
- PASS reasoning_validity: [minor/reviewer] D2 [criteriaAssessments C4 assessment; edgeCasesAndFailureModes; calculations (missing)] The newly added C4 text and verdict question (3) raise whether Brickwork builders also need $15 end-user seats, but the draft never puts a number on it. The cost is easy to work out: 12 x $15 = $180 a month. That cuts the 2-year gap from $650 (K10) to $470 a month, and moves the crossover with Formline Enterprise from about 593 (K9) to about 581 end users ((9500 - 12*65)/15 = 581.3). The draft names this as one cause of the thin-margin risk, so the figure should appear next to K9/K10 instead of being described only as something that 'would narrow its lead'.
- PASS alternatives_counterarguments
- PASS decision_usefulness: [minor/reviewer] D1 [verdict (opening conditions sentence); practicalImplications item 3; furtherResearchThatCouldChangeConclusion item 3] The verdict says Brickwork should be signed 'only after it confirms three things in writing'. Two of those three conditions don't hold up as written. (a) The third, 'that Security approves Relay', is an internal approval and not something Brickwork can confirm in writing. (b) The audit-log condition is a hard gate: Brickwork must confirm its logs 'cover both app changes and data changes'. Yet the same verdict, practicalImplications item 3 and furtherResearch item 3 allow a database-side compensating control if Security accepts it. E16-E18 suggest platform logs are usually event-level only, so the most likely outcome is that Brickwork cannot confirm record-level coverage. Read literally, the hard gate would then block signing even though the draft elsewhere describes an acceptable path. The signing conditions should say: data-change coverage confirmed by Brickwork, OR a compensating control that Security accepts.
- PASS traceability
