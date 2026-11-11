# Static analysis of billing coupling (partial, 2026-10)
- Files referencing Billing:: namespace: 214
- Shared DB tables between billing and other domains: not yet analysed
- Background jobs touching invoices: at least 17 (scan incomplete)
