import type { RawTrack } from "../core/midi";
import { instrumentById } from "../core/instruments";

/**
 * Fraction (0–1) of a track's notes that land within an instrument's natural
 * playable range — i.e. how faithfully that instrument can render the track before
 * any octave-folding. 100% = plays as written; lower = more notes get folded into
 * range and sound displaced. Mirrors LuteBot's per-track "(Flute: X%)" figure.
 */
export function rangeFit(track: RawTrack, instrumentId: 0 | 1, octaveOffset = 0): number {
  if (track.notes.length === 0) return 0;
  const inst = instrumentById(instrumentId);
  const lo = inst.lowestPlayed;
  const hi = inst.lowestPlayed + inst.noteCount - 1;
  const semis = 12 * octaveOffset;
  let inRange = 0;
  for (const n of track.notes) {
    const m = n.midi + semis;
    if (m >= lo && m <= hi) inRange++;
  }
  return inRange / track.notes.length;
}
