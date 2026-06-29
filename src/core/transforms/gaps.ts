import type { Track } from "../types";

/**
 * Cap silent gaps in the COMBINED timeline so playback never stalls on a long rest.
 *
 * Mordhau stops playback when it reaches a very long gap with no notes (e.g. a
 * 25-second verse where the chosen track is silent). Shrinking any gap larger than
 * `maxGapTicks` keeps the clock advancing so the song runs end-to-end and later
 * notes — including a flute that enters late — are reached.
 *
 * All tracks are shifted by the same cumulative amount at each gap, so the lute and
 * flute stay in sync with each other; only the absolute (wall-clock) timing changes.
 * Mutates the notes in place.
 */
export function capGaps(tracks: Track[], maxGapTicks: number): void {
  const ticks = [...new Set(tracks.flatMap((t) => t.notes.map((n) => n.tick)))].sort(
    (a, b) => a - b,
  );
  if (ticks.length < 2) return;

  const shiftFor = new Map<number, number>();
  let cum = 0;
  shiftFor.set(ticks[0], 0);
  for (let i = 1; i < ticks.length; i++) {
    const gap = ticks[i] - ticks[i - 1];
    if (gap > maxGapTicks) cum += gap - maxGapTicks;
    shiftFor.set(ticks[i], cum);
  }

  for (const t of tracks) for (const n of t.notes) n.tick -= shiftFor.get(n.tick) ?? 0;
}
