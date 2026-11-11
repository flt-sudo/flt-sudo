PAY-4471 | Sev-2 | Refunds > EUR 10k intermittently fail with timeout from ledger service (0.3% of such refunds).
Workaround: finance processes manually via back-office tool; ~6 per day.
Fix: PR #8812 (timeout config + retry), reviewed, passing CI.
