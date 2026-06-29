import { test, expect } from "vitest";
import { noteRects } from "./roll";

test("maps tick to x across the song span", () => {
  const r = noteRects(
    [
      { ticks: 0, midi: 60, durationTicks: 10 },
      { ticks: 100, midi: 60, durationTicks: 10 },
    ],
    100,
    200,
    50,
  );
  expect(r[0].x).toBe(0);
  expect(r[1].x).toBe(200); // tick 100 / span 100 * width 200
});

test("high notes sit above low notes (y inverted)", () => {
  const [hi, lo] = noteRects(
    [
      { ticks: 0, midi: 90, durationTicks: 1 },
      { ticks: 0, midi: 30, durationTicks: 1 },
    ],
    100,
    100,
    100,
  );
  expect(hi.y).toBeLessThan(lo.y);
});

test("clamps out-of-window pitches inside the canvas", () => {
  const [r] = noteRects([{ ticks: 0, midi: 200, durationTicks: 1 }], 100, 100, 100);
  expect(r.y).toBeGreaterThanOrEqual(-1);
  expect(r.y).toBeLessThanOrEqual(100);
});

test("note width never collapses below 1px", () => {
  const [r] = noteRects([{ ticks: 0, midi: 60, durationTicks: 0 }], 100, 100, 50);
  expect(r.w).toBe(1);
});

test("an octave offset moves notes up the roll", () => {
  const [base] = noteRects([{ ticks: 0, midi: 48, durationTicks: 1 }], 100, 100, 100);
  const [up] = noteRects([{ ticks: 0, midi: 48, durationTicks: 1 }], 100, 100, 100, 1);
  expect(up.y).toBeLessThan(base.y); // +1 octave → higher pitch → nearer the top
});

test("samples down dense tracks to at most maxRects", () => {
  const notes = Array.from({ length: 1000 }, (_, i) => ({ ticks: i, midi: 60, durationTicks: 1 }));
  const r = noteRects(notes, 1000, 100, 100, 0, 24, 96, 100);
  expect(r.length).toBeLessThanOrEqual(100);
  expect(r.length).toBeGreaterThan(50);
});
