# Evaluation: Is Formline the right choice for the internal-tools platform?

## Verdict

**No. As recommended, Formline is not the right choice, and the IT memo compares the wrong numbers.**

- **The recommended plan fails the requirements.** IT recommends the Formline Team plan ($4,800/month). That plan does not include SCIM provisioning or 1-year audit logs, and both are mandatory. Formline only offers those on its Enterprise plan, which costs **$9,500/month**.
- **The price comparison flips.** Compared plan-for-plan on what you actually need, Formline Enterprise costs **$2,900/month more than Brickwork ($9,500 vs $6,600). That is about 44% more expensive, not 27% cheaper.**
- **Formline may fail the private-database requirement on any plan.** Its documentation only describes connecting to databases that are reachable over the internet, using an IP allowlist. Your on-prem PostgreSQL has no public IP and must be reached privately. Unless Formline confirms in writing that it has a private connectivity option, it fails a third mandatory requirement.
- **Brickwork is the only option that meets all three mandatory requirements on paper.** It is also cheaper at today's headcount and at the projected 2-year headcount.

**Recommendation:** Do not sign the Formline Team plan. Treat Brickwork as the provisional front-runner. Sign only after the open questions below are answered in writing, particularly how Brickwork counts billable end users and whether its audit logs cover data changes. Re-open Formline only if it can show a supported private connectivity option and a price that beats Brickwork.

## Evaluation criteria

1. **Mandatory requirements (pass/fail).** SAML SSO, SCIM, 1-year audit logs of app *and* data changes, and private connectivity to on-prem PostgreSQL with no public IP. A plan that fails any of these is out.
2. **Capacity.** About 412 users today (12 builders plus ~400 end users), rising to about 562 within 2 years.
3. **Cost.** Compared only between plans that meet the requirements, now and through the growth period.
4. **Unknowns that could change the decision.** Billing definitions, how much the audit logs cover, how the connectivity is secured, contract terms.

Things not covered by the sources, such as how good each tool is to build with, SLAs, data residency, vendor stability and how easy it is to leave, are listed under remaining uncertainty. They are not scored.

## Requirements check

| Requirement | Formline Team ($4,800) | Formline Enterprise ($9,500) | Brickwork (~$6,600) |
|---|---|---|---|
| SAML SSO | Yes | Yes | Yes (all plans) |
| SCIM provisioning (mandatory) | **No** (Enterprise only) | Yes | Yes (all plans) |
| Audit logs, 1-year retention (mandatory) | **No** (Enterprise only) | Yes (1 year) | Yes (1 year) |
| Audit logs cover app **and data** changes | No | Not stated | Not stated |
| Private connection to Postgres with no public IP (mandatory) | **Not documented.** Docs say "any database reachable over the internet… add egress IPs to your allowlist" | **Not documented** (same docs) | Yes, on paper: "Brickwork Relay" agent inside your network makes outbound connections only, no inbound firewall rules |
| Capacity, today (412 users) | Yes (limit 500) | Yes (limit 1,000) | Yes (per-seat, no cap stated) |
| Capacity, 2 years (~562 users) | **No** (limit 500) | Yes | Yes |

**How the failures work:**

- **SCIM and audit logs.** These are written as Enterprise add-ons in Formline's own pricing ("Adds SCIM provisioning, audit logs (1-year retention)"). This is not a matter of interpretation. The Team plan does not meet the requirements.
- **Connectivity.** An IP allowlist only controls who may connect to an address that is already reachable from the internet. Your database has no public IP. To use Formline as documented, you would have to give the database, or a proxy in front of it, a public address and open inbound firewall rules. That would be a security design change, and it goes against the intent of requirement 3.
  - Brickwork's design (an agent inside your network that only makes outbound connections) is the standard way to meet this kind of requirement.
  - Formline may have an undocumented option (an agent, VPN, PrivateLink-style link or self-hosted deployment). The excerpt you have does not show one, so for now it counts as not met.
