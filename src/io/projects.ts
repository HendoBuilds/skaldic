import { appDataDir, join } from "@tauri-apps/api/path";
import { readFile, writeFile, exists, remove, mkdir, readDir } from "@tauri-apps/plugin-fs";
import type { ParsedMidi } from "../core/midi";
import type { Assignment } from "../core/converter";

/**
 * A re-editable project: everything needed to rebuild the Add panel for a saved song.
 * Stored as JSON in Skaldic's own app-data folder, separate from Mordhau's SaveGames.
 * (The exported .sav is lossy — lute/flute note streams only — so we keep the source
 * MIDI + the user's choices here to make a song editable again.)
 */
export interface Project {
  name: string; // matches the saved song name (and its .sav base name)
  filename: string; // original MIDI filename, for display
  midi: ParsedMidi;
  assignment: Assignment;
  offsets: Record<number, number>;
}

/** Where Skaldic keeps its project files (no side effects — safe to call for display). */
export async function projectsLocation(): Promise<string> {
  return join(await appDataDir(), "projects");
}

async function projectsDir(): Promise<string> {
  const d = await projectsLocation();
  if (!(await exists(d))) await mkdir(d, { recursive: true });
  return d;
}

const projectPath = async (name: string) => join(await projectsDir(), `${name}.json`);

export async function saveProject(p: Project): Promise<void> {
  await writeFile(await projectPath(p.name), new TextEncoder().encode(JSON.stringify(p)));
}

export async function loadProject(name: string): Promise<Project | null> {
  const path = await projectPath(name);
  if (!(await exists(path))) return null;
  return JSON.parse(new TextDecoder().decode(await readFile(path))) as Project;
}

export async function removeProject(name: string): Promise<void> {
  const path = await projectPath(name);
  if (await exists(path)) await remove(path);
}

export async function renameProject(oldName: string, newName: string): Promise<void> {
  const p = await loadProject(oldName);
  if (!p) return; // a pre-existing song with no project — nothing to rename
  await saveProject({ ...p, name: newName });
  await removeProject(oldName);
}

/** Names of songs that have a re-editable project on disk. */
export async function listProjects(): Promise<string[]> {
  const entries = await readDir(await projectsDir());
  return entries
    .filter((e) => e.isFile && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""));
}

/** Write a project to an arbitrary file path (for sharing or backup). */
export async function writeProjectFile(path: string, project: Project): Promise<void> {
  await writeFile(path, new TextEncoder().encode(JSON.stringify(project, null, 2)));
}

/** Read a project from an arbitrary file path; throws if it isn't a valid project. */
export async function readProjectFile(path: string): Promise<Project> {
  const p = JSON.parse(new TextDecoder().decode(await readFile(path))) as Project;
  if (!p || !p.midi || !p.assignment) throw new Error("Not a valid Skaldic project file.");
  return p;
}
