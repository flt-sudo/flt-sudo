// The discovery scan: fetch → normalize → screen → extract → classify →
// dedupe → persist → metrics. Idempotent: re-running over the same posts adds
// nothing, and checkpoints only advance after a query is fully processed.

import { randomUUID } from "node:crypto";
import { errorMessage, type Logger } from "@/lib/log";
import type { ClassificationResult, NormalizedPost, ScanStatus, ScanTrigger } from "@/lib/types";
import { classifyPost } from "./classify";
import { ProviderError } from "./http";
import type { LlmClassifier } from "./llm";
import { notifyScanComplete } from "./notify";
import type { SearchProvider } from "./providers/types";
import { matchTerm } from "./query";
import { suppressionKeys, type DiscoveryInput, type DiscoveryRepository, type RunMetrics } from "./repository";
import { screenForMinorIndicators } from "./safety";
import { extractCreatorProfiles, isValidPostId, isValidXHandle, xPostUrl, xProfileUrl } from "./url-extract";

export const LOCK_TTL_SECONDS = 15 * 60;
const COMPLIANCE_BATCH = 100;

export interface ScanDeps {
  repo: DiscoveryRepository;
  /** Resolves the provider named in settings. */
  providerFor: (name: "x" | "mock") => SearchProvider;
  llm: LlmClassifier | null;
  log: Logger;
  now?: () => Date;
  notify?: typeof notifyScanComplete;
}

export type ScanOutcome =
  | { status: "skipped"; reason: string }
  | { status: "locked" }
  | ({ status: ScanStatus; runId: string; isSimulated: boolean } & Omit<RunMetrics, "status">);

