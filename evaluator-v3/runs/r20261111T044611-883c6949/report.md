# Evaluation: Redesigning a 9-engineer platform on-call rotation (5 San Francisco, 4 Berlin): (a) weekly 24/7 primary plus a secondary vs (b) follow-the-sun 12-hour shifts split between offices

**Decision objective:** Pick the on-call design (option a, option b, or a variant/combination the evidence supports) that most cuts night-time page load and burnout while keeping incident response reliable, is fair to both offices, and can be rolled out lawfully. The plan must include rollout steps. It should not take for granted that a schedule change alone is the right fix: the page data suggests most of the load is non-actionable noise, so reducing alert noise has to be weighed as a precondition for either option or as a complement to it.

## Verdict

Neither option on its own is the best choice. The evidence points to a staged hybrid. Step 1: remove alert noise first, as a precondition for any schedule change. Step 2: at the same time, open works council consultation, get labour-counsel advice on ArbZG s.3 and s.9-11, export timestamped page logs and audit runbook coverage per office. Step 3: only after the works council has agreed, run a time-boxed pilot of follow-the-sun 12-hour shifts, with Berlin on 07:00-19:00 Berlin time and SF on 10:00-22:00 PT. A pilot is itself a change to the Berlin on-call plan, so it cannot start before approval (E5, E15). Step 4: confirm the pilot or roll it back against criteria set in advance. Why: three alerts (disk-usage-warning-80pct, queue-lag-warning, cert-check-flap) produce 335 of 540 pages (about 62%) and only 2 of the 173 actions (E1, E2; K1-K5). Demoting them cuts load from about 6 to about 2.3 pages a day and keeps about 98.8% of actionable pages (K7, K8, K16). If pages are spread evenly, that is about 1.1 pages per 12-hour shift, which looks within the SRE benchmark of 2 incidents per shift (E6; K11). That fit is only indicative: the benchmark counts incidents, not pages, and comes from search snippets, and the unverified 58% night annotation suggests pages may cluster in one half of the day (E1, E3, E12). Tuning helps either option equally. So the schedule comparison is between option (a) with tuning and option (b) with tuning. The fair comparison is primary duty against primary duty. A secondary is paged only on escalation, and how often is unknown (E12). Follow-the-sun could also add a daytime secondary. On that basis, option (a) with tuning still leaves a 24/7 primary who, if pages are spread evenly, gets about 5.3 pages a week in their own local night (K33). Each engineer would average about 6.2 h a week of scheduled local-night primary duty (K39) and about 14.2 h a week of out-of-hours primary duty, assuming 09:00-17:00 weekday working hours (K30). For Berlin engineers on 24/7 weeks, the German night window (23:00-06:00) falls in the PT afternoon and evening, so PT afternoon and evening alerts trigger the 11-hour rest restart (E5, E13). Option (b) with tuning has no scheduled local-night duty, provided the incoming shift takes the handoff overlap (E9, E11, E16). Out-of-hours duty is about 9.8 h a week per SF engineer and 11 h per Berlin engineer (K26, K28), about 31% and 23% less than the option (a) primary figure (K37, K38). Weekend duty is about the same under both: about 5.3 h a week as an option (a) primary, against 4.8 h (SF) and 6 h (Berlin) under (b) (K34, K35, K40). So the decisive advantage of (b) is removing scheduled local-night duty, the stressor the survey names (E5). It is not a large cut in out-of-hours hours. The option (a) secondary adds further standby on top: about 28.4 combined out-of-hours standby hours a week per engineer (K31). Its real interruption load cannot be determined. The costs of option (b): Berlin carries about 12% more out-of-hours hours per person than SF, and 25% more total hours (K14, K29). Both sites are below the SRE benchmark of 6 engineers per site (E7). There are two handoffs a day, about 28 days a year of DST drift (E10; K22), and per-office skills coverage is unknown (E18). The Berlin shift avoids the statutory night window, but that does not settle every legal question. Call-out time counts as working time (E21), so call-outs on top of a normal working day, Saturday included, may exceed the s.3 daily ceiling of 8 h, extendable to 10 h (E23, unverified). Sunday and public-holiday call-outs fall under the s.9 ban. Saturday is a working day (Werktag) under s.3, not s.9. Sunday and holiday call-outs are most likely allowed for non-deferrable incident response under s.10(1) no.14, with a duty to record working time (E20). A substitute rest day may be due within 2 weeks after a Sunday call-out (E24, unverified). The floor of 15 work-free Sundays cannot bind, because each Berlin engineer would be on call about 13 weekends a year, leaving about 39 Sundays off call (K41). A collective agreement could change these rules, but whether one exists is unknown (E25). The same issues already apply to Berlin's 24/7 weeks under the current rotation and under option (a). Counsel must confirm them before the works council submission. How much night load follow-the-sun actually removes after tuning cannot be determined, because the CSV has no timestamps (E1, E3). Timestamped page logs would settle this.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** The only options are (a) weekly 24/7 plus a secondary or (b) follow-the-sun 12-hour shifts.
  **Correction:** Alert-noise removal is a stronger first lever than either schedule, and it applies to both. It removes about 62% of pages while keeping 171 of 173 actionable ones. With tuning applied to both, follow-the-sun removes scheduled local-night duty and option (a) does not. The evidence supports a hybrid: tune first, then follow-the-sun after works council approval. [E2, E6, E8, E11]
- **Assumption:** 58% of pages fired between 20:00 and 08:00 US Pacific time.
  **Correction:** Unverified. It is a free-text annotation with no timestamps, and 58% of 540 is 313.2, not a whole number. Treat it as an estimate until raw logs are supplied. [E1, E3]
- **Assumption:** The CSV total of 540 pages is correct and the 'other' row is complete.
  **Correction:** The total is confirmed: the rows sum to 540, with 173 actionable. Whether the combined 'other (14 alerts)' row is complete cannot be checked. [E1, E2]
- **Assumption:** Burnout is caused mainly by the rotation structure.
  **Correction:** Structure and noise are separate contributors. About 62% of pages are near-zero-action noise, so fixing the structure alone would leave most of the volume in place. [E2, E19]
- **Assumption:** The PT/CET offset is a constant 9 hours.
  **Correction:** It is 8 hours for about 28 days a year (8-29 March and 25 October to 1 November in 2026), so shift boundaries need a DST rule. [E10, E11]
- **Assumption:** Both offices can handle every alert type independently.
  **Correction:** Unknown. There is no evidence on per-office skills, ownership or runbook coverage, so this must be audited before follow-the-sun goes live. [E18]
- **Assumption:** The HR notes accurately reflect ArbZG and BetrVG.
  **Correction:** Broadly consistent with secondary legal sources, but incomplete. A deadlock goes to the Einigungsstelle, which can take longer than 4-8 weeks. Whether trivial interruptions restart rest is disputed. The notes also leave out the Sunday and holiday ban (s.9) and its IT exception (s.10(1) no.14), which comes with a duty to record working time. Further rules may apply: the daily maximum on working days, Mon-Sat (s.3), substitute rest days after Sunday work (s.11), and collective-agreement deviations (s.7/s.12). These rest on background knowledge only. Statute texts were not retrieved, so this needs counsel confirmation. [E5, E13, E14, E15, E20, E23, E24, E25]

## Criteria

### C1 Reduction in night-time and out-of-hours interruptions (weight 25)

Follow-the-sun with Berlin 07:00-19:00 and SF 10:00-22:00 PT is the only design in the evidence that removes scheduled local-night duty (22:00-06:00) for both offices. The incoming shift must take the handoff overlap; if it is added to the end of SF's shift, SF runs to 22:30. Option (a) keeps 24/7 weeks, so the primary still takes night pages, even after tuning: about 6.2 h a week of scheduled local-night primary duty per engineer on average. Noise removal cuts total interruptions by about 62% whichever schedule is chosen, so it does not separate the two options. Out-of-hours duty matters too, not just local night. Assume weekday working hours of 09:00-17:00. Average out-of-hours primary on-call duty per engineer per week would then be about 9.8 h (SF) and 11 h (Berlin) under follow-the-sun, against about 14.2 h under today's rotation or as option (a)'s primary, about 23-31% less. Weekend duty is about the same under both. Option (a)'s secondary adds standby on top (about 28.4 h combined), but a secondary is paged only on escalation and its paging rate is unknown. That combined figure is therefore not comparable with primary-only duty. How much of the tuning cut falls at night cannot be determined, because there are no timestamps. [E1, E2, E3, E5, E9, E10, E11, E12, E16, E19]

