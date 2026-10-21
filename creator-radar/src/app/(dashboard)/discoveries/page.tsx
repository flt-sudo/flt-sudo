import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { ClassificationBadge, ConfidenceMeter, ReviewBadge, SimulatedBadge } from "@/components/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requireOperator } from "@/lib/auth";
import { PAGE_SIZE, getDataView, getFeed, getSettings, parseFeedFilters, type FeedFilters, type SortKey } from "@/lib/data/queries";
import { CLASSIFICATIONS, CLASSIFICATION_LABELS, REVIEW_STATUSES, REVIEW_STATUS_LABELS } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

type SP = Record<string, string | string[] | undefined>;

function href(f: FeedFilters, patch: Partial<FeedFilters>) {
  const next = { ...f, ...patch };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  if (next.classification) p.set("classification", next.classification);
  if (next.review) p.set("review", next.review);
  if (next.minConfidence !== undefined) p.set("min", String(Math.round(next.minConfidence * 100)));
  if (next.from) p.set("from", next.from);
  if (next.to) p.set("to", next.to);
  if (next.sort !== "first_seen_at") p.set("sort", next.sort);
  if (next.dir !== "desc") p.set("dir", next.dir);
  if (next.page > 1) p.set("page", String(next.page));
  const s = p.toString();
  return `/discoveries${s ? `?${s}` : ""}`;
}

function SortHeader({ f, k, children, className }: { f: FeedFilters; k: SortKey; children: React.ReactNode; className?: string }) {
  const active = f.sort === k;
  const dir = active && f.dir === "desc" ? "asc" : "desc";
  return (
    <TH className={className} aria-sort={active ? (f.dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={href(f, { sort: k, dir, page: 1 })} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {children}
        {active && (f.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </Link>
    </TH>
  );
}

export default async function DiscoveriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = parseFeedFilters(sp);
  const { supabase } = await requireOperator();
  const settings = await getSettings(supabase);
  const view = await getDataView(settings);
  const { rows, total } = await getFeed(supabase, view, f);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(f.q || f.classification || f.review || f.minConfidence || f.from || f.to);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Discoveries</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} creator profile{total === 1 ? "" : "s"}{filtered ? " match these filters" : " indexed"}. Classifications are automated inferences from public posts, not verified facts.
        </p>
        {sp.deleted && <p className="mt-2 text-xs text-success">Creator and associated evidence deleted.</p>}
      </div>

      <Card className="p-4">
        <form method="get" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7 xl:items-end">
          <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1 xl:col-span-2">
            <Label htmlFor="q">Search</Label>
            <Input id="q" name="q" placeholder="Handle, name or profile" defaultValue={f.q} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classification">Classification</Label>
            <Select id="classification" name="classification" defaultValue={f.classification ?? ""}>
              <option value="">All</option>
              {CLASSIFICATIONS.map((c) => <option key={c} value={c}>{CLASSIFICATION_LABELS[c]}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="review">Review status</Label>
            <Select id="review" name="review" defaultValue={f.review ?? ""}>
              <option value="">All</option>
              {REVIEW_STATUSES.map((r) => <option key={r} value={r}>{REVIEW_STATUS_LABELS[r]}</option>)}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min">Min. score %</Label>
            <Input id="min" name="min" type="number" min={0} max={100} step={5} defaultValue={f.minConfidence !== undefined ? Math.round(f.minConfidence * 100) : ""} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="from">First seen from</Label>
            <Input id="from" name="from" type="date" defaultValue={f.from} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to">to</Label>
            <Input id="to" name="to" type="date" defaultValue={f.to} />
          </div>
          <input type="hidden" name="sort" value={f.sort} />
          <input type="hidden" name="dir" value={f.dir} />
          <div className="col-span-2 flex gap-2 md:col-span-3 xl:col-span-7">
            <button type="submit" className={buttonVariants({ size: "sm" })}>Apply filters</button>
            {filtered && <Link href="/discoveries" className={buttonVariants({ size: "sm", variant: "ghost" })}>Clear</Link>}
          </div>
        </form>
      </Card>

      <Card>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <SortHeader f={f} k="handle">Creator</SortHeader>
              <SortHeader f={f} k="first_seen_at">Discovered</SortHeader>
              <TH>Classification</TH>
              <SortHeader f={f} k="confidence">Score</SortHeader>
              <TH>Source post</TH>
              <TH>Creator profile</TH>
              <TH>Review</TH>
            </TR>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <TR className="hover:bg-transparent">
                <TD colSpan={7} className="py-12 text-center text-muted-foreground">
                  {filtered ? "No profiles match these filters." : "No discoveries yet — run a scan from Scan control."}
                </TD>
              </TR>
            ) : (
              rows.map((r) => (
                <TR key={r.id}>
                  <TD>
                    <Link href={`/creators/${r.id}`} className="group flex flex-col">
                      <span className="flex items-center gap-2 font-medium group-hover:text-primary">
                        @{r.public_x_handle} {r.is_simulated && <SimulatedBadge />}
                      </span>
                      <span className="max-w-48 truncate text-xs text-muted-foreground">{r.public_display_name}</span>
                    </Link>
                  </TD>
                  <TD className="text-xs whitespace-nowrap">{formatDateTime(r.first_seen_at)}</TD>
                  <TD><ClassificationBadge value={r.launch_status} /></TD>
                  <TD><ConfidenceMeter value={r.launch_confidence} /></TD>
                  <TD className="text-xs">
                    <ExternalLink href={r.latest_source_post_url} simulated={r.is_simulated}>View post</ExternalLink>
                    {r.event_count > 1 && <span className="ml-1 text-muted-foreground">+{r.event_count - 1}</span>}
                  </TD>
                  <TD className="text-xs">
                    <ExternalLink href={r.advertised_creator_profile_url} simulated={r.is_simulated}>
                      {r.advertised_creator_profile_url?.replace("https://", "") ?? "—"}
                    </ExternalLink>
                  </TD>
                  <TD><ReviewBadge value={r.review_status} /></TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
            <span>Page {f.page} of {pages}</span>
            <div className="flex gap-2">
              {f.page > 1 && <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={href(f, { page: f.page - 1 })}>Previous</Link>}
              {f.page < pages && <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={href(f, { page: f.page + 1 })}>Next</Link>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
