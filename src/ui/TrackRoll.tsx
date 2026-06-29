import { useEffect, useRef } from "react";
import type { RawTrack } from "../core/midi";
import { noteRects } from "../app/roll";

const W = 480;
const H = 40;

/** A compact piano-roll thumbnail of one track, painted in the assignment colour. */
export function TrackRoll({
  track,
  songTicks,
  color,
  octaveOffset = 0,
}: {
  track: RawTrack;
  songTicks: number;
  color: string;
  octaveOffset?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = color;
    for (const r of noteRects(track.notes, songTicks, W, H, octaveOffset))
      ctx.fillRect(r.x, r.y, r.w, r.h);
  }, [track, songTicks, color, octaveOffset]);
  return <canvas ref={ref} width={W} height={H} className="roll" />;
}
