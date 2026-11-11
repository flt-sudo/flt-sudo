# Evaluation: Can security approve Keystone ID (workforce SSO + SCIM, 2,300 users) for production?

## Verdict

**Do not approve for production on this evidence. Don't sign off by Friday unless the conditions below are met. At most, approve a limited, time-boxed pilot.**

"Nothing critical" is true, but it's the wrong test. The pentest is about 2.5 years old. It did not test the SCIM provisioning API. It reported two High findings that were still unfixed when the report was written. The vendor says it has no retest letter. Since the test, the vendor has replaced or added the main parts of the system we would depend on: session management, SCIM provisioning, device-code login and passkeys. As it stands, the report gives almost no assurance about the product we would actually deploy.

## Evaluation criteria

For an identity provider (IdP) that controls access for the whole company, a pentest is useful evidence only if it is:

1. **Recent.** It tested the current code, usually within the last 12 months and after any major architecture change.
2. **In scope.** It covered the parts we will use: SSO flows, admin console, SCIM, session handling and MFA.
3. **Closed out.** High and Critical findings are fixed and confirmed by an independent retest.
4. **Independent and shareable.** It was done by a third party and is available to customers (or summarized in a SOC 2 Type II / ISO 27001 report).
5. **Low on residual risk.** Any risks the vendor has "accepted" must be tolerable for an IdP.

The evidence fails all five.

## Detailed analysis

### 1. Recency: the report tests a product that no longer exists in that form
- Test window: 2024-02-12 to 2024-03-01. Report date: 2024-03-15. That is about 32 months before today (2026-11-11).
- Changes since the test, from the changelog:
  - **2024.2 (2024-05):** "Security fixes", with no detail. This may be where BW-04 and BW-07 were fixed, but nothing says so and no retest confirms it.
  - **2025.1 (2025-02):** "Session management service replaced." BW-04 (session token not invalidated on password reset) was a session-handling flaw. The service it was found in is gone, and the replacement has never been tested by a third party as far as we've been shown. Even if the old bug is fixed, we know nothing about the new service's token revocation, session lifetime or logout behaviour.
  - **2025.4 (2025-11):** "SCIM 2.0 provisioning API rewritten on new service (`provisioner-v2`); legacy SCIM endpoint retired."
  - **2026.3 (2026-08):** New OAuth 2.0 Device Authorization Grant (device-code login, RFC 8628) and passkey (WebAuthn) enrollment. Both are new ways to log in. Device-code login is a well-known phishing target: attackers send a victim a code, the victim enters it, and the attacker gets the session. Passkey enrollment and recovery flows are common places for account-takeover bugs.
- **Mechanism:** a pentest gives assurance about the code it tested. After rewrites of session management and provisioning, that assurance doesn't carry over.

### 2. Scope: the SCIM part of our use case was never tested
- In scope: web SAML/OIDC login flows and the admin console.
- Explicitly out of scope: the SCIM provisioning API, mobile apps and customer-hosted connectors.
- We are buying Keystone for SCIM too. SCIM is a high-privilege, machine-to-machine API that creates, changes and deactivates every account. Typical risks are tenant isolation failures, long-lived bearer tokens with too much access, attribute injection (for example, setting group memberships or admin roles), and deprovisioning failures that leave leavers' accounts active.
- That API has never had a third-party test, either in its old form (out of scope) or in its current form (`provisioner-v2`, written after the test).

### 3. Closure: the Highs are not shown as fixed
| ID | Severity | Issue | Status at report | Why it matters for us |
|---|---|---|---|---|
| BW-04 | High | Session token not invalidated on password reset | Remediation in progress | Resetting a password after a compromise wouldn't kick out the attacker. That undermines our incident response. |
| BW-07 | High | IDOR in admin console user export | Remediation in progress | An access-control bug in an export feature could expose user directory data (names, emails, possibly attributes) to the wrong admin or tenant. |
| BW-11 | Medium | No rate limit on MFA one-time-code checks | **Accepted risk** | A 6-digit code has 10^6 possibilities. With no rate limit, an attacker who has the password can guess the code within the code's lifetime. That largely defeats MFA. |

