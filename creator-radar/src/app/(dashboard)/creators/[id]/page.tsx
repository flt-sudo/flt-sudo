import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "@/components/external-link";
import { ClassificationBadge, ConfidenceMeter, ReviewBadge, SimulatedBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOperator } from "@/lib/auth";
import { getCreator } from "@/lib/data/queries";
import { REVIEW_STATUS_LABELS } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { DeleteForm } from "./delete-form";
import { ReviewForm } from "./review-form";

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireOperator();
  const data = await getCreator(supabase, id);
  if (!data) notFound();
  const { creator: c, events, notes } = data;
  const sim = c.is_simulated;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/discoveries" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> Discoveries
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            @{c.public_x_handle} {sim && <SimulatedBadge />}
          </h1>
          <p className="text-sm text-muted-foreground">{c.public_display_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <ClassificationBadge value={c.launch_status} />
          <ReviewBadge value={c.review_status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Publicly advertised information</CardTitle>
              <CardDescription>Only what the creator published themselves. Status is inferred, not verified.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">X profile</dt><dd><ExternalLink href={c.public_x_profile_url} simulated={sim}>{c.public_x_profile_url.replace("https://", "")}</ExternalLink></dd></div>
                <div><dt className="text-xs text-muted-foreground">Advertised creator profile</dt><dd><ExternalLink href={c.advertised_creator_profile_url} simulated={sim}>{c.advertised_creator_profile_url?.replace("https://", "") ?? "—"}</ExternalLink></dd></div>
                <div><dt className="text-xs text-muted-foreground">First seen</dt><dd>{formatDateTime(c.first_seen_at)}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Last seen</dt><dd>{formatDateTime(c.last_seen_at)}</dd></div>
                <div>
                  <dt className="text-xs text-muted-foreground">Claimed launch date</dt>
                  <dd>{c.claimed_launch_date ? <>{formatDate(c.claimed_launch_date)} <span className="text-xs text-muted-foreground">(as stated in a post)</span></> : <span className="text-muted-foreground">Not stated</span>}</dd>
                </div>
                <div><dt className="text-xs text-muted-foreground">Launch score</dt><dd><ConfidenceMeter value={c.launch_confidence} /></dd></div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Verification</dt>
                  <dd>
                    {c.review_status === "confirmed"
                      ? "Confirmed by a reviewer."
                      : c.review_status === "dismissed"
                        ? "Dismissed by a reviewer."
                        : "Unverified — automated inference from public posts. The account’s actual creation date is not known."}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evidence timeline</CardTitle>
              <CardDescription>{events.length} observed announcement{events.length === 1 ? "" : "s"} with classification history</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-5 border-l border-border pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-card bg-primary" />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Posted {formatDateTime(e.source_published_at)}</span>
                      <span>·</span>
                      <span>Discovered {formatDateTime(e.discovered_at)}</span>
                      <Badge>{e.classifier === "rules+llm" ? "Rules + model" : "Rules"}</Badge>
                      <Badge>{e.evidence_source === "post" ? "Link in post" : "Link on X profile"}</Badge>
                    </div>
                    {/* Post text is untrusted: rendered as plain text only. */}
                    {e.post_excerpt && (
                      <blockquote className="mt-2 rounded-md border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap break-words">
                        {e.post_excerpt}
                      </blockquote>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <ClassificationBadge value={e.classification} />
                      <ConfidenceMeter value={e.confidence} />
                      <ExternalLink href={e.source_post_url} simulated={sim}><span className="text-xs">Source post</span></ExternalLink>
                      {e.search_term && <span className="text-xs text-muted-foreground">matched “{e.search_term}”</span>}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{e.explanation}</p>
                    {e.claimed_launch_date && <p className="mt-1 text-xs text-muted-foreground">Claimed launch date: {formatDate(e.claimed_launch_date)}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
              <CardDescription>Record what you verified</CardDescription>
            </CardHeader>
            <CardContent><ReviewForm creatorId={c.id} current={c.review_status} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Review notes</CardTitle></CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No notes yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {notes.map((n) => (
                    <li key={n.id} className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(n.created_at)}
                        {n.status_change && <> · set to <span className="text-foreground">{REVIEW_STATUS_LABELS[n.status_change]}</span></>}
                      </div>
                      {n.note && <p className="mt-0.5 whitespace-pre-wrap break-words">{n.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle>Remove record</CardTitle>
              <CardDescription>Deletes the profile, all evidence and notes.</CardDescription>
            </CardHeader>
            <CardContent><DeleteForm creatorId={c.id} handle={c.public_x_handle} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
