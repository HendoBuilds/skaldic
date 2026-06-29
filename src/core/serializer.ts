import type { Partition, Track, Note } from "./types";

function serializeNote(n: Note): string {
  return `${n.tick}-${n.tone}-${n.type}-${n.duration}`;
}

function serializeTrack(t: Track): string {
  return `#${t.instrumentId};` + t.notes.map(serializeNote).join(";");
}

export function serializePartition(p: Partition): string {
  const body = p.tracks.map(serializeTrack).join("|");
  return `|${p.name};${p.tempo}|${body}|`;
}
