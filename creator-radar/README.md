# Creator Radar

A private, self-hostable dashboard that finds **publicly announced** new creator-account launches in public X posts, keeps a deduplicated history with source evidence, and lets operators review each one.

It searches X through the official API, extracts the creator-profile link the poster published, scores how likely the post announces a *new* account, and stores the result with a link back to the source post. Scans run on a schedule or on demand. Nothing is scraped, nothing is fetched from the creator platform, and the app never contacts, follows or engages with anyone.

> Classifications are automated inferences from public text. The app never claims to know when an account was actually created; it records only what a post claims, and a reviewer decides.

---

## Contents

- [How it works](#how-it-works)
- [Quick start (local)](#quick-start-local)
- [Configuration](#configuration)
- [Connecting the X API](#connecting-the-x-api)
- [Scheduling](#scheduling)
- [Deployment](#deployment)
- [Testing](#testing)
- [Security and privacy model](#security-and-privacy-model)
- [Assumptions](#assumptions)
- [Limitations and remaining production risks](#limitations-and-remaining-production-risks)

---

## How it works

```
 Vercel Cron / scheduler ──► GET /api/cron/scan  (Bearer CRON_SECRET)
 "Scan now" button ───────► POST /api/scan       (operator session, same-origin)
                                   │
                                   ▼
                        runScan()  src/lib/discovery/pipeline.ts
   1. interval/enable check (scheduled runs only)
   2. acquire lease lock ─────────────── scan_lock (15-min lease; self-heals)
   3. per query group: read checkpoint ─ scan_checkpoints.since_id
   4. provider.search() ─────────────── X API v2 recent search  |  Mock provider
   5. per post: validate ids → drop retweets → safety screen (possible minors → dropped,
      nothing stored) → extract profile link (post, else author's X profile) → removal-request
      check → rule classifier → optional LLM second opinion (uncertain posts only)
   6. persist: creation-eligible posts first, then the rest; dedupe by post id, then by
      profile slug, then by X handle; ON CONFLICT DO NOTHING
   7. advance checkpoint only if every post in the window was handled
   8. source-deletion sweep (drop evidence for posts no longer public) + retention purge
   9. write scan_runs metrics/errors, provider health; optional webhook; release lock
```

**Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Tailwind CSS v4 with shadcn/ui-style components, Supabase (Postgres + Auth + RLS), `postgres` driver for the pipeline, optional Anthropic API for the LLM pass, Vitest and Playwright.

**Two database paths, on purpose.**
- The **dashboard** talks to Supabase with the signed-in user's JWT. Every table has row-level security; only users listed in `operators` see or change anything.
- The **pipeline** uses a direct Postgres connection (`DATABASE_URL`). It runs only on the server, from the cron route or the operator-only scan route. This keeps writes transactional and lets the same repository code be tested against a real Postgres.

### Data model (`supabase/migrations/20261021000000_init.sql`)

| Table | Purpose |
|---|---|
| `creators` | One row per creator profile: public X handle and profile URL, advertised profile URL and slug, first/last seen, `launch_status`, `launch_confidence`, `claimed_launch_date` (only if a post states it), `review_status`, `is_simulated`. Unique on `(is_simulated, lower(handle))` and `(is_simulated, slug)`. |
| `discovery_events` | Evidence: one row per source post. Post id/URL/time, matched search term, classification, score, explanation, classifier (`rules` or `rules+llm`), matched signals, where the link was found, short plain-text excerpt. Unique on `(is_simulated, source_platform, source_post_id)`. |
| `scan_runs` | Trigger, provider, status (`running/succeeded/partial/failed`), records examined, new profiles, new events, duplicates skipped, excluded, error list and summary. |
| `settings` | Single row: auto-scan switch, interval, search phrases, minimum score, notification preferences, provider configuration. No secrets. |
| `scan_checkpoints`, `scan_lock`, `provider_health` | Pipeline state. |
| `review_notes` | Reviewer notes and status changes (audit trail). |
| `suppressions` | SHA-256 hashes of removed handles/slugs so removed creators are not re-indexed. |
| `operators` | Which Supabase Auth users may use the dashboard. |

`creator_feed` is a `security_invoker` view (creator + latest evidence) used by the feed. `delete_creator()` and `purge_simulated_data()` are operator-checked RPCs.

### Classification

`src/lib/discovery/classify.ts` is a weighted, explainable rule set over normalized text ("OnlyFans", "only fans", "0nlyfans" and a capitalized "OF" become one token; the English word "of" never matches):

| Label | When |
|---|---|
| **Likely new launch** | First-person launch statement ("I just launched my…", "my … is live"), a creator-profile link, no conflicting signals, score ≥ 0.75 |
| **Possible new launch** | Launch language with weaker or indirect evidence, score ≥ 0.45 |
| **Existing creator promotion** | No launch language; sales, "new video", subscribe prompts |
| **Needs review** | Conflicts: third-party shoutouts, tenure ("2 years on…", "top 1%") alongside launch language, backup/replacement accounts. Score capped at 0.6 |

Every result carries a score, a short explanation, the matched signals, the evidence URL, the discovery time, a claimed launch date only when the post states one, and a verification status. The score is labeled in the UI as a heuristic, never as a probability or a fact.

The optional **LLM pass** (`src/lib/discovery/llm.ts`) runs only for *possible* and *needs review* posts. The post is passed as delimited untrusted data, output is schema-validated, and code clamps the result: the model cannot produce "likely" without a profile link and first-person launch wording, cannot clear a third-party flag, and its score is blended with the rules and capped. Any error, refusal or invalid output falls back to the rules.

---

## Quick start (local)

Requirements: Node.js ≥ 20.9 and a Supabase project (the free tier is fine).

```bash
cd creator-radar
npm install
cp .env.example .env.local      # fill in the Supabase values and DATABASE_URL
```

1. **Apply the schema.** Use one of:
   - Supabase dashboard → SQL Editor → paste and run `supabase/migrations/20261021000000_init.sql`, or
   - `supabase link && supabase db push` (Supabase CLI), or
   - `npm run db:migrate` (uses `DATABASE_URL`; tracks what it applied).
2. **Lock down sign-ups.** Supabase → Authentication → Sign In / Providers → turn off *Allow new users to sign up*. Operators are invited, not self-registered.
3. **Create your user.** Supabase → Authentication → Users → *Add user* (email + password, auto-confirm).
4. **Make it an operator:** `npm run operator:add -- you@example.com`
5. **Run:** `npm run dev` → http://localhost:3000, sign in.
6. **Scan.** The default provider is **Mock**: open *Scan control* → *Scan now*. You will get a deterministic set of synthetic `sim_*` accounts, tagged *Simulated* everywhere, with a banner across the dashboard. Switch the header toggle between *Live data* and *Simulated* at any time; the two sets never mix.

When you are done with demo data: *Scan control* → *Data management* → *Delete all simulated data*.

---

## Configuration

**Environment variables** (server secrets never reach the browser; see `.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `…_PUBLISHABLE_KEY`) | yes | Dashboard auth and RLS-scoped reads |
| `DATABASE_URL` | yes | Pipeline connection. Use the transaction pooler (port 6543) on serverless. Bypasses RLS: server only. |
| `CRON_SECRET` | for scheduled scans | ≥ 16 characters. Required on `/api/cron/scan`; the endpoint fails closed without it. |
| `APP_URL` | recommended | Public base URL (notifications, scheduler, origin check) |
| `X_BEARER_TOKEN` | for live data | X API app-only bearer token |
| `X_API_BASE_URL` | no | Override `https://api.x.com` |
| `ANTHROPIC_API_KEY`, `LLM_MODEL` | no | Enables the LLM second opinion (default model `claude-opus-5-5`; set `LLM_MODEL` to trade cost for quality) |
| `NOTIFY_WEBHOOK_URL` | no | HTTPS Slack/Discord-style webhook; receives counts and a dashboard link only, never handles |

**Runtime settings** (in the database, edited in *Scan control*): automatic scans on/off, frequency (1h–daily, default 6h), search phrases (≤ 25), provider (Mock / X API), minimum score to index a new profile (default 40%; *needs review* items are always queued), pages per query and results per page, evidence retention in days (default 90), LLM toggle, and webhook preferences.

---

## Connecting the X API

1. Create a project and app at developer.x.com with access to **`GET /2/tweets/search/recent`** (this needs a paid access level; check current pricing and limits).
2. Describe the use case accurately in the developer portal, and confirm it complies with the X Developer Agreement and Policy (see [risks](#limitations-and-remaining-production-risks)).
3. Copy the app's **Bearer Token** into `X_BEARER_TOKEN` on the server and restart/redeploy.
4. *Scan control* → set *Data provider* to **X API — live** → *Save settings* → *Test connection* (one small search request; it counts toward your quota) → *Scan now*.

What the adapter (`src/lib/discovery/providers/x.ts`) does:
- Packs your phrases into exact-phrase OR queries under the 512-character limit, appends `-is:retweet`, and requests `author_id` expansions with `entities` so links are the **expanded** URLs, not `t.co` wrappers. The author's public website/bio links are used when the post itself has no link.
- Pages with `next_token` up to the configured cap and resumes from `since_id` checkpoints per query.
- Reads `x-rate-limit-remaining/reset`. On 429 it waits if the window resets within 30 s, otherwise stops the run, records the reset time, and keeps the checkpoint so nothing is skipped. 5xx and network errors retry with exponential backoff and jitter; 401/403 stop immediately.
- Once per day per post, it checks stored live posts with `GET /2/tweets?ids=` (batches of 100) and **deletes evidence for posts that are no longer public**, removing creators left with no evidence.

---

## Scheduling

The cron route is called **hourly**; the app decides whether a scan is due from `settings.scan_interval_minutes` and the enable switch, so you change the frequency in the UI, not in infrastructure. Overlapping runs are prevented by a lease lock in Postgres (works through connection poolers and expires on its own if a run crashes); a run left in `running` by a crashed process is marked failed by the next run.

- **Vercel:** `vercel.json` registers `0 * * * *` on `/api/cron/scan`. Set `CRON_SECRET` in the project and Vercel sends it automatically. Hobby plans restrict how often cron jobs may run; use a Pro plan or the external scheduler for anything more frequent than daily.
- **Self-hosted:** `APP_URL=… CRON_SECRET=… npm run scheduler` (calls the endpoint every 15 minutes), or a system cron entry:
  `*/15 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://radar.example.com/api/cron/scan`

Each scan run is logged as structured JSON (`scan started`, `query failed`, `scan finished` with metrics) and recorded in `scan_runs`, which drives the *Scan history* table and the health indicators.

---

## Deployment

**Vercel:** import the repository with **Root Directory = `creator-radar`**, add the environment variables (Production), deploy. Scan routes declare `maxDuration = 300`; keep pages-per-query modest on plans with shorter function limits.

**Self-hosted Node:**
```bash
npm ci && npm run build
PORT=3000 npm run start          # behind a TLS-terminating reverse proxy
npm run scheduler                # separate process, or use system cron
```
`NEXT_PUBLIC_*` values are inlined at build time; rebuild after changing them.

---

## Testing

```bash
npm test             # unit + pipeline tests (no services needed)
npm run typecheck && npm run lint
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm test   # adds the Postgres suite
npm run test:e2e     # Playwright; see below
```

| Area | Where |
|---|---|
| Launch classification (synthetic fixtures, injection text, dates) | `tests/unit/classify.test.ts`, `tests/fixtures/posts.ts` |
| URL extraction and safe-link rendering; minor-indicator screening | `tests/unit/url-extract.test.ts` |
| Dedupe, idempotency, checkpointing, partial failure, lock, scheduling interval, suppression after deletion, source-deletion sweep, LLM gating, mock vs live separation | `tests/unit/pipeline.test.ts` |
| X adapter: request shape, pagination, rate-limit wait/give-up, backoff, auth errors, batch lookup | `tests/unit/x-provider.test.ts` |
| LLM output containment, notification content | `tests/unit/llm.test.ts` |
| Real Postgres with the production migration: persistence, unique constraints, URL check constraints, monotonic checkpoints, lease lock and concurrent scans, RLS for anon / non-operator / operator, `delete_creator` + suppression, simulated-data purge, retention | `tests/db/postgres.test.ts` |
| Browser: redirects, unauthenticated API rejection, cron secret, security headers, full operator workflow (login → scan → idempotent rescan → filter → evidence → review → delete), non-operator lockout | `e2e/*.spec.ts` |

The Postgres suite creates a throwaway database and applies `tests/db/supabase-shim.sql` (roles and `auth.uid()`) before the migration. The e2e workflow tests need `E2E_EMAIL`/`E2E_PASSWORD` (operator) and optionally `E2E_OUTSIDER_EMAIL`/`E2E_OUTSIDER_PASSWORD` (signed-in non-operator); they use the mock provider, so they only create simulated records. Point them at a running app with `E2E_BASE_URL`, and set `PLAYWRIGHT_CHROMIUM_PATH` if you use a preinstalled Chromium.

---

## Security and privacy model

- **Access:** every page and API route verifies the session server-side with Supabase Auth and checks `operators`; the proxy only adds redirects. RLS denies anonymous users entirely and gives signed-in non-operators zero rows. Operators cannot insert creators, read suppressions/checkpoints, or call the lock functions.
- **Secrets:** only in server environment variables. The settings table holds no credentials. The cron secret is compared in constant time.
- **State-changing routes:** server actions (built-in CSRF protection) or same-origin-checked POST routes.
- **Untrusted content:** post text is rendered as plain text only, stripped of control characters, and cut to a 500-character excerpt. It is never executed or treated as instructions, and the LLM sees it only as delimited data. Outbound links are rendered only if they match the app's own canonical `https://x.com/…` and `https://onlyfans.com/<slug>` shapes, which the database also enforces with check constraints. Links open with `noopener noreferrer nofollow` and `no-referrer`. Simulated records are never linked out.
- **Data minimization:** stored per creator: public X handle and display name, public profile URLs, timestamps, and classification. **Not** stored or fetched: real names, contact details, locations, demographics, images, media, or anything from the creator platform. The app never requests the advertised profile URL.
- **Adults only:** posts are indexed only when they link a profile on a platform that requires creator ID/age verification. Any post whose text, author name or bio suggests a possible minor (stated ages under 18, school references, "teen" and similar terms) is dropped before anything is stored and counted only as "excluded".
- **Deletion:** per-creator deletion removes the profile, all evidence and notes, and by default records a one-way hash so the creator is not re-indexed. Evidence for posts that disappear from X is removed automatically. Retention purges old evidence. Simulated data can be wiped in one click.
- **No automation toward people:** no messaging, following, liking, or other engagement, and no access behind logins or anti-bot systems.
- **Headers:** `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: no-referrer`, HSTS, `X-Robots-Tag: noindex`.

---

## Assumptions

- "New launch" means a public post in which the author **claims** a new account. Account age is never inferred.
- One creator = one X handle and/or one advertised profile slug; these are the dedup keys. A post by one handle linking another creator's profile attaches to that profile (shoutouts land in *needs review*).
- A creator-profile link (in the post or on the author's public X profile) is required to index anything. It is both the evidence and the adult-verification basis.
- Promotional posts never create new creators, but they are attached as evidence to creators already indexed.
- "Today" on the dashboard is UTC.
- The repository root is a GitHub profile repo, so the app lives in `creator-radar/`.

---

## Limitations and remaining production risks

**Platform and legal**
- **X terms are the biggest risk.** The X Developer Policy restricts using X content to profile or target individuals, and has specific rules about sensitive categories, including sexual content. Get a clear yes for this use case, declared in the developer portal, before running against live data. Display, storage and deletion obligations also apply: deletions are handled (once per day per stored post), but review the full policy.
- **Personal data.** Handles and display names are personal data under laws such as GDPR and CCPA. You need a lawful basis, a retention policy (configurable, default 90 days), and a way to handle access/erasure requests (deletion + suppression exist; there is no self-service request form).
- **API cost and access.** Recent search requires paid access, covers only about the last 7 days, and is quota-limited. Very busy windows beyond the page cap are logged as truncated and not backfilled.

**Detection quality**
- The rules target English phrasing and common spellings. Coded language, images with text, other languages and link-in-bio aggregators (Linktree etc.) are missed; aggregators are deliberately not followed.
- The minor-indicator screen is conservative keyword matching. It will drop some legitimate adult posts and cannot catch everything. It is a backstop on top of the platform's own verification, not age verification.
- Scores are heuristics tuned on synthetic fixtures, not calibrated on labeled real data. Build a labeled sample from real (reviewed) discoveries before relying on thresholds.
- The LLM pass adds cost per uncertain post and is non-deterministic (bounded by the code-side clamps).

**Engineering**
- E2E tests were run against a local stack (Supabase Auth + PostgREST + Postgres), not a hosted Supabase project; the X integration was exercised against a local test double that mimics the documented API, not the live API. Run `Test connection` and a first scan on staging before production.
- A scan runs inside one HTTP request (`maxDuration` 300 s). Large phrase lists × pages, or a long LLM backlog, can hit the limit; the lease lock and checkpoints make the next run resume safely, but a queue/worker would be more robust at scale.
- Rate-limit waits are capped at 30 s per request; longer windows end the run early (by design, recorded as an error).
- `DATABASE_URL` grants full database access to the server runtime. Consider a dedicated Postgres role limited to the tables the pipeline writes.
- The dashboard counts use exact `count` queries and a 5,000-row chart window; at very large volumes, move these to materialized views.
- No multi-tenant model: all operators see all data.
- No in-app operator management: operators are added with `npm run operator:add`.
