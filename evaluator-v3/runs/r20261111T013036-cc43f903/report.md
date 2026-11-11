# Evaluation: Whether to commit now to sharding the orders-platform Postgres cluster (prod-orders-pg) into 16 customer_id shards, compared with alternatives for its disk-capacity problem

**Decision objective:** Decide what to recommend at Thursday's architecture review: (a) commit to a 2-3 quarter, 16-shard customer_id sharding project starting next sprint that freezes most feature work, or (b) take cheaper near-term actions (online volume resize, archiving or partitioning audit_events under the retention policy, reclaiming bloat) and defer sharding until a real scaling limit appears, plus a clear trigger for when to revisit it. The recommendation has to rest on recomputed runway and growth figures, not the figures stated in the request.

## Verdict

Recommend option (b). Do not commit to the 16-shard customer_id project starting next sprint. Soon, grow the primary volume online, and grow the two read-replica volumes (and any standby or backup target) first or at the same time. Then take audit_events rows older than 12 months off the primary under retention policy v3 and make that a recurring job. Revisit sharding only when a measured trigger fires (see practicalImplications). The urgency premise is wrong. Month-over-month growth was 35, 35 and 80 GB, and the October 80 GB includes a documented one-off 45 GB backfill, so organic growth is about 35 GB/month, not 80 (K1-K4). At that rate the 160 GB free lasts about 4.57 months to 100%, not 2 (K5, K7, K8). The cluster is at 92% (K6). If the team alerts at 90% and treats 95% as a safety line (both are assumed thresholds, not given in the packet), 95% is about 1.71 months away (K9). So the disk needs prompt action, and that action is a resize, not a re-architecture. Compute is far from any limit: write TPS headroom is about 4.19x, connections are at 41% and CPU p95 is 34% (K13, K14; E7). Sharding solves throughput, compute and working-set limits, and none of those is near. Archival can work in two ways. If the old space goes back to the filesystem (partition drop, or DELETE plus a rewrite), usage falls to about 1,060 GB, about 53% of the current volume (K10, K11), which is about 26.9 months of runway even at the full 35 GB/month (K12). If old rows are only DELETEd and the space is reused inside the table (E12), disk usage stays at 1,840 GB. New audit inserts stop adding to disk, so net growth falls to roughly the non-audit share, estimated at about 16.5 GB/month (K24). Runway on the current volume would then be only about 9.7 months as a central estimate (K25), and realistically somewhere around 8-12 months, because the audit/non-audit split is estimated rather than measured. The resize should come first. Any rewrite (pg_repack or VACUUM FULL) requires it, because every estimate of pg_repack's free-space need exceeds the 160 GB free (K5, K18, K19), and a pg_repack that runs out of space fails partway (E14). Do not start a rewrite on the 92%-full disk. DELETE-and-reuse is the only removal path that does not strictly need the resize, but its WAL must fit on the primary and on every replica, and a 92%-full disk leaves little margin for that. Up to the 16,000 GB online ceiling, runway is decades at the corrected rate (K15). Open risks: we don't know whether audit_events is partitioned, the cloud platform and the replica volume setup are not confirmed, no query logs prove nothing reads the old rows, and ticket ORD-2231 was not checked. Confidence is therefore moderate.

**Confidence:** moderate  ·  **Certified by quality gates:** yes

## Corrected assumptions

- **Assumption:** The database is growing about 80 GB per month.
  **Correction:** Organic growth is about 35 GB/month. October's 80 GB included a one-off 45 GB backfill (ORD-2231); the other two deltas were 35 GB each. [E1, E2, E4]
- **Assumption:** There are roughly two months before hitting the wall.
  **Correction:** About 4.57 months to 100% at 35 GB/month. Against an assumed 95% safety line it is about 1.71 months, so a resize is needed soon. With the resize and archival, runway is years. [E1, E4, E8]
- **Assumption:** Sharding is the only durable fix ('nothing else scales').
  **Correction:** Measured compute, write throughput and connections have more than 3x headroom, and storage is the only resource trending toward a limit. Online resize up to about 16 TB and policy-authorized archival of at least 780 GB address storage without sharding. [E7, E8, E5, E6]
- **Assumption:** The cluster is at 92% disk.
  **Correction:** Confirmed for the primary: 1,840 / 2,000 GB = 92%. But 'used' appears to be relation size only, since the table sizes add up to exactly 1,840 GB, so WAL and slot retention may not be included. The replicas' disk usage is not reported. [E1, E5, E7]
- **Assumption:** Sharding is a 2-3 quarter project that would freeze most feature work.
  **Correction:** Not verifiable from the evidence. Citus guidance implies schema-wide changes, and a public comparable took months, which is consistent in scale but not confirmed for this schema. [E15, E16, E18]

## Criteria

### C1 Accuracy of runway and growth-rate estimate (weight 25)

The stated 80 GB/month and 2-month runway are wrong. The month-end series 1,690 → 1,725 → 1,760 → 1,840 GB gives deltas of 35, 35 and 80 GB (K1-K3). The capacity report attributes 45 GB of October's growth to a one-off shipment_events backfill (ORD-2231) that it says is not expected to recur. Without it, October's organic growth is 35 GB (K4), the same as the two months before. Free space is 160 GB and usage is 92% (K5, K6). Corrected runway to 100% is about 4.57 months, against 2 months at 80 GB/month (K7, K8). Alert thresholds are not given in the packet. If the team alerts at 90% and treats 95% as a safety line (assumed values), the cluster is already past the first and about 1.71 months from the second (K9). That makes a resize time-sensitive, but it does not support starting sharding next sprint. [E1, E2, E3, E4, E5, E18]

*Mechanisms:* The staff engineer took the one month that contained a documented one-off load and treated it as the run rate. A single-month delta that includes a bulk migration overstates steady growth. The two clean months match each other exactly (35 GB each), which supports reading 35 GB/month as the organic rate. Since the 6-table breakdown adds up to exactly 1,840 GB (K16), 'used' appears to be relation size only. WAL or replication-slot retention could therefore add usage that the series does not show.

*Strengths:*
- The base series is VERIFIED fixture data (E1).
- The backfill exclusion is documented in the same report (E2), and the result matches the two prior months.
- The 92% figure is confirmed exactly (K6).

*Weaknesses:*
- Only 3 deltas. There is no longer history to test for acceleration or seasonality (E1).
- ORD-2231 was not inspected, so 'not expected to recur' rests on SRE's word (E2).
- 'Used' may exclude WAL and slot retention, so true disk pressure could be higher (E5).
- The 90% and 95% thresholds are assumptions, not sourced operating limits.

### C2 Storage relief from data lifecycle (audit_events archival or partitioning) (weight 20)

