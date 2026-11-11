# Evaluation: Should the orders platform commit to sharding Postgres now?

## Verdict

**No. Don't commit to a 16-shard migration next sprint.** The sharding proposal rests on two premises, and the attached sources contradict both.

1. **The growth figure is inflated.** The staff engineer's 80 GB/month comes from October, and October includes a one-off 45 GB backfill (ORD-2231) that the capacity report says will not recur. The underlying rate is about **35 GB/month**: July→August, August→September, and October once the backfill is removed.
2. **Disk is not a scaling-architecture problem.** Storage is the only resource near a limit. CPU is at 34% p95, write TPS is 2,150 against a tested 9,000, and connections are 410 of 1,000. Most of the disk, **780 GB of the 1,840 GB used (about 42%)**, is audit_events rows older than 13 months. Retention policy v3 §4.2 already allows that data to move to cold storage after 12 months, and nothing requires it to stay queryable from the database.

**What to recommend on Thursday:**
- **This week:** grow the volume online on the primary and both replicas, for example to 2,500–3,000 GB.
- **Next 2–6 weeks:** partition audit_events by time, archive rows older than 12 months to object storage, verify the archive, then drop the old data. This takes the database to about 1,060 GB (about 53% of today's 2,000 GB volume).
- **Sharding:** turn it into a decision gated on specific triggers (listed below), plus some cheap "shard-readiness" work. It should not be a 2–3 quarter feature freeze starting now.

The urgency is still real. At 92% you are already in the danger zone for Postgres (autovacuum, temp files, WAL bursts, index builds). That is a reason to resize this week, not a reason to shard.

---

## Evaluation criteria

| Criterion | Why it matters |
|---|---|
| Correct diagnosis of the constraint | The fix has to target the resource that is actually running out. |
| Time-to-relief vs. time-to-failure | A 2–3 quarter project can't fix a problem with a 2–5 month runway. |
| Durability | How long does the fix last before the problem comes back? |
| Cost and opportunity cost | A feature freeze, the engineering burden, and infrastructure spend. |
| Risk and reversibility | Migration risk, the risk of losing data, and one-way decisions. |
| Compliance fit | Retention policy v3. |

---

## Analysis

### 1. The growth rate: 80 GB/month vs. about 35 GB/month

From the capacity report (month-end used GB):

| Month | Used | Delta | Delta excl. backfill |
|---|---|---|---|
| Jul | 1,690 | — | — |
| Aug | 1,725 | +35 | +35 |
| Sep | 1,760 | +35 | +35 |
| Oct | 1,840 | +80 | **+35** (80 − 45 one-off backfill) |

The Slack message ("1,760 to 1,840 last month, that's 80 GB/month") extrapolates from the one anomalous month. The organic rate has been exactly 35 GB/month for three months running.

**Runway on the current 2,000 GB volume, with 160 GB free:**
- At 35 GB/month: about 4.6 months to 100%. Reaching 95% (1,900 GB) takes about 1.7 months.
- At 80 GB/month, the staff engineer's figure: 2 months to 100%.

Either way, the practical runway is short, because Postgres needs operating headroom. So "act now" is right. "Act now" just means resizing and archiving, not sharding.

### 2. Where the disk goes

The table sizes add up to 1,840 GB, which matches the capacity report:

| Table | GB | Share |
|---|---|---|
| audit_events | 1,020 | 55% |
| — of which >13 months old | 780 | 42% of total |
| orders | 310 | 17% |
| order_items | 240 | 13% |
| shipment_events | 150 | 8% (includes Oct backfill) |
| customers | 40 | 2% |
| other (62 tables) | 80 | 4% |

The transactional core (orders, order_items, shipment_events, customers) is about 740 GB. More than half the database is an append-only audit log that holds mostly data the policy says can move out.

**Implications of the retention policy (v3, §4.2):**
- Audit events must stay online for 12 months. After that they may move to object storage for 6 years.
- There is no requirement that archived events be queryable from the transactional database.
- The 780 GB figure covers rows older than **13** months. Everything older than **12** months is eligible, so the true reclaimable amount is at least 780 GB, and probably about 18 GB more.

**Inferred audit inflow:** 1,020 − 780 = 240 GB covers the most recent 13 months, or roughly 18 GB/month. That is about half of the 35 GB/month organic growth. Once a rolling 12-month window is enforced, audit_events stops growing net, apart from growth in event volume. Net database growth then falls to about 17 GB/month, coming from the other tables.

**Runway after archiving (rough estimate):**
- About 1,060 GB used on a 2,000 GB volume.
- At about 17 GB/month to reach 80% (1,600 GB): about 32 months.
- Even at the full 35 GB/month: about 15 months.
- With the volume grown to 3,000 GB, it is many years before storage forces an architecture change.

### 3. Why sharding is the wrong tool for this problem

- **It solves a problem you don't have.** Sharding spreads write throughput, CPU, and working-set pressure. You have more than 3x headroom on all of those. Storage alone can grow online to 16,000 GB, which is about 8.7x current usage, according to the capacity report.
- **It doesn't remove the audit bloat. It copies it.** Sixteen shards of a database that is 55% stale audit log is still 55% stale audit log, now spread across 16 primaries and their replicas, with 16 sets of retention jobs.
- **The timing doesn't work.** A 2–3 quarter migration finishes after even the pessimistic runway (2 months) runs out. You would have to resize or archive anyway, just to survive until sharding is done.
- **The cost is very large.** You freeze most feature work for 2–3 quarters. Sharding by customer_id also makes cross-customer queries harder: reporting, admin tools, global uniqueness, and anything that joins across customers. Rebalancing and operating the shards (16+ primaries, schema migrations, backups) is a permanent tax. Partitioning and archiving, by contrast, can be reversed by restoring from object storage.
- **"Growing the volume is kicking the can."** That's only true if the can is growing quickly toward a hard limit. Here the online-resizable ceiling is 16,000 GB, and after archiving the net growth is about 17 GB/month. Kicking the can by a decade is a legitimate engineering choice.

### 4. Recommended plan

**Phase 0: this week, before or right after Thursday (hours of work)**
1. **Grow the volume online** on the primary and on both read replicas. If replicas are left behind, they fill up and fail first. A reasonable target is 2,500–3,000 GB.
   - The volume cannot shrink afterwards. AWS EBS, for example, does not allow decreasing a volume's size, so don't oversize it, because you'll be paying for unused capacity.
   - There are also limits on how often a volume can be modified. AWS currently allows up to four modifications per rolling 24 hours, and older guidance says to wait 6 hours between them. Optimization can take hours. So make one deliberate step rather than several small ones.
   - The report only says "gp-ssd". Check your provider's equivalent rules.
2. **Check for hidden consumers**:
   - pg_wal size
   - inactive replication slots holding WAL
   - temp files
   - bloat from the October backfill on shipment_events
3. **Set alert thresholds** at 75%, 85%, and 90%, and build a growth-rate dashboard that excludes one-off migrations.

**Phase 1: about 2–6 weeks (a small team, not a freeze)**
1. **Legal check.** Confirm with Legal/Security that there is no litigation hold or open investigation covering old audit events. Also confirm that object storage meets the 6-year archive requirement: immutability (for example, object lock), encryption, and access controls.
2. **Make audit_events range-partitioned by month**, for example with native declarative partitioning plus pg_partman:
   - Create a new partitioned parent for incoming writes.
   - Backfill or attach the last 12 months.
   - Leave the legacy table to be exported.
3. **Export the rows older than 12 months to object storage** (for example as Parquet or compressed CSV). Verify row counts and checksums, and document how to restore.
4. **Reclaim the space**, and choose the method deliberately:
   - **Preferred:** drop the old data as whole tables or partitions. Dropping a table or partition removes its files immediately. The PostgreSQL docs describe dropping partitions as much faster than a bulk DELETE and say it avoids the VACUUM overhead entirely.
   - **Avoid:** a bulk DELETE plus plain VACUUM. Plain VACUUM generally does not return space to the operating system, so you would delete 780 GB and the disk would stay full.
   - **Avoid VACUUM FULL** on a 1 TB table. It holds an exclusive lock for the whole run.
   - **If you use pg_repack**, its documentation says it needs free space of roughly twice the target table plus its indexes. That is another reason to grow the volume first, because 160 GB free is not enough.
5. **Automate the rolling retention**: each month, export, verify, then detach and drop the partition that has aged out.

**Phase 2: ongoing, cheap shard-readiness (optional, inside normal sprints)**
- Make sure customer_id is present and indexed on the tenant-scoped tables.
- Keep an inventory of cross-customer queries.
- Avoid new global sequences or uniqueness constraints that would make sharding hard later.

This keeps sharding as an option without paying for it now.

**Revisit sharding when any of these triggers fires:**
- Sustained write TPS above about 50–60% of tested headroom (above about 5,000 against 9,000).
- p95 CPU above about 60–70% after query tuning.
- Working set no longer fits in memory on the largest practical instance.
- Single-node operational limits start to hurt: backup or restore time misses the recovery time objective, vacuum can't keep up, or replica lag grows.
- Projected size after archiving is approaching several TB.

None of these is near today.

---

## Strengths and weaknesses of each option

| Option | Strengths | Weaknesses |
|---|---|---|
| **Shard now (16 × customer_id)** | Removes the single-node ceilings for good; sets up for very large scale | 2–3 quarter freeze; lands after the runway runs out; doesn't fix audit bloat; permanent operating and query complexity; spends effort on a non-binding constraint |
| **Grow volume only** | Minutes to hours, online, low risk | Can't be reversed (no shrink); costs grow linearly; leaves the policy-noncompliant audit backlog in place; backup and restore times keep growing |
| **Grow + partition + archive (recommended)** | Fixes the root cause; follows the retention policy; about 42% reduction; net growth roughly halved; weeks of work, not quarters | Needs migration work on a hot table; needs Legal sign-off; restoring archives is slower than a SQL query |
| **Move audit_events to a separate database or log store** | Isolates append-only workload from OLTP | More moving parts; only needed if audit volume is far larger than today |

---

## Edge cases and failure modes

- **The 780 GB may not all be reclaimable.** total_size_gb includes indexes and TOAST. If the 780 GB is heap-only or estimated differently, the real savings could be a bit higher or lower. Confirm with pg_total_relation_size on a date-bounded copy, or sample the data.
- **Replicas and standbys** need the same resize. Logical replication or change-data-capture (CDC) consumers may break on a table swap or new partition layout, and a slow consumer's replication slot can hold WAL.
- **Bulk deletes on an unpartitioned table** produce heavy WAL, which inflates disk use, replica lag, and backup storage. Use partition drops or a table-swap approach instead.
- **Application or reporting dependencies** on old audit rows (support tools, analytics jobs) will break silently. Audit who queries audit_events WHERE created_at < now() - 12 months before dropping anything.
- **Backups and point-in-time recovery (PITR)** still contain the old rows until their retention expires. That is fine for this policy, but note it if any deletion obligations apply.
- **Growth acceleration.** If order volume jumps sharply (an acquisition or new market), redo the runway math. The trigger-based plan handles this.
- **The October backfill may not be the last.** Future migrations can cause similar spikes. Budget headroom for them.

---

## Counterarguments, and responses

- **"We'll need sharding eventually, so start now."** Maybe. But "eventually" isn't established by these metrics, and the migration is cheaper later with better data and readiness work done. Starting now pays the full cost early for a constraint that doesn't bind.
- **"Resizing is kicking the can."** The can goes up to 16,000 GB, and archiving halves the growth rate. Combined, that is years of runway for about 1% of the sharding effort.
- **"Partitioning a 1 TB hot table is risky too."** True. But it's a single, well-understood table, append-only, with no updates. That is the easiest kind of table to repartition, and much less risky than resharding the whole schema.
- **"Citus makes sharding easy."** Citus lowers routing complexity, but you still need distribution-key design, reference tables, and cross-shard query rewrites. Infrastructure and operations change too, especially on managed Postgres, where Citus may not be available.

---

## Practical talking points for Thursday

1. The 80 GB/month figure includes a 45 GB one-off. The real rate is 35 GB/month, stable for three months.
2. Storage is the only constrained resource. Compute and write throughput have more than 3x headroom.
3. 42% of the database is audit data that policy already lets us archive.
4. **Ask:** approve an online volume resize this week, and audit partitioning and archiving over the next 4–6 weeks.
5. **Sharding:** put it on a trigger-based watch list with lightweight readiness work. No feature freeze.

---

## Remaining uncertainty

- I don't know the cloud provider or the exact "gp-ssd" resize rules. The AWS EBS limits cited here are illustrative.
- I don't know the split between heap and index in the 780 GB, or the age distribution of the 12–13 month band.
- I don't know whether downstream consumers (CDC, analytics, support tools) read old audit rows.
- Legal-hold status is not confirmed.
- The 3-month trend is short. Seasonal peaks, such as Q4 for an orders platform, could raise organic growth above 35 GB/month in November and December. That strengthens the case for resizing immediately.

## Sources

- Run sources:
  - /home/user/flt-sudo/evaluator-v3/runs/r20261111T014544-6c6ca9d5/sources/capacity-report-2026-10.md
  - /home/user/flt-sudo/evaluator-v3/runs/r20261111T014544-6c6ca9d5/sources/table-sizes.csv
  - /home/user/flt-sudo/evaluator-v3/runs/r20261111T014544-6c6ca9d5/sources/data-retention-policy-excerpt.md
  - /home/user/flt-sudo/evaluator-v3/runs/r20261111T014544-6c6ca9d5/sources/slack-thread-staff-eng.txt
- [AWS EBS: Modify a volume using Elastic Volumes](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html) (no decrease; modification frequency limits; duration)
- [AWS Knowledge Center: Why can't I modify my EBS volume?](https://repost.aws/knowledge-center/ebs-resolve-modify-volume-issues) (6-hour guidance)
- [pg_repack documentation](https://www.pgxn.org/dist/pg_repack/doc/pg_repack.html) (about 2x free space requirement)
- [PostgreSQL docs: Table Partitioning (v18)](https://www.postgresql.org/docs/18/ddl-partitioning.html) and [v10](https://www.postgresql.org/docs/10/ddl-partitioning.html) (bulk deletes via dropping partitions; avoids VACUUM overhead)
- The claims that plain VACUUM doesn't return space to the OS and that VACUUM FULL takes an exclusive lock come from general PostgreSQL knowledge. My search didn't verify them directly.

## Self-assessed quality score: 86/100

The arithmetic, how well the sources reconcile, and the actionability are strong. I lose points because the runway projections after archiving are inferred from limited data, the provider is unknown, and two Postgres mechanics weren't checked against the primary docs in this session. This is a single-pass self-assessment with no independent verification.