*Mechanisms:* Night interruptions = (pages that land in someone's local night) x (people exposed). Tuning reduces the first factor at every hour under any schedule. Option (a) leaves the share of pages in the primary's local night unchanged: with tuned load spread evenly, about 5.3 pages per primary week fall in 22:00-06:00 local (K33). It also adds a secondary who can be woken on escalation. Follow-the-sun moves coverage into each office's local day, so scheduled local-night exposure drops to zero by design. Out-of-hours exposure still remains: SF evenings 17:00-22:00, Berlin 07:00-09:00 and 17:00-19:00, and full 12-hour weekend days for both offices. So the out-of-hours saving over a 24/7 primary is moderate, and the weekend burden is roughly unchanged. If the 58% annotation is right (313.2 pages in 20:00-08:00 PT), at least 140 of those night-window pages were non-actionable, because only 173 pages were actionable at all.

*Strengths:*
- With the overlap in the incoming shift, the E11 split puts neither office on scheduled duty in 22:00-06:00 local, and keeps Berlin out of 23:00-06:00 (E9, E11, E16)
- Scheduled local-night primary duty drops from about 6.2 h a week per engineer (today and option (a)) to zero (K39; E11)
- Out-of-hours primary on-call per person drops from about 14.2 h a week (today and option (a) primary) to 9.8 h (SF) or 11 h (Berlin), about 23-31% less (K26, K28, K30, K37, K38). This assumes 09:00-17:00 weekday working hours
- Noise removal lowers interruptions at all hours and keeps 171 of 173 actionable pages (E2; K16)
- Survey: 7 of 9 engineers name night pages as the main stressor (E5)

*Weaknesses:*
- The 58% night share is unverified and there is no hour-of-day breakdown of actionable pages (E1, E3)
- During the 8-hour-offset weeks, a split fixed to Berlin time pushes SF to 11:00-23:00 PT (E10, E11)
- Option (a), even with tuning, still leaves about 5.3 local-night pages per primary week if pages are spread evenly (K33)
- Follow-the-sun still includes 12-hour weekend shifts and weekday evenings or early mornings (K25, K27). Weekend duty per person (4.8-6 h a week) is about the same as for an option (a) primary (about 5.3 h) (K34, K35, K40)
- The secondary's paging rate under option (a) is unknown, so its true burden cannot be set against follow-the-sun (E12)

### C2 Actionable workload and alert-noise handling (weight 20)

Alert noise is the single biggest lever, and it applies equally to every schedule option. The three noise alerts produce 335 of 540 pages (62.0%) with 2 actions (0.6% actionable). The remaining four rows are 83.4% actionable. After demotion, load is about 2.3 pages a day, or about 1.1 per 12-hour shift if pages are spread evenly. That looks within the SRE benchmark of at most 2 incidents per 12-hour shift, and current load (about 3 per 12 hours) is above it. But the benchmark counts incidents, not pages, and uneven timing could push one half over it. [E1, E2, E6, E8, E12, E20]

*Mechanisms:* Cause-based or flapping warnings fire often but rarely need a human. SRE guidance is to page only on urgent, actionable, user-visible symptoms and to move cause signals to dashboards or tickets (E8). Removing them leaves the symptom alerts (api-5xx, db-replica-lag, payment-webhook) that drive real response. It also limits Sunday and holiday call-outs in Berlin to non-deferrable incidents, which is what the s.10(1) no.14 exception appears to cover (E20).

*Strengths:*
- Arithmetic checked against the VERIFIED CSV: total 540, actionable 173, rate 32.0% (E1, E2; K1-K3)
- Demotion loses only 2 of 173 actionable pages (E2; K16)
- On an even spread, post-tuning load is below 2 per 12-hour shift (E6; K11)

*Weaknesses:*
- queue-lag-warning did lead to 2 actions, so it needs replacing with a symptom-based alert, not just deleting (E2)
- Per-day and per-shift figures assume pages are spread evenly. The 'other (14 alerts)' row cannot be broken down (E1, E2, E12)
- The SRE benchmark counts incidents, not pages, and comes from search snippets only (E6)

### C3 Fairness and burden distribution across offices and individuals (weight 15)

Total on-call hours overstate the differences, because much of a 12-hour daytime shift overlaps normal work. Out-of-hours hours are the better fairness measure. Assume weekday working hours of 09:00-17:00 local. Follow-the-sun then gives each office's on-call person this much out-of-hours duty per week. SF: 5 h each weekday (17:00-22:00) plus 24 h at the weekend, 49 h in total. Berlin: 4 h each weekday (07:00-09:00 and 17:00-19:00) plus 24 h, 44 h in total. Per person that is about 9.8 h (SF) and 11 h (Berlin) a week, so Berlin carries about 12% more, less than the 25% gap in total hours. Weekend on-call is about 4.8 h a week per SF engineer and 6 h per Berlin engineer (about 13 weekends a year in Berlin). Under option (a), primary out-of-hours duty is shared evenly at about 14.2 h a week per person, including about 5.3 h of weekend duty. The secondary role adds standby on top (combined about 28.4 h out-of-hours and 10.7 h weekend), but its interruption load is unknown and probably much lower. So follow-the-sun lowers out-of-hours primary duty for both offices but gives no real weekend relief: Berlin's 6 h weekend figure is slightly above the 5.3 h under (a). Pay fairness cannot be assessed. [E4, E5, E11, E12, E17, E24]

*Mechanisms:* Splitting a fixed 168 h a week across unequal headcounts (4 vs 5) concentrates hours on the smaller office. Berlin's shift has fewer out-of-hours weekday hours (4 vs 5), which partly offsets this. If the unverified 58% figure is right, more pages could land in Berlin's 22:00-10:00 PT half, so Berlin's page burden per person could exceed the hours ratio. Weekend-day coverage counts the same for each office, so it is the main source of the Berlin imbalance (6 vs 4.8 h a week).

*Strengths:*
- No office has scheduled local-night duty under the E11 split (E11)
- The out-of-hours gap (about 12%) is smaller than the total-hours gap (25%) (K14, K29)
- Option (a) is even across offices: about 14.2 primary out-of-hours hours per person per week, plus secondary standby of uncertain burden (K30, K31; E12)

*Weaknesses:*
- Berlin carries more out-of-hours and weekend hours per person and possibly more pages (E12; K28, K29, K34)
- Berlin's weekend duty under follow-the-sun (6 h a week) is slightly above an option (a) primary's (about 5.3 h) (K34, K40)
- The 09:00-17:00 working-hours baseline is an assumption, not from the packet
- The German allowance is unknown, so it cannot be compared with the US $400/week (E5, E17)
- Berlin Sunday call-outs may require a substitute rest day within 2 weeks, which reduces Berlin capacity (E24, unverified). The floor of 15 work-free Sundays cannot bind: about 13 on-call weekends a year leave about 39 Sundays off call (K41)

### C4 Labour-law and works-council compliance (Berlin) (weight 15)

Both options change the Berlin on-call plan, so both need works council agreement before anything changes, pilots included. The typical lead time is 4-8 weeks, and a deadlock goes to the conciliation board (Einigungsstelle). Follow-the-sun with Berlin on 07:00-19:00 keeps Berlin outside the statutory night window, which largely avoids the 11-hour rest restart. Under option (a), Berlin's statutory night (23:00-06:00) is 14:00-21:00 PT, which is PT afternoon and evening. Berlin primaries and secondaries on 24/7 weeks are therefore exposed to night call-outs and rest restarts. Avoiding the night window does not settle every legal question for the Berlin shift, however. Call-out time is working time (E21). On working days (Mon-Sat), call-outs on top of a normal 8-hour day could exceed the s.3 ceiling of 8 h, extendable to 10 h; this rests on background knowledge only (E23). Sunday and public-holiday call-outs are banned by default under s.9; Saturday is a working day under s.3, not s.9. Sunday and holiday call-outs are most likely allowed for non-deferrable incident response under s.10(1) no.14, and working time must be recorded (E20). If counsel disagrees, an authority authorisation under s.13 is a slower fallback (E22). A substitute rest day within 2 weeks after a Sunday call-out may be required (E24, unverified). The s.11 floor of 15 work-free Sundays cannot bind at about 13 on-call weekends a year per Berlin engineer (K41). A collective agreement could change these defaults, but whether one exists is unknown (E25). The same issues already affect Berlin's 24/7 weeks under the current rotation and under option (a), so they do not favour option (a). They do need to be settled in the works agreement. [E5, E11, E13, E14, E15, E16, E20, E21, E22, E23, E24, E25]

*Mechanisms:* Under BetrVG s.87(1) no.2, the works council co-determines working time, and on-call plans fall under this (E15). Under ArbZG s.5, a call-out generally restarts the full 11-hour rest (E13). Standby counts as rest, but call-out time counts as working time (E21). So the legal risk depends on call-out frequency and timing, which tuning reduces. With about 1.1 pages per 12-hour shift, the s.3 ceiling is less likely to be hit, but long incidents could still breach it (E23). One mitigation is a rule that call-out time on on-call working days replaces regular work.

*Strengths:*
- The 07:00-19:00 Berlin shift avoids 23:00-06:00 entirely (E11, E16)
- The HR notes and the secondary legal sources agree on the approval gate and the rest rule (E5, E13, E15)
- For IT incident response there is a plausible statutory route for Sunday and holiday call-outs (E20)

*Weaknesses:*
- The s.3, s.11 and s.7/s.12 points rest only on background knowledge; no statute texts were retrieved (E23, E24, E25)
- Whether a trivial interruption restarts rest is disputed (E13 vs E14)
- Whether Sunday standby without a call-out counts as Sunday employment is unresearched (E24)
- An Einigungsstelle or an s.13 authorisation could push the timeline beyond 8 weeks (E15, E22)

### C5 Incident response reliability and handoff risk (weight 15)

Option (a) adds escalation depth and avoids handoffs, but keeps a 24/7 primary who is woken at night. Follow-the-sun adds two handoffs a day. It needs a written handoff, an overlap window in the incoming shift, a rule for the DST-drift boundary, holiday calendars for both offices, and confirmation that each office can handle every alert type alone, which is currently UNKNOWN. Both sites are below the SRE multi-site staffing benchmark of 6 per site, and Berlin is lowest at 4. [E6, E7, E9, E10, E11, E18, E26]

*Mechanisms:* Handoffs create gaps in context, especially for incidents that span a boundary. Vendor guidance recommends a roughly 30-minute overlap and a mandatory structured handoff (E9). The PT-Berlin offset drops to 8 hours for about 28 days a year (E10). US and German public holidays differ, and Berlin holidays fall under the s.9 holiday ban (E9, E26).

*Strengths:*
- Handoff safeguards are well described (E9)
- After tuning, a shift carries about 1.1 pages on an even spread, leaving headroom for follow-up (E6; K11)

*Weaknesses:*
- Per-office skills and runbook coverage is UNKNOWN (E18)
- No empirical data on handoff-related incident risk (E9)
- 5 and 4 engineers per site is below the 6-per-site benchmark (E7)
- The holiday calendars were not retrieved, and the weekend call-out load is not quantified (E26)

### C6 Rollout feasibility, cost and reversibility (weight 10)

Noise removal is the cheapest, fastest and most reversible step. Option (a) adds a second person on paid standby every week. Its cost cannot be quantified, because no US secondary stipend is defined and the German allowance amount is unknown. Follow-the-sun needs works council approval (4-8 weeks or more), labour-counsel review of s.3 and s.9-11, scheduling tool changes, holiday calendars and a DST rule. If counsel finds Sunday and holiday call-outs fall outside s.10, an s.13 authorisation would add further lead time. It can be piloted and rolled back, but the rollback also touches the co-determined Berlin plan. [E2, E5, E15, E17, E22]

*Mechanisms:* Cost scales with the number of people on paid standby and the allowance rates. Lead time is set by the works council gate and any authority authorisation. Reversibility depends on whether a change touches the co-determined plan.

*Strengths:*
- Tuning can start immediately, in parallel with the works council consultation (E2, E15)
- The legal review and the audit can run during the 4-8 week approval window (E5)

*Weaknesses:*
- German allowance and US secondary stipend amounts are missing (E5, E17)
- The works council position on a pilot is unknown (E15)
- A possible s.13 authorisation adds lead time (E22)

## Key claims

- **CL1** (material): The CSV rows sum to 540 pages with 173 actionable, an actionable rate of about 32.0%. [E1, E2, K1, K2, K3]
- **CL2** (material): disk-usage-warning-80pct, queue-lag-warning and cert-check-flap produce 335 pages (about 62.0% of all pages) with only 2 actions (about 0.6% actionable). The remaining 205 pages are about 83.4% actionable. [E1, E2, K4, K5, K6]
- **CL3** (material): Demoting the three noise alerts would cut average load from about 6.0 to about 2.3 pages a day (about 15.9 a week; about 1.1 per 12-hour shift instead of 3, on an even spread). It would keep about 98.8% of actionable pages. This applies equally under either schedule option. [E2, E12, K7, K8, K9, K10, K11, K16]
- **CL4** (material): On an even spread, post-tuning load per 12-hour shift (about 1.1) is within the SRE benchmark of at most 2 incidents per 12-hour shift, and current load (about 3) exceeds it. The fit is indicative only. The benchmark counts incidents rather than pages and comes from search snippets, and uneven timing (for example, if the unverified 58% annotation holds) could put more load on one half. [E6, E12, E3, K10, K11]
- **CL5** (material): With a 9-hour offset, a split of Berlin 07:00-19:00 and SF 10:00-22:00 PT leaves neither office on scheduled duty in 22:00-06:00 local time, and keeps Berlin outside the ArbZG night window of 23:00-06:00. This holds only if the incoming shift takes the 30-minute handoff overlap (Berlin from 06:30, SF from 09:30 PT). An overlap added to the end of SF's shift would run to 22:30 local. During the 8-hour-offset weeks the split cannot avoid both offices' nights: fixed to Berlin time, SF runs to 23:00 PT; fixed to PT, Berlin starts at 06:00. [E9, E10, E11, E16]
- **CL6**: The PT-Berlin offset is not a constant 9 hours. In 2026 it is 8 hours from 8-29 March and from 25 October to 1 November, about 28 days in total. [E10, K22]
- **CL7** (material): Under follow-the-sun, each office covers 84 h a week: about 16.8 h per SF engineer against 21 h per Berlin engineer, about 25% more per Berlin person and more than today's average of about 18.7 h. These are total hours, much of which overlaps normal working hours. CL18 gives the out-of-hours comparison. [E4, E12, K12, K13, K14, K23]
- **CL8** (material): Option (a) puts each engineer on call (primary or secondary) about 2 weeks in 9 (about 22.2% of weeks, about 37.3 h a week of combined standby on average), with 24/7 night exposure unchanged. How often the secondary is actually paged is unknown. [E12, K19, K24]
- **CL9** (material): Any change to the Berlin on-call plan, whether a secondary role, 12-hour shifts or a time-boxed pilot of either, needs works council agreement before it takes effect. HR reports a typical lead time of 4-8 weeks, and a deadlock goes to the Einigungsstelle. [E5, E15]
- **CL10** (material): In Berlin, a night call-out generally restarts the full 11-hour rest period. Designs that keep Berlin off night duty therefore avoid lost next-day capacity. Whether trivial interruptions count is disputed. [E5, E13, E14]
- **CL11** (material): The claim that 58% of pages fired between 20:00 and 08:00 PT cannot be verified. The CSV has no timestamps, and 58% of 540 is 313.2, not a whole number. The night share of actionable pages cannot be determined. [E1, E3, K15]
- **CL12**: If the 58% annotation is correct, at least about 140 of the roughly 313 night-window pages were non-actionable, because only 173 pages in total were actionable. Noise removal would then necessarily remove some night pages. The exact share remains unknown. [E1, E2, E3, K15, K17, K18]
- **CL13** (material): Whether both offices can handle every alert type independently, which follow-the-sun requires, cannot be determined from the evidence. [E18]
- **CL14**: Pay fairness and the cost of adding a secondary cannot be determined. The German collective allowance amount and any US secondary stipend are not specified. [E5, E17]
- **CL15** (material): Both sites (5 SF, 4 Berlin) are below the SRE multi-site benchmark of at least 6 engineers per site, which is a sustainability risk for follow-the-sun, especially in Berlin. [E4, E7]
- **CL16** (material): Burnout is unlikely to come from rotation structure alone. Night exposure (structure) and noise (volume) are separate contributors, and noise makes up about 62% of pages. [E2, E5, E19, K4]
- **CL17**: With raw load of about 42 pages per 24/7 week, if the 58% annotation is correct, about 24.4 of them would fall in 20:00-08:00 PT. Under option (a) these land in an SF primary's local night. [E1, E12, K20, K21]
- **CL18** (material): Assume weekday working hours of 09:00-17:00 local. Average out-of-hours on-call duty per engineer per week as primary (or sole on-call) would then be about 9.8 h (SF) and 11 h (Berlin) under follow-the-sun, with Berlin about 12% higher. It would be about 14.2 h under today's rotation and for option (a)'s primary, so follow-the-sun is about 23-31% lower like for like. Weekend on-call duty averages about 4.8 h a week per SF engineer and 6 h per Berlin engineer under follow-the-sun, against about 5.3 h as an option (a) primary, which is roughly the same. Option (a)'s secondary adds standby on top: about 28.4 h out-of-hours and 10.7 h weekend in combined primary and secondary standby. A secondary is paged only on escalation, at an unknown rate, so these combined figures overstate its interruption burden and are not a like-for-like comparison with follow-the-sun. [E4, E11, E12, K25, K26, K27, K28, K29, K30, K31, K34, K35, K36, K37, K38, K40]
- **CL19** (material): Option (a) with tuning still leaves the 24/7 primary about 5.3 pages a week in their own local night (22:00-06:00), if tuned pages are spread evenly. Each engineer would average about 6.2 h a week of scheduled local-night primary duty. Combined primary and secondary local-night standby is about 12.4 h, but the secondary's paging rate is unknown. Follow-the-sun with tuning has no scheduled local-night duty. [E2, E11, E12, K32, K33, K39]
- **CL20** (material): Under ArbZG s.9, Sunday and holiday call-outs by Berlin engineers are banned by default. They are most likely allowed for non-deferrable incident response on production systems under s.10(1) no.14, with call-out working time recorded. Standby itself counts as rest; only call-out time counts as working time. Saturday is a working day (Werktag), so Saturday call-outs fall under the s.3 daily limits rather than s.9. [E20, E21, E23]
- **CL21** (material): The evidence cannot settle several questions. Whether call-outs on working days (Mon-Sat) during a Berlin on-call shift breach the ArbZG s.3 daily maximum (8 h, extendable to 10 h). Whether s.11 requires a substitute rest day within 2 weeks after a Sunday call-out, and whether Sunday standby without a call-out counts as a worked Sunday. Whether a collective agreement under s.7/s.12 changes these defaults for the Berlin entity. These points rest only on background knowledge or are UNKNOWN, and need labour counsel. They apply to Berlin's 24/7 weeks under every option, not only to follow-the-sun. [E23, E24, E25]
- **CL22**: One option (a) variant has a secondary in the other office take the primary's local-night pages. That amounts to follow-the-sun with weekly cross-office pairs: its night coverage, works council requirement and handoff needs are the same. Because each pair needs one person from each office, Berlin engineers would be on duty about 1 week in 4 and SF engineers about 1 week in 5. [E4, E11, E12, E15]
- **CL23**: If the s.11 rule of at least 15 work-free Sundays a year applies (unverified), it cannot bind under the proposed rotation. Each Berlin engineer is on call about 13 weekends a year, leaving about 39 Sundays off call even if every on-call Sunday counted as worked. Only the substitute-rest-day rule is a real capacity factor. [E24, K41]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Total pages from CSV rows | `148+121+66+71+48+39+47` | 540 | 540 | yes |
| K2 | Total actionable pages | `0+2+0+63+41+37+30` | 173 | 173 | yes |
| K3 | Actionable rate in percent | `173/540*100` | 32.04 | 32.03703703703704 | yes |
| K4 | Share of pages from the three noise alerts, in percent | `(148+121+66)/540*100` | 62.04 | 62.03703703703704 | yes |
| K5 | Actionable rate of the three noise alerts, in percent | `2/(148+121+66)*100` | 0.597 | 0.5970149253731344 | yes |
| K6 | Actionable rate of the remaining four rows, in percent | `(63+41+37+30)/(71+48+39+47)*100` | 83.41 | 83.41463414634146 | yes |
| K7 | Raw pages per day | `540/90` | 6 | 6 | yes |
| K8 | Pages per day after removing the three noise alerts | `(71+48+39+47)/90` | 2.278 | 2.2777777777777777 | yes |
| K9 | Pages per week after noise removal | `(71+48+39+47)/90*7` | 15.94 | 15.944444444444443 | yes |
| K10 | Raw pages per 12-hour shift (even spread) | `540/90/2` | 3 | 3 | yes |
| K11 | Pages per 12-hour shift after noise removal (even spread) | `(71+48+39+47)/90/2` | 1.139 | 1.1388888888888888 | yes |
| K12 | Follow-the-sun total on-call hours per SF engineer per week | `84/5` | 16.8 | 16.8 | yes |
| K13 | Follow-the-sun total on-call hours per Berlin engineer per week | `84/4` | 21 | 21 | yes |
| K14 | Percent more total on-call hours per Berlin engineer than per SF engineer | `(21/16.8-1)*100` | 25 | 25 | yes |
| K15 | Pages implied by the 58% night annotation | `0.58*540` | 313.2 | 313.2 | yes |
| K16 | Percent of actionable pages retained after demoting noise alerts | `(173-2)/173*100` | 98.84 | 98.84393063583815 | yes |
| K17 | Total non-actionable pages | `540-173` | 367 | 367 | yes |
| K18 | Minimum non-actionable pages within the 58% night window if the annotation is correct | `0.58*540-173` | 140.2 | 140.2 | yes |
| K19 | Percent of weeks each engineer is on call (primary or secondary) under option (a) | `2/9*100` | 22.22 | 22.22222222222222 | yes |
| K20 | Raw pages per 24/7 week | `540/90*7` | 42 | 42 | yes |
| K21 | Raw weekly pages in 20:00-08:00 PT if the 58% annotation holds | `540/90*7*0.58` | 24.36 | 24.36 | yes |
| K22 | Days in 2026 with an 8-hour PT-Berlin offset (8-29 March plus 25 October to 1 November) | `21+7` | 28 | 28 | yes |
| K23 | Current average total on-call hours per engineer per week (one 168 h week in 9) | `168/9` | 18.67 | 18.666666666666668 | yes |
| K24 | Average combined primary plus secondary standby hours per engineer per week under option (a) | `2*168/9` | 37.33 | 37.333333333333336 | yes |
| K25 | SF office weekly out-of-hours on-call hours under follow-the-sun. With the 10:00-22:00 PT shift and assumed 09:00-17:00 working hours: 5 out-of-hours hours on each of 5 weekdays, plus two 12 h weekend days | `5*5+2*12` | 49 | 49 | yes |
| K26 | Out-of-hours on-call hours per SF engineer per week under follow-the-sun | `(5*5+2*12)/5` | 9.8 | 9.8 | yes |
| K27 | Berlin office weekly out-of-hours on-call hours under follow-the-sun. With the 07:00-19:00 shift and assumed 09:00-17:00 working hours: 4 out-of-hours hours on each of 5 weekdays, plus two 12 h weekend days | `5*4+2*12` | 44 | 44 | yes |
| K28 | Out-of-hours on-call hours per Berlin engineer per week under follow-the-sun | `(5*4+2*12)/4` | 11 | 11 | yes |
| K29 | Percent more out-of-hours on-call hours per Berlin engineer than per SF engineer under follow-the-sun | `(11/9.8-1)*100` | 12.24 | 12.244897959183664 | yes |
| K30 | Out-of-hours primary on-call hours per engineer per week under the current rotation and for the option (a) primary (168 h minus 40 assumed working hours, one week in 9) | `(168-40)/9` | 14.22 | 14.222222222222221 | yes |
| K31 | Combined primary plus secondary out-of-hours standby hours per engineer per week under option (a). Not like-for-like with follow-the-sun, because the secondary is paged only on escalation | `2*(168-40)/9` | 28.44 | 28.444444444444443 | yes |
| K32 | Combined primary plus secondary local-night (22:00-06:00) standby hours per engineer per week under option (a). Not like-for-like, because the secondary's paging rate is unknown | `2*8*7/9` | 12.44 | 12.444444444444445 | yes |
| K33 | Tuned pages per week landing in a 24/7 primary's local night (8 of 24 hours), assuming an even spread | `(71+48+39+47)/90*7*8/24` | 5.315 | 5.314814814814814 | yes |
| K34 | Weekend on-call hours per Berlin engineer per week under follow-the-sun | `2*12/4` | 6 | 6 | yes |
| K35 | Weekend on-call hours per SF engineer per week under follow-the-sun | `2*12/5` | 4.8 | 4.8 | yes |
| K36 | Combined primary plus secondary weekend standby hours per engineer per week under option (a). Not like-for-like | `2*48/9` | 10.67 | 10.666666666666666 | yes |
| K37 | Percent fewer out-of-hours on-call hours per SF engineer under follow-the-sun (9.8 h) than for the option (a) primary (about 14.2 h) | `(1-9.8/((168-40)/9))*100` | 31.09 | 31.093749999999986 | yes |
| K38 | Percent fewer out-of-hours on-call hours per Berlin engineer under follow-the-sun (11 h) than for the option (a) primary (about 14.2 h) | `(1-11/((168-40)/9))*100` | 22.66 | 22.65625 | yes |
| K39 | Scheduled local-night (22:00-06:00) primary on-call hours per engineer per week under option (a) or the current rotation (8 h x 7 nights, one week in 9) | `8*7/9` | 6.222 | 6.222222222222222 | yes |
| K40 | Weekend primary on-call hours per engineer per week under option (a) or the current rotation (48 weekend hours, one week in 9) | `48/9` | 5.333 | 5.333333333333333 | yes |
| K41 | Sundays a year a Berlin engineer is off call when on call about 1 weekend in 4 (52 weeks) | `52-52/4` | 39 | 39 | yes |

## Alternatives

- **Option (a): weekly 24/7 primary plus a secondary, with no noise tuning:** It keeps about 42 pages a week on a 24/7 primary (K20) and does not remove local-night duty (E11). Each person's on-call share doubles to about 2 weeks in 9 (K19). The primary role alone carries about 14.2 out-of-hours hours a week on average, and the secondary adds standby with an unknown paging rate (K30, K31; E12). It adds a second paid standby person each week, at a cost that cannot be quantified (E5, E17). For Berlin weeks, PT afternoon and evening alerts fall in Berlin's statutory night and trigger rest restarts (E13). It scores worst on C1 and C4 and best only on avoiding handoffs (C5).
- **Option (a) with noise tuning:** It gets the same tuning benefit as the hybrid: about 15.9 pages a week, about 2.3 a day (K8, K9). But the 24/7 primary still receives about 5.3 local-night pages a week if pages are spread evenly (K33). Compared like for like (primary duty only), engineers average about 6.2 h a week of scheduled local-night duty and about 14.2 h of out-of-hours duty (K30, K39). Under (b) with tuning the figures are zero and 9.8-11 h, about 23-31% less out of hours (K26, K28, K37, K38). Weekend primary duty is similar (about 5.3 h against 4.8-6 h; K34, K35, K40). The secondary adds standby on top, but its interruption burden is unknown (E12). Berlin 24/7 weeks keep the rest-restart risk (E13) and the same s.3 and s.9 questions (E20, E23). It is better than (b) on handoffs and on hours parity between offices. On the stated stressor, night pages (E5), it is worse.
- **Option (a) variant: weekly cross-office pair, where the secondary in the other office takes the primary's local-night pages:** This answers C1 without formal 12-hour shifts. In practice it is follow-the-sun with weekly pairs. The Berlin partner covers SF nights (22:00-06:00 PT is about 07:00-15:00 Berlin at a 9-hour offset). The SF partner covers Berlin nights (23:00-06:00 Berlin is 14:00-21:00 PT). Each pair needs one person from each office, so Berlin frequency is about 1 week in 4 against 1 in 5 for SF (E4, E12), the same imbalance as (b). It still needs works council approval (E15), routing handoffs and the per-office skills check (E18). It is a reasonable way to frame (b) to the team, not a separate solution.
- **Option (b): follow-the-sun 12-hour shifts, with no noise tuning:** It removes scheduled local-night duty (E11), but each shift carries about 3 pages, above the 2-per-12h benchmark (E6; K10). Berlin takes about 25% more total hours and about 12% more out-of-hours hours (K14, K29). More call-outs also make the s.3 daily-maximum and Sunday-work questions more pressing for Berlin (E20, E23).
- **Noise removal only, keeping the current weekly 24/7 primary:** Fastest and cheapest. Load drops to about 15.9 pages a week (K9), and the schedule itself needs no change or approval (E15). But the primary still gets about 5.3 local-night pages a week on an even spread (K33), and Berlin primaries still face night call-outs (E11, E13). Load still falls on one person all week, with about 14.2 out-of-hours hours a week on average (K30). This is a credible fallback if the works council, legal review or skills audit blocks follow-the-sun.
- **Recommended hybrid: noise removal first, then, after works council approval, a follow-the-sun pilot (Berlin 07:00-19:00, SF 10:00-22:00 PT) with structured handoffs:** Compared with option (a) with tuning, it trades handoff risk and a Berlin hours imbalance (K29) for no scheduled local-night duty (K39) and about 23-31% less out-of-hours primary duty per person (K26, K28, K30, K37, K38). Weekend load is about unchanged (K34, K35, K40). It requires works council agreement before the pilot (E15), a per-office runbook audit (E18), a DST rule (E10), holiday calendars (E26), and counsel confirmation of the s.3 and s.9-11 points (E20, E23-E25).

## Tradeoffs

- Night relief against hours fairness: follow-the-sun removes scheduled nights but gives each Berlin engineer about 12% more out-of-hours on-call than each SF engineer, and 25% more total hours (E12; K14, K29).
- Escalation depth against exposure: a secondary adds backup but doubles each person's on-call weeks and adds a second paid standby. Its cost cannot be quantified without stipend and allowance figures (E5, E12, E17; K19).
- Fewer handoffs against fatigue: weekly 24/7 avoids two daily handoffs but keeps one person exposed around the clock, even after tuning (E9, E11; K33).
- Speed against durability: noise removal is quick and reversible, while schedule changes are gated by the works council for 4-8 weeks or longer (E5, E15).
- Aggressive demotion against hidden incidents: queue-lag-warning had 2 real actions, so deleting it outright risks missing them (E2).

## Edge cases and failure modes

- DST mismatch weeks (8-29 March, 25 October to 1 November 2026): a boundary fixed to Berlin time moves SF to 11:00-23:00 PT, and one fixed to PT moves Berlin to 06:00-18:00. Pick one rule in advance and tell both offices (E10, E11).
- Handoff overlap placement: if the 30-minute overlap is added to the outgoing SF shift, SF runs to 22:30, or 23:30 in mismatch weeks if boundaries are fixed to Berlin time. Put the overlap in the incoming shift (E9, E11).
- Incidents that span the 19:00 Berlin / 10:00 PT boundary: without an overlap window and a written handoff, context is lost (E9).
- A Berlin call-out that runs late into the 19:00 boundary pushes the next-day start back under the 11-hour rule (E11, E13).
- A Berlin engineer works a full 8-hour working day (Mon-Sat) and then handles more than about 2 h of call-outs. The day may exceed the s.3 ceiling (unverified), so call-out time should replace regular work on on-call days (E21, E23).
- Sunday and Berlin public-holiday call-outs (for example 8 March) fall under the s.9 ban; Saturday call-outs are working-day work under s.3. Sunday and holiday call-outs need the s.10(1) no.14 exception, recorded working time and possibly a substitute rest day within 2 weeks. The floor of 15 work-free Sundays cannot bind at about 13 on-call weekends a year (E20, E23, E24, E26; K41).
- Absence or attrition at a site with 4 engineers puts more load on the remaining 3 (E7).
- Demoted alerts turn into real incidents, for example disk fill or certificate expiry. Symptom-based or deadline-based replacements and ticket routing are needed (E2, E8).
- If timestamps show that actionable pages cluster in the Berlin half or near boundaries, the fairness and reliability picture changes (E3, E12).
- Even a brief night acknowledgement by a Berlin engineer may restart rest under the strict view (E13, E14).

## Counterarguments

- **Option (a) is safer because a secondary adds escalation depth and avoids handoff risk.** — Compared fairly, with tuning applied to both, option (a) avoids handoffs and keeps hours equal between offices. But its primary still gets about 5.3 local-night pages a week on an even spread (K33), with about 6.2 h a week of scheduled local-night primary duty per engineer against zero under follow-the-sun (K39). That leaves the stated stressor, night pages, largely in place (E5). On out-of-hours primary duty the gap is moderate (about 14.2 h against 9.8-11 h, K26, K28, K30), and weekend load is about the same (K34, K35, K40). So the case against (a) rests mainly on night exposure, not on total out-of-hours hours. The evidence does not show a need for more escalation depth at about 2.3 pages a day (K8). If depth is wanted, a daytime secondary can be added within follow-the-sun. Handoff risk can be reduced with an overlap and written handoffs (E9).
- **Once noise is removed, a schedule change may not be needed at all.** — Possibly. That is why tuning comes first and the schedule change is measured in a pilot. But real actionable alerts would still wake a 24/7 primary at night (K33), and Berlin primaries would still face rest-restart call-outs (E11, E13). Whether residual night load is material cannot be determined without timestamps (E3).
- **Follow-the-sun is unfair to Berlin, which has fewer people.** — Correct, though less so than total hours suggest. Berlin carries about 11 vs 9.8 out-of-hours hours a week per person, about 12% more (K28, K26, K29), and 6 vs 4.8 weekend hours (K34, K35). In return, Berlin avoids all scheduled statutory night duty and rest restarts (E11, E16). Possible mitigations: compensate 12-hour shifts under the collective policy (amount unknown, E17), have SF take some weekend shifts, or rely on tuned load to keep each shift light. These belong in the works council negotiation.
- **Berlin weekend and holiday coverage under follow-the-sun breaks the Sunday-work ban, so follow-the-sun is unlawful.** — Not obviously. Sunday and holiday work is banned by default (s.9). Saturday is a working day and falls under the s.3 daily limits instead. Maintaining computer systems appears to fall under the s.10(1) no.14 exception for non-deferrable incidents. Working time must be recorded, and an s.13 authorisation is a fallback (E20, E22). Standby itself is rest time (E21). Berlin 24/7 weeks under option (a) or today's rotation face the same question, so it is not a point against (b) specifically. Counsel must confirm (E23-E25).
- **The 58% night figure shows most load is at night, so the schedule is the root cause.** — The figure is an unverified annotation (E1, E3). Even if accurate, at least about 140 of those night pages were non-actionable (K18), so noise is also a large share of the night problem (E19).
- **Short night acknowledgements do not interrupt rest under German law, so option (a) is fine for Berlin.** — That is a contested minority view from 2012-era commentary (E14). The mainstream secondary sources say a call-out restarts the full 11 hours (E13). A design should not depend on the contested view. Labour counsel should confirm.

## Practical implications

- Rollout step 1 (weeks 0-4): demote disk-usage-warning-80pct to a ticket or dashboard, with a separate symptom or fill-rate page if needed. Fix the flapping in cert-check-flap and replace it with an expiry-deadline alert. Review the 2 actionable queue-lag-warning cases and replace that alert with a user-visible symptom alert (E2, E8). Ask HR whether these monitoring changes need works council involvement, since BetrVG s.87(1) no.6 was not researched (E15).
- Rollout step 2 (start in week 0, in parallel): export raw timestamped page logs and measure the hour-of-day and weekend split of actionable pages before and after tuning. This settles the 58% question, the Berlin page share and the expected weekend call-out load (E3).
- Rollout step 3 (start in week 0): before the works council submission, get labour-counsel confirmation of four points. First, that Sunday and holiday call-outs fall under ArbZG s.10(1) no.14, and how call-out time will be recorded (E20). Second, whether s.3 daily maximums require reduced regular hours on Berlin on-call working days (Mon-Sat), or a rule that call-out time replaces regular work (E21, E23). Third, whether s.11 substitute rest days apply after Sunday call-outs, and whether Sunday standby alone counts as Sunday work (E24). Fourth, whether a collective agreement with s.7/s.12 opening clauses covers the Berlin entity (E25). Then open the works council consultation on a time-boxed follow-the-sun pilot. Cover Berlin 07:00-19:00, the DST boundary rule, handoff overlap placement, weekend and holiday rules, the 12-hour shift allowance under the collective policy, and rollback terms. Plan for 4-8 weeks plus the risk of an Einigungsstelle, or an s.13 authorisation if counsel requires one (E5, E15, E17, E22).
- Rollout step 4 (weeks 2-6): audit runbook, access and service-ownership coverage per office for every paging alert. Close the gaps through pairing and shadow shifts before the pilot (E18).
- Rollout step 5 (only after works council approval): pilot follow-the-sun for a fixed period. Use a 30-minute overlap taken by the incoming shift (Berlin from 06:30, SF from 09:30 PT), a mandatory written handoff in a fixed channel, and one DST rule chosen in advance. Load both offices' public-holiday calendars into the scheduling tool, and consider SF covering German holidays and some weekend shifts to offset Berlin's extra hours (E9, E10, E11, E12, E26).
- Rollout step 6: set success and rollback criteria in advance. For example: local-night pages per person at or near zero; pages per shift below 2; no missed or late acknowledgements on api-5xx, db-replica-lag or payment-webhook alerts; no s.3 or rest-period breaches in the Berlin working-time records; and a repeat burnout pulse survey. Roll back to the tuned weekly rotation if the criteria fail (E5, E6, E20).
- Do not adopt option (a) as the main fix. If a secondary is wanted for depth, make it a daytime, same-office backup within follow-the-sun, and only if pilot data shows a need (E11, E13).

## Remaining uncertainty

- The hour-of-day and weekend distribution of all pages and of actionable pages is unknown, and the 58% figure is unverified (E3).
- Per-office skills, ownership and runbook coverage are unknown (E18).
- The German collective on-call allowance and any US secondary stipend are not specified, so pay fairness and the cost of a secondary cannot be quantified (E5, E17).
- Legal points rest on search snippets or background knowledge. The statute texts were not retrieved, the trivial-interruption question is disputed (E13, E14, E15, E16), and the s.3, s.11 and s.7/s.12 points are unverified (E23, E24, E25).
- Whether Sunday standby without a call-out counts as Sunday employment, and whether the Berlin entity has a collective agreement with opening clauses, are unknown (E24, E25).
- The out-of-hours figures (K25-K31, K37-K40) assume 09:00-17:00 weekday working hours in both offices. That assumption is not in the packet.
- How often an option (a) secondary would actually be paged is unknown (E12). The combined standby figures (K31, K32, K36) therefore cannot be converted into an interruption burden, and the like-for-like comparison uses primary duty only.
- The SRE benchmarks (2 incidents per 12-hour shift, 6 per site) come from search snippets, count incidents rather than pages, and assume Google-scale services (E6, E7).
- Whether led_to_human_action was recorded reliably, and whether the 'other (14 alerts)' row hides further noise, is unknown (E1, E2).
- Boundary-crossing incident handling and handoff-related incident risk have no empirical evidence (E9).
- E18 UNKNOWN: No evidence is available on whether both offices have equal skills, service ownership and runbook or access coverage for every alert type, which follow-the-sun requires.
- E25 UNKNOWN: Collective-agreement deviations under ArbZG s.7 (daily maximum, rest periods, including extensions beyond 10h where working time regularly includes standby, and adjustment of rest periods for Rufbereitschaft) and s.12 (number of work-free Sundays, substitute rest days) may allow a collective agreement, or a works agreement based on one, to depart from the s.3, s.5 and s.11 defaults. Whether the Berlin entity is covered by any such collective agreement is unknown.
- Open question the reviewer judged decisive: What is the hour-of-day and weekday/weekend split of actionable pages after the three noise alerts are removed (from raw timestamped logs), and how does it divide between the Berlin 22:00-10:00 PT half and the SF half? The draft's case for (b) now rests mainly on removing local-night exposure (about 5.3 tuned night pages a week if pages are spread evenly), so this split directly decides whether a schedule change is worth its cost.
- Open question the reviewer judged decisive: Can each office independently handle every paging alert type (runbooks, access, service ownership)?
- Open question the reviewer judged decisive: Does labour counsel confirm that Sunday and holiday incident call-outs fall under ArbZG s.10(1) no.14, and does a collective agreement with s.7/s.12 opening clauses cover the Berlin entity?

## Further research that could change the conclusion

- Timestamped page logs. If actionable pages cluster in PT daytime, at weekends or near the boundaries, the night benefit, the benchmark fit or the fairness picture changes.
- Escalation data from comparable rotations, or a trial of a secondary role. These would show the true burden and benefit of an option (a) secondary, and whether a daytime secondary within follow-the-sun closes any reliability gap.
- A per-office runbook and access audit. Large gaps could make follow-the-sun infeasible in the near term, favouring tuning plus the current weekly rotation.
- The works council position. A refusal, or conditions such as limits on Berlin shift frequency or weekend duty, could block or reshape the pilot.
- Labour-counsel confirmation of ArbZG s.3, s.9-11 and s.5 (including the Bagatelle view), and of any collective agreement under s.7/s.12. A restrictive reading of Sunday and holiday call-outs could force SF to cover those days, or require an s.13 authorisation.
- The actual German allowance and the US secondary stipend amounts, which could change the cost and fairness ranking.
- Post-tuning page volume measured over 2-4 weeks. If residual night load is negligible, a schedule change may be unnecessary.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | The 90-day page CSV has these rows (alert, pages, led_to_human_action): disk-usage-warning-80pct 148/0; queue-lag-warning 121/2; cert-check-flap 66/0; api-5xx-rate-high 71/63; db-replica-lag 48/41; payment-webhook-failures 39/37; other (14 alerts) 47/30. The footer says: '# total pages: 540; 58% of pages fired between 20:00 and 08:00 US Pacific time'. | pages-last-90-days.csv |
| E2 | INFERRED | fixture_read | Recomputed from the CSV: the rows sum to 148+121+66+71+48+39+47 = 540, which matches the stated total. Actionable pages sum to 0+2+0+63+41+37+30 = 173, so the actionable rate is 173/540, about 32.0%. The three noise alerts (disk-usage-warning-80pct, queue-lag-warning, cert-check-flap) account for 335 pages (about 62.0% of all pages) and 2 actions (about 0.6% actionable). The other four rows have 205 pages and 171 actions (about 83.4% actionable). Removing or demoting the three noise alerts would cut page volume by about 62%, from about 6.0 to about 2.3 pages per day, and would drop only 2 of 173 actionable pages. | pages-last-90-days.csv |
| E3 | INFERRED | fixture_read | The claim that 58% of pages fired between 20:00 and 08:00 PT cannot be checked against the data. The CSV has no timestamps. 58% of 540 is 313.2, which is not a whole number, so the figure is rounded or estimated. Nothing shows the hour-of-day distribution of actionable pages, or whether night pages are mostly noise. | pages-last-90-days.csv |
| E4 | VERIFIED | fixture_read | Roster: San Francisco (US Pacific) has 5 engineers and Berlin (Central European Time) has 4. Current setup is 1 primary on a weekly 24/7 rotation with handoff Mondays 10:00 PT, and no secondary. | roster.md |
| E5 | VERIFIED | fixture_read | HR notes say: (1) in Berlin, any change to on-call schedules needs consultation with and approval by the works council (Betriebsrat), with a typical lead time of 4-8 weeks; (2) in Berlin, a night call-out interrupts the statutory 11-hour rest period, and the engineer may not start regular work until 11 hours after the call-out ends; (3) the US on-call stipend is $400/week for primary, and Germany pays an on-call allowance 'per collective policy' (no amount given); (4) in the Sep 2026 burnout survey, 7 of 9 named night pages as the main stressor. | hr-notes.md |
| E6 | INFERRED | search_result | The Google SRE book (Ch. 11 'Being On-Call', Appendix B) and the SRE Workbook on-call chapter set a target of at most 2 incidents (events) per 12-hour on-call shift, so that there is time for follow-up and postmortems. | https://sre.google/sre-book/being-on-call/ |
| E7 | INFERRED | search_result | SRE book guidance on team size, as given in search results: at least 8 engineers for a single-site on-call team, or at least 6 per site for a team split across two well-separated sites (multi-site). On-call should be no more than 25% of SRE time, framed as a share of the non-engineering half. A USENIX piece reports that many teams in practice treated 7 per site as the minimum. | https://sre.google/sre-book/being-on-call/ |
| E8 | INFERRED | search_result | SRE guidance on alerting (Ch. 6 'Monitoring Distributed Systems', as summarised in secondary notes): every page should be actionable and urgent and should need human judgement. Alert on user-visible symptoms, not causes. Cause-type signals such as disk usage percentages belong on dashboards unless they directly threaten user impact. | https://sre.google/sre-book/monitoring-distributed-systems/ |
| E9 | INFERRED | search_result | Follow-the-sun handoff practices described in vendor guidance: an overlap window of about 30 minutes in which both outgoing and incoming engineers are reachable; a fixed-format written handoff (active issues, recent deploys, watch list) posted in a known channel at a known time, treated as mandatory; at least 3 engineers per timezone to avoid single points of failure. Public holidays differ by country, and many global teams pair follow-the-sun with traditional rotations for weekends or low-staffed hours. | https://incident.io/blog/on-call-best-practices-guide-2026 |
| E10 | INFERRED (claimed CORROBORATED) | search_result | DST dates in 2026: the US springs forward Sunday 8 March 2026 and falls back Sunday 1 November 2026. The EU moves to summer time on 29 March 2026 and back on 25 October 2026 (last Sundays of March and October, at 01:00 UTC). The US-Europe offset is therefore 1 hour shorter from 8-29 March and from 25 October to 1 November. | https://www.universaltimedate.com/articles/daylight-saving-time-2026-when-clocks-change |
| E11 | INFERRED | fixture_read | Shift-boundary analysis, derived from the offsets in E10. With a 9h offset, Berlin 07:00-19:00 CET corresponds to 22:00-10:00 PT, so SF covers 10:00-22:00 PT. Neither office then has duty in the local 22:00-06:00 window, nor in the German statutory night window of 23:00-06:00. The alternative, Berlin 05:00-17:00 CET (20:00-08:00 PT) with SF on 08:00-20:00 PT, puts Berlin 1 hour (05:00-06:00) inside the German night window. During the 8h-offset weeks, if boundaries are fixed to Berlin local time (07:00-19:00), SF's half becomes 11:00-23:00 PT, adding 1 hour of SF local late evening (22:00-23:00). If boundaries are fixed to SF time instead, Berlin's shift shifts to 06:00-18:00. | roster.md |
| E12 | INFERRED | fixture_read | Per-person burden, derived from the roster and CSV. Option (a): each engineer is primary 1 week in 9, and with a secondary also on a 9-person rotation, is on call (primary or secondary) about 2 weeks in 9. The 24/7 night exposure is unchanged. Option (b): each office covers 84 h/week, which is about 16.8 h per SF engineer per week vs 21 h per Berlin engineer per week, so Berlin carries about 25% more on-call hours per person (or, in weekly blocks, 1 week in 5 for SF vs 1 week in 4 for Berlin). Raw load is 540 pages/90 days, about 6/day, about 42 per 24/7 week (about 3 per 12h shift). After removing the 3 noise alerts it is about 2.3/day, about 16 per week (about 1.1 per 12h shift). | roster.md |
| E13 | INFERRED | search_result | German secondary sources on ArbZG s.5: employees must have at least 11 hours of uninterrupted rest after daily working time ends. On-call standby (Rufbereitschaft) counts as rest unless the employee is actually called to work. A call-out generally restarts the full 11-hour rest regardless of how long it lasted. There are exceptions (e.g. hospitals, s.5(3)) and room for collective-agreement deviations. | https://www.haufe.de/id/beitrag/ruhezeiten-arbeitsrecht-HI727265.html |
| E14 | INFERRED | search_result | Some German commentary (a Luther law-firm publication from 2012, an LMU ZAAR lecture handout, hrworks) argues that trivial interruptions such as a short phone call or email may not count as interrupting the rest period ('Bagatelle' / teleological reduction). The boundary is disputed and fluid. | https://www.luther-lawfirm.com/uploads/tx_fwluther/2012_Smartphone_versus_Arbeitsrecht.pdf |
| E15 | INFERRED | search_result | Under BetrVG s.87(1) no.2 the works council has co-determination rights over the start and end of daily working time and how it is distributed. On-call (Rufbereitschaft) periods count as working time for this purpose, so both introducing on-call and drawing up the on-call plan need works council agreement. The local works council is normally competent. If no agreement is reached, the conciliation board (Einigungsstelle) decides and its ruling replaces the agreement (s.87(2)). Whether s.87(1) no.3 applies is disputed; most sources say it usually does not for permanent on-call arrangements. | https://www.dgb-bildungswerk-nrw.de/downloads/igm/2017/FMTagung/IG-Metall_Muster_BV_Notdienst_und_Rufbereitschaft_im_Elektro-Handwerk.pdf |
| E16 | INFERRED | search_result | ArbZG s.2(3) defines night time as 23:00-06:00. Under s.2(4), night work is any work covering more than 2 hours of night time. | https://lexetius.com/ArbZG/2 |
| E17 | INFERRED | search_result | German on-call pay varies by agreement. In public-sector tariffs (TVöD), on-call under 12h is paid hourly at 12.5% of the hourly wage on weekdays (15% Saturday, 25% Sunday/holiday), and periods over 12h at a flat daily rate. In the private sector there is no statutory rate; pay is set by contract or works agreement, often 12.5-25% of the hourly wage. Actual call-out work is paid as working time. | https://www.fachanwalt.de/magazin/arbeitsrecht/rufbereitschaft |
| E18 | UNKNOWN | none | No evidence is available on whether both offices have equal skills, service ownership and runbook or access coverage for every alert type, which follow-the-sun requires. | none |
| E19 | INFERRED | fixture_read | The burnout survey (7 of 9 cite night pages) together with the CSV (62% of pages come from 3 alerts with almost no actions) suggests that structure (night exposure) and volume (noise) are separate contributors. Whether most night pages are noise cannot be confirmed without timestamps. | hr-notes.md |
| E20 | INFERRED | search_result | ArbZG s.9 sets a general ban on employing workers on Sundays and public holidays, and s.10 lists statutory exceptions. A KomNet (NRW labour-protection advisory service) answer classes an IT company under s.10(1) no.14 (maintaining data networks and computer systems). Any Sunday or holiday work under the s.10 exceptions requires that the work cannot be done on working days. A further KomNet answer on repair work under no.14 says such work does not have to be notified to the authority, but the working hours must be recorded (s.16(2) ArbZG). | https://www.komnet.nrw.de/_sitetools/dialog/19289 |
| E21 | CORROBORATED | search_result | Rufbereitschaft counts as rest time as long as the employee is not called on to work. Time actually spent working during Rufbereitschaft (the call-out) counts as working time. | https://www.komnet.nrw.de/_sitetools/dialog/19289 |
| E22 | INFERRED | search_result | If an activity does not fall under the s.10 exceptions, Sunday or holiday employment can be authorised by the competent authority under ArbZG s.13 (e.g. s.13(3) no.2 on application). A Saxon administrative-court case on telephone service support dealt with such an s.13 authorisation. | https://www.justiz.sachsen.de/ovgentschweb/documents/24A188.pdf |
| E23 | HYPOTHETICAL | none | ArbZG s.3 (content not retrieved in this run; from general background knowledge only): daily working time on working days (Werktage, Mon-Sat) may not exceed 8 hours. It may be extended to up to 10 hours if it averages 8 hours over 6 calendar months or 24 weeks. Applied to the Berlin 07:00-19:00 design, the 12h standby is not working time (E21). But if a Berlin engineer works a normal 8h day while on shift and has call-outs on top, more than 2h of call-out time would push the day past the 10h ceiling. Any time over 8h must also be offset within the averaging period. | none |
| E24 | HYPOTHETICAL | none | ArbZG s.11 (not retrieved; background knowledge only): even where Sunday work is permitted, at least 15 Sundays per year must stay work-free. Employees who work on a Sunday must get a substitute rest day within 2 weeks (within 8 weeks for a weekday public holiday). Sunday and holiday working time is subject to the s.3 limits. Applied to option (b), a rotation of 4 Berlin engineers covering every weekend would need tracking of which Sundays count as 'worked' for each person. | none |
| E25 | UNKNOWN | none | Collective-agreement deviations under ArbZG s.7 (daily maximum, rest periods, including extensions beyond 10h where working time regularly includes standby, and adjustment of rest periods for Rufbereitschaft) and s.12 (number of work-free Sundays, substitute rest days) may allow a collective agreement, or a works agreement based on one, to depart from the s.3, s.5 and s.11 defaults. Whether the Berlin entity is covered by any such collective agreement is unknown. | none |
| E26 | HYPOTHETICAL | none | Berlin public holidays differ from US holidays and include state-specific days (background knowledge: e.g. Internationaler Frauentag, 8 March, is a public holiday in Berlin). Under option (b), the Berlin half of coverage on those days falls under the s.9 holiday ban, so call-outs then depend on the s.10 exceptions (E20). | none |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 12 web search(es), 5 fetch attempt(s), 3 supplied document(s) read.
- search: "Google SRE book "Being On-Call" maximum two incidents per 12-hour shift" (17 results)
- search: "ArbZG § 5 Ruhezeit 11 Stunden Rufbereitschaft Einsatz Unterbrechung" (18 results)
- search: "BetrVG § 87 Abs. 1 Nr. 2 Rufbereitschaft Mitbestimmung Betriebsrat" (19 results)
- search: "SRE book on-call 25% time limit minimum eight engineers single-site six per site multi-site" (20 results)
- search: "2026 daylight saving time dates US March 8 November 1 Europe March 29 October 25 time difference" (4 results)
- search: "follow-the-sun on-call handoff best practices shift handover checklist PagerDuty" (10 results)
- search: ""Monitoring Distributed Systems" SRE "every page" actionable "symptoms" pages should be urgent actionable" (20 results)
- search: "Nachtarbeit ArbZG § 2 Abs. 3 23 bis 6 Uhr Nachtzeit Definition Rufbereitschaft" (16 results)
- search: "Rufbereitschaft Vergütung Pauschale Tarifvertrag Höhe IT Rufbereitschaftszulage pro Tag Wochenende" (16 results)
- search: "§ 87 Abs. 2 BetrVG Einigungsstelle Einigung kommt nicht zustande Rufbereitschaftsplan" (18 results)
- search: "Ruhezeit Unterbrechung Rufbereitschaft kurzer Anruf geringfügig neu beginnen Remote Einsatz IT" (18 results)
- search: "§ 10 ArbZG Sonn- und Feiertagsbeschäftigung Ausnahmen IT Rufbereitschaft Datenverarbeitung" (20 results)
2. **Sources inspected:**
- hr-notes.md (fixture_read)
- roster.md (fixture_read)
- pages-last-90-days.csv (fixture_read)
   Cited from search snippets only (not opened):
- https://sre.google/sre-book/being-on-call/
- https://sre.google/sre-book/monitoring-distributed-systems/
- https://incident.io/blog/on-call-best-practices-guide-2026
- https://www.universaltimedate.com/articles/daylight-saving-time-2026-when-clocks-change
- https://www.haufe.de/id/beitrag/ruhezeiten-arbeitsrecht-HI727265.html
- https://www.luther-lawfirm.com/uploads/tx_fwluther/2012_Smartphone_versus_Arbeitsrecht.pdf
- https://www.dgb-bildungswerk-nrw.de/downloads/igm/2017/FMTagung/IG-Metall_Muster_BV_Notdienst_und_Rufbereitschaft_im_Elektro-Handwerk.pdf
- https://lexetius.com/ArbZG/2
- https://www.fachanwalt.de/magazin/arbeitsrecht/rufbereitschaft
- https://www.komnet.nrw.de/_sitetools/dialog/19289
- https://www.justiz.sachsen.de/ovgentschweb/documents/24A188.pdf
3. **Checks executed:**
- Evidence registry validation: 26 accepted, 0 rejected (source never retrieved / schema), 1 classification downgrade(s)
- Deterministic quality gates over 3 draft(s)
- Calculation K1 re-executed: 148+121+66+71+48+39+47 = 540 (claimed 540) → match
- Calculation K2 re-executed: 0+2+0+63+41+37+30 = 173 (claimed 173) → match
- Calculation K3 re-executed: 173/540*100 = 32.03703703703704 (claimed 32.04) → match
- Calculation K4 re-executed: (148+121+66)/540*100 = 62.03703703703704 (claimed 62.04) → match
- Calculation K5 re-executed: 2/(148+121+66)*100 = 0.5970149253731344 (claimed 0.597) → match
- Calculation K6 re-executed: (63+41+37+30)/(71+48+39+47)*100 = 83.41463414634146 (claimed 83.41) → match
- Calculation K7 re-executed: 540/90 = 6 (claimed 6) → match
- Calculation K8 re-executed: (71+48+39+47)/90 = 2.2777777777777777 (claimed 2.278) → match
- Calculation K9 re-executed: (71+48+39+47)/90*7 = 15.944444444444443 (claimed 15.94) → match
- Calculation K10 re-executed: 540/90/2 = 3 (claimed 3) → match
- Calculation K11 re-executed: (71+48+39+47)/90/2 = 1.1388888888888888 (claimed 1.139) → match
- Calculation K12 re-executed: 84/5 = 16.8 (claimed 16.8) → match
- Calculation K13 re-executed: 84/4 = 21 (claimed 21) → match
- Calculation K14 re-executed: (21/16.8-1)*100 = 25 (claimed 25) → match
- Calculation K15 re-executed: 0.58*540 = 313.2 (claimed 313.2) → match
- Calculation K16 re-executed: (173-2)/173*100 = 98.84393063583815 (claimed 98.84) → match
- Calculation K17 re-executed: 540-173 = 367 (claimed 367) → match
- Calculation K18 re-executed: 0.58*540-173 = 140.2 (claimed 140.2) → match
- Calculation K19 re-executed: 2/9*100 = 22.22222222222222 (claimed 22.22) → match
- Calculation K20 re-executed: 540/90*7 = 42 (claimed 42) → match
- Calculation K21 re-executed: 540/90*7*0.58 = 24.36 (claimed 24.36) → match
- Calculation K22 re-executed: 21+7 = 28 (claimed 28) → match
- Calculation K23 re-executed: 168/9 = 18.666666666666668 (claimed 18.67) → match
- Calculation K24 re-executed: 2*168/9 = 37.333333333333336 (claimed 37.33) → match
- Calculation K25 re-executed: 5*5+2*12 = 49 (claimed 49) → match
- Calculation K26 re-executed: (5*5+2*12)/5 = 9.8 (claimed 9.8) → match
- Calculation K27 re-executed: 5*4+2*12 = 44 (claimed 44) → match
- Calculation K28 re-executed: (5*4+2*12)/4 = 11 (claimed 11) → match
- Calculation K29 re-executed: (11/9.8-1)*100 = 12.244897959183664 (claimed 12.24) → match
- Calculation K30 re-executed: (168-40)/9 = 14.222222222222221 (claimed 14.22) → match
- Calculation K31 re-executed: 2*(168-40)/9 = 28.444444444444443 (claimed 28.44) → match
- Calculation K32 re-executed: 2*8*7/9 = 12.444444444444445 (claimed 12.44) → match
- Calculation K33 re-executed: (71+48+39+47)/90*7*8/24 = 5.314814814814814 (claimed 5.315) → match
- Calculation K34 re-executed: 2*12/4 = 6 (claimed 6) → match
- Calculation K35 re-executed: 2*12/5 = 4.8 (claimed 4.8) → match
- Calculation K36 re-executed: 2*48/9 = 10.666666666666666 (claimed 10.67) → match
- Calculation K37 re-executed: (1-9.8/((168-40)/9))*100 = 31.093749999999986 (claimed 31.09) → match
- Calculation K38 re-executed: (1-11/((168-40)/9))*100 = 22.65625 (claimed 22.66) → match
- Calculation K39 re-executed: 8*7/9 = 6.222222222222222 (claimed 6.222) → match
- Calculation K40 re-executed: 48/9 = 5.333333333333333 (claimed 5.333) → match
- Calculation K41 re-executed: 52-52/4 = 39 (claimed 39) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://sre.google/sre-book/being-on-call/ — getaddrinfo ENOTFOUND sre.google. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does not 
- Fetch failed: https://www.gesetze-im-internet.de/arbzg/__5.html — getaddrinfo ENOTFOUND www.gesetze-im-internet.de. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domai
- Fetch failed: https://www.gesetze-im-internet.de/betrvg/__87.html — getaddrinfo ENOTFOUND www.gesetze-im-internet.de. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domai
- Fetch failed: https://www.gesetze-im-internet.de/arbzg/__3.html — getaddrinfo ENOTFOUND www.gesetze-im-internet.de. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domai
- Fetch failed: https://lxgesetze.de/arbzg/10 — getaddrinfo ENOTFOUND lxgesetze.de. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or does no
- Research call blocked by budget guard: WebSearch — research budget exhausted: WebSearch 12/12 for run r20261111T044611-883c6949
- Research call blocked by budget guard: WebSearch — research budget exhausted: WebSearch 12/12 for run r20261111T044611-883c6949
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G2 unresolved: The CSV has no per-page timestamps. The hour-of-day distribution of all pages and of actionable pages, and the 58% 20:00-08:00 PT claim, cannot be verified. Raw timestamped page logs are needed.
- Knowledge gap G5 unresolved: The German collective on-call allowance amount is not in the HR notes, so it cannot be compared with the $400/week US stipend. No US secondary stipend is defined. The statute texts for ArbZG s.3, s.5, s.7, s.9-13 and BetrVG s.87 could not be fetched: www.gesetze-im-internet.de and lxgesetze.de were unreachable (ENOTFOUND), and both hosts have to be allowed in the session's network settings. The WebSearch budget ran out after one D1 search, so s.3 (8h/10h), s.11 (15 free Sundays, substitute rest days) and s.7/s.12 (collective-agreement deviations) rest only on background knowledge (E23-E25, HYPOTHETICAL/UNKNOWN). Several questions stay open: whether pure Sunday standby without a call-out counts as Sunday employment, whether the Berlin entity has a collective agreement with opening clauses, and the exact wording of s.10(1) no.14. All need labour-counsel confirmation. Whether alert-tuning changes need works council involvement was not researched.
- Knowledge gap G6 unresolved: sre.google was unreachable (ENOTFOUND; needs to be allowed in network settings), so the SRE book figures (2 incidents per 12h shift, 8 single-site / 6 per site, 25% cap) come only from search snippets. No empirical study of handoff-related incident risk in follow-the-sun was found.
- Knowledge gap G3 unresolved: Office skills, ownership and runbook coverage per office are unknown (E18). Weekend and public-holiday coverage under follow-the-sun is only partly addressed: E20-E26 cover the legal side, but no Berlin/US holiday calendar was retrieved and the weekend call-out load is not quantified for lack of timestamps.
5. **Independent validation status:** NOT INDEPENDENTLY VALIDATED. Only the in-pipeline adversarial review (same model family, fresh context) and deterministic checks were applied.
6. **Remaining uncertainty:** 15 item(s), listed above.
7. **Revisions:** 2
- cycle 1 (both): [coverage/major] D1 [criteriaAssessments C4; CL5, CL9, CL10; verdict; practicalImplications step 3] The legal analysis of the recommended Berlin 07:00-19:00 12-hour shift only checks the ArbZG night window (s.2) and the 11-hour rest rule (s.5). It leaves out the daily maximum working time in ArbZG s.3 (8 h, extendable to 10 h) and the Sunday and public-holiday work ban in ArbZG s.9-10. Under follow-the-sun, a Berlin engineer works a normal day and is also on call 07:00-19:00, every day of their on-call week including Saturday and Sunday. Call-outs at 07:00-09:00 or 17:00-19:00 count as working time and can push the day past 10 h. Any weekend or holiday call-out is Sunday or holiday work, which needs a statutory exception. The request asks for 'anything that could block or complicate the rollout', and the verdict calls the Berlin shift legally clean because it 'sits entirely outside the statutory night window'. That framing leaves out a plausible complication, and possibly a blocker, for the recommended design. The packet does not research it either, so the gap was not flagged.; [decision_usefulness/major] D2 [verdict (Step 2/Step 3 wording) vs practicalImplications step 3 and step 5] The verdict and the rollout steps disagree on when works council approval comes. The verdict says 'Step 2: run a time-boxed pilot... Step 3: confirm it only after the works council agrees', which implies the pilot can start before approval. practicalImplications step 5 says the pilot starts 'after approval'. HR notes (E5) and BetrVG s.87 (E15) say any change to the Berlin on-call schedule, a pilot included, needs works council approval first. A reader of the verdict alone could start an unlawful pilot in Berlin.; [coverage/major] D3 [criteriaAssessments C1, C3; CL7, CL8; K12-K14, K23-K24] C1 covers 'night-time and out-of-hours interruptions', but the draft only analyses the local-night window (22:00-06:00). Under the recommended split, SF is on call until 22:00 local on every on-call day, which covers the evening 18:00-22:00. Berlin covers 07:00-09:00 and 17:00-19:00 outside normal hours. Both offices also cover full 12-hour weekend days. The fairness comparison (CL7: 16.8 h vs 21 h vs 18.7 h today) treats business-hours on-call time the same as out-of-hours time. That makes the comparison apples-to-oranges: much of a 12-hour daytime shift overlaps normal working hours and costs far less than 24/7 hours. The draft does not quantify out-of-hours or weekend on-call hours per person per office, which is the metric that actually matters for burnout and fairness.; [alternatives_counterarguments/major] D4 [alternatives; counterarguments[0]; criteriaAssessments C1/C5] Option (a) is never assessed together with noise tuning. The alternatives list contains '(a) with no noise tuning', '(b) with no noise tuning', 'noise removal only' and 'hybrid = tuning + (b)'. The recommended hybrid therefore gets credit for tuning (1.1 pages per shift) that option (a) would get too. The fair comparison is (a)+tuning vs (b)+tuning, and it is missing. The counterargument response on (a) ('after tuning, load is about 2.3 pages a day') quietly uses tuning against (a) without scoring (a)+tuning. Variants of (a) are also not considered, such as a secondary in the opposite office who takes the primary's local-night pages. That variant would answer C1 without 12-hour shifts.
- cycle 2 (reanalysis): [reasoning_validity/major] D1 [verdict; criteriaAssessments C1 (assessment, strengths), C3; CL18, CL19; alternatives 'Option (a) with noise tuning' and 'Recommended hybrid'; counterargument[0]; K31, K32, K36] The new out-of-hours comparison counts secondary standby hours the same as primary hours for option (a), and then sets that against follow-the-sun with no secondary. K31 (2*(168-40)/9 = 28.44 h), K32 (12.44 local-night h) and K36 (10.67 weekend h) all double the primary figure because a secondary is added. A secondary is only paged on escalation, so it carries far less interruption load than a primary. The draft itself says how often the secondary would be paged is unknown (E12 limitations). The draft's own rollout also allows a daytime secondary within follow-the-sun, so the comparison does not hold like for like. Even so, the 28.4 h vs 9.8-11 h gap is used as a main argument: the verdict, C1 strengths, alternatives ('less than half the out-of-hours load per person'), and the first counterargument response. The fairer like-for-like figure is the primary-only 14.2 h (K30) vs 9.8-11 h. That gap is still real but much smaller (about 23-31% lower). The ranking probably survives on the zero-local-night point, but the size of the out-of-hours advantage is overstated.
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency: [minor/deterministic] 1 evidence classification violation(s) downgraded by registry
- PASS reasoning_validity: [minor/reviewer] D1 [verdict ('Saturday included'); criteriaAssessments C4 assessment; edgeCasesAndFailureModes item 5 ('full 8-hour working day (Mon-Sat)'); rollout step 3 ('Berlin on-call working days (Mon-Sat)')] The text that was changed to fix the Saturday/s.9 problem now overreaches the other way. The verdict says call-outs 'on top of a normal working day, Saturday included, may exceed the s.3 daily ceiling'. C4 says 'On working days (Mon-Sat), call-outs on top of a normal 8-hour day could exceed the s.3 ceiling'. The draft's own working-hours assumption is 09:00-17:00 on weekdays only (K25-K30), so a Berlin engineer has no normal 8-hour day on Saturday. The 8 h + more than 2 h call-out breach scenario therefore applies Monday to Friday. On Saturday, s.3 is reached only by call-outs alone. The correct legal point is that s.3 covers Saturday and s.9 does not. Saying that Saturday call-outs sit on top of a normal workday overstates the Saturday s.3 risk.
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability
