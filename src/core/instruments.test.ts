import { test, expect } from "vitest";
import { LUTE, FLUTE, instrumentById } from "./instruments";

test("instrument definitions match Mordhau", () => {
  expect(LUTE).toEqual({ id: 0, name: "Lute", lowestSent: 0, lowestPlayed: 24, noteCount: 60 });
  expect(FLUTE).toEqual({ id: 1, name: "Flute", lowestSent: 0, lowestPlayed: 36, noteCount: 48 });
  expect(instrumentById(0)).toBe(LUTE);
  expect(instrumentById(1)).toBe(FLUTE);
});
