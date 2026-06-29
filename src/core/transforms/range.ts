import type { Instrument } from "../types";

/** Map a MIDI note to the instrument's sent-tone range [0, noteCount), folding by octaves. */
export function fitToInstrument(midiNote: number, inst: Instrument): number {
  let tone = midiNote - inst.lowestPlayed + inst.lowestSent;
  while (tone < 0) tone += 12;
  while (tone >= inst.noteCount) tone -= 12;
  return tone;
}

/** Map a MIDI note into range by clamping to the nearest playable note (no folding). */
export function clampToInstrument(midiNote: number, inst: Instrument): number {
  const hi = inst.lowestPlayed + inst.noteCount - 1;
  const m = Math.min(hi, Math.max(inst.lowestPlayed, midiNote));
  return m - inst.lowestPlayed + inst.lowestSent;
}
