### Jordan Calhoun

I make **AI features safe to run in production.** I design and ship LLM
integrations — classification, vision extraction, grounded narration,
AI-drafted messaging — and I build the controls that keep them contained:
model output treated as untrusted input, forced-tool structured output, an
explicit fail-open / fail-loud policy per feature, and containment proven in CI
so an AI route can never touch the database or escalate privilege.

Full-stack underneath it (Next.js · Supabase/Postgres RLS · Stripe · Twilio),
solo from schema to shipped UI. I started building to solve problems I kept
hitting as a founder, and I haven't stopped since.

**See it running**
- [Interactive résumé](https://flt-sudo.github.io) — the projects, AI-security first
- [Air Marshalls](https://airmarshallscorporate.com) — a multi-branch operations portal (8 governed AI routes) a real franchise runs in production

**Controls I've shipped, mapped to the [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)**

| Risk | What I built | Where it runs |
|---|---|---|
| Excessive Agency (LLM06) | A static CI test that fails the build if any AI route can reach the database, hold the service-role key, or escalate privilege. A read-only copilot whose only tool is enum-constrained navigation. | Air Marshalls |
| Improper Output Handling (LLM05) | Sanitizers that treat every model response as untrusted. Forced-tool JSON so output is schema-validated, never free text. | Air Marshalls, Flytline |
| Misinformation (LLM09) | A live end-to-end eval that proves the model *refuses to fabricate* when source data is missing. | Flytline |
| Unbounded Consumption (LLM10) | Model-cost routing governed by a written in-repo standard (`ai-ops.md`), so each feature runs on the model its job needs and no more. | Flytline |
| Failure policy | Every AI feature declares whether it fails open (degrade to the non-AI path) or fails loud (block and alert). No silent fallbacks. | Both |

**Selected work**
- **Air Marshalls** — 8 governed AI routes with a **CI-enforced containment guard**. Vision-PDF lab extraction; a read-only copilot whose only tool is enum-constrained navigation.
- **Flytline** — 6 production LLM features built to a written in-repo standard (`ai-ops.md`): forced-tool JSON, model-cost routing, and a fabrication-refusal eval.
- [`brightwater-portal`](https://github.com/flt-sudo/brightwater-portal) — public reference build: marketing site + role-based ops portal + lead→job pipeline (Next.js + Supabase RLS).

Most client work is private — the live sites above are the proof it ships.

**Working with me**
- **AI security review** — threat model, architecture review, containment gaps, written report. Fixed scope, two weeks.
- **Governed AI feature** — one LLM feature built to the standard above, with its containment test and eval included.
- **Fractional technical lead** — ongoing ownership of an AI-enabled product for teams without a full-time CTO.

📫 jordanmercalhoun@gmail.com