Data lifecycle is the biggest lever. audit_events is 1,020 GB, about 55.4% of used space (K17), and 780 GB of it is older than 13 months (E5). Policy v3 section 4.2 allows audit events older than 12 months to move to cold object-storage archive for 6 years. It also says archived events do not need to be queryable from the transactional DB (E6). So at least 780 GB is eligible now, plus the unquantified 12-13 month band. There are three removal paths. (1) If audit_events is time-partitioned, exporting and then dropping or detaching old partitions frees space at once and avoids VACUUM overhead (E13). Usage would fall to about 1,060 GB, about 53% (K10, K11). (2) If it is not partitioned, a batched DELETE does not shrink files, but plain VACUUM keeps the freed space for reuse within the same table (E12). audit_events is append-only (E5), so new audit inserts would fill about 780 GB of reusable space inside the table. That stops audit_events from growing on disk, and a rolling monthly DELETE keeps it that way. It needs no exclusive lock and no extra free space for a rewrite. Disk usage stays at about 1,840 GB, though, so net growth falls only to the non-audit share. Assuming the 240 GB of audit rows younger than 13 months (K18) accumulated evenly, audit adds about 18.5 GB/month (K23), leaving about 16.5 GB/month of other growth (K24). (3) Returning the space to the OS on an unpartitioned table needs a rewrite: VACUUM FULL with an exclusive lock (E12), or pg_repack online (E14). pg_repack's free-space need is uncertain because E14's '2x' wording is unverified. It is about 240 GB (K18) if the extra space is just the rebuilt copy of the retained rows, about 480 GB (K19) if '2x' applies to the retained data, and far more if it applies to the full 1,020 GB physical table. Every reading exceeds the 160 GB free (K5). Path (2) makes a rewrite optional rather than required. [E5, E6, E12, E13, E14, E17]

*Mechanisms:* PostgreSQL returns space to the operating system only when relation files are dropped or rewritten. DROP or DETACH of a partition removes whole files. DELETE plus VACUUM only marks space as reusable inside the table, which is enough to stop growth on an append-only table but does not lower the 'used' figure. All paths except partition drop write a large amount of WAL. A mass DELETE logs every row removal, and a rewrite logs the new copy. That WAL has to be held on the primary and replayed on each replica, and it is why the order of resize and archival matters. The packet does not quantify the volume. A rolling retention job also caps audit_events at about 12 months of data and cuts freeze and vacuum work on an 8.9B-row append-only table (E17).

*Strengths:*
- Explicit Legal and Security policy authorization (E6, VERIFIED).
- A large, VERIFIED volume of eligible data (E5).
- Creates a repeatable retention mechanism, not a one-off cleanup (E13).
- A DELETE-and-reuse path exists that needs no rewrite and no extra free space (E12, E5).

*Weaknesses:*
- We don't know whether audit_events is partitioned, so the timeline and effort are uncertain (E5, E13).
- Converting an unpartitioned 1 TB table to partitions is a migration project of its own (E13).
- No pg_stat_statements or query-log evidence shows that no application, report or foreign key reads the old rows (E6).
- The archive must be kept for 6 years, so export integrity has to be verified before anything is dropped (E6).
- WAL volume, vacuum load and replica lag from a batched 780 GB DELETE are not quantified in the packet.
- The audit/non-audit growth split (K23, K24) assumes even accumulation over 13 months and ignores the unquantified 12-13 month band. It is not measured.

### C3 Availability and safety of short-term capacity levers (online volume resize, bloat reclaim) (weight 15)

An online resize is very likely available and removes the immediate wall within hours to days. SRE describes the volume as 'gp-ssd, online-resizable up to 16,000 GB, no downtime' (E8). If the platform is AWS, EBS gp2/gp3 supports in-use size increases up to 16,384 GiB, with a 6-24 hour 'optimizing' phase afterwards (E9). The older 6-hour cooldown between modifications (E10) appears to be superseded. A 2026-07-15 AWS announcement allows up to four RDS storage modifications per 24 hours, and write-ups report that the EBS cooldown was removed (E11). Caveats: the platform is not confirmed as AWS. RDS increases must be at least 10%, storage cannot be shrunk afterwards, and a modification in progress cannot be cancelled. An older note mentions brief downtime on Single-AZ RDS (E11). Replicas and backups are a gap in the plan. The capacity report covers the primary only (E1), and the cluster has 2 read replicas (E7). If they are physical streaming replicas, which the packet does not state, they hold the same data and fill at the same rate as the primary. Their volumes, and any standby or backup target, must then be grown first or at the same time, or a replica can run out of disk even after the primary is resized. The WAL from archival or a rewrite (C2) also has to fit on every replica. As an illustration, growing to 4,000 GB alone gives about 61.7 months at 35 GB/month (K20). Bloat reclaim cannot be sized because no bloat data was supplied. [E8, E9, E10, E11, E5, E1, E7]

*Mechanisms:* Block-storage elastic resizing changes capacity without detaching the volume. Self-managed hosts then need a filesystem grow step (E9). Each replica is a separate node with its own volume, so a primary resize does not change replica capacity. A replica that runs out of disk stops replaying WAL and may have to be rebuilt. Because storage cannot be shrunk later (E11), oversizing is a permanent cost. A moderate increase followed by archival is better than jumping straight to 16 TB.

*Strengths:*
- Two internal SRE statements (E8, CORROBORATED).
- Vendor documentation patterns are consistent with the claim (E9, E11).
- Fast: hours, not quarters.

*Weaknesses:*
- The platform is not named, so the vendor match is provisional (E8, E9).
- Replica volume sizes and replication type are not in the packet. The capacity report covers the primary only (E1, E7).
- Cost, IOPS and throughput scaling, and the effect on backup, restore and replica rebuild times were not researched (E9).
- Possible brief downtime on Single-AZ RDS (E11).
- Bloat and WAL reclaim cannot be quantified (E5).

### C4 Whether a non-storage scaling limit actually justifies sharding (weight 15)

No measured non-storage limit justifies sharding now. 30-day p95 figures: CPU 34%; write TPS 2,150 against 9,000 tested headroom, about 4.19x (K13); connections 410/1,000, 41% (K14); replica p99 lag 140 ms. The report summary says storage is the only resource trending toward a limit (E7). The staff engineer's 'nothing else scales' (E3) conflicts with this measured data. Hidden limits are still possible, such as working set versus RAM or freeze and vacuum pressure on the 8.9B-row append-only audit_events (E17), but none was measured. Archiving would reduce the freeze pressure, not add to it. [E7, E3, E17]

*Mechanisms:* Splitting one database into 16 shards spreads CPU, write I/O, memory and connections across nodes. That pays off when one node runs out of those resources. Disk capacity on a resizable volume can be added without splitting anything, so sharding is the wrong tool for a disk-only problem.

*Strengths:*
- VERIFIED metrics with more than 3x headroom (E7).

*Weaknesses:*
- Point-in-time p95 only, with no trend (E7).
- No working-set, vacuum-duration, XID or freeze-age, or PostgreSQL-version data (E7, E17).

### C5 Cost, risk and opportunity cost of the sharding project (weight 15)

