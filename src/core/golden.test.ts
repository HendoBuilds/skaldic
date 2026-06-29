import { test, expect } from "vitest";
import { convert } from "./converter";
import { serializePartition } from "./serializer";
import type { ParsedMidi } from "./midi";

// Deterministic, hand-built input (no float nondeterminism) → locks the exact output format.
const midi: ParsedMidi = {
  ppq: 480,
  tempos: [{ ticks: 0, bpm: 120 }],
  tracks: [
    {
      index: 0, name: "lute", channel: 0, isPercussion: false, pitchRange: [60, 62],
      notes: [
        { ticks: 0, midi: 60, durationTicks: 240, durationSec: 0.25 },
        { ticks: 480, midi: 62, durationTicks: 240, durationSec: 0.25 },
      ],
    },
    {
      index: 1, name: "flute", channel: 1, isPercussion: false, pitchRange: [48, 48],
      notes: [{ ticks: 0, midi: 48, durationTicks: 240, durationSec: 0.25 }],
    },
  ],
};

test("golden: convert+serialize produces the exact verified partition string", () => {
  const p = convert(midi, { 0: 0, 1: 1 }, "Golden");
  expect(serializePartition(p)).toBe(
    "|Golden;1042|#0;0-36-1-0.25;480-38-1-0.25|#1;0-12-1-0.25|",
  );
});
