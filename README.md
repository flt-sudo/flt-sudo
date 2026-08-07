### Jordan Calhoun

I ship **production LLM/AI features** into real software — classification, vision
extraction, grounded narration, AI-drafted messaging — and I make them *safe to
run in production*: forced-tool structured output, sanitizers that treat model
output as untrusted, an explicit fail-open/fail-loud policy, and containment
enforced in CI so an AI route can never touch the database or escalate privilege.

Full-stack underneath it (Next.js · Supabase/Postgres RLS · Stripe · Twilio),
solo from schema to shipped UI. I started building to solve problems I kept
hitting as a founder, and I haven't stopped since.

**See it running**
- [Interactive résumé](https://flt-sudo.github.io) — the projects, AI-integration first
- [Air Marshalls](https://airmarshallscorporate.com) — a multi-branch operations portal (8 governed AI routes) a real franchise runs in production

**Selected AI work**
- **Air Marshalls** — 8 governed AI routes with a **CI-enforced containment guard**: a static test proves on every commit that no AI route touches the database, holds the service-role key, or can escalate privilege. Vision-PDF lab extraction; a read-only copilot whose only tool is enum-constrained navigation.
- **Flytline** — 6 production LLM features built to a written in-repo standard (`ai-ops.md`): forced-tool JSON, model-cost routing, and a live end-to-end eval that proves the model *refuses to fabricate* missing data.
- [`brightwater-portal`](https://github.com/flt-sudo/brightwater-portal) — public reference build: marketing site + role-based ops portal + lead→job pipeline (Next.js + Supabase RLS).

Most client work is private — the live sites above are the proof it ships.

📫 jordanmercalhoun@gmail.com
