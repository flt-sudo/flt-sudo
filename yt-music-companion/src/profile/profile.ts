import { z } from "zod";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { LlmProvider } from "../llm/types.js";
import { uuid } from "../security/crypto.js";
import { computeObserved, type ObservedProfile } from "./observed.js";

export const CORRECTION_KINDS = ["exclude_artist", "boost_artist", "prefer_genre", "avoid_genre", "reject_inference", "note"] as const;
export type CorrectionKind = (typeof CORRECTION_KINDS)[number];

export interface Inference {
  id: string;
  kind: string;
  value: string;
  weight: number;
  confidence: number;
  evidence: string | null;
  model: string | null;
  createdAt: string;
}

export interface Correction {
  id: string;
  kind: CorrectionKind;
  value: string;
  note: string | null;
  createdAt: string;
}

export interface TasteProfile {
  generatedAt: string;
  /** Honest data-freshness statement for display and for the LLM. */
  freshness: string;
  observed: ObservedProfile;
  inferred: { summary: string | null; items: Inference[]; model: string | null; generatedAt: string | null; label: string };
  corrections: Correction[];
}

const InferenceSchema = z.object({
  summary: z.string().describe("3-5 sentence description of this person's taste, grounded in the data"),
  genres: z.array(z.object({ value: z.string(), weight: z.number(), confidence: z.number(), evidence: z.string() })),
  moods: z.array(z.object({ value: z.string(), weight: z.number(), confidence: z.number(), evidence: z.string() })),
  contexts: z.array(z.object({ value: z.string(), weight: z.number(), confidence: z.number(), evidence: z.string() })),
});

export async function getCorrections(db: DB): Promise<Correction[]> {
  const rows = await db.selectFrom("profile_corrections").selectAll().orderBy("created_at", "asc").execute();
  return rows.map((r) => ({ id: r.id, kind: r.kind as CorrectionKind, value: r.value, note: r.note, createdAt: r.created_at }));
}

export async function addCorrection(db: DB, kind: CorrectionKind, value: string, note?: string): Promise<Correction> {
  const c = { id: uuid(), kind, value: value.trim(), note: note ?? null, created_at: nowIso() };
  await db.insertInto("profile_corrections").values(c).execute();
  return { id: c.id, kind, value: c.value, note: c.note, createdAt: c.created_at };
}

export async function deleteCorrection(db: DB, id: string): Promise<boolean> {
  const r = await db.deleteFrom("profile_corrections").where("id", "=", id).executeTakeFirst();
  return Number(r.numDeletedRows) > 0;
}

function freshnessText(o: ObservedProfile): string {
  const parts: string[] = [];
  if (o.sources.takeout) {
    parts.push(
      `Google Takeout history: ${o.sources.takeout.plays} plays from ${o.sources.takeout.from?.slice(0, 10) ?? "?"} to ${o.sources.takeout.through?.slice(0, 10) ?? "?"} (static export; nothing after ${o.sources.takeout.through?.slice(0, 10) ?? "the export"}).`,
    );
  } else parts.push("No Google Takeout history imported yet, so play counts are unavailable.");
  if (o.sources.ytmLibrary) {
    parts.push(`YouTube Music library last synced ${o.sources.ytmLibrary.lastSyncAt.slice(0, 16).replace("T", " ")} UTC (snapshot, not live).`);
  } else parts.push("YouTube Music library not synced.");
  return parts.join(" ");
}

export async function getInferences(db: DB): Promise<Inference[]> {
  const rows = await db.selectFrom("profile_inferences").selectAll().orderBy("weight", "desc").execute();
  return rows.map((r) => ({ id: r.id, kind: r.kind, value: r.value, weight: r.weight, confidence: r.confidence, evidence: r.evidence, model: r.model, createdAt: r.created_at }));
}

export async function getProfile(db: DB, opts: { timezone?: string } = {}): Promise<TasteProfile> {
  const observed = await computeObserved(db, { timezone: opts.timezone });
  const corrections = await getCorrections(db);
  const rejected = new Set(corrections.filter((c) => c.kind === "reject_inference").map((c) => c.value.toLowerCase()));
  const all = await getInferences(db);
  const summaryRow = all.find((i) => i.kind === "summary");
  const items = all.filter((i) => i.kind !== "summary" && !rejected.has(i.id) && !rejected.has(`${i.kind}:${i.value}`.toLowerCase()) && !rejected.has(i.value.toLowerCase()));
  return {
    generatedAt: nowIso(),
    freshness: freshnessText(observed),
    observed,
    inferred: {
      summary: summaryRow?.value ?? null,
      items,
      model: summaryRow?.model ?? items[0]?.model ?? null,
      generatedAt: summaryRow?.createdAt ?? null,
      label: "AI-inferred from your observed data; may be wrong. Correct it with profile corrections.",
    },
    corrections,
  };
}

