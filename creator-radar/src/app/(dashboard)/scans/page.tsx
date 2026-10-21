import { CheckCircle2, XCircle } from "lucide-react";
import { ScanNowButton } from "@/components/scan-now-button";
import { ScanStatusBadge, SimulatedBadge } from "@/components/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requireOperator } from "@/lib/auth";
import { getProviderHealth, getScanRuns, getSettings } from "@/lib/data/queries";
import { integrationStatus } from "@/lib/scan-service";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { ProviderTest } from "./provider-test";
import { PurgeSimulated } from "./purge-simulated";
import { SettingsForm } from "./settings-form";

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {ok ? <CheckCircle2 className="size-3.5 text-success" /> : <XCircle className="size-3.5 text-muted-foreground" />}
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function duration(a: string, b: string | null) {
  if (!b) return "—";
  const s = Math.round((Date.parse(b) - Date.parse(a)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function ScansPage() {
  const { supabase } = await requireOperator();
  const [settings, runs, health] = await Promise.all([getSettings(supabase), getScanRuns(supabase, 30), getProviderHealth(supabase)]);
  const integ = integrationStatus();
  const provider = settings.provider_configuration.provider;
  const h = health.find((x) => x.provider === provider);
  const errorIsLatest = Boolean(h?.last_error && (!h.last_success_at || (h.last_error_at ?? "") > h.last_success_at));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Scan control</h1>
          <p className="text-sm text-muted-foreground">Run scans, manage the schedule and search phrases, and inspect scan history.</p>
        </div>
        <ScanNowButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Stored in the database. Credentials live only in server environment variables.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} xConfigured={integ.xConfigured} llmConfigured={integ.llmConfigured} webhookConfigured={integ.webhookConfigured} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>API health</CardTitle>
              <CardDescription>{provider === "x" ? "X API v2 (recent search)" : "Mock provider (simulated)"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className={`flex items-center gap-2 text-sm font-medium ${!h ? "text-muted-foreground" : errorIsLatest ? "text-destructive" : "text-success"}`}>
                <span className={`size-2 rounded-full ${!h ? "bg-muted-foreground" : errorIsLatest ? "bg-destructive" : "bg-success"}`} />
                {!h ? "Not checked yet" : errorIsLatest ? "Error" : "Operational"}
              </div>
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Last success</dt><dd>{formatRelative(h?.last_success_at)}</dd>
                <dt className="text-muted-foreground">Last error</dt><dd>{formatRelative(h?.last_error_at)}</dd>
                <dt className="text-muted-foreground">Rate limit left</dt><dd>{h?.rate_limit_remaining ?? "—"}</dd>
                <dt className="text-muted-foreground">Window resets</dt><dd>{formatDateTime(h?.rate_limit_reset_at)}</dd>
              </dl>
              {errorIsLatest && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs break-words text-destructive">{h?.last_error}</p>}
              <ProviderTest />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Server integrations</CardTitle></CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1.5">
                <Check ok={integ.databaseConfigured} label="Pipeline database (DATABASE_URL)" />
                <Check ok={integ.xConfigured} label="X API bearer token" />
                <Check ok={integ.cronConfigured} label="Cron secret (scheduled scans)" />
                <Check ok={integ.llmConfigured} label={`LLM classifier (${integ.llmModel})`} />
                <Check ok={integ.webhookConfigured} label="Notification webhook" />
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data management</CardTitle>
              <CardDescription>Individual creators can be deleted from their detail page.</CardDescription>
            </CardHeader>
            <CardContent><PurgeSimulated /></CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan history</CardTitle>
          <CardDescription>Last {runs.length} runs</CardDescription>
        </CardHeader>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Started</TH><TH>Trigger</TH><TH>Status</TH><TH>Duration</TH>
              <TH className="text-right">Examined</TH><TH className="text-right">New profiles</TH>
              <TH className="text-right">Duplicates</TH><TH className="text-right">Excluded</TH><TH>Errors</TH>
            </TR>
          </THead>
          <TBody>
            {runs.length === 0 ? (
              <TR className="hover:bg-transparent"><TD colSpan={9} className="py-10 text-center text-muted-foreground">No scans yet.</TD></TR>
            ) : (
              runs.map((r) => (
                <TR key={r.id}>
                  <TD className="text-xs whitespace-nowrap">
                    <span className="flex items-center gap-2">{formatDateTime(r.started_at)} {r.is_simulated && <SimulatedBadge />}</span>
                  </TD>
                  <TD className="text-xs capitalize">{r.trigger}</TD>
                  <TD><ScanStatusBadge value={r.status} /></TD>
                  <TD className="tabular text-xs">{duration(r.started_at, r.completed_at)}</TD>
                  <TD className="tabular text-right text-xs">{r.records_examined}</TD>
                  <TD className="tabular text-right text-xs">{r.new_profiles_found}</TD>
                  <TD className="tabular text-right text-xs">{r.duplicates_skipped}</TD>
                  <TD className="tabular text-right text-xs" title="Not indexed: no profile link, safety screen, removal request, or retweet">{r.excluded_count}</TD>
                  <TD className="max-w-72 text-xs">
                    {r.errors.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <details>
                        <summary className="cursor-pointer text-destructive">{r.errors.length} error{r.errors.length === 1 ? "" : "s"}</summary>
                        <ul className="mt-1 flex flex-col gap-1 text-muted-foreground">
                          {r.errors.slice(0, 10).map((e, i) => <li key={i} className="break-words"><span className="text-foreground">{e.scope}:</span> {e.message}</li>)}
                        </ul>
                      </details>
                    )}
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
