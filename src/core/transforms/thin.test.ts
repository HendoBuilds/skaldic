import { test, expect } from "vitest";
import { thinNotes } from "./thin";

const n = (tick: number, tone: number) => ({ tick, tone, type: 1 as const, duration: 0.2 });

test("caps simultaneous notes per chord", () => {
  const out = thinNotes([n(0, 1), n(0, 2), n(0, 3), n(0, 4)], { cooldownTicks: 0, maxPerChord: 3 });
  expect(out.length).toBe(3);
});

test("drops notes closer than the cooldown (different ticks)", () => {
  const out = thinNotes([n(0, 1), n(5, 2), n(100, 3)], { cooldownTicks: 30, maxPerChord: 3 });
  expect(out.map((x) => x.tick)).toEqual([0, 100]);
});