Sharding is expensive and risky compared with what it buys today. Citus-style multi-tenant migration requires every table to carry customer_id, with backfill where it is missing. Primary and foreign keys become compound keys, often the most invasive change. Distribution column types must match, inserts must include the tenant ID, and shared tables become reference tables (E15). Notion's sharding was described as months of focused engineering (E16). That is consistent in scale with the 2-3 quarter estimate, but it is not a quantified match. The proposal's 2-3 quarter feature freeze is an unverified estimate (E18). We can't confirm it, and we can't confirm that customer_id is a sound shard key: no schema, cross-customer query inventory or skew data was supplied. Opportunity-cost frame for the review: team size is not in the packet, so the cost can only be stated as a formula. Freezing 'most feature work' for 2-3 quarters (6-9 months) costs roughly N engineers × 6-9 months of feature capacity, where N is the affected team. Option (b) costs hours to days for the resize (E9, E11) plus an archival effort whose size depends on partitioning (E13). Our judgment is days to weeks if a partition drop or DELETE-and-reuse is possible, and longer if a partition conversion is needed. The benefit side of sharding is close to zero today, because no non-storage limit is near (C4) and the storage problem has cheaper fixes (C2, C3). [E15, E16, E18, E7, E9, E11, E13]

*Mechanisms:* Sharding by tenant makes cross-customer queries, global uniqueness and multi-customer transactions distributed operations. A badly chosen key, with skewed whales or cross-tenant access patterns, creates hot shards and is costly to reverse. A feature freeze is a direct business opportunity cost that scales with team size and freeze length.

*Strengths:*
- The Citus guidance is CORROBORATED and specific about what has to change (E15).

*Weaknesses:*
- No effort estimate specific to this schema (E15).
- The Notion comparison is secondary and unquantified (E16).
- Customer_id skew and cross-customer access are unknown (E15).
- Team size is not in the packet, so the opportunity cost can't be put in person-months.

### C6 Long-term durability and revisit triggers of the alternative plan (weight 10)

The alternative is not 'kicking the can' in any short-horizon sense. If the old audit space is returned to the filesystem (partition drop, or DELETE plus a rewrite after the resize), runway on the current 2,000 GB volume is about 26.9 months at 35 GB/month (K12) and about 11.75 months at the disputed 80 GB/month (K21). Both figures are conservative because they keep the full growth rate. A rolling 12-month retention job caps audit_events, so net growth would fall toward the non-audit share of about 16.5 GB/month (K24, an estimate). With DELETE-and-reuse only and no resize, usage stays at 1,840 GB and runway is about 9.7 months as a central estimate (K25), realistically roughly 8-12 months given the unmeasured growth split. That is why the resize is part of the plan. Up to the 16,000 GB online ceiling, without any archival, runway is about 33.7 years at 35 GB/month (K15), and about 11.2 years even if growth tripled to 105 GB/month (K22). These ceiling figures only show that disk is not a reason to shard. They do not show that a single node of 8-16 TB is operationally acceptable. Backup duration, restore and point-in-time-recovery time, and replica rebuild time all grow with data size, and none was researched (E9). Retention keeps the live dataset near the current size, so it avoids testing that limit. The real long-term limit is therefore compute or throughput, or operational scale (backup, restore and vacuum times on a very large single node), not disk. That is what the triggers should watch. The thresholds proposed under practicalImplications are judgment calls, not evidence-derived. [E1, E5, E6, E7, E8, E9, E12, E13]

*Mechanisms:* Runway is capacity divided by net growth. Retention shrinks net growth, and resizing raises capacity. Sharding should be timed to the first non-storage resource approaching its tested limit, with enough lead time to cover a multi-quarter project.

*Strengths:*
- Large runway margins under linear assumptions (K12, K15, K22).

*Weaknesses:*
- Linear extrapolation from 3 deltas (E1).
- The audit/non-audit growth split is estimated, not measured (K23, K24).
- Restore, PITR and replica-rebuild times grow with volume size, and this was not researched (E9).
- Trigger thresholds are proposals, not measured limits.

## Key claims

- **CL1** (material): Organic storage growth is about 35 GB/month, not 80. The deltas are 35, 35 and 80 GB, and the 80 includes a documented one-off 45 GB backfill. [E1, E2, E4, K1, K2, K3, K4]
- **CL2** (material): Free space is 160 GB (92% used). At 35 GB/month that lasts about 4.57 months to 100%, not 2 months. [E1, E4, K5, K6, K7, K8]
- **CL3** (material): Using assumed thresholds (a 90% alert line and a 95% safety line, neither given in the packet), the cluster is already past the first and would reach the second in about 1.71 months. A prompt resize is therefore warranted. Even without those thresholds, the measured runway to 100% is only about 4.57 months. [E1, E4, K9, K7]
- **CL4** (material): Retention policy v3 allows audit_events older than 12 months to be moved to cold archive, and at least 780 GB qualifies. If that space is returned to the filesystem, usage would fall to about 1,060 GB, about 53% of the current volume. [E5, E6, K10, K11]
- **CL5** (material): If the archived space is returned to the filesystem (partition drop, or DELETE plus a rewrite done after the resize), runway on the 2,000 GB volume is about 26.9 months at 35 GB/month and about 11.75 months at 80 GB/month. Both are conservative, because rolling retention would also cut net growth. With DELETE-and-reuse only, usage stays at 1,840 GB and runway at the estimated non-audit growth rate is about 9.7 months as a central estimate, realistically roughly 8-12 months, because the growth split is estimated rather than measured. [E1, E5, E6, E12, E13, K12, K21, K24, K25]
- **CL6** (material): Compute and throughput are far from their limits: about 4.19x write-TPS headroom, 41% of connections in use, CPU p95 34%. No measured non-storage limit justifies sharding now. [E7, K13, K14]
- **CL7** (material): The volume can very likely be grown online up to about 16 TB without downtime. The older 6-hour cooldown appears to be superseded by the 2026 AWS changes. This holds only if the platform is AWS, which is not confirmed. [E8, E9, E10, E11]
- **CL8** (material): If audit_events is not partitioned, DELETE alone will not return disk to the OS. Returning it needs VACUUM FULL (exclusive lock) or pg_repack. pg_repack's free-space need is uncertain because the '2x' wording is unverified. It is about 240 GB if only the rebuilt copy of the retained rows counts, about 480 GB if '2x' applies to the retained data, and far more if it applies to the full 1,020 GB table. Every reading exceeds the 160 GB free, so a rewrite would need the resize first. A rewrite is optional, because DELETE-and-reuse stops audit growth without one. [E12, E14, E5, K18, K19, K5]
- **CL9** (material): Up to the 16,000 GB online ceiling, runway is about 33.7 years at 35 GB/month and about 11.2 years at triple that rate, so disk is not a durable reason to shard. Whether a very large single node is operationally acceptable (backup, restore and PITR time) is not established. [E8, E1, E9, K15, K22]
- **CL10**: Citus-style customer_id sharding needs schema-wide changes: the tenant column on every table, compound primary and foreign keys, reference tables and tenant-aware inserts. Comparable projects took months of focused effort. [E15, E16]
- **CL11** (material): The available evidence can't determine whether audit_events is time-partitioned, or whether any application, report or foreign key reads rows older than 12 months. So the effort and timeline of the archival step can't be fixed yet. [E5, E6, E13]
- **CL12**: The available evidence can't verify the 2-3 quarter sharding estimate or whether customer_id is a sound shard key. No schema, cross-customer query inventory or skew data was supplied. [E15, E18]
- **CL13**: Hidden non-storage limits can't be ruled out: working set versus RAM, vacuum or freeze age on the 8.9B-row audit_events, and resource trends. None of these was measured. [E7, E17]
- **CL14**: audit_events makes up about 55.4% of used space, and the listed table sizes add up to exactly 1,840 GB. That suggests 'used' is relation size only and may exclude WAL and slot retention. [E5, E1, K16, K17]
- **CL15** (material): Because audit_events is append-only and plain VACUUM keeps freed space for reuse within the table, a batched DELETE of the old rows would let new audit inserts reuse about 780 GB without growing the table on disk. Assuming the 240 GB of audit rows younger than 13 months accumulated evenly, audit is about 18.5 GB/month of growth and the rest is about 16.5 GB/month. This split is an estimate, not a measurement: uneven accumulation and the unquantified 12-13 month band could move it either way, so the derived figures should be read as approximate. [E5, E12, K23, K24]
- **CL16** (material): The capacity report covers the primary only, and the cluster has 2 read replicas. If those are physical streaming replicas (not stated in the packet), they fill at the same rate. Their volumes must then be grown first or at the same time as the primary's, and they must have room for the WAL from archival. The evidence can't determine the replicas' current volume sizes. [E1, E7]

