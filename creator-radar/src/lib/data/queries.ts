import "server-only";
import { cookies } from "next/headers";
import type { SupabaseServerClient } from "@/lib/auth";
import { parseSettings } from "@/lib/settings";
import { CLASSIFICATIONS, REVIEW_STATUSES, type Classification, type ReviewStatus, type Settings } from "@/lib/types";

export type DataView = "live" | "simulated";
export const DATA_VIEW_COOKIE = "cr_view";

export async function getSettings(supabase: SupabaseServerClient): Promise<Settings> {
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return parseSettings(data);
}

/** Which data set the dashboard shows. Defaults to whatever the active provider produces. */
export async function getDataView(settings: Settings): Promise<DataView> {
  const v = (await cookies()).get(DATA_VIEW_COOKIE)?.value;
  if (v === "live" || v === "simulated") return v;
  return settings.provider_configuration.provider === "mock" ? "simulated" : "live";
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export interface ScanRunRow {
  id: string;
  trigger: string;
  provider: string;
  is_simulated: boolean;
  started_at: string;
  completed_at: string | null;
  status: "running" | "succeeded" | "partial" | "failed";
  records_examined: number;
  new_profiles_found: number;
  new_events_recorded: number;
  duplicates_skipped: number;
  excluded_count: number;
  errors: Array<{ scope: string; message: string }>;
  error_summary: string | null;
}

export interface ProviderHealthRow {
  provider: string;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error: string | null;
  rate_limit_remaining: number | null;
  rate_limit_reset_at: string | null;
}

export async function getOverview(supabase: SupabaseServerClient, view: DataView) {
  const sim = view === "simulated";
  const today = startOfUtcDay();
  const weekAgo = new Date(today.getTime() - 6 * 86_400_000);
  const chartStart = new Date(today.getTime() - 13 * 86_400_000);
  const count = (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) =>
    Promise.resolve(q).then((r) => {
      if (r.error) throw new Error(r.error.message);
      return r.count ?? 0;
    });
  const base = () => supabase.from("creators").select("id", { count: "exact", head: true }).eq("is_simulated", sim);

  const [todayCount, weekCount, total, likely, awaiting, recent, chartRows, lastSuccess, lastRun, health] = await Promise.all([
    count(base().gte("first_seen_at", today.toISOString())),
    count(base().gte("first_seen_at", weekAgo.toISOString())),
    count(base()),
    count(base().eq("launch_status", "likely_new_launch")),
    count(base().eq("review_status", "pending")),
    supabase
      .from("creator_feed")
      .select("id, public_x_handle, public_display_name, launch_status, launch_confidence, first_seen_at, review_status")
      .eq("is_simulated", sim)
      .order("first_seen_at", { ascending: false })
      .limit(6),
    supabase
      .from("creators")
      .select("first_seen_at, launch_status")
      .eq("is_simulated", sim)
      .gte("first_seen_at", chartStart.toISOString())
      .limit(5000),
    supabase
      .from("scan_runs")
      .select("completed_at")
      .eq("is_simulated", sim)
      .eq("status", "succeeded")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("scan_runs").select("*").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("provider_health").select("*"),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(chartStart.getTime() + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), likely: 0, other: 0 };
  });
  for (const r of chartRows.data ?? []) {
    const day = days.find((d) => d.date === String(r.first_seen_at).slice(0, 10));
    if (!day) continue;
    if (r.launch_status === "likely_new_launch") day.likely++;
    else day.other++;
  }

  return {
    todayCount,
    weekCount,
    total,
    likely,
    awaiting,
    recent: recent.data ?? [],
    days,
    lastSuccessAt: (lastSuccess.data?.completed_at as string | undefined) ?? null,
    lastRun: (lastRun.data as ScanRunRow | null) ?? null,
    health: (health.data as ProviderHealthRow[] | null) ?? [],
  };
}

export const SORTABLE = {
  first_seen_at: "first_seen_at",
  last_seen_at: "last_seen_at",
  confidence: "launch_confidence",
  handle: "public_x_handle",
} as const;
export type SortKey = keyof typeof SORTABLE;

export interface FeedFilters {
  q?: string;
  classification?: Classification;
  review?: ReviewStatus;
  minConfidence?: number;
  from?: string;
  to?: string;
  sort: SortKey;
  dir: "asc" | "desc";
  page: number;
}

export const PAGE_SIZE = 25;

