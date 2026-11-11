# Evaluation: Can a Sev-2 hotfix bypass CAB during the holiday freeze with only the on-call lead's approval?

## Verdict

**No, this is not the right process.** The runbook you're relying on is out of date, and the current policy overrides it. Change Management Policy v4 took effect on 2026-09-01. It says it "supersedes v3 and all team runbooks that conflict with it". Under v4:

- A Sev-2 forward fix is **deferred until the freeze ends** (§6.3).
- The only exception is a **written freeze exception granted by both the CAB chair and the VP Engineering** (§6.3).
- The on-call lead **may approve rollbacks only, not forward fixes** (§6.4). Her sign-off alone cannot authorize tonight's deploy. Her approval wouldn't count under any reading of v4.

Deploying tonight on her approval would be an unauthorized production change during a freeze. That is a policy violation, and on a payments/ledger path it may also be an audit finding.

**What to do instead:** (1) Keep the manual finance workaround going. (2) If you want the fix out before January 5, ask the CAB chair and the VP Engineering for a written freeze exception and get both approvals. (3) If that's not granted, deploy PR #8812 through the normal process once the freeze ends. (4) Ask the runbook owner to update or retire the 2023 wiki page.

## Evaluation criteria

1. **Which document governs?** Precedence between the runbook and the policy.
2. **Is Sev-2 the right severity?** That decides which path applies (§6.2 vs §6.3).
3. **Who is allowed to approve?** Does the on-call lead have the authority?
4. **Is the proposed path proportionate?** Business risk of waiting vs. deploying.
5. **Edge cases** that could change the answer.

## Detailed analysis

### 1. Precedence: the runbook is superseded

| Document | Date | What it says about Sev-2 in the freeze |
|---|---|---|
| Wiki runbook "Holiday change freeze" | Last edited 2023-11-20 | Sev-1 and Sev-2 may bypass CAB with the on-call engineering lead's approval; log in #changes |
| Change Management Policy v4 | Effective 2026-09-01 | Sev-2 deferred unless the CAB chair AND VP Engineering grant a written exception; on-call leads approve rollbacks only |

The two documents conflict directly. v4 settles the conflict itself: it "supersedes v3 and all team runbooks that conflict with it." The runbook was last edited almost three years before v4 took effect, so it likely reflects v3 or earlier. You don't need to judge which document seems more reasonable, because the policy states its own precedence.

### 2. Severity: Sev-2 is correct, so §6.3 applies

Severity definitions (v4):
- Sev-1: full outage of a tier-1 service, data loss, or an active security incident.
- Sev-2: partial degradation of a tier-1 service with a workaround available.

PAY-4471: about 0.3% of refunds over EUR 10k time out at the ledger service. Finance handles them manually, about 6 per day. This is a partial degradation with a workaround, which is the textbook Sev-2. It is not an outage, and the ticket reports no data loss. So the Sev-1 path (Emergency CAB under §6.2) isn't available, and upgrading the severity just to use it would misuse the process. Your classification is right. It just leads to the stricter rule, not the looser one.

(If refunds/ledger is *not* a tier-1 service, this would be Sev-3 or lower. §6.3 covers "Sev-2 and lower", so the outcome is the same.)

### 3. Approval authority

- §6.4 limits on-call leads to approving **rollbacks only**. PR #8812 changes the timeout config and adds a retry. That is a forward fix, not a rollback.
- §6.3 needs **two specific people** (CAB chair and VP Engineering), and the exception must be **in writing**.
- Even under the stricter Sev-1 path, §6.2 requires at least two approvers including VP Engineering or a delegate. One approver is never enough for a production change during a freeze under v4.

### 4. Proportionality: waiting is a reasonable outcome

- **Cost of waiting:** about 6 manual refunds per day. Assuming the freeze runs from Dec 15 to Jan 5, that's 22 days and roughly 130 manual refunds. This is ongoing operational work and some customer-delay risk, not a crisis. The workaround exists, and finance is already running it.
- **Risk of deploying:** the change touches timeout and retry behaviour on a ledger/refund path. **Retries on money-movement calls are a known source of duplicate transactions** if the ledger call isn't idempotent. For example, the first request times out on the client side but actually commits on the ledger, then the retry posts a second refund. A double refund over EUR 10k is much worse than a manual one. Holiday freezes exist because staffing is thin and volumes are high, which makes this kind of regression harder to catch and fix.
- So the policy's default (defer) fits the actual risk here. If you ask for an exception, address idempotency directly, because that is what approvers should be checking.

## Strengths and weaknesses of the proposed plan

**Strengths**
- Correct severity classification.
- The fix is reviewed and passing CI (per the ticket).
- A workaround is in place, so there's no pressure to rush.
- You asked before acting.

