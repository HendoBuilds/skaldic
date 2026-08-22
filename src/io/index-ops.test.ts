import { test, expect } from "vitest";
import { sanitizeName, withSong, withoutSong, matchProjects } from "./index-ops";

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

test("strips '@' (the .sav chunk padding byte — a real '@' desyncs the index from disk on read-back)", () => {
  expect(sanitizeName("DJ K@t Boogie")).toBe("DJ Kt Boogie");
});

test("withSong adds without duplicating", () => {
  expect(withSong(["a"], "b")).toEqual(["a", "b"]);
  expect(withSong(["a", "b"], "b")).toEqual(["a", "b"]);
});

test("withoutSong removes the named song", () => {
  expect(withoutSong(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  expect(withoutSong(["a"], "x")).toEqual(["a"]);
});

test("matchProjects matches a legacy project name against its stripped in-game entry", () => {
  // A project saved before this fix can still have '@' in its name on disk (project
  // JSON isn't run through the .sav read path), while the in-game index entry for the
  // same song was already stripped of '@' on read-back. A plain string comparison would
  // wrongly call it an orphan and hide its edit/export controls.
  const songs = ["DJ Kt Boogie", "Greensleeves"];
  const projects = ["DJ K@t Boogie", "Greensleeves"];
  const { editable, orphans } = matchProjects(songs, projects);
  expect(orphans).toEqual([]);
  expect(editable).toEqual(new Set(["DJ Kt Boogie", "Greensleeves"]));
});

test("matchProjects still reports a genuine orphan (project with no matching in-game entry)", () => {
  const { orphans } = matchProjects(["Greensleeves"], ["Greensleeves", "Unsent Song"]);
  expect(orphans).toEqual(["Unsent Song"]);
});