/** Compact text view of the profile for LLM prompts. Observed vs inferred stays explicit. */
export function profileForPrompt(p: TasteProfile, max = 25): string {
  const o = p.observed;
  const lines = [
    `DATA FRESHNESS: ${p.freshness}`,
    `OBSERVED top artists (all-time plays): ${o.topArtists.slice(0, max).map((a) => `${a.artist} (${a.plays})`).join(", ") || "n/a"}`,
    `OBSERVED recent top artists (last ${o.recentWindow.days} days of data): ${o.recentTopArtists.slice(0, 15).map((a) => `${a.artist} (${a.plays})`).join(", ") || "n/a"}`,
    `OBSERVED top tracks: ${o.topTracks.slice(0, 15).map((t) => `${t.title} — ${t.artist} (${t.plays})`).join("; ") || "n/a"}`,
    `OBSERVED liked-song artists: ${o.library.likedTopArtists.slice(0, 20).map((a) => `${a.artist} (${a.tracks})`).join(", ") || "n/a"}`,
    `OBSERVED playlists: ${o.library.playlists.slice(0, 20).map((pl) => `"${pl.title}"${pl.topArtists.length ? ` [${pl.topArtists.join(", ")}]` : ""}`).join(", ") || "n/a"}`,
    `OBSERVED recently played (YouTube Music history snapshot): ${o.recentHistory.slice(0, 10).map((t) => `${t.title} — ${t.artist}`).join("; ") || "n/a"}`,
    `OBSERVED new artists in recent window: ${o.discovery.newArtistsInRecentWindow.slice(0, 10).join(", ") || "n/a"}`,
  ];
  if (p.inferred.summary) lines.push(`INFERRED (AI, may be wrong) summary: ${p.inferred.summary}`);
  if (p.inferred.items.length) lines.push(`INFERRED traits: ${p.inferred.items.slice(0, 20).map((i) => `${i.kind}:${i.value}`).join(", ")}`);
  if (p.corrections.length) {
    lines.push(`USER CORRECTIONS (authoritative): ${p.corrections.map((c) => `${c.kind}=${c.value}${c.note ? ` (${c.note})` : ""}`).join("; ")}`);
  }
  return lines.join("\n");
}

/** (Re)generate AI-inferred traits from observed data. Replaces previous inferences. */
export async function refreshInferences(db: DB, llm: LlmProvider, opts: { timezone?: string } = {}): Promise<TasteProfile> {
  const profile = await getProfile(db, opts);
  const o = profile.observed;
  if (!o.totals.plays && !o.library.likedTopArtists.length && !o.library.playlists.length) {
    throw new Error("No listening data yet. Import Google Takeout history or sync your YouTube Music library first.");
  }
  const res = await llm.generateJson({
    name: "taste_inference",
    system:
      "You are a music analyst. Infer genre, mood and listening-context preferences ONLY from the observed data given. " +
      "Give each trait a weight (0..1, importance) and confidence (0..1), and cite the artists/tracks/playlists that support it as evidence. " +
      "Do not invent statistics. Respect user corrections.",
    prompt: profileForPrompt(profile, 40),
    schema: InferenceSchema,
    maxTokens: 8000,
  });
  const now = nowIso();
  const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
  const rows = [
    { id: uuid(), kind: "summary", value: res.summary, weight: 1, confidence: 1, evidence: null, model: llm.model, created_at: now },
    ...(["genres", "moods", "contexts"] as const).flatMap((k) =>
      res[k].slice(0, 15).map((i) => ({
        id: uuid(),
        kind: k.slice(0, -1),
        value: i.value.toLowerCase(),
        weight: clamp(i.weight),
        confidence: clamp(i.confidence),
        evidence: i.evidence.slice(0, 500),
        model: llm.model,
        created_at: now,
      })),
    ),
  ];
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("profile_inferences").execute();
    await trx.insertInto("profile_inferences").values(rows).execute();
  });
  return getProfile(db, opts);
}
