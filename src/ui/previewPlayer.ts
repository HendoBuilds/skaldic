import * as Tone from "tone";
import type { TimedNote, Voices } from "../app/playback";

let lute: Tone.PluckSynth | null = null;
let flute: Tone.Synth | null = null;
let total = 0; // current preview's total length, in seconds

const freq = (midi: number) => Tone.Frequency(midi, "midi").toFrequency();
const lastTime = (ns: TimedNote[]) => (ns.length ? ns[ns.length - 1].time : 0);

/** Stop any playback and tear down the synths. Safe to call repeatedly. */
export function stopPreview(): void {
  const t = Tone.getTransport();
  t.stop();
  t.cancel();
  lute?.dispose();
  flute?.dispose();
  lute = null;
  flute = null;
  total = 0;
}

/**
 * Sound the two voices: a plucked-string lute (Karplus-Strong) and a soft triangle
 * "flute". `onEnd` fires once playback finishes. Must be triggered from a user gesture
 * so the browser/webview audio context can start.
 */
export async function playVoices(voices: Voices, onEnd: () => void): Promise<void> {
  await Tone.start();
  stopPreview();
  const t = Tone.getTransport();

  lute = new Tone.PluckSynth({ resonance: 0.95, dampening: 2600 }).toDestination();
  lute.volume.value = -4;
  flute = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.4, release: 0.3 },
  }).toDestination();
  flute.volume.value = -7;

  for (const n of voices.lute) {
    t.schedule((time) => lute?.triggerAttackRelease(freq(n.midi), 0.2, time), n.time);
  }
  for (const n of voices.flute) {
    t.schedule((time) => flute?.triggerAttackRelease(freq(n.midi), 0.2, time), n.time);
  }

  const end = Math.max(lastTime(voices.lute), lastTime(voices.flute)) + 0.6;
  total = end;
  t.scheduleOnce((time) => {
    // Hop to the draw queue so we mutate state/dispose off the audio thread.
    Tone.getDraw().schedule(() => {
      stopPreview();
      onEnd();
    }, time);
  }, end);

  t.start();
}

/** Current preview position and total length, in seconds (for a progress bar). */
export function previewProgress(): { elapsed: number; total: number } {
  return { elapsed: Tone.getTransport().seconds, total };
}
