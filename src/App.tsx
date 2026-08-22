import { useCallback, useEffect, useState } from "react";
import { defaultSaveDir, saveDirExists, listSongs, addSong, removeSong, renameSong } from "./io/savegames";
import {
  listProjects,
  loadProject,
  removeProject,
  renameProject,
  projectsLocation,
  writeProjectFile,
  readProjectFile,
  type Project,
} from "./io/projects";
import { sanitizeName, matchProjects } from "./io/index-ops";
import { prepareSong } from "./app/prepare";
import { SongList } from "./ui/SongList";
import { AddPanel } from "./ui/AddPanel";
import { Guide, GUIDE_SEEN_KEY } from "./ui/Guide";
import { UpdateBanner } from "./ui/UpdateBanner";
import { getVersion } from "@tauri-apps/api/app";
import { ask, save, open } from "@tauri-apps/plugin-dialog";

export default function App() {
  const [dir, setDir] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [songs, setSongs] = useState<string[]>([]);
  const [editable, setEditable] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Project | null>(null);
  const [dataDir, setDataDir] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem(GUIDE_SEEN_KEY));
  const [version, setVersion] = useState("");

  const refresh = useCallback(async (d: string) => {
    try {
      const [list, projects] = await Promise.all([listSongs(d), listProjects()]);
      setSongs(list);
      const { editable, orphans } = matchProjects(list, projects);
      setEditable(editable);
      setOrphans(orphans);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  // Locate the save dir and load the songbook; bumping initAttempt re-runs it
  // (Setup's "try again").
  const [initAttempt, setInitAttempt] = useState(0);
  useEffect(() => {
    void (async () => {
      try {
        const d = await defaultSaveDir();
        setDir(d);
        setDataDir(await projectsLocation());
        if (await saveDirExists(d)) {
          setNeedsSetup(false);
          await refresh(d);
        } else {
          setNeedsSetup(true);
        }
      } catch (e) {
        setError(String(e));
      }
    })();
  }, [initAttempt, refresh]);

  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  async function onRemove(name: string) {
    if (!dir) return;
    const ok = await ask(`Remove "${name}" from your songbook? This deletes it from Mordhau.`, {
      title: "Remove song",
      kind: "warning",
    });
    if (!ok) return;
    try {
      await removeSong(dir, name);
      await removeProject(name);
      if (editing?.name === name) setEditing(null);
      await refresh(dir);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onEdit(name: string) {
    try {
      const p = await loadProject(name);
      if (p) {
        setEditing(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function onRename(oldName: string, newName: string) {
    if (!dir) return;
    const next = sanitizeName(newName);
    if (!next || next === oldName) return;
    if (songs.includes(next)) {
      setError(`A song called "${next}" already exists.`);
      return;
    }
    try {
      await renameSong(dir, oldName, next);
      await renameProject(oldName, next);
      if (editing?.name === oldName) setEditing({ ...editing, name: next });
      await refresh(dir);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onResend(name: string) {
    if (!dir) return;
    try {
      const p = await loadProject(name);
      if (!p) return;
      const { partition } = prepareSong(p.midi, p.assignment, p.filename, p.offsets, p.name);
      await addSong(dir, p.name, partition);
      await refresh(dir);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onDeleteProject(name: string) {
    if (!dir) return;
    const ok = await ask(`Delete the saved backup "${name}"? This can't be undone.`, {
      title: "Delete backup",
      kind: "warning",
    });
    if (!ok) return;
    try {
      await removeProject(name);
      await refresh(dir);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onExport(name: string) {
    try {
      const p = await loadProject(name);
      if (!p) return;
      const path = await save({
        defaultPath: `${name}.json`,
        filters: [{ name: "Skaldic project", extensions: ["json"] }],
      });
      if (!path) return;
      await writeProjectFile(path, p);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onImport() {
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: "Skaldic project", extensions: ["json"] }],
      });
      if (typeof path !== "string") return;
      const p = await readProjectFile(path);
      setEditing(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <main className="app">
      <button className="btn-ghost guide-btn" type="button" onClick={() => setShowGuide(true)}>
        ❔ Guide
      </button>
      <h1 className="title">
        <span className="flourish">⚜</span>Skaldic<span className="flourish">⚜</span>
      </h1>
      <p className="subtitle">{dir ?? "resolving SaveGames…"}</p>
      <UpdateBanner />
      {error && <pre className="error">{error}</pre>}
      {needsSetup ? (
        <Setup dir={dir} onRetry={() => setInitAttempt((n) => n + 1)} />
      ) : (
        <>
          {dir && (
            <AddPanel
              dir={dir}
              editing={editing}
              onImport={onImport}
              onAdded={() => {
                setEditing(null);
                void refresh(dir);
              }}
            />
          )}
          <h2>Your songs</h2>
          <SongList
            songs={songs}
            editable={editable}
            onEdit={onEdit}
            onExport={onExport}
            onRename={onRename}
            onRemove={onRemove}
          />
          {orphans.length > 0 && (
            <section>
              <h2>Saved, not in your game</h2>
              <p className="caption">
                These projects aren't currently in Mordhau — re-send to restore one, or delete the backup.
              </p>
              <ul className="song-list">
                {orphans.map((name) => (
                  <li key={name}>
                    <span className="song-name">{name}</span>
                    <span className="song-actions">
                      <button className="btn-ghost" type="button" onClick={() => onResend(name)}>
                        Re-send
                      </button>
                      <button className="btn-ghost danger" type="button" onClick={() => onDeleteProject(name)}>
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {dataDir && (
        <footer className="datafoot">
          <div className="version">Skaldic{version && ` v${version}`}</div>
          Skaldic keeps editable backups of your songs at <code>{dataDir}</code>. The list above is read
          straight from Mordhau's SaveGames — Remove works on any of them, and they stay in-game if you
          uninstall Skaldic.
        </footer>
      )}
      {showGuide && <Guide onClose={() => setShowGuide(false)} />}
    </main>
  );
}

function Setup({ dir, onRetry }: { dir: string | null; onRetry: () => void }) {
  return (
    <section>
      <h2>First-time setup</h2>
      <div className="panel">
        <p className="setup-lead">Skaldic couldn't find your Mordhau SaveGames folder.</p>
        <p className="hint">It looked here:</p>
        <code className="setup-path">{dir}</code>
        <p className="setup-body">
          Make sure <strong>Mordhau is installed and has been launched at least once</strong> — the game
          creates this folder on first run. You'll also need <strong>LuteMod</strong> installed in
          Mordhau for the songs Skaldic sends to actually play in-game.
        </p>
        <button type="button" onClick={onRetry}>
          Check again
        </button>
      </div>
    </section>
  );
}
