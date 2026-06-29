import type { Note } from "../types";

/**
 * Keep notes playable on Mordhau: cap simultaneous notes per chord, and drop notes
 * that fall within `cooldownTicks` of the previous kept chord on this instrument.
 */
export function thinNotes(notes: Note[], opts: { cooldownTicks: number; maxPerChord: number }): Note[] {
  const sorted = [...notes].sort((a, b) => a.tick - b.tick);
  const out: Note[] = [];
  let lastKeptTick = -Infinity;
  let chordTick = -Infinity;
  let chordCount = 0;
  for (const note of sorted) {
    if (note.tick === chordTick) {
      if (chordCount < opts.maxPerChord) {
        out.push(note);
        chordCount++;
      }
      continue;
    }
    if (note.tick - lastKeptTick < opts.cooldownTicks) continue;
    out.push(note);
    chordTick = note.tick;
    chordCount = 1;
    lastKeptTick = note.tick;
  }
  return out;
}