- **Capacity.** The Team plan caps at 500 users. 12 builders plus 550 end users is 562, which breaks the cap even if Formline doesn't count builders. If builders do count toward the cap, you would reach 500 at about 488 end users, roughly 14 months in at linear growth.

## Cost analysis

**Checking IT's arithmetic.** Brickwork costs 12 × $50 + 400 × $15 = $600 + $6,000 = $6,600. Then $4,800 / $6,600 = 0.727, so the Team plan is 27.3% cheaper. **The sums are correct; the plan they compare is not, because the Team plan doesn't meet the requirements.**

**Comparing plans that meet the requirements:**

| Scenario | Brickwork /month | Formline Enterprise /month | Difference |
|---|---|---|---|
| Today: 12 builders, 400 end users | $6,600 | $9,500 | Formline costs +$2,900 (+43.9%) |
| Year 2: 12 builders, 550 end users | $8,850 | $9,500 | Formline costs +$650 (+7.3%) |
| Annual cost at today's headcount | $79,200 | $114,000 | Formline costs +$34,800/yr |

**Two-year total cost**, assuming end users grow steadily from 400 to 550:

- Brickwork: year 1 averages about 437.5 end users, roughly $7,163/month or about $85,950. Year 2 averages about 512.5 end users, roughly $8,288/month or about $99,450. Total about **$185,400**.
- Formline Enterprise: **$228,000**.
- **Brickwork saves about $42,600 over 2 years.**

**When Formline Enterprise becomes cheaper.** The two prices are equal when $50 × builders + $15 × end users = $9,500.

- With 12 builders, that happens at about **593 end users**.
- With 20 builders, at about **567 end users**.
- So Brickwork stays cheaper through the planned growth. The gap narrows quickly, though: a few more builders or faster user growth puts Formline Enterprise level with or below Brickwork by about year 3. Brickwork's per-seat cost keeps rising after that, while Formline Enterprise stays flat up to 1,000 users.

**The Team plan does not work even as a cheap stopgap.** You would need it plus a separate fix for SCIM, audit logs and connectivity, and it hits the 500-user cap within about 1–2 years. Switching to Enterprise then means $9,500/month anyway, plus the cost of moving mid-contract.

## Strengths and weaknesses

**Brickwork**
- Strengths:
  - Every security feature you need is included on all plans.
  - It has a documented, outbound-only way to reach private databases.
  - It is cheapest at your current and projected headcount.
  - Cost grows in line with usage.
- Weaknesses and risks:
  - Per-seat pricing means the bill keeps rising with headcount and becomes the more expensive option past roughly 590 end users.
  - The billable end-user definition is unknown (named vs. active users, occasional users). This is the biggest single swing factor.
  - The Relay agent becomes infrastructure you have to run and secure: availability, patching, the credentials it holds, and the outbound path it opens.
  - It is not confirmed that the audit logs cover *data* changes.

**Formline**
- Strengths:
  - Flat, predictable pricing.
  - Enterprise is cheap per user at scale (up to 1,000 users).
- Weaknesses:
  - The recommended plan is not compliant.
  - The compliant plan costs 44% more today.
  - No documented private connectivity.
  - The jump from Team to Enterprise is a steep price cliff.

## Edge cases and failure modes

- **Billing definitions.** If Brickwork bills every SCIM-provisioned user, and you provision far more than 400 (for example, all staff), its cost could pass Formline's. If it bills only monthly active users, it could come in well below $6,600.
- **Discounts.** Both price lists are list prices. Annual prepayment or volume discounts could change the comparison, though probably not the requirements result.
- **Formline connectivity workaround.** Exposing PostgreSQL behind a public-IP proxy with an allowlist would need a formal exception from Security. It would also increase your attack surface and add ongoing network work.
- **Relay as a single point of failure.** If there is only one Relay instance, all 30 tools that use on-prem data go down when it does. Confirm it supports high availability.
- **Audit log coverage.** "Audit logs" in vendor materials often means platform and admin events only, not row-level data changes made through apps. Requirement 2 explicitly needs data changes. This may be unmet for both vendors.
- **Hidden costs.** Either vendor may charge extra for environments (staging/production), extra workspaces or the Relay agent. Neither excerpt says.

