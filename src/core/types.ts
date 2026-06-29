export type NoteType = 0 | 1 | 2; // 0=off, 1=on, 2=tempo

export interface Note {
  tick: number;
  tone: number;
  type: NoteType;
  duration: number;
}

export interface Track {
  instrumentId: 0 | 1;
  notes: Note[];
}

export interface Partition {
  name: string;
  tempo: number;
  tracks: Track[];
}

export interface Instrument {
  id: 0 | 1;
  name: string;
  lowestSent: number;
  lowestPlayed: number;
  noteCount: number;
}
