import { test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseMidi } from "./midi";

test("parses tracks and notes from a MIDI", () => {
  const bytes = new Uint8Array(readFileSync(new URL("./__fixtures__/two-note.mid", import.meta.url)));
  const m = parseMidi(bytes);
  expect(m.ppq).toBe(480);
  const t = m.tracks.find((t) => t.notes.length === 2)!;
  expect(t).toBeTruthy();
  expect(t.notes.map((n) => n.midi)).toEqual([60, 62]);
  expect(t.notes[0].ticks).toBe(0);
  expect(t.notes[1].ticks).toBe(480);
});
