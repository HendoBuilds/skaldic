// Generates test MIDI fixtures using @tonejs/midi. Run: node scripts/make-fixtures.mjs
import pkg from "@tonejs/midi";
const { Midi } = pkg;
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "src", "core", "__fixtures__");
mkdirSync(outDir, { recursive: true });

// two-note.mid: default ppq 480, 120 bpm; C4 @ tick 0, D4 @ tick 480 (= time 0.5s)
const midi = new Midi();
const track = midi.addTrack();
track.addNote({ midi: 60, time: 0, duration: 0.25 });
track.addNote({ midi: 62, time: 0.5, duration: 0.25 });
writeFileSync(join(outDir, "two-note.mid"), Buffer.from(midi.toArray()));
console.log("wrote two-note.mid (ppq", midi.header.ppq + ")");
