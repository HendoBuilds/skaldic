import type { RawTrack } from "../core/midi";
import type { Assignment } from "../core/converter";
import { rangeFit } from "./fit";

interface Stat {
  index: number;
  n: number;
  avgPitch: number;
  hi: number;
  bassy: boolean;
  avgChord: number; // notes per distinct tick: ~1 = a single line, >1 = strummed chords
  fluteFit: number; // 0–1, fraction of notes already in the flute's range
}

function statsFor(tracks: RawTrack[]): Stat[] {
  return tracks.map((t) => {
    const midis = t.notes.map((n) => n.midi);
    const hi = t.pitchRange ? t.pitchRange[1] : 60;
    const avgPitch = midis.length ? midis.reduce((a, b) => a + b, 0) / midis.length : 60;
    const distinctTicks = new Set(t.notes.map((n) => n.ticks)).size || 1;
    return {
      index: t.index,
      n: t.notes.length,
      avgPitch,
      hi,
      bassy: hi < 52,
      avgChord: t.notes.length / distinctTicks,
      fluteFit: rangeFit(t, 1),
    };
  });
}

/**
 * How "lead/melody-like" a part is — what should sing on the flute so the tune stays
 * recognizable in-game: it sits high, is a single line rather than strummed chords,
 * and actually fits the flute's range (so it won't octave-fold into nonsense). These
 * are the same signals LuteBot's track-scoring net keys on (register, chord size,
 * range), made transparent and tunable instead of a black box.
 */
function leadScore(s: Stat): number {
  const register = Math.min(Math.max((s.avgPitch - 48) / 36, 0), 1); // ~C3..C6 → 0..1
  const monophonic = Math.min(Math.max(2 - s.avgChord, 0), 1); // 1 note/tick → 1, 2+ → 0
  return register * 1.0 + monophonic * 0.8 + s.fluteFit * 1.2;
}

/**
 * Suggest a starting assignment built for a RECOGNIZABLE in-game rendition:
 *  - Lute (#0) = every substantial part stacked (guitars, bass, keys). Each becomes
 *    its own `#0` section and the game merges them; the density gives the song its
 *    body AND keeps the playback clock alive so nothing stalls on a long rest.
 *  - Flute (#1) = the single clearest LEAD line (high + single-line + fits the flute),
 *    lifted onto its own instrument so the melody cuts through instead of being buried
 *    under the lute's chords. Left off if no line genuinely fits the flute.
 *  - Trivial tracks (a handful of notes) are left Off.
 * Always overridable per-track by the user.
 */
export function suggestAssignment(tracks: RawTrack[]): Assignment {
  const a: Assignment = {};
  for (const t of tracks) a[t.index] = null;
  if (tracks.length === 0) return a;

  const stats = statsFor(tracks);
  const maxN = Math.max(...stats.map((s) => s.n));
  // "Substantial" = enough notes to be a real part; scale with the densest track so we
  // keep real parts in sparse files but ignore 2-3 note stubs.
  const minNotes = Math.max(8, Math.round(maxN * 0.02));
  const substantial = stats.filter((s) => s.n >= minNotes);
  if (substantial.length === 0) {
    a[[...stats].sort((x, y) => y.n - x.n)[0].index] = 0;
    return a;
  }

  // Stack everything substantial on the lute for body + density...
  for (const s of substantial) a[s.index] = 0;

  // ...then lift the clearest lead onto the flute — but only a line that actually fits
  // it (otherwise folding ruins the very melody we're trying to feature).
  if (substantial.length > 1) {
    const leads = substantial.filter((s) => !s.bassy && s.fluteFit >= 0.5);
    if (leads.length) {
      const lead = leads.sort((x, y) => leadScore(y) - leadScore(x))[0];
      a[lead.index] = 1;
    }
  }

  return a;
}
