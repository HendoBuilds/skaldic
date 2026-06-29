import { test, expect } from "vitest";
import { capGaps } from "./gaps";
import type { Track } from "../types";

const n = (tick: number) => ({ tick, tone: 30, type: 1 as const, duration: 0.1 });

test("caps a long gap and shifts later notes earlier", () => {
  const tracks: Track[] = [{ instrumentId: 0, notes: [n(0), n(100), n(10000)] }];
  capGaps(tracks, 500); // gap 100→10000 is 9900 > 500, so cap excess 9400
  expect(tracks[0].notes.map((x) => x.tick)).toEqual([0, 100, 600]);
});

test("shifts every track by the same amount, keeping them in sync", () => {
  const tracks: Track[] = [
    { instrumentId: 0, notes: [n(0), n(100)] },
    { instrumentId: 1, notes: [n(10000)] }, // a flute that enters late
  ];
  capGaps(tracks, 500);
  expect(tracks[0].notes.map((x) => x.tick)).toEqual([0, 100]);
  expect(tracks[1].notes.map((x) => x.tick)).toEqual([600]); // 10000 - 9400
});

test("leaves short gaps untouched", () => {
  const tracks: Track[] = [{ instrumentId: 0, notes: [n(0), n(100), n(300)] }];
  capGaps(tracks, 500);
  expect(tracks[0].notes.map((x) => x.tick)).toEqual([0, 100, 300]);
});
