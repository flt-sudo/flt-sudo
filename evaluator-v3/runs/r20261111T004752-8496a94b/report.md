# Evaluation: Should we prioritise adding replication to the session store next quarter?

## Verdict

**No. The premise is out of date.** The wiki page the question relies on was last edited on 2021-06-02. It describes `sess-redis-01`, a single Redis 5.0 node with no replicas and no persistence. The platform changelog shows that node was replaced on 2025-02-18 and shut down on 2025-03-04. Sessions now run on a managed Valkey 8 cluster, `sessions-prod`: 3 shards, each with 1 primary and 1 replica, spread across availability zones, with automatic failover. Replication already exists.

A real incident has already tested it. In INC-2291 (2025-07-22), a shard primary failed. Failover took 41 s, about 6% of active sessions saw errors, and nobody was logged out. The scenario the wiki warns about ("a node failure logs everyone out") did not happen.

What should get priority next quarter is the **gap the incident exposed**:
1. Client retry/backoff handling for cluster redirects and failover errors. This is the INC-2291 action item, still marked OPEN.
2. Finding out why failover took 41 s.
3. Fixing the wiki.

None of these is "add replication".

Confidence: high on the main conclusion, because the two documents directly contradict each other and the newer one is more specific and backed by an incident record. Medium on the follow-up priorities, which depend on details the documents don't contain.

## Evaluation criteria

1. **Is the premise current?** Does the risk in the wiki still exist?
2. **Size of the remaining risk.** What failure modes are still open, and how bad are they?
3. **Return on effort.** Which work next quarter cuts the most user-visible session errors for the least cost?
4. **Evidence quality.** How recent, specific and consistent the sources are.

## Analysis

### 1. Is the premise current?

| Item | Wiki (2021-06-02) | Changelog (2025) |
|---|---|---|
| Engine | Redis 5.0 | Managed Valkey 8 |
| Topology | Single node `sess-redis-01` | Cluster `sessions-prod`: 3 shards x (1 primary + 1 replica) |
| Replication | None ("TODO: add replication") | 1 replica per shard |
| Spread | Single node | Multiple availability zones |
| Failover | None; a restart logs out all users | Automatic |
| Status of the old node | In service | Shut down 2025-03-04 |
| Session TTL | Not stated | Cut from 30 d to 14 d (2025-03-10) |

The changelog is about four years newer and names specific events, dates and an incident ID. The wiki's "TODO: add replication" was in effect done by the 2025-02 migration, but nobody updated the page. Funding "add replication" would mean paying for work that is already finished.

### 2. How failover works now, and what INC-2291 shows

In a Valkey cluster, nodes check each other's health. When a primary stops responding for longer than `cluster-node-timeout`, the other nodes agree it has failed. One of its replicas is then elected and promoted. Shard failovers happen one at a time across the cluster. Session data on the replica survives, which is why INC-2291 caused no logouts.

The errors come from clients. During the window, requests for that shard's keys fail. After promotion, clients with an outdated map of which node holds which keys get MOVED redirects or connection errors until they refresh that map. If the client doesn't retry with backoff and refresh its map, those errors go straight to users. That matches the 6% error rate, and the open action item targets exactly this.

**41 s is long.** Detection time is set by `cluster-node-timeout` (default 15 s). A Valkey Keyspace 2025 talk reported about 20 s for detection plus failover in a benchmark with a 15 s timeout. A failover more than twice as long points to one or more of:
- a long timeout configured on the managed service;
- slow failure detection or promotion on the provider's side;
- clients reconnecting or refreshing their key map slowly, which stretches the window users actually see past the server-side failover.

The documents don't say which. That should be investigated rather than assumed.

### 3. Rough numbers

- There are 3 shards, so about one third of the key space was affected. 6% of active sessions erroring means only sessions that made a request during the ~41 s window failed. That is consistent with a failover window problem, not lost data.
- Better client retry/backoff could hide most of those errors if the window fits inside the retry budget. Shortening the window (tuning the timeout, refreshing the key map faster) shrinks the problem further. Both are much cheaper than redesigning the architecture.
- The 14 d TTL limits how bad a total data loss would be: users would just log in again, and the stored session state is short-lived. But a full loss would still log everyone out.

## Strengths and weaknesses of the current setup (as documented)

**Strengths:** one replica per shard; spread across availability zones; automatic failover; a managed service handles upkeep; a real failover has already happened without logouts.

**Weaknesses and open items:**
- The client retry/backoff fix from INC-2291 is still OPEN, more than a year after the incident.
- 41 s failover with user-visible errors.
- Only one replica per shard. If a shard's primary and replica both fail, for example during maintenance or a replica resync, that slice of sessions is lost.
- Persistence and backup settings for `sessions-prod` aren't documented. It's unknown whether a full-cluster or region-wide failure would log everyone out.
- The architecture docs are stale, which is how this question arose. Other planning decisions may be resting on the same out-of-date pages.

