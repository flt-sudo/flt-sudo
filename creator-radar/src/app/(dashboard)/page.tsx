import { AlertTriangle, CheckCircle2, Clock, Sparkles, Users, Inbox, CalendarDays } from "lucide-react";
import Link from "next/link";
import { ScanNowButton } from "@/components/scan-now-button";
import { ClassificationBadge, ConfidenceMeter, ReviewBadge, ScanStatusBadge } from "@/components/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOperator } from "@/lib/auth";
import { getDataView, getOverview, getSettings } from "@/lib/data/queries";
import type { Classification, ReviewStatus } from "@/lib/types";
import { formatDateTime, formatRelative } from "@/lib/utils";

export default async function OverviewPage() {
  const { supabase } = await requireOperator();
  const settings = await getSettings(supabase);
  const view = await getDataView(settings);
  const o = await getOverview(supabase, view);
  const providerHealth = o.health.find((h) => h.provider === settings.provider_configuration.provider);
  const max = Math.max(1, ...o.days.map((d) => d.likely + d.other));

  const health = !o.lastRun
    ? { label: "No scans yet", tone: "text-muted-foreground", Icon: Clock }
    : o.lastRun.status === "succeeded"
      ? { label: "Healthy", tone: "text-success", Icon: CheckCircle2 }
      : o.lastRun.status === "running"
        ? { label: "Scan running", tone: "text-info", Icon: Clock }
        : { label: o.lastRun.status === "partial" ? "Degraded" : "Failing", tone: o.lastRun.status === "partial" ? "text-warning" : "text-destructive", Icon: AlertTriangle };

  const stats = [
    { label: "New today", value: o.todayCount, icon: Sparkles, hint: "Profiles first seen since 00:00 UTC" },
    { label: "New this week", value: o.weekCount, icon: CalendarDays, hint: "Last 7 days" },
    { label: "Indexed profiles", value: o.total, icon: Users, hint: "All creator profiles in this data set" },
    { label: "Likely launches", value: o.likely, icon: CheckCircle2, hint: "Rule/model score — unverified" },
    { label: "Awaiting review", value: o.awaiting, icon: Inbox, hint: "Review status: pending", href: "/discoveries?review=pending" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Publicly announced creator-account launches discovered from authorized search.
          </p>
        </div>
        <ScanNowButton />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, hint, href }) => {
          const body = (
            <Card className="h-full p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">{label}</span>
                <Icon className="size-4" />
              </div>
              <div className="tabular mt-2 text-2xl font-semibold">{value.toLocaleString()}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
            </Card>
          );
          return href ? <Link key={label} href={href}>{body}</Link> : <div key={label}>{body}</div>;
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New profiles per day</CardTitle>
            <CardDescription>Last 14 days (UTC), by first-seen date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Bar chart of new profiles per day">
              {o.days.map((d) => {
                const total = d.likely + d.other;
                return (
                  <div key={d.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div className="flex w-full flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${(total / max) * 100}%` }} title={`${d.date}: ${d.likely} likely, ${d.other} other`}>
                      <div className="w-full bg-info/50" style={{ flexGrow: d.other }} />
                      <div className="w-full bg-success" style={{ flexGrow: d.likely }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{o.days[0].date}</span>
              <span className="flex gap-3">
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-success" /> Likely launch</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-info/50" /> Other</span>
              </span>
              <span>{o.days[13].date}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan health</CardTitle>
            <CardDescription>Automatic scans {settings.auto_scan_enabled ? `every ${settings.scan_interval_minutes / 60}h` : "disabled"}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className={`flex items-center gap-2 font-medium ${health.tone}`}>
              <health.Icon className="size-4" /> {health.label}
            </div>
            <dl className="grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Last successful scan</dt>
              <dd title={formatDateTime(o.lastSuccessAt)}>{formatRelative(o.lastSuccessAt)}</dd>
              <dt className="text-muted-foreground">Last run</dt>
              <dd className="flex items-center gap-1.5">
                {o.lastRun ? <><ScanStatusBadge value={o.lastRun.status} /> {formatRelative(o.lastRun.started_at)}</> : "—"}
              </dd>
              <dt className="text-muted-foreground">Provider API</dt>
              <dd>
                {providerHealth?.last_error && (!providerHealth.last_success_at || providerHealth.last_error_at! > providerHealth.last_success_at)
                  ? <span className="text-destructive">Error</span>
                  : providerHealth?.last_success_at ? <span className="text-success">OK</span> : "Unknown"}
              </dd>
            </dl>
            {o.lastRun?.error_summary && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{o.lastRun.error_summary}</p>
            )}
            <Link href="/scans" className="text-xs text-primary hover:underline">Open scan control →</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Latest discoveries</CardTitle>
            <CardDescription>Most recently first-seen profiles</CardDescription>
          </div>
          <Link href="/discoveries" className="text-xs text-primary hover:underline">View all →</Link>
        </CardHeader>
        <CardContent>
          {o.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No discoveries yet. Run a scan to start building history.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {o.recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <Link href={`/creators/${r.id}`} className="min-w-0">
                    <div className="truncate text-sm font-medium hover:text-primary">@{r.public_x_handle}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.public_display_name} · first seen {formatRelative(r.first_seen_at)}</div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <ConfidenceMeter value={Number(r.launch_confidence)} />
                    <ClassificationBadge value={r.launch_status as Classification} />
                    <ReviewBadge value={r.review_status as ReviewStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