**Weaknesses**
- It relies on a superseded document.
- It uses an approver with no authority over forward fixes.
- There's no written exception and no CAB chair or VP involvement.
- Retry-on-ledger risk isn't mentioned (idempotency, duplicate refunds).
- The ticket mentions no rollback plan or post-deploy monitoring.

## Alternatives

| Option | Policy-compliant? | Notes |
|---|---|---|
| A. Deploy tonight with only the on-call lead's sign-off | **No** (violates §6.3 and §6.4) | Not recommended |
| B. Ask the CAB chair + VP Eng for a written freeze exception, then deploy | Yes | Best option if you want the fix before Jan 5. Include impact, workaround cost, test evidence, idempotency analysis and a rollback plan |
| C. Defer until the freeze ends; keep the manual workaround | Yes | Policy default; lowest risk |
| D. Mitigate without a code deploy (e.g., ask finance to watch for or pre-empt failures; adjust alerts) | Depends | Only if it isn't a "production change" under §6.1. Check first |
| E. Reclassify as Sev-1 to use Emergency CAB | **No**, unless the facts change | Facts don't meet the Sev-1 criteria |

A note on runtime config: if the timeout could be changed through a config flag rather than a code deploy, that is still very likely a "production change" under §6.1. It would need the same exception.

## Edge cases and failure modes

- **Dates:** today is 2026-11-11, but you say the freeze is in effect (Dec 15 – Jan 5). If you're actually planning ahead, or the freeze hasn't started, the freeze rules don't apply yet. You could ship PR #8812 through the normal change process *before* Dec 15, which is the simplest fix. Check which it is.
- **Escalation to Sev-1:** if the failure rate rises sharply, failures spread to all refunds, or you find data loss or ledger inconsistency, reassess. The Emergency CAB path (§6.2) may then apply: at least two approvers including VP Eng or a delegate, plus a post-implementation review within 2 business days.
- **Delegates:** §6.2 allows a delegate for VP Engineering. §6.3 doesn't mention delegates. Don't assume a delegate can sign a §6.3 exception without confirming.
- **Manual-processing risk:** manual handling of high-value refunds can cause errors of its own (keying mistakes, duplicates). If finance reports problems, that strengthens an exception request. It doesn't change who must approve.
- **Rollback:** if a deploy is approved and then goes wrong, §6.4 lets the on-call lead approve the rollback. That's where her authority is relevant.

## Counterarguments considered

- *"The runbook is the operational doc teams actually use."* v4 explicitly overrides conflicting runbooks. Common practice doesn't create authority, and following an outdated wiki page won't hold up in an audit.
- *"The fix is small, reviewed and passing CI, so it's low risk."* Code review and CI aren't what this policy controls. The policy controls who approves. Also, retry logic on financial calls is a classic place where small changes fail badly.
- *"The on-call lead is senior and accountable."* §6.4 names her role and limits it to rollbacks.

## Practical next steps

1. Don't deploy tonight on the on-call lead's approval alone.
2. If the fix shouldn't wait: write a short exception request to the CAB chair and VP Engineering. Include impact (0.3% of refunds over EUR 10k, about 6/day, manual workaround), PR #8812 test evidence, confirmation that the ledger call is idempotent or the retry is deduplicated, a rollback plan, a deploy window and monitoring. Get **both** approvals in writing.
3. Otherwise, schedule PR #8812 for the first change window after the freeze.
4. Tell the runbook owner to fix or retire the 2023 "Holiday change freeze" page, which is wrong now. Point the on-call lead to v4 §6.4 so she doesn't approve something she's not allowed to.

## Sources

- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T052856-6444f1ba/sources/change-management-policy-v4.md` (§6.1–6.4, precedence clause)
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T052856-6444f1ba/sources/wiki-runbook-holiday-freeze.md` (last edited 2023-11-20)
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T052856-6444f1ba/sources/severity-definitions-v4.md`
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T052856-6444f1ba/sources/incident-ticket-PAY-4471.md`
- I did no web research. The question is about internal policy, and the attached documents settle it.

## Remaining uncertainty

- Whether the refunds/ledger service is tier-1. This doesn't change the outcome.
- Whether a delegate can sign for the VP under §6.3. The text is silent.
- Whether tonight is actually inside the freeze, given today's date is 2026-11-11.
- Whether the policy has amendments or newer versions after v4 that weren't attached.
- Whether the ledger call is idempotent. The ticket doesn't say.

## Self-assessed quality score: 90/100

The conclusion follows directly from explicit policy text, and the precedence clause leaves little room for doubt. Points off because: I couldn't verify internal facts (tier-1 status, idempotency, whether there are amendments); the date inconsistency is unresolved; the source documents are short excerpts; and the score is my own estimate, not an independent check.