## Calculations (re-executed by code)

| id | purpose | expression | claimed | recomputed | ok |
|---|---|---|---|---|---|
| K1 | Jul to Aug growth (GB) | `1725 - 1690` | 35 | 35 | yes |
| K2 | Aug to Sep growth (GB) | `1760 - 1725` | 35 | 35 | yes |
| K3 | Sep to Oct growth (GB) | `1840 - 1760` | 80 | 80 | yes |
| K4 | October organic growth after removing the 45 GB backfill (GB) | `80 - 45` | 35 | 35 | yes |
| K5 | Free space on the 2,000 GB volume (GB) | `2000 - 1840` | 160 | 160 | yes |
| K6 | Percent of disk used | `1840 / 2000 * 100` | 92 | 92 | yes |
| K7 | Runway to 100% at 35 GB/month (months) | `160 / 35` | 4.57 | 4.571428571428571 | yes |
| K8 | Runway to 100% at the claimed 80 GB/month (months) | `160 / 80` | 2 | 2 | yes |
| K9 | Runway to an assumed 95% safety line (threshold not sourced in the packet) at 35 GB/month (months) | `(2000 * 0.95 - 1840) / 35` | 1.71 | 1.7142857142857142 | yes |
| K10 | Used space after archiving 780 GB of audit_events, if space is returned to the filesystem (GB) | `1840 - 780` | 1060 | 1060 | yes |
| K11 | Percent used after archival on the 2,000 GB volume, if space is returned to the filesystem | `(1840 - 780) / 2000 * 100` | 53 | 53 | yes |
| K12 | Runway to 100% after archival with space returned, 2,000 GB volume, full 35 GB/month (months; conservative) | `(2000 - (1840 - 780)) / 35` | 26.9 | 26.857142857142858 | yes |
| K13 | Write TPS headroom ratio (tested / p95) | `9000 / 2150` | 4.19 | 4.186046511627907 | yes |
| K14 | Connection utilization percent | `410 / 1000 * 100` | 41 | 41 | yes |
| K15 | Runway to the 16,000 GB ceiling with no archival at 35 GB/month (years) | `(16000 - 1840) / 35 / 12` | 33.7 | 33.714285714285715 | yes |
| K16 | Sum of listed table sizes (GB) | `1020 + 310 + 240 + 150 + 40 + 80` | 1840 | 1840 | yes |
| K17 | audit_events share of used space (%) | `1020 / 1840 * 100` | 55.4 | 55.434782608695656 | yes |
| K18 | Upper bound on retained audit_events after removing 780 GB; also the low-end pg_repack free-space need if only the rebuilt copy counts (GB) | `1020 - 780` | 240 | 240 | yes |
| K19 | pg_repack free-space need if the unverified '2x' wording applies to the retained audit_events (GB; assumption) | `2 * (1020 - 780)` | 480 | 480 | yes |
| K20 | Illustrative runway after a resize to 4,000 GB without archival at 35 GB/month (months) | `(4000 - 1840) / 35` | 61.7 | 61.714285714285715 | yes |
| K21 | Runway after archival with space returned, 2,000 GB volume, at the disputed 80 GB/month (months) | `(2000 - (1840 - 780)) / 80` | 11.75 | 11.75 | yes |
| K22 | Runway to the 16,000 GB ceiling at triple the organic rate, 105 GB/month (years) | `(16000 - 1840) / 105 / 12` | 11.2 | 11.238095238095239 | yes |
| K23 | Estimated audit_events growth: 240 GB of rows younger than 13 months spread evenly over 13 months (GB/month; assumption of even accumulation) | `(1020 - 780) / 13` | 18.5 | 18.46153846153846 | yes |
| K24 | Estimated non-audit growth: organic 35 GB/month minus estimated audit growth (GB/month) | `35 - (1020 - 780) / 13` | 16.5 | 16.53846153846154 | yes |
| K25 | Central estimate of runway on the current 2,000 GB volume with DELETE-and-reuse (usage stays at 1,840 GB), growing at the estimated non-audit rate (months; stated in text as about 9.7, realistically roughly 8-12 because the growth split is unmeasured) | `160 / (35 - (1020 - 780) / 13)` | 9.67 | 9.674418604651162 | yes |

## Alternatives

