import { test, expect } from "vitest";
import { LUTE } from "../instruments";
import { fitToInstrument } from "./range";

test("in-range note maps by lowestPlayed offset", () => {
  expect(fitToInstrument(24, LUTE)).toBe(0);
  expect(fitToInstrument(36, LUTE)).toBe(12);
});

test("below range folds up by octaves into [0,noteCount)", () => {
  expect(fitToInstrument(12, LUTE)).toBe(0);
});

test("above range folds down into [0,noteCount)", () => {
  expect(fitToInstrument(96, LUTE)).toBe(60 - 12 + (96 % 12));
});
