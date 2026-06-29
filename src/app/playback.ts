import type { Partition } from "../core/types";
import { instrumentById } from "../core/instruments";

export interface TimedNote {
  time: number; // seconds from the start of the song
  midi: number; // absolute MIDI pitch
}

export interface Voices {
  lute: TimedNote[];
  flute: TimedNote[];
}

const COOLDOWN_SEC = 0.016; // Mordhau sounds ~one note per 16ms per instrument
const PREVIEW_MAX_SEC = 90; // cap preview length so a huge song doesn't flood the scheduler

// A partition tone is instrument-relative (0..noteCount); recover the absolute MIDI
// pitch the synth should play. fitToInstrument did: tone = midi − lowestPlayed + lowestSent.
function toMidi(tone: number, instrumentId: 0 | 1): number {
  const inst = instrumentById(instrumentId);
  return tone + inst.lowestPlayed - inst.lowestSent;
}

/** Merge every section of one instrument into a single time-sorted note list. */
function voiceFor(partition: Partition, instrumentId: 0 | 1): TimedNote[] {
  const secPerTick = partition.tempo / 1_000_000; // header tempo is µs per tick
  const notes: TimedNote[] = [];
  for (const t of partition.tracks) {
    if (t.instrumentId !== instrumentId) continue;
    for (const n of t.notes) {
      if (n.type !== 1) continue; // play note-ons only
      notes.push({ time: n.tick * secPerTick, midi: toMidi(n.tone, instrumentId) });
    }
  }
  return notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
}

/**
 * Reschedule notes so no two are closer than the cooldown — mirroring how Mordhau
 * queues notes at ~16ms per instrument. Without this, our stacked-lute output would
 * preview as a wall of simultaneous notes instead of the quick roll heard in-game.
 */
export function applyCooldown(notes: TimedNote[], cooldownSec = COOLDOWN_SEC): TimedNote[] {
  let last = -Infinity;
  return notes.map((n) => {
    const time = Math.max(n.time, last + cooldownSec);
    last = time;
    return { time, midi: n.midi };
  });
}

/** Turn a finished partition into the two voices a preview player will sound. */
export function toVoices(
  partition: Partition,
  cooldownSec = COOLDOWN_SEC,
  maxSeconds = PREVIEW_MAX_SEC,
): Voices {
  const cap = (ns: TimedNote[]) => ns.filter((n) => n.time <= maxSeconds);
  return {
    lute: cap(applyCooldown(voiceFor(partition, 0), cooldownSec)),
    flute: cap(applyCooldown(voiceFor(partition, 1), cooldownSec)),
  };
}
