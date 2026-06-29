import type { Instrument } from "./types";

export const LUTE: Instrument = { id: 0, name: "Lute", lowestSent: 0, lowestPlayed: 24, noteCount: 60 };
export const FLUTE: Instrument = { id: 1, name: "Flute", lowestSent: 0, lowestPlayed: 36, noteCount: 48 };

export function instrumentById(id: 0 | 1): Instrument {
  return id === 0 ? LUTE : FLUTE;
}
