# Evaluation: Platform on-call redesign (weekly 24/7 plus secondary vs. follow-the-sun 12-hour shifts)

## 1. Verdict

**Recommendation: go with option (b), follow-the-sun (FTS), but don't start with it. First, cut alert noise, which needs no approval and can begin this week. Second, run FTS through the Berlin works council, adjusting the shift boundaries so per-person hours are fair and adding a light escalation backup rather than a full secondary. Do not adopt option (a) as the long-term design.**

The reasons, in brief:

1. **Noise is the biggest lever, and neither option touches it.** Three alerts (disk-usage-warning-80pct, queue-lag-warning, cert-check-flap) produced 335 of 540 pages (62%), and only 2 of those led to human action. Overall, only 173 of 540 pages (32%) were actionable.
2. **Option (a) doesn't fix the main stressor.** 7 of 9 engineers name night pages as the main stressor. A secondary does nothing about the primary being woken up, and it roughly doubles each person's on-call exposure (from 1 week in 9 to 2 weeks in 9).
3. **FTS fits this team's geography well.** 58% of pages fire between 20:00 and 08:00 Pacific, which is 05:00–17:00 in Berlin, mostly Berlin's working day. FTS turns most of today's night pages into daytime pages.
4. **The binding constraint is Berlin's size (4 people), not the design itself.** Under FTS each Berlin engineer is on call 1 week in 4. That is at the commonly cited ~25% ceiling with no slack. Berlin would also take the larger share of pages. Fairness needs active design: uneven shift lengths, compensation, and probably growing Berlin headcount.
5. **The works council sets the timeline.** Any Berlin schedule change needs consultation and approval, typically 4–8 weeks. That applies to both options, so (a) is not really a "quick" option either.

## 2. Evaluation criteria

| Criterion | Why it matters here | Weight |
|---|---|---|
| Night-page exposure per person | Named stressor for 7/9; health and retention | High |
| Total on-call burden (hours, frequency) | Burnout comes from exposure as well as pages | High |
| Fairness between sites | 5 vs. 4 split; pages skewed in time; different pay schemes | High |
| Legal and process compliance (DE) | Works council approval; 11-hour rest rule; Sunday work | High (could block) |
| Coverage resilience | Holidays, sickness, attrition in a 4-person site | Medium-high |
| Handoff quality and incident continuity | FTS adds a handoff each day | Medium |
| Cost and compensation design | US stipend is per week; DE allowance follows a collective policy | Medium |
| Speed of relief | People are burning out now | Medium |

## 3. What the data says

### 3.1 Page volume and noise (90 days)

- Total: 540 pages, about 6.0 per day or 42 per week. The CSV rows add up to the stated total.
- Actionable: 0 + 2 + 0 + 63 + 41 + 37 + 30 = **173 (32%)**. Non-actionable: **367 (68%)**.

| Alert | Pages | Actionable | Precision |
|---|---|---|---|
| disk-usage-warning-80pct | 148 | 0 | 0% |
| queue-lag-warning | 121 | 2 | 1.7% |
| cert-check-flap | 66 | 0 | 0% |
| api-5xx-rate-high | 71 | 63 | 89% |
| db-replica-lag | 48 | 41 | 85% |
| payment-webhook-failures | 39 | 37 | 95% |
| other (14 alerts) | 47 | 30 | 64% |

- Removing or downgrading the top three noisy alerts (warnings become tickets; fix the cert flap) would remove **335 pages (62%)** and lose about 2 actionable events in 90 days. Those two queue-lag cases can be covered by a stricter, symptom-based threshold. About 205 pages would remain, roughly 2.3 per day or 16 per week.
- Inference, not confirmed: alerts like disk-usage warnings and queue-lag warnings often cluster around overnight batch work. If so, hygiene would remove a disproportionate share of night pages. The CSV has no time-of-day breakdown per alert, so this needs checking.

### 3.2 Time-of-day geometry