- **(a) Commit now to a 16-shard customer_id sharding project (2-3 quarters, most feature work frozen):** It addresses limits that are not near (about 4.19x write headroom, K13). It takes quarters, so it does not fix the disk before even the 100% point, about 4.57 months away (K7). It also carries schema-wide changes (E15) and an unverified freeze cost of about N engineers × 6-9 months (E18). Rejected for now.
- **(b1) Online volume resize only (for example to about 4,000 GB), applied to the primary and to both read replicas and any standby or backup target:** Fast, hours to days (E9, E11), and gives about 61.7 months at 35 GB/month (K20). Replica volumes must be grown too or they become the new wall (E1, E7). Cost and backup or restore effects are not researched, and storage can't be shrunk later (E11). Necessary first step, but it doesn't fix the long-term audit_events growth.
- **(b2) Resize primary and replicas, then remove audit_events older than 12 months (partition drop; or batched DELETE with in-table reuse; optionally a rewrite to return space), then a recurring monthly retention job:** Recommended. If space is returned to the filesystem, usage falls to about 53% of the current volume (K11) and runway is about 26.9 months at the full 35 GB/month (K12), conservatively. With DELETE-and-reuse, usage stays at 1,840 GB but net growth falls to about 16.5 GB/month (K24), and the resize supplies the headroom. Policy-authorized (E6). Reduces freeze and vacuum load (E17). Effort depends on the unknown partitioning state (E13).
- **(b3) Archive only, without a resize, using batched DELETE and in-table reuse (no rewrite):** Cheaper than first assumed. It needs no exclusive lock and no extra free space for a rewrite (E12), and it stops audit_events growing on disk (E5). Net growth falls to about 16.5 GB/month (K24, estimated). Its weaknesses: usage stays at 92%, and runway on the current volume is only about 9.7 months as a central estimate (K25), realistically roughly 8-12 months because the growth split is not measured. A 780 GB DELETE writes a large, unquantified amount of WAL that has to fit on a nearly full primary and on both replicas, plus vacuum load and possible replica lag. Viable as the archival method, but not as a substitute for the resize. Those WAL and headroom risks, more than pg_repack's space need, are why the resize should come first.
- **(c) Defer sharding, but prepare: shard-key and schema readiness study, customer_id skew analysis:** Low-cost hedge that answers the 'kicking the can' objection. It reduces the lead time if a trigger fires, without a feature freeze. Rests on judgment, not packet evidence.

## Tradeoffs

- Resizing is quick but permanent: storage can't be shrunk (E11), and backup, restore and replica rebuild times likely grow with size (E9, not researched). A moderate resize plus archival beats jumping to 16 TB.
- Archiving through partition drop is cheap once the table is partitioned. Converting an unpartitioned 1 TB table is a migration of its own (E13).
- On an unpartitioned table, DELETE-and-reuse avoids a rewrite and its space need but leaves 'used' at 92% (E12). VACUUM FULL returns space but holds an exclusive lock (E12). pg_repack is online but needs roughly 240-480 GB or more of free space under the unverified '2x' wording and can fail partway (E14; K18, K19). Every option except partition drop generates heavy WAL.
- Deferring sharding keeps feature velocity. If growth or load really accelerates, the multi-quarter lead time has to be covered by early triggers.

## Edge cases and failure modes

- The cluster is already at 92%. A surprise load (another backfill, WAL build-up from a stuck replication slot) could fill the remaining 160 GB faster than 35 GB/month suggests (E1, E5).
- 'Used' may exclude WAL or replication-slot retention, since the table sizes add up to exactly 1,840 GB (K16). An inactive slot could fill the disk on its own.
- If only the primary is resized, a read replica on an unchanged 2,000 GB volume can still run out of disk and stop replaying (E1, E7).
- WAL from a mass DELETE, pg_repack or partition export/conversion must be retained on the primary and replayed on both replicas. On a 92%-full disk this can fill the primary or a replica, or raise replica lag well above the current 140 ms p99 (E7). Batch and throttle the work and watch lag and WAL size.
- A pg_repack that runs out of space fails partway (E14), so any rewrite must happen after the resize.
- DETACH PARTITION CONCURRENTLY is not allowed if the table has a default partition and can't run in a transaction block (E13).
- Single-AZ RDS may have brief downtime during storage modification (E11). A modification can't be cancelled once started (E11).
- An undiscovered reader or foreign key on old audit_events could break when the rows are removed (E6). The archive must be verified before deletion, because 6-year retention is mandatory (E6).
- An anti-wraparound autovacuum on the 8.9B-row append-only table could cause heavy I/O if freeze age is high (E17).
- The ORD-2231 backfill pattern could recur in future migrations despite the 'not expected to recur' note (E2).

## Counterarguments

- **Not sharding now is kicking the can. Growth will eventually force it, so start while the system is stable.** — The corrected runway is long. It is about 26.9 months on the current volume once archived space is returned (K12), and decades up to the 16 TB ceiling (K15). Compute headroom is more than 3x (E7). The 16 TB figure only shows that disk is not the constraint. Whether backup, restore and PITR times on a very large single node are acceptable is unresearched (E9). Rolling retention keeps the live dataset near its current size, so that limit isn't tested soon. Starting a multi-quarter freeze for a limit that isn't near spends feature capacity early. Explicit triggers plus a readiness study keep the option open without the freeze.
- **The 80 GB/month month could be the start of acceleration, not a one-off.** — 45 GB of it is documented as the ORD-2231 backfill (E2), and the remainder is exactly 35 GB, matching the prior two months (K4). Even if 80 GB/month were real, post-archival runway is about 11.75 months (K21). That is still no reason to start sharding next sprint. A longer history and ORD-2231 should be checked (G1).
- **Online resize might not be as safe as SRE says.** — The claim matches vendor patterns (E9, E11), but the platform isn't confirmed and Single-AZ downtime is possible (E11). The mitigation is to confirm the platform, the AZ setup and the replica volumes, and schedule the change in a low-traffic window. Even a brief planned blip costs far less than a sharding project.
- **Archiving 780 GB could break something that reads old audit data.** — The policy explicitly says archived events don't need to be queryable from the transactional DB (E6). Usage still has to be confirmed through pg_stat_statements or query logs before deletion, and this is flagged as unresolved (CL11).

## Practical implications

- Soon (judgment: this week or next): confirm the platform (AWS EBS or RDS or other), the AZ setup, and how the 2 read replicas and any standby or backup target are provisioned. Grow the replica volumes first or at the same time as the primary, by at least 10% (an illustrative 4,000 GB gives about 61.7 months, K20). Keep in mind storage can't be shrunk later (E11).
- Check for WAL or replication-slot retention not counted in 'used' (K16) and for any inactive slots.
- Before archival, run pg_stat_statements or a query-log review for reads of audit_events older than 12 months, and check foreign keys (E6).
- Find out whether audit_events is time-partitioned. If it is: export old partitions to object storage, verify them, then DETACH or DROP (E13). If not: after export and verification, use a batched, throttled DELETE with in-table reuse (E12). Watch WAL size, replica lag and vacuum while it runs, and do it after the resize so the WAL has headroom on every node. A rewrite (pg_repack, roughly 240-480 GB or more free, K18, K19) or a partition conversion is only needed if the space must go back to the OS.
- Set up a recurring monthly retention job so audit_events stays at about 12 months online (E6, E13).
- At Thursday's review, present the corrected growth figures (35 GB/month, about 4.57 months raw runway) and the opportunity-cost frame: N engineers × 6-9 months of frozen feature work, against days for the resize plus the archival effort.
- Proposed revisit triggers for sharding. These are judgment thresholds, not evidence-derived: sustained write TPS p95 above about 50% of the tested 9,000; CPU p95 above about 60%; organic growth above about 70 GB/month for 3 consecutive months; used above 75% after resize and archival; or vacuum, freeze, backup or restore times exceeding operational targets.
- Optionally fund a small sharding-readiness study (customer_id skew, cross-customer queries, which tables lack customer_id) to cut lead time if a trigger fires (E15).

