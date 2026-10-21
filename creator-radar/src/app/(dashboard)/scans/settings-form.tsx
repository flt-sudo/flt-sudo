"use client";

import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Settings } from "@/lib/types";

const INTERVALS = [
  [60, "Every hour"],
  [180, "Every 3 hours"],
  [360, "Every 6 hours (default)"],
  [720, "Every 12 hours"],
  [1440, "Daily"],
] as const;

function Toggle({ name, defaultChecked, label, hint }: { name: string; defaultChecked: boolean; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--primary)]" />
      <span className="flex flex-col">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function SettingsForm({ settings, xConfigured, llmConfigured, webhookConfigured }: { settings: Settings; xConfigured: boolean; llmConfigured: boolean; webhookConfigured: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, { ok: true, message: "" });
  const p = settings.provider_configuration;
  const intervalKnown = INTERVALS.some(([m]) => m === settings.scan_interval_minutes);
  return (
    <form action={action} className="flex flex-col gap-5">
      <section className="grid gap-3 md:grid-cols-2">
        <Toggle name="auto_scan_enabled" defaultChecked={settings.auto_scan_enabled} label="Automatic scans" hint="Runs on the schedule below via the cron endpoint." />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scan_interval_minutes">Scan frequency</Label>
          <Select id="scan_interval_minutes" name="scan_interval_minutes" defaultValue={String(settings.scan_interval_minutes)}>
            {!intervalKnown && <option value={settings.scan_interval_minutes}>Every {settings.scan_interval_minutes} min</option>}
            {INTERVALS.map(([m, l]) => <option key={m} value={m}>{l}</option>)}
          </Select>
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <Label htmlFor="search_terms">Search phrases (one per line, max 25)</Label>
        <Textarea id="search_terms" name="search_terms" rows={6} defaultValue={settings.search_terms.join("\n")} className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground">Matched as exact phrases. Retweets are excluded automatically.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider">Data provider</Label>
          <Select id="provider" name="provider" defaultValue={p.provider}>
            <option value="mock">Mock — simulated data</option>
            <option value="x">X API — live{xConfigured ? "" : " (token missing)"}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="minimum_confidence">Minimum score to index (%)</Label>
          <Input id="minimum_confidence" name="minimum_confidence" type="number" min={0} max={100} step={5} defaultValue={Math.round(settings.minimum_confidence * 100)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="retention_days">Evidence retention (days)</Label>
          <Input id="retention_days" name="retention_days" type="number" min={1} max={3650} defaultValue={p.retention_days} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max_pages_per_query">Max pages per query</Label>
          <Input id="max_pages_per_query" name="max_pages_per_query" type="number" min={1} max={10} defaultValue={p.max_pages_per_query} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="max_results_per_page">Results per page (10–100)</Label>
          <Input id="max_results_per_page" name="max_results_per_page" type="number" min={10} max={100} defaultValue={p.max_results_per_page} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Toggle
          name="llm_enabled"
          defaultChecked={p.llm_enabled}
          label="LLM second opinion"
          hint={llmConfigured ? "Refines uncertain posts only. Rules still gate the result." : "ANTHROPIC_API_KEY is not set — the toggle has no effect until it is."}
        />
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="webhook_enabled" defaultChecked={settings.notification_preferences.webhook_enabled} className="size-4 accent-[var(--primary)]" />
            Webhook notification after scans
          </label>
          <Select name="notify_on" defaultValue={settings.notification_preferences.notify_on} aria-label="Notify on">
            <option value="likely_new_launch">When likely launches are found</option>
            <option value="any_launch">When any new profile is found</option>
          </Select>
          {!webhookConfigured && <span className="text-xs text-muted-foreground">Set NOTIFY_WEBHOOK_URL to enable delivery.</span>}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        {state.message && <p className={state.ok ? "text-xs text-success" : "text-xs text-destructive"}>{state.message}</p>}
      </div>
    </form>
  );
}