export async function runScan(
  deps: ScanDeps,
  opts: { trigger: ScanTrigger; triggeredBy?: string | null },
): Promise<ScanOutcome> {
  const now = deps.now ?? (() => new Date());
  const settings = await deps.repo.getSettings();

  if (opts.trigger === "scheduled") {
    if (!settings.auto_scan_enabled) return { status: "skipped", reason: "automatic scans are disabled" };
    const last = await deps.repo.lastRunStartedAt();
    // 1-minute tolerance so an hourly cron is not skipped by clock jitter.
    if (last && now().getTime() - last.getTime() < settings.scan_interval_minutes * 60_000 - 60_000) {
      return { status: "skipped", reason: "scan interval has not elapsed" };
    }
  }

  const holder = randomUUID();
  if (!(await deps.repo.acquireLock(holder, LOCK_TTL_SECONDS))) return { status: "locked" };

  const provider = deps.providerFor(settings.provider_configuration.provider);
  const cfg = settings.provider_configuration;
  const log = deps.log.child({ scan: holder, provider: provider.name });
  const m: Omit<RunMetrics, "status"> = {
    recordsExamined: 0,
    newProfilesFound: 0,
    newEventsRecorded: 0,
    duplicatesSkipped: 0,
    excludedCount: 0,
    errors: [],
  };
  let runId: string | null = null;
  let newLikely = 0;

  try {
    runId = await deps.repo.createRun({
      trigger: opts.trigger,
      provider: provider.name,
      isSimulated: provider.isSimulated,
      triggeredBy: opts.triggeredBy,
    });
    log.info("scan started", { runId, trigger: opts.trigger });

    const queries = provider.buildQueries(settings.search_terms);
    let queriesSucceeded = 0;
    let lastRateLimit: { remaining?: number; resetAt?: Date } | undefined;

    for (const q of queries) {
      const sinceId = (await deps.repo.getCheckpoint(provider.name, q.key)) ?? undefined;
      let page;
      try {
        page = await provider.search(q, { sinceId, maxPages: cfg.max_pages_per_query, maxResults: cfg.max_results_per_page });
      } catch (err) {
        const msg = errorMessage(err);
        m.errors.push({ scope: `query ${q.key.slice(0, 8)}`, message: msg });
        log.warn("query failed", { query: q.key, error: msg });
        if (err instanceof ProviderError) {
          await deps.repo.updateProviderHealth(provider.name, {
            error: msg,
            rateLimitResetAt: err.resetAt,
            rateLimitRemaining: err.kind === "rate_limited" ? 0 : undefined,
          });
          // Auth failures and exhausted rate limits will fail every query; stop early.
          if (err.kind === "auth" || err.kind === "rate_limited") break;
        }
        continue;
      }
      lastRateLimit = page.rateLimit;
      if (page.truncated) log.warn("page cap reached; older results for this window were not fetched", { query: q.key });

      let postErrors = 0;
      const prepared: Prepared[] = [];
      for (const post of page.posts) {
        m.recordsExamined++;
        try {
          const p = await preparePost(post, q.terms, settings.minimum_confidence, cfg.llm_enabled, deps);
          if (p) prepared.push(p);
          else m.excludedCount++;
        } catch (err) {
          postErrors++;
          m.errors.push({ scope: `post ${post.id}`, message: errorMessage(err) });
          log.error("post preparation failed", { post: post.id, error: errorMessage(err) });
        }
      }

      // Persist creation-eligible posts first (oldest first), then the rest, so the
      // outcome for a window does not depend on the order the provider returned it in.
      prepared.sort((a, b) => Number(b.allowCreate) - Number(a.allowCreate) || compareIds(a.post.id, b.post.id));
      for (const p of prepared) {
        try {
          const outcome = await deps.repo.recordDiscovery(toInput(p, runId, provider.isSimulated, now()), { allowCreate: p.allowCreate });
          if (outcome === "new_creator") {
            m.newProfilesFound++;
            m.newEventsRecorded++;
            if (p.result.classification === "likely_new_launch") newLikely++;
          } else if (outcome === "new_event") m.newEventsRecorded++;
          else if (outcome === "duplicate") m.duplicatesSkipped++;
        } catch (err) {
          postErrors++;
          m.errors.push({ scope: `post ${p.post.id}`, message: errorMessage(err) });
          log.error("post persistence failed", { post: p.post.id, error: errorMessage(err) });
        }
      }

      // Advance only when every post in the window was handled; failures are retried next run.
      if (postErrors === 0 && page.newestId) {
        await deps.repo.setCheckpoint(provider.name, q.key, q.query, page.newestId);
      }
      if (postErrors === 0) queriesSucceeded++;
    }

    if (queriesSucceeded > 0) {
      await deps.repo.updateProviderHealth(provider.name, {
        success: true,
        rateLimitRemaining: lastRateLimit?.remaining,
        rateLimitResetAt: lastRateLimit?.resetAt,
      });
    }

    await maintenance(provider, cfg.retention_days, deps, log, m);

    const status: ScanStatus =
      m.errors.length === 0 ? "succeeded" : queriesSucceeded > 0 || m.recordsExamined > 0 ? "partial" : "failed";
    await deps.repo.finishRun(runId, { status, ...m });
    log.info("scan finished", { runId, status, ...m, errors: m.errors.length });

    await (deps.notify ?? notifyScanComplete)(
      settings.notification_preferences,
      { runId, isSimulated: provider.isSimulated, newProfiles: m.newProfilesFound, newLikely, status },
      log,
    );
    return { status, runId, isSimulated: provider.isSimulated, ...m };
  } catch (err) {
    m.errors.push({ scope: "scan", message: errorMessage(err) });
    log.error("scan failed", { error: errorMessage(err) });
    if (runId) await deps.repo.finishRun(runId, { status: "failed", ...m }).catch(() => {});
    if (!runId) throw err;
    return { status: "failed", runId, isSimulated: provider.isSimulated, ...m };
  } finally {
    await deps.repo.releaseLock(holder).catch((e) => log.error("lock release failed", { error: errorMessage(e) }));
  }
}

interface Prepared {
  post: NormalizedPost;
  profile: { url: string; slug: string };
  evidence: "post" | "author_profile";
  result: ClassificationResult;
  allowCreate: boolean;
  searchTerm: string | null;
}