- In November both sites are on standard time: PST is UTC−8 and CET is UTC+1, a 9-hour gap. In summer (PDT/CEST) it is also 9 hours.
- 20:00–08:00 Pacific, where 58% of pages fire (about 313 per 90 days, ~24 per week, ~3.5 per night), is **05:00–17:00 in Berlin**.
- Each site's local 08:00–20:00 day, in UTC: SF is 16:00–04:00 and Berlin is 07:00–19:00. The overlap is 16:00–19:00 UTC. **The gap is 04:00–07:00 UTC, which is 20:00–23:00 Pacific and 05:00–08:00 Berlin.** Any 12/12 split has to give these 3 "unsociable" hours to one side or divide them.
- Daylight saving transitions don't line up: the EU ends DST on the last Sunday of October, the US on the first Sunday of November, and the start dates differ by about 2–3 weeks in March. For roughly 3–4 weeks a year the gap is 8 hours. Shift boundaries fixed in local time will then leave a 1-hour gap or overlap at the handoffs. Example: between 25 Oct and 1 Nov 2026, SF ending at 22:00 PDT (05:00 UTC) and Berlin starting at 07:00 CET (06:00 UTC) leaves 05:00–06:00 UTC uncovered.

### 3.3 Current state (baseline)

- Exposure: 168 on-call hours per week across 9 people, about 18.7 hours per person per week on average, delivered as one full 24/7 week every 9 weeks.
- Each 24/7 week averages ~42 pages (~6 per day), of which ~24 fall in Pacific night.
  - An SF primary takes ~3.5 night pages per night.
  - A Berlin primary's night (roughly 23:00–07:00 Berlin, i.e. 14:00–22:00 PT) falls inside the 42% "Pacific daytime" bucket. So Berlin engineers are also woken up today, and each night call-out triggers the 11-hour rest rule and cuts into the next working day.