## Remaining uncertainty

- Only 3 monthly deltas, so no evidence on acceleration or seasonality (E1).
- ORD-2231 was not inspected. Recurrence of similar backfills is possible (E2).
- Whether audit_events is partitioned, and the size of the 12-13 month band (E5).
- Whether anything reads old audit_events (E6).
- The platform identity, the cost of a larger volume, IOPS and throughput scaling, and the effect on backup, restore, PITR and replica rebuild times (E8, E9).
- Replica type (physical streaming or other), replica and backup volume sizes, and replica disk usage are not in the packet (E1, E7).
- The WAL volume, vacuum load and replica-lag impact of deleting about 780 GB is not quantified.
- The split of the 35 GB/month between audit_events and other tables is estimated from a 13-month average, not measured (K23, K24). It assumes even accumulation and ignores the unquantified 12-13 month band, so the DELETE-and-reuse runway (K25, about 9.7 months central) is only approximate, roughly 8-12 months. A per-table growth query would settle it.
- Team size, needed to put the feature-freeze cost in person-months, is not in the packet.
- The 90% and 95% thresholds are assumed, not given.
- Possible brief downtime on Single-AZ RDS (E11).
- Working set versus RAM, vacuum and freeze age, PostgreSQL version, and metric trends (E7, E17).
- Bloat, unused-index and WAL or slot figures (E5).
- Real sharding effort and how sound customer_id is as a shard key (E15, E16).
- Open question the reviewer judged decisive: Is audit_events time-range partitioned, and does any application, report or foreign key read rows older than 12 months (pg_stat_statements or query logs)?
- Open question the reviewer judged decisive: Which platform and deployment (self-managed EBS, RDS Single-AZ or Multi-AZ, other) hosts prod-orders-pg and its 2 replicas? Are the replica volumes provisioned separately, and can they be resized online?
- Open question the reviewer judged decisive: What does a 12-24 month per-table storage history show about organic growth and the audit/non-audit split, and is growth accelerating?

## Further research that could change the conclusion

- 12-24 months of storage history showing sustained organic growth well above 35 GB/month, or a per-table growth breakdown.
- ORD-2231 or upcoming migration plans showing repeated large backfills.
- Evidence that audit_events is unpartitioned and that conversion is very expensive, or that old rows are actively read or referenced by foreign keys.
- Confirmation that the platform can't resize the primary or the replica volumes online, or does so with significant downtime or cost.
- Working-set, vacuum or wraparound, or TPS trend data showing a non-storage limit within about 12-18 months, which would strengthen the case for starting sharding (or a readiness phase) sooner.
- Measured backup, restore or PITR times showing that a large single node is already near operational limits.
- Schema and skew analysis showing customer_id sharding is much cheaper than 2-3 quarters, which would lower its opportunity cost.

## Evidence registry

| id | class | provenance | claim | source |
|---|---|---|---|---|
| E1 | VERIFIED | fixture_read | Month-end used storage on prod-orders-pg primary: 2026-07 1,690 GB; 2026-08 1,725 GB; 2026-09 1,760 GB; 2026-10 1,840 GB. Provisioned volume 2,000 GB. Report generated 2026-11-02 by platform-sre. | capacity-report-2026-10.md |
| E2 | CORROBORATED | fixture_read | Per the capacity report, October includes a one-off 45 GB backfill of the shipment_events table (migration ORD-2231) that is 'Not expected to recur.' | capacity-report-2026-10.md |
| E3 | VERIFIED | fixture_read | Staff engineer: 'We went from 1,760 to 1,840 last month, that's 80 GB/month. 160 GB free / 80 = 2 months. We need to shard, nothing else scales. Proposing 16 shards on customer_id via Citus-style routing.' | slack-thread-staff-eng.txt |
| E4 | INFERRED | fixture_read | Arithmetic from E1 and E2: the deltas are 35, 35 and 80 GB, or 35 GB in October once the 45 GB backfill is excluded. Free space is 2,000 - 1,840 = 160 GB, and 1,840/2,000 = 92%. At 35 GB/month, 160 GB lasts about 4.6 months to 100%, compared with 2 months at 80 GB/month. | capacity-report-2026-10.md |
| E5 | VERIFIED | fixture_read | Table sizes: audit_events 1,020 GB, 8,900M rows, append-only, 'rows older than 13 months = 780 GB'; orders 310 GB, 410M rows; order_items 240 GB, 1,300M rows; shipment_events 150 GB, 620M rows (includes Oct backfill); customers 40 GB, 18M rows; other (62 tables) 80 GB. | table-sizes.csv |
| E6 | VERIFIED | fixture_read | Data retention policy v3 (Legal + Security, approved 2026-03), section 4.2: 'Audit events must be retained online for 12 months and may then be moved to cold archive (object storage) for 6 years. There is no requirement for archived audit events to be queryable from the transactional database.' | data-retention-policy-excerpt.md |
| E7 | VERIFIED | fixture_read | Compute, 30-day p95: CPU 34%; write TPS 2,150 (tested headroom on current instance 9,000); 2 read replicas with p99 replica lag 140 ms; connections 410/1,000. Report summary: 'Storage is the only resource trending toward a limit. Compute and write throughput have >3x headroom.' | capacity-report-2026-10.md |
| E8 | CORROBORATED | fixture_read | The capacity report describes the volume as 'gp-ssd, online-resizable up to 16,000 GB, no downtime'. In Slack, the SRE lead says 'the volume can be grown online'. | capacity-report-2026-10.md |
| E9 | INFERRED | search_result | Search results describe AWS EBS Elastic Volumes. Volume size can be increased while the volume is in use, and the gp2/gp3 size range is 1-16,384 GiB. After a size change the volume enters an 'optimizing' state, which can take 6 to 24 hours to complete. | https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html |
| E10 | INFERRED | search_result | Older AWS ModifyVolume documentation in the search results says at least six hours must pass between modifications of the same volume. | https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/APIReference/API_ModifyVolume.html |
| E11 | CORROBORATED | search_result | AWS announced on 2026-07-15 that RDS supports up to four storage modifications per instance in a rolling 24-hour window. A new modification can start once storage optimization for the previous one completes, without downtime, and the change applies to RDS for PostgreSQL. Classmethod write-ups (including a 2026-01-16 article on EBS) report that the earlier 6-hour cooldown was removed. | https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-rds-upto-four-storage-modifications-24-hours |
| E12 | CORROBORATED | search_result | Plain VACUUM does not return space to the operating system in most cases; freed space stays available for reuse within the same table. VACUUM FULL rewrites the table into a new file and returns the space, but it is much slower and holds an exclusive lock on each table while it runs. | https://www.postgresql.org/docs/13/sql-vacuum.html |
| E13 | INFERRED (claimed CORROBORATED) | search_result | PostgreSQL docs: 'Dropping an individual partition using DROP TABLE, or doing ALTER TABLE DETACH PARTITION, is far faster than a bulk operation. These commands also entirely avoid the VACUUM overhead caused by a bulk DELETE.' DETACH PARTITION ... CONCURRENTLY cannot run in a transaction block, is not allowed if the table has a default partition, and takes a SHARE UPDATE EXCLUSIVE lock on the parent. | https://www.postgresql.org/docs/18/ddl-partitioning.html |
| E14 | CORROBORATED | search_result | pg_repack runs online without holding exclusive locks for the whole operation. A full-table repack needs free disk space about twice the size of the target tables and their indexes, and runs that run out of space fail partway through. | https://www.pgxn.org/dist/pg_repack/doc/pg_repack.html |
| E15 | CORROBORATED | search_result | Citus multi-tenant migration guidance: every table must carry the tenant/distribution column, and missing columns must be added and backfilled. Primary and foreign keys usually have to become compound keys that include the distribution column, because Citus cannot otherwise enforce uniqueness, and this is often described as the most invasive change. Distribution column types must match across tables. Inserts must include the tenant ID. Shared small tables become reference tables. | https://docs.citusdata.com/en/v12.1/develop/migration_mt_schema.html |
| E16 | INFERRED | search_result | Secondary write-ups of Notion's Postgres sharding (2021) describe a 5-minute maintenance window that reflected 'months of focused engineering effort'. | https://notion.com/blog/sharding-postgres-at-notion |
| E17 | CORROBORATED | search_result | For insert-only tables, anti-wraparound autovacuum starts when the oldest unfrozen row is more than about 200 million transactions old (the autovacuum_freeze_max_age default), and on such tables this is often the first vacuum the table gets. PostgreSQL 13+ added autovacuum_vacuum_insert_threshold and autovacuum_vacuum_insert_scale_factor to vacuum insert-only tables earlier. | https://www.cybertec-postgresql.com/en/?p=14916 |
| E18 | INFERRED | user_input | The user's request states the cluster is at 92% disk, is growing about 80 GB/month with about two months of runway, and that the staff engineer proposes a 2-3 quarter, 16-shard customer_id project that would freeze most feature work. | request |

