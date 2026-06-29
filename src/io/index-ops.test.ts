import { test, expect } from "vitest";
import { sanitizeName, withSong, withoutSong } from "./index-ops";

test("sanitizes a filename into a song name", () => {
  expect(sanitizeName("My Song (final).mid")).toBe("My Song final");
  expect(sanitizeName("a|b[c]")).toBe("abc");
});

test("normalizes non-ASCII names to ASCII (LuteMod loads names as single-byte text)", () => {
  // Real playtest failure: the em-dash corrupted to '?' in-game and the song wouldn't load.
  expect(sanitizeName("Osbourne Ozzy — Mama I'm Coming Home [MIDIfind.com].mid")).toBe(
    "Osbourne Ozzy - Mama I'm Coming Home MIDIfind.com",
  );
  // Accents, smart quotes, and an ellipsis all reduce to pure ASCII.
  const out = sanitizeName("Café — Déjà vu “quoted”….midi");
  expect(out).toBe("Cafe - Deja vu quoted...");
  expect(/^[\x20-\x7e]*$/.test(out)).toBe(true);
});

test("withSong adds without duplicating", () => {
  expect(withSong(["a"], "b")).toEqual(["a", "b"]);
  expect(withSong(["a", "b"], "b")).toEqual(["a", "b"]);
});

test("withoutSong removes the named song", () => {
  expect(withoutSong(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  expect(withoutSong(["a"], "x")).toEqual(["a"]);
});