- Against Google SRE guidance of at most 2 incidents per 12-hour shift ([SRE book, Being On-Call](https://sre.google/sre-book/being-on-call/)), the current ~6 per day, or ~3 per 12 hours, is above the limit. Most of the excess is noise.

## 4. Option analysis

### 4.1 Option (a): keep weekly 24/7, add a secondary

**How it works.** The primary is still paged first, at any hour. The secondary handles escalations and missed acks and gives a second pair of hands on large incidents.

**Workload**
- Night pages for the primary: unchanged. The stated main stressor is not addressed.
- On-call exposure: 336 person-hours per week, ~37 hours per person per week on average. Each engineer is on call 2 weeks in 9 (22%) instead of 1 in 9. That is close to the 25% ceiling, and the hours are 24/7.
- Benefit: less "alone at 3 a.m." anxiety, faster help on real incidents, and resilience when the primary misses a page.

**Fairness**
- Symmetric across sites. Everyone does the same 24/7 weeks.
- But SF primaries still absorb the 58% Pacific-night load, and Berlin primaries still get Berlin-night pages and rest-rule disruption.

**Blockers**
- Adding a secondary for Berlin engineers is still a change to on-call schedules, so it **still needs works council approval** (4–8 weeks). It is only "fast" for SF.
- Cost: a second stipend (US $400 per week for primary; the secondary rate isn't specified). That is roughly twice the stipend outlay for SF weeks.
- It gives continuity without a daily handoff, and keeps one owner per week.

**Assessment:** a sensible addition to any design, but it fails as the main fix. It raises total burden while leaving night exposure as it is.

### 4.2 Option (b): follow-the-sun 12-hour shifts

**How it works.** Each site covers about its own daytime plus part of the 3-hour unsociable gap. Rotation stays weekly within each site.

**Candidate shift boundaries (standard time)**

| Variant | SF (PT) | Berlin (CET) | UTC (winter) | Unsociable hours borne | On-call hours/person/week (SF / Berlin) |
|---|---|---|---|---|---|
| B1: 08–20 PT / 05–17 CET | 08:00–20:00 | 05:00–17:00 | SF 16–04, DE 04–16 | Berlin starts at 05:00 | 16.8 / 21.0 |
| B2 (equal 12/12): 10–22 PT / 07–19 CET | 10:00–22:00 | 07:00–19:00 | SF 18–06, DE 06–18 | SF until 22:00, Berlin from 07:00 | 16.8 / 21.0 |
| **B3 (head-weighted 13/11): 09–22 PT / 07–18 CET** | 09:00–22:00 | 07:00–18:00 | SF 17–06, DE 06–17 | SF until 22:00, Berlin from 07:00 | **18.2 / 19.25** |

How the hours are computed:
- With an equal split, each site carries 84 hours per week. That is 84/5 = 16.8 per SF person and 84/4 = 21.0 per Berlin person. Berlin carries 25% more per head.
- B3 gives SF 13 hours and Berlin 11 hours, close to the head-count-proportional 13.3 / 10.7. Per-person exposure comes out nearly equal. **B3 is the recommended starting point**, with exact boundaries to be agreed with the works council and with SF.

**Workload**
- Night exposure largely disappears. Nobody covers 23:00–07:00 local, except the 1-hour DST edge cases and incidents that run past handoff.
- Rotation frequency rises, but each shift is half as long:
  - Berlin: 1 week in 4 (25%).
  - SF: 1 week in 5 (20%).
- Page share is skewed toward Berlin. Roughly 55–60% of pages fall in Berlin's window. The exact figure depends on hourly data, because B3's Berlin window (22:00–09:00 PT) is offset from the 20:00–08:00 PT bucket in the CSV.

| Scenario | Berlin pages per 90 days (per person) | SF pages per 90 days (per person) | Berlin pages per on-call week | SF pages per on-call week |
|---|---|---|---|---|
| FTS, no hygiene (58/42 split assumed) | 313 (78) | 227 (45) | ~24 (~3.4 per shift) | ~17 (~2.5 per shift) |
| FTS after noise removal (205 pages, same split) | ~119 (~30) | ~86 (~17) | ~9 (~1.3 per shift) | ~6.6 (~0.9 per shift) |

- Without hygiene, Berlin is above the 2-per-shift guidance and per-person load is ~1.7 times SF's. That is a serious fairness problem, and Berlin engineers could fairly see it as "you moved SF's nights onto us."
- With hygiene, both sites are well within guidance, and the remaining asymmetry is manageable through compensation or boundary tuning.
- This is why hygiene must come first.

**Fairness**
- *Load:* skewed to Berlin (see above). Mitigations:
  - B3 boundaries.
  - Monthly per-site page-load review, with boundaries adjusted if the gap exceeds an agreed threshold (e.g. 1.5×).
  - Compensation that reflects load.
- *Pay:*
  - US stipend: today it is $400 per 24/7 week. Each SF engineer does ~5.8 weeks a year, about $2,311 a year.
  - FTS at full $400 per 12-hour week: 10.4 weeks a year, about $4,160 per person and about $20,800 total for SF, up from about $11,556. That is +80% cost.
  - FTS pro-rated to $200: about $2,080 per person. That is a slight pay cut for less disruption, and engineers may see it as a cut.
  - Decide this explicitly. Suggestion: keep per-person annual stipend income roughly constant (e.g. ~$220–250 per 12-hour week). Germany follows the collective policy, which may already prorate by hours. Check that it does, so the two sites aren't treated inconsistently.
- *Unsociable-hour burden:* B2/B3 give SF 22:00 evenings and Berlin 07:00 mornings, which is a modest burden on both sides.
- *Weekends:* every on-call week includes Saturday and Sunday daytime for both sites. That is unchanged in count but now in daylight.

**Resilience**
- Berlin at 4 people is fragile:
  - With one person on leave, it becomes 1 week in 3 (33%).
  - With one departure, the rotation is close to unsustainable.
- Google SRE's rule of thumb is a minimum of 8 engineers single-site, or about 6 per site dual-site, to stay within a 25% on-call time budget ([SRE book](https://sre.google/sre-book/being-on-call/); dual-site figure as quoted in secondary summaries). This team is below that at both sites, Berlin especially.
- **Recommendation:** plan Berlin headcount to grow to 5–6, or define a documented fallback for Berlin gaps. Options for the fallback:
  - An SF volunteer covers Berlin's window on paid "night" terms, rarely and voluntarily.
  - A Berlin manager or tech lead acts as backup.
  - Critical-only paging during gap periods.

**Secondary in FTS**
- A same-site secondary every week would mean 2 of 4 Berlin people on call: 50%. Not viable.
- Instead: escalation-only backup.
  - Within business-hours overlap, escalate cross-site.
  - Outside it, escalate to the previous week's primary at the same site or to the on-call engineering manager.
  - Make clear this is a low-likelihood, compensated, best-effort role.
- Trigger it by missed acknowledgement (e.g. 15 minutes) and for severity-1 incidents only.

**Handoffs**
- Two handoffs per day, and they happen at edges where neither side is in core hours:
  - 22:00 PT = 07:00 Berlin.
  - 09:00 PT = 18:00 Berlin.
- They need to be asynchronous by default: a structured handoff note in the incident tool covering open incidents, silenced alerts and in-flight changes.
- Add a weekly synchronous review in the 16:00–17:00 UTC overlap (08:00–09:00 PT / 17:00–18:00 Berlin).
- Rule: an active severity-1 incident is handed off explicitly, by voice, not just by timer.

## 5. Blockers and complications

### 5.1 Berlin works council (Betriebsrat), the critical path

- Per the HR notes, *any* change to on-call schedules needs works council consultation and approval, typically 4–8 weeks.
- Under German law, co-determination on working time (BetrVG §87(1) No. 2: start and end of daily working time and its distribution across weekdays) is generally applied to on-call rosters. The case law is not entirely uniform on whether standby itself counts as "working time," but in practice employers treat rosters and response times as co-determined ([betriebsrat.de](https://www.betriebsrat.de/betriebsratslexikon/br/rufbereitschaft), [iww.de](https://www.iww.de/ea/quellenmaterial/id/235909), [Kliemt blog](https://www.kliemt.blog/2025/09/15/schon-arbeit-oder-noch-freizeit-was-arbeitgeber-bei-der-einfuehrung-von-rufbereitschaft-beachten-muessen/)).
- Expect the works council to look at:
  - shift times;
  - weekend and holiday handling;
  - required response time;
  - rest-period handling;
  - the allowance;
  - voluntariness;
  - fallback rules.
- **Possible additional trigger:** if paging or incident tooling data is used to evaluate individual engineers, BetrVG §87(1) No. 6 (technical monitoring of performance) may come into play. Keep page-load metrics at team or site level, and say so in the proposal.
- The works council is likely to see FTS favourably: it removes night call-outs for Berlin staff. However, the 1-in-4 frequency and the higher daytime load are things it will reasonably challenge. Bring the hygiene data and the B3 balancing to the table.

### 5.2 Rest periods and working-time limits (Germany)

- **11-hour rest rule:**
  - On-call standby without a call-out counts as rest. A call-out interrupts it, and a fresh 11-hour rest is owed afterwards (§5 ArbZG; deviations only via collective agreement under §7) ([komnet.nrw.de](https://www.komnet.nrw.de/_sitetools/dialog/44043), [arbeitsrechte.de](https://arbeitsrechte.de/rufbereitschaft)).
  - Under FTS (B3, 07:00–18:00 Berlin), a late call-out ending at 18:30 means work can resume at 05:30. That causes essentially no lost working time.
  - Under today's 24/7 design or option (a), a 02:00 call-out means no regular work before 13:00 or later. That is a real productivity cost and a compliance risk if engineers "just keep working."
  - **This is a strong argument for FTS beyond wellbeing.**
- **Daily maximum:** active call-out time counts as working time. A Berlin engineer working a normal 8-hour day and handling pages from 07:00 to 09:00 or after hours can approach the 10-hour daily cap (§3 ArbZG). Rule: page time before or after core hours is offset by starting later or leaving earlier, and is recorded.
- **Sundays and holidays:** Berlin weekend daytime shifts mean Sunday and public-holiday call-outs. German law restricts Sunday work, with exceptions, and generally requires a substitute rest day for Sunday work (ArbZG §§9–11).
  - Confirm with counsel that the exception applies to platform operations, and how substitute rest days are handled.
  - German public holidays (and Berlin-specific ones) and US holidays don't line up. The holiday calendar for each site's rotation needs to be published early.
- **Standby that is effectively working time:** EU case law (CJEU C-344/19 and C-580/19, March 2021) holds that standby can count as working time if its constraints, especially very short response times, significantly restrict free time. Set a reasonable response time, e.g. 15–30 minutes to acknowledge, with remote work allowed. That keeps Berlin on-call classed as standby (Rufbereitschaft) rather than working time.

### 5.3 US side

- No equivalent works council. Still, consult SF engineers, because FTS changes their pattern:
  - more frequent weeks;
  - 22:00 evenings;
  - a possible stipend change.
- Exempt/non-exempt status and state rules on on-call pay should be checked by HR if any engineers are non-exempt. That is probably not an issue for salaried platform engineers, but it is unverified here.

### 5.4 Tooling and operations

- **Pager schedules:** use two layers, each in its site's local time zone. Add explicit overrides or a UTC-based rule for the ~3–4 weeks a year when DST is misaligned, and alert on any coverage gap.
- **Routing:** severity-based routing, so that only SLO-impacting alerts page and warnings create tickets for business hours. This is the technical form of "hygiene first."
- **Runbooks:** the three high-precision alerts (5xx, replica lag, payment webhooks) need runbooks that both sites can execute. Today knowledge may sit with whichever site built the system.
- **Ownership:** payment-webhook failures (37 of 39 actionable) may need domain expertise. Check that each site has it, or define a domain escalation.

## 6. Recommended design

1. **Alert hygiene (immediate, no works council needed for alert configuration):**
   - Downgrade disk-usage-warning-80pct to a ticket. Page only on a rate-of-fill or time-to-full condition, e.g. full within 4 hours.
   - Fix or debounce cert-check-flap. Page only on expiry within N days, sent as a business-hours ticket.
   - Re-threshold queue-lag-warning so it pages only on sustained, user-impacting lag. The 2 actionable cases are the test set.
   - Review the 17 alerts in "other" individually: 17 noise pages, unknown precision per alert.
   - Target: at least 60% reduction in pages and at least 80% actionable.
2. **Follow-the-sun with head-weighted boundaries (B3):** SF 09:00–22:00 PT, Berlin 07:00–18:00 CET, weekly rotation within each site. Revisit the boundaries after 2 months of per-hour page data.
3. **Escalation-only backup** instead of a full secondary. Severity-1 incidents and missed acks only; compensated.
4. **Fairness instruments:**
   - Published monthly per-site metrics: pages per shift, after-hours minutes, actionable rate.
   - An agreed imbalance threshold that triggers a boundary review.
   - Compensation reworked for 12-hour shifts so per-person annual income stays roughly neutral.
5. **Berlin resilience:** a headcount request for 1–2 more Berlin engineers, plus a written gap-coverage policy.

## 7. Rollout steps

| Week | Step | Notes / owner |
|---|---|---|
| 0 | Share the data and the proposal with both teams. Open formal works council consultation with the full draft: shift times, response time, Sunday/holiday handling, rest-period handling, allowance, fallback, data use. | Eng manager plus HR (DE). Starting now puts approval around week 4–8. |
| 0–3 | Alert hygiene sprint: retune the top 3 noisy alerts, add severity routing, triage the "other" alerts. Export **hourly** page timestamps per alert. | Platform team. Measure weekly. |
| 0–8 (interim) | Relief within the *current* approved schedule: no on-call commitments beyond the existing roster; enforce the 11-hour rest for Berlin; post-night-page comp time for SF; a manager as informal escalation. | Avoid changing the Berlin schedule before approval. |
| 3–4 | Re-run the page analysis on post-hygiene data. Finalise B3 boundaries using real hourly distribution. Update the works council if the numbers change. | Data-driven boundary choice. |
| 4–8 | Works council approval (works agreement or amendment). Finalise US stipend terms. Build pager layers, DST overrides, handoff template, cross-site runbooks. Dry-run handoffs. | HR, legal, platform. |
| ~8–12 | 4-week pilot of FTS. Weekly retro. Track pages per shift, ack times, handoff misses, after-hours minutes, rest-rule violations (should be zero). | Go/no-go criteria agreed in advance. |
| ~12+ | Full adoption. Monthly fairness review. Re-run the burnout survey after 3 months (target: fewer than 3 of 9 citing night pages). Pursue Berlin headcount. | Ongoing. |

**Go/no-go criteria for the pilot:**
- At most 2 pages per 12-hour shift on average at each site.
- No uncovered schedule gaps.
- No missed severity-1 handoffs.
- Berlin-to-SF per-person page ratio at or below 1.5×.
- Zero rest-period breaches.

## 8. Alternatives considered

- **Hygiene only, no schedule change.** This cuts pages by about 60% but the remaining ~2.3 pages per day still include roughly 1+ night page per day for whoever is on 24/7. Partial relief. It is a necessary step, not enough on its own.
- **Shorter 24/7 blocks (e.g. 3–4 day splits).** This spreads night exposure but doesn't remove it. It also still needs works council approval.
- **Night-time critical-only paging under 24/7.** Combined with hygiene this would be effective, but it still wakes someone for real incidents. FTS removes that structurally for little extra cost.
- **Adding a third region or contractor/MSP night coverage.** Not justified at ~2–3 actionable pages per day after hygiene.
- **Asymmetric FTS (SF owns weekends, for example).** Possible as a works-council-friendly variant that eases Berlin's Sunday issues. But it would give SF Berlin-daytime weekend hours, i.e. SF nights. Rejected unless SF volunteers.

## 9. Counterarguments and responses

- *"FTS just moves SF's nights onto Berlin."* Partly true for page volume. But they arrive in Berlin daytime, which is a much smaller burden than night pages. Hygiene plus B3 bring the per-person gap within a reasonable range.
- *"1-in-4 weeks is worse than 1-in-9."* The frequency is higher, but total hours per person stay about the same (~18–19 per week averaged), with no nights. Average on-call hours per person barely change (18.7 to ~18–19). The disruptive hours fall sharply.
- *"Handoffs will drop incidents."* That is a real risk. Mitigate it with structured notes, voice handoff for severity-1 incidents, and pilot metrics.
- *"Option (a) is faster."* Only for SF. Berlin still needs approval, so the speed advantage is mostly illusory, and the design permanently doubles exposure.

## 10. Remaining uncertainty

- **No per-alert hourly data.** How actionable pages are distributed by time of day, and by Berlin vs. SF window, is unknown. The 58/42 split is applied uniformly as an assumption.
- **The 90-day window may be seasonal** (e.g. end-of-quarter batch load).
- **German collective-policy allowance terms** and any existing works agreement on standby are not provided. They may already constrain shift lengths or response times.
- **Legal points need confirmation by German counsel or HR:** the Sunday-work exception and substitute rest day, and whether §87(1) No. 6 applies to pager data. The co-determination case law has some divergence.
- **The 7/9 survey result doesn't say which sites the respondents are at.**
- **The SRE dual-site figure (6 per site)** is corroborated only through secondary quotations in this research. The 8-engineer single-site minimum and the 2-incidents-per-shift guidance are from the primary chapter.
- **Engineer preferences are unknown.** Some may prefer occasional full weeks to more frequent 12-hour weeks.
- **Process caveat:** this was a single pass with self-assessed quality. Web fetch was unavailable, so claims were checked only against search-result summaries, not full source pages, and there was no independent verification step.

## Sources

- Run fixtures: `/home/user/flt-sudo/evaluator-v3/runs/r20261111T050637-3d87459f/request.md`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T050637-3d87459f/sources/pages-last-90-days.csv`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T050637-3d87459f/sources/roster.md`, `/home/user/flt-sudo/evaluator-v3/runs/r20261111T050637-3d87459f/sources/hr-notes.md`
- [Google SRE Book, Chapter 11: Being On-Call](https://sre.google/sre-book/being-on-call/)
- [Google SRE Workbook, Chapter 8: On-Call](https://sre.google/workbook/on-call/)
- [Manageable on-call for companies without money printers (dev.to)](https://dev.to/software-at-scale/manageable-on-call-for-companies-without-money-printers), the secondary source for the dual-site minimum
- [betriebsrat.de: Rufbereitschaft](https://www.betriebsrat.de/betriebsratslexikon/br/rufbereitschaft)
- [KomNet NRW: Ruhezeit und Rufbereitschaft](https://www.komnet.nrw.de/_sitetools/dialog/44043)
- [arbeitsrechte.de: Rufbereitschaft](https://arbeitsrechte.de/rufbereitschaft)
- [IWW: Rufbereitschaft and co-determination](https://www.iww.de/ea/quellenmaterial/id/235909)
- [Kliemt blog (2025): introducing Rufbereitschaft](https://www.kliemt.blog/2025/09/15/schon-arbeit-oder-noch-freizeit-was-arbeitgeber-bei-der-einfuehrung-von-rufbereitschaft-beachten-muessen/)
- [BAuA guidance on on-call duty (Handlungshilfe Rufdienste)](https://www.dgb-bildungswerk-nrw.de/downloads/igm/2017/FMTagung/BAuA-Handlungshilfe-Rufdienste.pdf)
- CJEU C-344/19 and C-580/19 (9 March 2021), standby as working time. Cited from background knowledge; not re-fetched in this run.

## Self-assessed quality score: 80/100

The arithmetic is checked against the fixtures; the time-zone and DST geometry, the per-person fairness figures, the compensation scenarios, and the treatment of the works council, rest-rule and Sunday-work constraints are all spelled out. Points off for:
- lacking hourly per-alert data;
- legal points verified only through search summaries;
- the dual-site SRE figure coming from secondary sources;
- this being a single-pass self-assessment with no independent verification.