## Validation record

_Generated by code from the tool log; not written by the model._

1. **Research performed:** 10 web search(es), 1 fetch attempt(s), 4 supplied document(s) read.
- search: "EBS Elastic Volumes modify volume size online wait 6 hours between modifications gp3 16 TiB" (19 results)
- search: "PostgreSQL documentation VACUUM does not return space to operating system VACUUM FULL exclusive lock" (19 results)
- search: "PostgreSQL partitioning DETACH PARTITION CONCURRENTLY drop old data bulk removal documentation" (17 results)
- search: "pg_repack online reclaim bloat requires free disk space double table size" (13 results)
- search: "postgresql.org docs ddl-partitioning "bulk loads and deletes" dropping partition avoids VACUUM overhead" (16 results)
- search: "Amazon RDS PostgreSQL increase allocated storage no downtime 6 hours storage optimization max 64 TiB" (17 results)
- search: "Citus migrating multi-tenant application distribution column tenant_id reference tables cross-tenant queries effort" (15 results)
- search: "Notion sharding Postgres how long did it take engineering blog" (17 results)
- search: "Amazon RDS now supports up to four storage modifications in 24 hours July 2026" (18 results)
- search: "PostgreSQL autovacuum anti-wraparound freeze large append-only table insert-only autovacuum_vacuum_insert_threshold" (15 results)
2. **Sources inspected:**
- capacity-report-2026-10.md (fixture_read)
- table-sizes.csv (fixture_read)
- data-retention-policy-excerpt.md (fixture_read)
- slack-thread-staff-eng.txt (fixture_read)
   Cited from search snippets only (not opened):
