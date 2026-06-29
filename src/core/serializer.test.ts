import { test, expect } from "vitest";
import { serializePartition } from "./serializer";

test("serializes one lute track in the verified format", () => {
  const p = {
    name: "",
    tempo: 2272,
    tracks: [
      {
        instrumentId: 0 as const,
        notes: [
          { tick: 0, tone: 24, type: 1 as const, duration: 0.15 },
          { tick: 120, tone: 26, type: 1 as const, duration: 0.15 },
        ],
      },
    ],
  };
  expect(serializePartition(p)).toBe("|;2272|#0;0-24-1-0.15;120-26-1-0.15|");
});

test("serializes two tracks (lute + flute)", () => {
  const p = {
    name: "",
    tempo: 1096,
    tracks: [
      { instrumentId: 0 as const, notes: [{ tick: 0, tone: 24, type: 1 as const, duration: 0.2 }] },
      { instrumentId: 1 as const, notes: [{ tick: 0, tone: 12, type: 1 as const, duration: 0.2 }] },
    ],
  };
  expect(serializePartition(p)).toBe("|;1096|#0;0-24-1-0.2|#1;0-12-1-0.2|");
});
