import type { RawTrack } from "../midi";

export function isDrumTrack(t: RawTrack): boolean {
  return t.isPercussion || t.channel === 9;
}

export function removeDrums(tracks: RawTrack[]): RawTrack[] {
  return tracks.filter((t) => !isDrumTrack(t));
}
