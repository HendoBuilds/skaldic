import { test, expect } from "vitest";
import { buildSavChunks, readSavContent } from "./sav";

const header = new Uint8Array(1235).fill(7); // stand-in header for unit tests

test("one short partition → one 6239-byte chunk that round-trips", () => {
  const content = "|;2272|#0;0-24-1-0.15|";
  const chunks = buildSavChunks(content, header);
  expect(chunks.length).toBe(1);
  expect(chunks[0].length).toBe(1235 + 5001 + 3);
  expect(readSavContent(chunks, header)).toBe(content);
});

test("long content spans multiple chunks and round-trips", () => {
  const content =
    "|;1000|#0;" +
    Array.from({ length: 600 }, (_, i) => `${i}-24-1-0.2`).join(";") +
    "|";
  const chunks = buildSavChunks(content, header);
  expect(chunks.length).toBeGreaterThan(1);
  expect(readSavContent(chunks, header)).toBe(content);
});