- https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html
- https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/APIReference/API_ModifyVolume.html
- https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-rds-upto-four-storage-modifications-24-hours
- https://www.postgresql.org/docs/13/sql-vacuum.html
- https://www.postgresql.org/docs/18/ddl-partitioning.html
- https://www.pgxn.org/dist/pg_repack/doc/pg_repack.html
- https://docs.citusdata.com/en/v12.1/develop/migration_mt_schema.html
- https://notion.com/blog/sharding-postgres-at-notion
- https://www.cybertec-postgresql.com/en/?p=14916
3. **Checks executed:**
- Evidence registry validation: 18 accepted, 0 rejected (source never retrieved / schema), 1 classification downgrade(s)
- Deterministic quality gates over 3 draft(s)
- Calculation K1 re-executed: 1725 - 1690 = 35 (claimed 35) → match
- Calculation K2 re-executed: 1760 - 1725 = 35 (claimed 35) → match
- Calculation K3 re-executed: 1840 - 1760 = 80 (claimed 80) → match
- Calculation K4 re-executed: 80 - 45 = 35 (claimed 35) → match
- Calculation K5 re-executed: 2000 - 1840 = 160 (claimed 160) → match
- Calculation K6 re-executed: 1840 / 2000 * 100 = 92 (claimed 92) → match
- Calculation K7 re-executed: 160 / 35 = 4.571428571428571 (claimed 4.57) → match
- Calculation K8 re-executed: 160 / 80 = 2 (claimed 2) → match
- Calculation K9 re-executed: (2000 * 0.95 - 1840) / 35 = 1.7142857142857142 (claimed 1.71) → match
- Calculation K10 re-executed: 1840 - 780 = 1060 (claimed 1060) → match
- Calculation K11 re-executed: (1840 - 780) / 2000 * 100 = 53 (claimed 53) → match
- Calculation K12 re-executed: (2000 - (1840 - 780)) / 35 = 26.857142857142858 (claimed 26.9) → match
- Calculation K13 re-executed: 9000 / 2150 = 4.186046511627907 (claimed 4.19) → match
- Calculation K14 re-executed: 410 / 1000 * 100 = 41 (claimed 41) → match
- Calculation K15 re-executed: (16000 - 1840) / 35 / 12 = 33.714285714285715 (claimed 33.7) → match
- Calculation K16 re-executed: 1020 + 310 + 240 + 150 + 40 + 80 = 1840 (claimed 1840) → match
- Calculation K17 re-executed: 1020 / 1840 * 100 = 55.434782608695656 (claimed 55.4) → match
- Calculation K18 re-executed: 1020 - 780 = 240 (claimed 240) → match
- Calculation K19 re-executed: 2 * (1020 - 780) = 480 (claimed 480) → match
- Calculation K20 re-executed: (4000 - 1840) / 35 = 61.714285714285715 (claimed 61.7) → match
- Calculation K21 re-executed: (2000 - (1840 - 780)) / 80 = 11.75 (claimed 11.75) → match
- Calculation K22 re-executed: (16000 - 1840) / 105 / 12 = 11.238095238095239 (claimed 11.2) → match
- Calculation K23 re-executed: (1020 - 780) / 13 = 18.46153846153846 (claimed 18.5) → match
- Calculation K24 re-executed: 35 - (1020 - 780) / 13 = 16.53846153846154 (claimed 16.5) → match
- Calculation K25 re-executed: 160 / (35 - (1020 - 780) / 13) = 9.674418604651162 (claimed 9.67) → match
- Context packet contradiction-retention assertion
4. **Checks not executed:**
- Fetch failed: https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html — getaddrinfo ENOTFOUND docs.aws.amazon.com. In this cloud session a host fails to resolve like this when it is outside the session's allowed network domains, or 
- Full-page web inspection: WebFetch is blocked by this environment's network policy; web sources are search snippets unless fetched
- Knowledge gap G1 unresolved: Only 4 month-end data points were supplied, so there is no longer history to test for acceleration. Ticket ORD-2231, which would confirm the backfill does not recur, was not available.
- Knowledge gap G2 unresolved: It is unknown whether audit_events is partitioned by time, and the size of the 12-to-13-month band is not given. No query logs or pg_stat_statements were available to confirm that nothing reads rows older than 12 months, and no foreign-key information was available.
- Knowledge gap G3 unresolved: The cloud platform is not named ('gp-ssd'). docs.aws.amazon.com could not be fetched because WebFetch is blocked (ENOTFOUND); the domain would need to be allowed in the session's network settings. Volume cost, IOPS/throughput scaling, and the effect on backup, restore and replica rebuild times were not established.
- Knowledge gap G4 unresolved: No data was supplied on working set versus RAM, vacuum durations, XID or freeze age, or trends for the CPU and TPS figures.
- Knowledge gap G5 unresolved: No schema, cross-customer query inventory or customer_id skew data was available. No public source quantifies Citus migration effort for a comparable schema.
- Knowledge gap G6 unresolved: No bloat estimates, unused-index statistics, or WAL and replication-slot retention figures were supplied. Table sizes add up to exactly 1,840 GB, which suggests 'used' may exclude WAL and slots or that they were not measured.
5. **Independent validation status:** Graded by separate grader process (eval-grader (native agent, claude-opus-5-5), prompts v5); total 93.75/100; critical failures: none. Grader is the same model family as the agent.
6. **Remaining uncertainty:** 17 item(s), listed above.
7. **Revisions:** 2
- cycle 1 (reanalysis): [coverage/major] D1 [criteriaAssessments C3; practicalImplications[0]; alternatives b1/b2; edgeCasesAndFailureModes] The capacity report covers the primary only ('prod-orders-pg, primary'), and E7 records 2 read replicas. A streaming physical replica holds the same data, so it fills at the same rate unless its volume is grown too. The draft's resize plan (verdict, C3, practicalImplications item 1, alternative b1) talks only about 'the volume'. It never says the two replica volumes, and any standby or backup target, must be grown first or at the same time. It also never says that a mass DELETE, pg_repack or partition export produces a WAL burst that has to fit on both the primary and the replicas. G3 in the packet asks about 'effects on replicas and backups', and the draft only touches this through the unresearched 'replica rebuild times'. A team that follows the plan as written could resize the primary and still lose a replica to a full disk.; [alternatives_counterarguments/major] D2 [alternatives b3; CL8; criteriaAssessments C2 mechanisms; tradeoffs[2]] Alternative b3 ('archive only, without a resize') is rejected because pg_repack needs about 480 GB free. That reasoning assumes the freed space has to be returned to the OS. audit_events is append-only (E5). The draft's own E12 says plain VACUUM keeps freed space for reuse within the same table. So exporting and then batch-DELETEing the old rows, with no rewrite at all, would let new audit inserts reuse roughly 780 GB inside the table. That stops audit_events from growing on disk for years and cuts net disk growth to only the non-audit tables, with no exclusive lock and no extra free space for a rewrite. The draft never weighs this cheaper option. It also never weighs the option's real risks: WAL volume from a 780 GB DELETE on a disk that is 92% full, vacuum load, and replica lag. Those risks, not the pg_repack space need, are what should drive the order of resize and archival. The fair comparison and the case for resizing first are therefore not properly argued.; D1 research part (replica volume layout) is internal infrastructure data not obtainable by web search
- cycle 2 (reanalysis): [reasoning_validity/major] D1 [verdict (sentence beginning 'The resize should come first')] The verdict sentence added in draft 2 reads: 'The resize should come first. A rewrite does not strictly need it, but the archival steps generate WAL...'. That contradicts the draft's own CL8 ('Every reading exceeds the 160 GB free, so a rewrite would need the resize first'), the C2 path (3) analysis, tradeoffs[2], and edgeCasesAndFailureModes ('A pg_repack that runs out of space fails partway (E14), so any rewrite must happen after the resize'). The path that does not strictly need the resize is DELETE-and-reuse, not a rewrite. The verdict is the part that goes to Thursday's review, so this wording could lead someone to start pg_repack or VACUUM FULL on a disk that is 92% full, which is the exact failure the draft warns about elsewhere.
8. **Final quality gates:**
- PASS coverage
- PASS evidence_sufficiency: [minor/deterministic] 1 evidence classification violation(s) downgraded by registry | [minor/reviewer] D1 [verdict; CL5; CL15; alternatives b3; C6 assessment; K25 purpose; remainingUncertainty] Draft 3 adds a range of 'realistically roughly 8-12 months' around the 9.67-month DELETE-and-reuse runway (K25) in the verdict, CL5, CL15, b3, C6 and remainingUncertainty. Nothing derives it: there is no sensitivity calculation and no K entry for it. Working backwards, 160/8 = 20 GB/month and 160/12 = 13.3 GB/month of non-audit growth. That implies audit growth of roughly 15 to 21.7 GB/month, against the 18.5 GB/month central estimate (K23), and the draft never states or justifies those bounds. Giving a range is the right direction, and it is what review 2 asked for. But as written it reads as a computed interval when it is a judgment call. It should either be labelled as judgment or backed by an explicit sensitivity calculation, for example audit growth of 15-22 GB/month.
- PASS reasoning_validity: [minor/reviewer] D2 [verdict (sentence beginning 'Any rewrite (pg_repack or VACUUM FULL) requires it')] The rewritten verdict says 'Any rewrite (pg_repack or VACUUM FULL) requires it, because every estimate of pg_repack's free-space need exceeds the 160 GB free (K5, K18, K19)'. This uses pg_repack's figures to justify the claim for VACUUM FULL too. VACUUM FULL also needs room for a full new copy of the retained heap plus rebuilt indexes, at least about 240 GB by K18, so the conclusion still holds. The stated reason just doesn't cover VACUUM FULL. One clause should give the VACUUM FULL space need directly.
- PASS alternatives_counterarguments
- PASS decision_usefulness
- PASS traceability