export function parseFeedFilters(sp: Record<string, string | string[] | undefined>): FeedFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  const classification = one("classification");
  const review = one("review");
  const min = Number(one("min"));
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 60),
    classification: CLASSIFICATIONS.includes(classification as Classification) ? (classification as Classification) : undefined,
    review: REVIEW_STATUSES.includes(review as ReviewStatus) ? (review as ReviewStatus) : undefined,
    minConfidence: Number.isFinite(min) && min > 0 && min <= 100 ? min / 100 : undefined,
    from: date(one("from")),
    to: date(one("to")),
    sort: sort && sort in SORTABLE ? (sort as SortKey) : "first_seen_at",
    dir: one("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Math.min(1000, Number(one("page")) || 1)),
  };
}

export interface FeedRow {
  id: string;
  public_x_handle: string;
  public_display_name: string | null;
  public_x_profile_url: string;
  advertised_creator_profile_url: string | null;
  first_seen_at: string;
  last_seen_at: string;
  launch_status: Classification;
  launch_confidence: number;
  review_status: ReviewStatus;
  latest_source_post_url: string | null;
  event_count: number;
  is_simulated: boolean;
}

export async function getFeed(supabase: SupabaseServerClient, view: DataView, f: FeedFilters) {
  let q = supabase
    .from("creator_feed")
    .select(
      "id, public_x_handle, public_display_name, public_x_profile_url, advertised_creator_profile_url, first_seen_at, last_seen_at, launch_status, launch_confidence, review_status, latest_source_post_url, event_count, is_simulated",
      { count: "exact" },
    )
    .eq("is_simulated", view === "simulated");
  if (f.q) {
    // Strip PostgREST filter syntax characters before building the or() expression.
    const term = f.q.replace(/[^A-Za-z0-9_. -]/g, "");
    if (term) q = q.or(`public_x_handle.ilike.%${term}%,public_display_name.ilike.%${term}%,advertised_profile_slug.ilike.%${term}%`);
  }
  if (f.classification) q = q.eq("launch_status", f.classification);
  if (f.review) q = q.eq("review_status", f.review);
  if (f.minConfidence !== undefined) q = q.gte("launch_confidence", f.minConfidence);
  if (f.from) q = q.gte("first_seen_at", `${f.from}T00:00:00Z`);
  if (f.to) q = q.lt("first_seen_at", new Date(Date.parse(`${f.to}T00:00:00Z`) + 86_400_000).toISOString());
  q = q.order(SORTABLE[f.sort], { ascending: f.dir === "asc" }).order("id");
  const from = (f.page - 1) * PAGE_SIZE;
  const { data, count, error } = await q.range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`Could not load discoveries: ${error.message}`);
  return { rows: (data ?? []) as FeedRow[], total: count ?? 0 };
}

export interface EventRow {
  id: string;
  source_post_id: string;
  source_post_url: string;
  source_published_at: string;
  discovered_at: string;
  search_term: string | null;
  classification: Classification;
  confidence: number;
  explanation: string;
  classifier: string;
  matched_signals: string[];
  claimed_launch_date: string | null;
  evidence_source: "post" | "author_profile";
  extracted_profile_url: string | null;
  post_excerpt: string | null;
}

export interface NoteRow {
  id: string;
  note: string | null;
  status_change: ReviewStatus | null;
  created_at: string;
  author_id: string | null;
}

export async function getCreator(supabase: SupabaseServerClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [creator, events, notes] = await Promise.all([
    supabase.from("creators").select("*").eq("id", id).maybeSingle(),
    supabase.from("discovery_events").select("*").eq("creator_id", id).order("source_published_at", { ascending: false }),
    supabase.from("review_notes").select("*").eq("creator_id", id).order("created_at", { ascending: false }),
  ]);
  if (!creator.data) return null;
  return {
    creator: creator.data as FeedRow & { claimed_launch_date: string | null; advertised_profile_slug: string | null },
    events: (events.data ?? []) as EventRow[],
    notes: (notes.data ?? []) as NoteRow[],
  };
}

export async function getScanRuns(supabase: SupabaseServerClient, limit = 25) {
  const { data } = await supabase.from("scan_runs").select("*").order("started_at", { ascending: false }).limit(limit);
  return (data ?? []) as ScanRunRow[];
}

export async function getProviderHealth(supabase: SupabaseServerClient) {
  const { data } = await supabase.from("provider_health").select("*");
  return (data ?? []) as ProviderHealthRow[];
}
