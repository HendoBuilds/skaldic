import type { Partition } from "../core/types";

/** The SaveGames operations the UI depends on. Real impl = Tauri (savegames.ts); tests inject a fake. */
export interface SaveGamesApi {
  defaultSaveDir(): Promise<string>;
  listSongs(dir: string): Promise<string[]>;
  addSong(dir: string, name: string, p: Partition): Promise<void>;
  removeSong(dir: string, name: string): Promise<void>;
}
