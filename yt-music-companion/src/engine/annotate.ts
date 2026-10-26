import { z } from "zod";
import type { DB } from "../db/index.js";
import { nowIso } from "../db/index.js";
import type { LlmProvider } from "../llm/types.js";
import type { Track } from "../providers/music/types.js";

/**
 * Track-level mood/energy annotations. YouTube Music exposes no audio features,
 * so these are always AI-inferred (or user-entered) and stored with source and
 * model so they are never presented as measured data.
 */
export interface Annotation {
  videoId: string;
  energy: number | null;
  valence: number | null;
  moods: string[];
  genres: string[];
  source: "inferred" | "user" | "heuristic";
}

const AnnotationBatchSchema = z.object({
  tracks: z.array(
    z.object({
      videoId: z.string(),
      energy: z.number().describe("0..1"),
      valence: z.number().describe("0..1, musical positivity"),
      moods: z.array(z.string()),
      genres: z.array(z.string()),
    }),
  ),
});

export async function loadAnnotations(db: DB, ids: string[]): Promise<Map<string, Annotation>> {
  const out = new Map<string, Annotation>();
  for (let i = 0; i < ids.length; i += 500) {
    const rows = await db.selectFrom("track_annotations").selectAll().where("video_id", "in", ids.slice(i, i + 500)).execute();
    for (const r of rows) {
      out.set(r.video_id, {
        videoId: r.video_id,
        energy: r.energy,
        valence: r.valence,
        moods: JSON.parse(r.moods),
        genres: JSON.parse(r.genres),
        source: r.source as Annotation["source"],
      });
    }
  }
  return out;
}

async function store(db: DB, a: Annotation, model: string | null) {
  const row = {
    video_id: a.videoId,
    energy: a.energy,
    valence: a.valence,
    moods: JSON.stringify(a.moods),
    genres: JSON.stringify(a.genres),
    source: a.source,
    model,
    created_at: nowIso(),
  };
  // Never overwrite a user-entered annotation with an inferred one.
  await db
    .insertInto("track_annotations")
    .values(row)
    .onConflict((oc) => oc.column("video_id").doUpdateSet(row).where("track_annotations.source", "!=", "user"))
    .execute();
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

/** Annotate tracks lacking annotations. With no LLM, a tag source (mock catalog) or nothing is used. */
export async function ensureAnnotations(
  db: DB,
  tracks: Track[],
  llm: LlmProvider | null,
  tagSource?: (videoId: string) => string[],
): Promise<Map<string, Annotation>> {
  const ids = tracks.map((t) => t.videoId);
  const have = await loadAnnotations(db, ids);
  const missing = tracks.filter((t) => !have.has(t.videoId));
  if (!missing.length) return have;

  if (llm?.isModel) {
    for (let i = 0; i < missing.length; i += 40) {
      const batch = missing.slice(i, i + 40);
      const list = batch.map((t) => `${t.videoId} | ${t.title} | ${t.artists.join(", ")}${t.album ? ` | ${t.album}` : ""}`).join("\n");
      try {
        const res = await llm.generateJson({
          name: "track_annotations",
          system:
            "You estimate musical attributes of songs from general music knowledge. Return one entry per input videoId. " +
            "If you don't know a song, estimate from the artist's typical style and keep moods/genres broad.",
          prompt: `Annotate these tracks (videoId | title | artists | album):\n${list}`,
          schema: AnnotationBatchSchema,
          maxTokens: 8000,
        });
        const valid = new Set(batch.map((t) => t.videoId));
        for (const r of res.tracks) {
          if (!valid.has(r.videoId)) continue; // ignore ids the model made up
          const a: Annotation = {
            videoId: r.videoId,
            energy: clamp(r.energy),
            valence: clamp(r.valence),
            moods: r.moods.slice(0, 6).map((m) => m.toLowerCase()),
            genres: r.genres.slice(0, 4).map((g) => g.toLowerCase()),
            source: "inferred",
          };
          await store(db, a, llm.model);
          have.set(a.videoId, a);
        }
      } catch {
        // Annotation is best-effort; sequencing degrades gracefully without it.
      }
    }
    return have;
  }

  if (tagSource) {
    for (const t of missing) {
      const tags = tagSource(t.videoId);
      if (!tags.length) continue;
      const energy = tags.includes("energetic") || tags.includes("workout") ? 0.85 : tags.includes("slow") || tags.includes("intimate") ? 0.3 : 0.5;
      const a: Annotation = { videoId: t.videoId, energy, valence: null, moods: tags, genres: tags.slice(0, 1), source: "heuristic" };
      await store(db, a, null);
      have.set(t.videoId, a);
    }
  }
  return have;
}
