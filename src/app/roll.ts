export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Map a track's notes to canvas rectangles for a mini piano-roll: x = time (tick)
 * across a shared song span, y = pitch (inverted so high notes sit near the top)
 * within a fixed pitch window. Pure + deterministic so the geometry is unit-testable.
 */
export function noteRects(
  notes: { ticks: number; midi: number; durationTicks: number }[],
  songTicks: number,
  width: number,
  height: number,
  octaveOffset = 0,
  pitchLo = 24,
  pitchHi = 96,
  maxRects = 1800,
): Rect[] {
  const span = Math.max(1, songTicks);
  const range = Math.max(1, pitchHi - pitchLo);
  const semis = 12 * octaveOffset;
  // For very dense tracks, sample evenly so the thumbnail stays cheap to draw.
  const step = notes.length > maxRects ? Math.ceil(notes.length / maxRects) : 1;
  const out: Rect[] = [];
  for (let i = 0; i < notes.length; i += step) {
    const n = notes[i];
    const x = (n.ticks / span) * width;
    const w = Math.max(1, (n.durationTicks / span) * width);
    const py = (clamp(n.midi + semis, pitchLo, pitchHi) - pitchLo) / range;
    const y = clamp(height - py * height, 0, height) - 1;
    out.push({ x, y, w, h: 2 });
  }
  return out;
}