## Alternatives for next quarter, ranked

1. **Close INC-2291's client action item** (recommended, high value, low cost): cluster-aware client settings, retry with jittered backoff on MOVED, ASK, CLUSTERDOWN and connection errors, automatic key-map refresh, and sensible request timeouts. The GLIDE client docs, for example, suggest raising the default 250 ms request timeout to about 1000 ms during node recovery. Make sure session reads and writes are safe to retry.
2. **Investigate the 41 s failover** (recommended): check `cluster-node-timeout` and the provider's failover metrics. Measure the server-side failover separately from the time clients took to recover.
3. **Run a failover test** (recommended): trigger a controlled failover (e.g., `CLUSTER FAILOVER` or the provider's test-failover feature) before and after the client fix, and measure the error rate and duration.
4. **Update the wiki** (recommended, trivial cost): replace the 2021 page, link to the changelog and INC-2291, and review other old architecture pages.
5. **Second replica per shard or cross-region backup** (optional): only if the business can't accept a full logout from a two-node or region-wide failure. Decide this after checking persistence and backups.
6. **"Add replication"** (not recommended): already done.

## Tradeoffs

- More retrying adds latency during failover and can overload a recovering cluster if backoff isn't jittered and capped.
- A lower `cluster-node-timeout` speeds failover but risks false failovers during network blips or long-running commands.
- A second replica per shard costs about 50% more nodes, against a rare double-failure scenario.

## Edge cases and failure modes still open

- The primary and its only replica fail together, or the replica is still syncing when the primary fails.
- A whole region goes down. Spreading across zones doesn't cover this.
- A network partition causes a split-brain moment. Writes acknowledged by the old primary can be lost, because replication is asynchronous.
- Clients that don't understand clusters, or use old libraries, may treat MOVED as a fatal error.
- Managed-service maintenance windows trigger planned failovers, so the same client errors will keep recurring until the fix ships.

## Counterarguments

- *"The changelog is only an excerpt; maybe things changed later."* Possible. Check the live configuration of `sessions-prod` before deciding. But nothing suggests a rollback to a single node, and the old node is recorded as shut down.
- *"Replication exists, but the wiki's concern was really availability, so it's still a priority."* That concern is valid, but the fix is client resilience and failover tuning, not replication.
- *"The managed service might be misconfigured, e.g. replicas disabled."* INC-2291's "no logouts" outcome is direct evidence that replicas worked in July 2025.

## Practical implications

Take "add session-store replication" off the candidate list. Replace it with one small, cheap work package: the client retry/backoff fix, the failover-time investigation, a failover test, and the wiki update. Add a question to settle: what are the persistence/backup settings and the stance on region-wide failure? The answer decides whether option 5 is ever needed.

## Sources

- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T004752-8496a94b/sources/wiki-session-store.md` (stale, 2021-06-02)
- `/home/user/flt-sudo/evaluator-v3/runs/r20261111T004752-8496a94b/sources/platform-changelog-2025.md` (migration, TTL change, INC-2291)
- [Valkey cluster tutorial](https://valkey.io/topics/cluster-tutorial): failure detection and replica promotion
- [Valkey CLUSTER FAILOVER command](https://valkey.io/commands/cluster-failover/): manual failover for testing
- [Valkey blog: 1 billion RPS](https://valkey.io/blog/1-billion-rps/): failovers happen one shard at a time
- [Demystifying Valkey clustering (Keyspace 2025 slides)](https://valkey.io/events/keyspace-2025/./slides/demystifying-valkey-clustering.pdf): ~20 s failover benchmark with a 15 s node timeout
- [Valkey GLIDE high availability](https://glide.valkey.io/concepts/client-features/high-availability/): client timeout guidance
- [AWS re:Post: minimizing ElastiCache failover downtime](https://repost.aws/knowledge-center/elasticache-minimize-downtime-failovers)

## Remaining uncertainty

- The live state of `sessions-prod` after the excerpt wasn't checked. The changelog is partial.
- The provider, `cluster-node-timeout` value, client library and persistence/backup settings are unknown.
- The cause of the 41 s failover is unknown.
- It's unclear whether the INC-2291 action item has been fixed since and just not recorded.
- External sources were only summarised by search results (fetching pages wasn't possible in this environment). The figures quoted from them are background, not part of the core conclusion.

## Self-assessed quality score: 85/100

The core finding is well supported and the reasoning is complete. Points lost because I couldn't check the live system, the external sources are search summaries only, and the cause of the 41 s failover remains speculative.
