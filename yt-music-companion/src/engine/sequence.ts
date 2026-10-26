/**
 * Mood-aware sequencing. Builds a target energy curve (start → peak at ~60% →
 * end) and assigns tracks to slots by closest energy, then spaces out repeated
 * artists. Tracks with unknown energy are treated as mid-curve fillers.
 */
export interface SeqItem {
  videoId: string;
  artist: string;
  energy: number | null;
  durationS: number | null;
}

export function energyCurve(n: number, start: number, peak: number, end: number, peakAt = 0.6): number[] {
  if (n <= 0) return [];
  if (n === 1) return [peak];
  return Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    if (x <= peakAt) return start + (peak - start) * Math.sin((x / peakAt) * (Math.PI / 2));
    const y = (x - peakAt) / (1 - peakAt);
    return peak + (end - peak) * (1 - Math.cos(y * (Math.PI / 2)));
  });
}

export function sequence<T extends SeqItem>(items: T[], curve: { start: number; peak: number; end: number }): T[] {
  const n = items.length;
  if (n <= 2) return [...items];
  const target = energyCurve(n, curve.start, curve.peak, curve.end);
  const known = items.filter((i) => i.energy != null);
  const unknown = items.filter((i) => i.energy == null);
  const slots: Array<T | null> = Array(n).fill(null);

  // Fill slots in order of how extreme their target is, so peaks/valleys get the best matches.
  const mid = (curve.start + curve.peak + curve.end) / 3;
  const order = target.map((e, i) => ({ i, e })).sort((a, b) => Math.abs(b.e - mid) - Math.abs(a.e - mid));
  const pool = [...known];
  const unknownSlots: number[] = [];
  for (const { i, e } of order) {
    if (!pool.length) {
      unknownSlots.push(i);
      continue;
    }
    let best = 0;
    for (let k = 1; k < pool.length; k++) if (Math.abs(pool[k]!.energy! - e) < Math.abs(pool[best]!.energy! - e)) best = k;
    slots[i] = pool.splice(best, 1)[0]!;
  }
  unknownSlots.sort((a, b) => a - b);
  unknownSlots.forEach((slot, k) => (slots[slot] = unknown[k]!));
  return spaceArtists(slots.filter((s): s is T => s != null));
}

/** Swap to avoid the same artist on adjacent tracks where possible. */
export function spaceArtists<T extends { artist: string }>(list: T[]): T[] {
  const out = [...list];
  for (let i = 1; i < out.length; i++) {
    if (out[i]!.artist.toLowerCase() !== out[i - 1]!.artist.toLowerCase()) continue;
    for (let j = i + 1; j < out.length; j++) {
      const cand = out[j]!;
      const okPrev = cand.artist.toLowerCase() !== out[i - 1]!.artist.toLowerCase();
      const okNext = i + 1 >= out.length || cand.artist.toLowerCase() !== out[i + 1]?.artist.toLowerCase() || j === i + 1;
      if (okPrev && okNext) {
        [out[i], out[j]] = [out[j]!, out[i]!];
        break;
      }
    }
  }
  return out;
}

/** Pick a prefix whose total duration lands near the target (unknown durations count as 3.5 min). */
export function fitDuration<T extends SeqItem>(items: T[], minutes: number): T[] {
  const target = minutes * 60;
  const out: T[] = [];
  let total = 0;
  for (const it of items) {
    const d = it.durationS ?? 210;
    if (total + d > target + 150 && out.length) break;
    out.push(it);
    total += d;
    if (total >= target - 60) break;
  }
  return out;
}
