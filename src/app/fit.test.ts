import { test, expect } from "vitest";
import { rangeFit } from "./fit";

const tk = (midis: number[]) =>
  ({ notes: midis.map((midi) => ({ ticks: 0, midi, durationTicks: 1, durationSec: 1 })) }) as any;

// Lute range = [24, 83], Flute range = [36, 83].

test("100% when every note is in range", () => {
  expect(rangeFit(tk([24, 50, 60, 83]), 0)).toBe(1);
});

test("counts only the in-range notes", () => {
  // flute [36,83]: 30 and 35 are below, 40 and 50 are in → 2/4
  expect(rangeFit(tk([30, 35, 40, 50]), 1)).toBe(0.5);
});

test("a bass line fits the lute but barely the flute", () => {
  const bass = tk([28, 30, 33, 37]);
  expect(rangeFit(bass, 0)).toBe(1); // lute [24,83]: all four in
  expect(rangeFit(bass, 1)).toBe(0.25); // flute [36,83]: only 37
});

test("empty track → 0", () => {
  expect(rangeFit(tk([]), 0)).toBe(0);
});

test("an octave offset shifts what counts as in-range", () => {
  const bass = tk([24, 28, 32]); // all below the flute's low note (36)
  expect(rangeFit(bass, 1, 0)).toBe(0);
  expect(rangeFit(bass, 1, 1)).toBe(1); // +1 octave → 36, 40, 44, all in [36, 83]
});