function compareIds(a: string, b: string): number {
  const x = BigInt(a);
  const y = BigInt(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Screens, extracts evidence and classifies a post. Returns null when it must not be indexed. */
async function preparePost(
  post: NormalizedPost,
  terms: string[],
  minimumConfidence: number,
  llmEnabled: boolean,
  deps: ScanDeps,
): Promise<Prepared | null> {
  // Validate identifiers before anything is derived from them.
  if (post.isRetweet || !isValidPostId(post.id) || !isValidXHandle(post.author.username)) return null;

  // Adult-only: drop anything suggesting a minor, before any storage.
  if (screenForMinorIndicators(post.text, post.author.name, post.author.description).excluded) return null;

  // Evidence: a creator-profile link in the post itself, else on the author's public X profile.
  // Profiles on this platform require creator ID/age verification before they can publish,
  // which is the adult-evidence basis; posts with no such link are not indexed.
  const inPost = extractCreatorProfiles(post.urls, post.text);
  const inBio = inPost.length ? [] : extractCreatorProfiles(post.author.profileUrls);
  const profile = inPost[0] ?? inBio[0];
  if (!profile) return null;
  const evidence = inPost.length ? ("post" as const) : ("author_profile" as const);

  if (await deps.repo.isSuppressed(suppressionKeys(post.author.username, profile.slug))) return null;

  let result = classifyPost({ text: post.text, publishedAt: post.createdAt, evidence });
  if (llmEnabled && deps.llm && (result.classification === "possible_new_launch" || result.classification === "needs_review")) {
    result = await deps.llm.refine({ text: post.text, evidence, rules: result, publishedAt: post.createdAt });
  }

  const allowCreate =
    result.classification === "needs_review" ||
    (result.classification !== "existing_creator_promotion" && result.confidence >= minimumConfidence);

  return { post, profile, evidence, result, allowCreate, searchTerm: matchTerm(post.text, terms) };
}

function toInput(p: Prepared, runId: string, isSimulated: boolean, discoveredAt: Date): DiscoveryInput {
  const { post } = p;
  return {
    isSimulated,
    scanRunId: runId,
    discoveredAt,
    searchTerm: p.searchTerm,
    post: { id: post.id, url: xPostUrl(post.author.username, post.id), publishedAt: post.createdAt, excerpt: excerpt(post.text) },
    creator: {
      handle: post.author.username,
      displayName: post.author.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 100),
      xProfileUrl: xProfileUrl(post.author.username),
      profileUrl: p.profile.url,
      slug: p.profile.slug,
    },
    result: p.result,
    evidenceSource: p.evidence,
  };
}

/** Plain-text excerpt for evidence display. Control characters stripped; rendered as text only. */
export function excerpt(text: string): string {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function maintenance(
  provider: SearchProvider,
  retentionDays: number,
  deps: ScanDeps,
  log: Logger,
  m: Omit<RunMetrics, "status">,
) {
  // Honour source deletions: drop evidence for posts that are no longer publicly available.
  if (!provider.isSimulated && provider.lookupAvailable) {
    try {
      const ids = await deps.repo.postsForComplianceCheck(COMPLIANCE_BATCH);
      if (ids.length) {
        const available = await provider.lookupAvailable(ids);
        const gone = ids.filter((id) => !available.has(id));
        if (gone.length) {
          const removed = await deps.repo.removePosts(gone);
          log.info("removed evidence for deleted source posts", { removed });
        }
        await deps.repo.markComplianceChecked(ids.filter((id) => available.has(id)));
      }
    } catch (err) {
      m.errors.push({ scope: "compliance", message: errorMessage(err) });
    }
  }
  try {
    const purged = await deps.repo.purgeOlderThan(retentionDays);
    if (purged) log.info("retention purge", { purged });
  } catch (err) {
    m.errors.push({ scope: "retention", message: errorMessage(err) });
  }
}