## Counterarguments

- **"Flat pricing protects against growth."** True, but only for Enterprise. Within the 2-year plan, Brickwork is still about $42,600 cheaper. The argument only works if growth goes well past about 590 end users or the builder count rises a lot.
- **"Formline probably has a private connection option on Enterprise."** It might. But nothing you have says so, and it might carry an extra charge. Get it in writing before giving Formline any credit for it.
- **"Formline might negotiate Enterprise down."** It would need to come down by more than about 30%, to below $6,600, to beat Brickwork today. Even then the connectivity gap remains.

## Questions to ask before signing

**Brickwork**
1. How is a billable "end user" defined: named, provisioned, or monthly active? Are there cheaper viewer-only or occasional-user seats?
2. Do the audit logs record data changes (create/update/delete made through apps) as well as app and configuration changes? Can they be exported or streamed to our security monitoring (SIEM)? Is the 1-year retention included, or extra?
3. Relay: can it run in a high-availability setup? Which outbound ports and protocols does it use, and how is it authenticated? Where are database credentials stored? How are updates handled? Is there any extra charge?
4. Is SCIM fully supported on every plan, including group-based permissions and deprovisioning?
5. Are there minimum terms or annual commitments? Is there a price cap on renewals? Can we drop seats as well as add them?
6. Where is data hosted (residency)? What SLA, security certifications (SOC 2 / ISO 27001) and support level come with the plan?

**Formline**
1. Is there any supported way to reach a database with no public IP (an agent, VPN, PrivateLink-style link, self-hosted option)? On which plan, and at what cost?
2. Do Enterprise audit logs cover data changes, as well as app changes?
3. Do builders count toward the user cap? What happens above the cap?
4. Would Formline move SCIM and audit logs onto the Team plan, or discount Enterprise? What is the best compliant price?

**Both**
- Can we run a proof of concept against the real on-prem PostgreSQL before we commit?
- What are the export and exit terms for the 30 apps if we leave?
- What does each charge for separate development and production environments?

## Practical implications

- Send the memo back to IT with the corrected comparison: the requirements-compliant cost is $6,600 for Brickwork vs $9,500 for Formline Enterprise.
- Have Security sign off on the Relay design.
- Run a short proof of concept with Brickwork Relay against the real database.
- Write the billing definitions and audit-log coverage into the contract.

## Sources and method

- The only evidence used is the run directory: `/home/user/flt-sudo/evaluator-v3/runs/r20261111T065717-f234258c/request.md` and the four files in `sources/` (`requirements.md`, `brickwork-pricing-and-docs.md`, `formline-pricing-and-docs.md`, `it-memo.md`).
- One web search for "Brickwork Relay" found no matching product, so the vendor claims could not be checked against any independent source. Unrelated results returned included [Baserow – Best Internal Tool Builders 2026](https://baserow.io/blog/best-internal-tool-builders) and [Relpin vs. Low-Code](https://relpin-website.pages.dev/compare/low-code).
- All figures are calculated from the list prices in the sources.

## Remaining uncertainty

- Every vendor claim comes from short excerpts and has not been verified.
- How Brickwork defines a billable end user could move its cost a lot in either direction.
- Neither vendor confirms that its audit logs cover data changes.
- Formline may have an undocumented private connectivity option.
- Builder experience, SLAs, data residency, certifications and vendor stability were not assessed.
- The growth figures assume steady growth and a fixed 12 builders.

## Self-assessed quality score: 85/100

Strong points: the requirements check, the cost arithmetic, the break-even and growth analysis, and a concrete list of questions. Points lost: the vendors could not be verified externally, and the non-price criteria aren't assessed because the sources don't cover them.
