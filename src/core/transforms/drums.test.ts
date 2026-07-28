import { test, expect } from "vitest";
import type { RawTrack } from "../midi";
import { removeDrums } from "./drums";

test("drops percussion / channel 10 tracks", () => {
  const tracks: RawTrack[] = [
    { index: 0, name: "lead", channel: 0, isPercussion: false, pitchRange: [60, 72], notes: [{ ticks: 0, midi: 60, durationTicks: 1, durationSec: 1 }] },
    { index: 1, name: "drums", channel: 9, isPercussion: true, pitchRange: [35, 40], notes: [{ ticks: 0, midi: 35, durationTicks: 1, durationSec: 1 }] },
  ];
  expect(removeDrums(tracks).map((t) => t.index)).toEqual([0]);
});