- The report says "a retest letter will be issued upon completion of remediation." Two and a half years later, the vendor says it has no retest letter to share. That means either the fixes were never confirmed independently, or a retest exists and is being withheld. Both are red flags.
- BW-11 marked as "accepted risk" is a design-maturity concern for an IdP. NIST SP 800-63B requires verifiers to limit failed authentication attempts (no more than 100 consecutive failures per account). Note that the report predates the passkey release; passkeys would help only if we enforce them instead of one-time codes.

### 4. Independence and transparency
- Quote from the vendor email: "Our 2025/2026 assessments are internal only." Internal assessments are not independent assurance, and we can't see them anyway. The only independent evidence we have is the 2024 report.
- What we have is an executive summary, not the full report. We can't judge methodology, coverage depth, or whether "no critical" reflects real testing or a short engagement. The test window was under three weeks.

### 5. Quantitative framing
- Users affected: 2,300. Each one's access to every federated app runs through this IdP and is provisioned by its SCIM service.
- Share of our planned use covered by current independent evidence: roughly zero. SCIM was never tested. The session service has been replaced. Device-code login and passkeys were added afterwards. Only the login-protocol handling and admin console were tested, and both may also have changed in ~2.5 years of releases.
- Open High findings with independent proof of fix: 0 of 2.

## Strengths
- A third-party firm did test the core login flows and admin console, and found no Criticals at that time.
- The vendor retired the legacy SCIM endpoint instead of running two in parallel, which reduces attack surface.
- Adding passkeys is a security improvement, if we can enforce it and limit fallback to one-time codes.
- The vendor replied openly and says it is willing to answer questions.

## Weaknesses
- The report is stale, its scope doesn't match our use, its High findings are unresolved, it has no retest, it's a summary only, and the vendor accepted a weakness that undermines MFA.
- Major rewrites of the components that matter most to us have no independent assurance.
- The changelog is an excerpt with vague entries ("Security fixes") and no CVE or advisory references.

## Comparisons and alternatives
- **Established workforce IdPs** (for example Okta, Microsoft Entra ID, Ping) usually provide a current SOC 2 Type II report, ISO 27001 certification, and a yearly third-party pentest attestation under NDA. That is the bar to hold Keystone to.
- **Options for the organization:**
  1. **Delay sign-off** until the conditions below are met. This is the lowest-risk option.
  2. **Conditional limited pilot.** No SCIM write access, or SCIM scoped to a test group, plus the compensating controls below. Full production rollout waits on the evidence.
  3. **Approve now with documented risk acceptance** signed by the CISO or the business owner, not security staff. Not recommended for an IdP.

## Conditions to attach (if moving forward)

**Before production approval (blocking):**
1. A **current independent pentest** (within the last 12 months, after 2026.3) covering: SAML/OIDC flows, the admin console, **SCIM `provisioner-v2`**, the **new session management service**, the **device authorization grant**, and **passkey enrollment and recovery**. Full report or detailed summary under NDA.
2. **Retest evidence** that BW-04 and BW-07 are fixed, or confirmation in the new pentest that they no longer reproduce.
3. **BW-11 fixed**: rate limiting and lockout on one-time-code checks, in line with NIST SP 800-63B, confirmed by testing.
4. A **SOC 2 Type II report** (or ISO 27001 certificate plus Statement of Applicability) covering the current period, including any bridge letter.
5. Answers to a written security questionnaire on: SCIM token scope, rotation and expiry; tenant isolation; session revocation APIs; admin audit logging and export to our SIEM; vulnerability disclosure and patching timelines.

**Contract terms:**
6. Breach notification within a defined window (for example 72 hours or less).
7. An annual third-party pentest, with results shared.
8. Right to audit or to receive assessment reports.
9. A requirement to notify us of major architecture changes.
10. Data export and exit support.

