import { test, expect } from "vitest";
import { toVoices, applyCooldown } from "./playback";
import type { Partition } from "../core/types";

const note = (tick: number, tone: number) => ({ tick, tone, type: 1 as const, duration: 0.1 });

test("converts tones to absolute MIDI per instrument and ticks to seconds", () => {
  const p: Partition = {
    name: "X",
    tempo: 1_000_000, // 1 second per tick — keeps the arithmetic obvious
    tracks: [
      { instrumentId: 0, notes: [note(0, 0), note(2, 12)] }, // lute: tone 0→24, tone 12→36
      { instrumentId: 1, notes: [note(0, 0)] }, // flute: tone 0→36
    ],
  };
  const v = toVoices(p, 0);
  expect(v.lute).toEqual([
    { time: 0, midi: 24 },
    { time: 2, midi: 36 },
  ]);
  expect(v.flute).toEqual([{ time: 0, midi: 36 }]);
});

test("merges multiple sections of the same instrument, time-sorted", () => {
  const p: Partition = {
    name: "X",
    tempo: 1_000_000,
    tracks: [
      { instrumentId: 0, notes: [note(2, 0)] },
      { instrumentId: 0, notes: [note(0, 5)] },
    ],
  };
  expect(toVoices(p, 0).lute.map((n) => n.time)).toEqual([0, 2]);
});

test("cooldown pushes too-close notes apart", () => {
  const v = applyCooldown(
    [
      { time: 0, midi: 24 },
      { time: 0.001, midi: 26 },
      { time: 0.002, midi: 28 },
    ],
    0.016,
  );
  expect(v[0].time).toBeCloseTo(0, 6);
  expect(v[1].time).toBeCloseTo(0.016, 6);
  expect(v[2].time).toBeCloseTo(0.032, 6);
});

test("cooldown leaves well-spaced notes alone", () => {
  const v = applyCooldown(
    [
      { time: 0, midi: 24 },
      { time: 1, midi: 26 },
    ],
    0.016,
  );
  expect(v.map((n) => n.time)).toEqual([0, 1]);
});

test("caps preview length to maxSeconds", () => {
  const p: Partition = {
    name: "X",
    tempo: 1_000_000, // 1 second per tick
    tracks: [{ instrumentId: 0, notes: [note(0, 0), note(100, 0)] }],
  };
  const v = toVoices(p, 0, 50); // note at tick 100 = 100s, beyond the 50s cap
  expect(v.lute.map((n) => n.time)).toEqual([0]);
});
