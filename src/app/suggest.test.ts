import { test, expect } from "vitest";
import type { RawTrack } from "../core/midi";
import { suggestAssignment } from "./suggest";

// A monophonic line: one note per tick, climbing through [lo, hi].
const line = (index: number, n: number, [lo, hi]: [number, number]): RawTrack =>
  ({
    index,
    name: `T${index}`,
    channel: 0,
    isPercussion: false,
    pitchRange: [lo, hi],
    notes: Array.from({ length: n }, (_, i) => ({
      ticks: i * 120,
      midi: lo + (i % (hi - lo + 1)),
      durationTicks: 60,
      durationSec: 0.4,
    })),
  });

// A chordal part: nChords chords of `size` notes each, voiced upward from `lo`.
const chords = (index: number, nChords: number, size: number, lo: number): RawTrack =>
  ({
    index,
    name: `T${index}`,
    channel: 0,
    isPercussion: false,
    pitchRange: [lo, lo + size - 1],
    notes: Array.from({ length: nChords }, (_, i) =>
      Array.from({ length: size }, (_, k) => ({
        ticks: i * 120,
        midi: lo + k,
        durationTicks: 60,
        durationSec: 0.4,
      })),
    ).flat(),
  });

test("flute = the high single-line lead; lute = the chordal/low backing", () => {
  const tracks = [
    chords(0, 200, 4, 30), // low strummed chords → lute
    chords(1, 200, 3, 50), // mid chords → lute
    line(2, 200, [67, 79]), // high melodic line → flute
  ];
  const a = suggestAssignment(tracks);
  expect(a[2]).toBe(1); // the lead rides the flute on its own cooldown
  expect(a[0]).toBe(0);
  expect(a[1]).toBe(0);
});

test("won't feature a line on the flute that sits above its range (would fold)", () => {
  const tracks = [
    chords(0, 200, 3, 45), // mid backing → lute
    line(1, 200, [96, 108]), // far above the flute → fluteFit ~0, not chosen
  ];
  const a = suggestAssignment(tracks);
  expect(a[0]).toBe(0);
  expect(a[1]).toBe(0); // stays on the lute rather than become a folded "lead"
});

test("bass stacks on the lute, never the flute", () => {
  const tracks = [
    line(0, 300, [28, 40]), // bass line (bassy)
    line(1, 200, [60, 72]), // melody
  ];
  const a = suggestAssignment(tracks);
  expect(a[0]).toBe(0); // bass → lute for density
  expect(a[1]).toBe(1); // melody → flute
});

test("a lone substantial track goes on the lute, no flute", () => {
  const tracks = [line(0, 300, [55, 70]), line(1, 3, [60, 62])];
  const a = suggestAssignment(tracks);
  expect(a[0]).toBe(0);
  expect(a[1]).toBe(null); // 3 notes = trivial, left off
});

test("empty tracks → empty assignment", () => {
  expect(suggestAssignment([])).toEqual({});
});