**Configuration and compensating controls (for pilot or rollout):**
11. Enforce phishing-resistant MFA (passkeys/WebAuthn). Disable or tightly limit one-time-code fallback until BW-11 is verified fixed.
12. **Disable the Device Authorization Grant** unless there is a specific business need. If it is needed, restrict it to named clients, devices or networks.
13. Give the SCIM token least privilege, store it in a secrets manager, rotate it on a schedule, restrict it by IP where supported, and watch for unusual provisioning activity.
14. Test session revocation ourselves: after a password reset or admin "sign out everywhere", confirm that existing sessions and tokens actually die.
15. Keep break-glass admin accounts outside Keystone for critical systems. Send Keystone audit logs to the SIEM with alerts on admin exports, role changes and bulk provisioning.
16. Limit admin-console access (fewest possible admins, phishing-resistant MFA, IP restrictions). This partly offsets the BW-07 risk.

## Edge cases and failure modes
- **Silent deprovisioning failure in `provisioner-v2`:** leavers keep access to downstream apps. This is often invisible until an audit or incident.
- **Session revocation gap (a regression of BW-04 in the new service):** incident responders reset a password believing the attacker is out, and the attacker keeps access.
- **Device-code phishing:** attackers send users codes. The login takes place on a genuine Keystone page, so users and some controls won't spot it.
- **One-time-code brute force:** a leaked password plus an unlimited guessing loop lets an attacker get past MFA.
- **Admin export IDOR:** bulk exposure of the directory, which then fuels targeted phishing.
- **Vendor compromise:** an IdP breach compromises every downstream app at once, so 2,300 users are exposed together.

## Counterarguments
- *"No criticals, and the Highs were probably fixed in 2024.2."* Possibly. But "probably" isn't evidence. The vendor itself says it has no retest letter, and later rewrites make the 2024 results largely irrelevant either way.
- *"Internal assessments are still assessments."* They may be good, but we can't see them and they aren't independent. At minimum, ask for a summary letter signed by their CISO.
- *"Procurement deadline."* A Friday deadline is a scheduling constraint, not a reason to accept risk. A conditional pilot keeps the project moving without making an unverified IdP the company-wide root of trust.
- *"Every vendor has old pentests."* For a workforce IdP that also handles provisioning, a current independent attestation is standard practice.

## Practical implications
- Tell procurement security cannot give an unconditional sign-off by Friday, and send the vendor the evidence list (conditions 1–5) today.
- If the business needs to start, approve only a scoped pilot with controls 11–16, and put the contract terms (6–10) into the agreement now.
- Re-review when the new pentest and SOC 2 report arrive. A reasonable expectation is 2–6 weeks if the vendor already has current reports, longer if it has to commission a new test.

## Sources
- Run sources (all read):
  - `/home/user/flt-sudo/evaluator-v3/runs/r20261111T022433-b4a5f130/request.md`
  - `/home/user/flt-sudo/evaluator-v3/runs/r20261111T022433-b4a5f130/sources/keystone-pentest-summary.html`
  - `/home/user/flt-sudo/evaluator-v3/runs/r20261111T022433-b4a5f130/sources/keystone-changelog.md`
  - `/home/user/flt-sudo/evaluator-v3/runs/r20261111T022433-b4a5f130/sources/vendor-email.txt`
- Background references (cited from general knowledge, not fetched during this run):
  - NIST SP 800-63B (limits on failed authentication attempts)
  - IETF RFC 8628 (OAuth 2.0 Device Authorization Grant), Security Considerations section
  - Microsoft Threat Intelligence reporting on device-code phishing campaigns (for example Storm-2372, February 2025)
  - IETF RFC 7644 (SCIM 2.0 protocol), security considerations

## Remaining uncertainty
- BW-04 and BW-07 may in fact have been fixed in 2024.2. We have no evidence either way.
- The internal 2025/2026 assessments may be thorough. We can't see them.
- We have only an excerpt of the changelog. Other relevant changes or advisories may be missing.
- We don't have the full pentest report, so the depth of testing is unknown.
- Our own requirements are assumptions: which apps will be federated, whether device-code login is needed, and our MFA policy.
- I did not run any web searches. The external standards above are cited from general knowledge.

## Self-assessed quality score: 86/100
The analysis covers every source, ties each changelog entry to the pentest gap it affects, and turns that into concrete, prioritized conditions. Points off because I didn't verify the external references live and had no vendor documentation beyond the three supplied files.
