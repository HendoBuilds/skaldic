import { useState, useMemo, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { parseMidi, melodicTracks, prepareSong } from "../app/prepare";
import type { ParsedMidi, RawTrack, Assignment } from "../app/prepare";
import { addSong } from "../io/savegames";
import { suggestAssignment } from "../app/suggest";
import { rangeFit } from "../app/fit";
import { TrackRoll } from "./TrackRoll";
import { toVoices } from "../app/playback";
import { playVoices, stopPreview, previewProgress } from "./previewPlayer";
import { saveProject, type Project } from "../io/projects";

type Choice = 0 | 1 | "off";

const rollColor = (c: Choice) => (c === 0 ? "#ecc879" : c === 1 ? "#9ec5c0" : "#5a4f3c");
const fmtOct = (o: number) => (o > 0 ? `+${o}` : o < 0 ? `−${-o}` : "0");

function Pct({ f }: { f: number }) {
  const cls = f >= 0.9 ? "good" : f >= 0.5 ? "mid" : "low";
  return <span className={`pct ${cls}`}>{Math.round(f * 100)}%</span>;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// Live preview progress bar. Self-contained so only this re-renders each frame.
function Playbar() {
  const [p, setP] = useState({ elapsed: 0, total: 0 });
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setP(previewProgress());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pct = Math.min(100, (p.elapsed / Math.max(0.001, p.total)) * 100);
  return (
    <div className="playbar">
      <div className="playbar-track">
        <div className="playbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="playbar-time">
        {fmtTime(p.elapsed)} / {fmtTime(p.total)}
      </span>
    </div>
  );
}

interface AddPanelProps {
  dir: string;
  onAdded: () => void;
  editing?: Project | null;
  onImport?: () => void;
}

export function AddPanel({ dir, onAdded, editing, onImport }: AddPanelProps) {
  const [filename, setFilename] = useState("");
  const [midi, setMidi] = useState<ParsedMidi | null>(null);
  const [tracks, setTracks] = useState<RawTrack[]>([]);
  const [choices, setChoices] = useState<Record<number, Choice>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<number, number>>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [settings, setSettings] = useState({ fold: true, maxPerChord: 3, maxGapSec: 1 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => stopPreview(), []);

  // Re-edit: rebuild the panel from a saved project.
  useEffect(() => {
    if (!editing) return;
    stopPreview();
    setIsPlaying(false);
    setError(null);
    const mt = melodicTracks(editing.midi);
    const init: Record<number, Choice> = {};
    for (const t of mt) {
      const v = editing.assignment[t.index];
      init[t.index] = v === 0 || v === 1 ? v : "off";
    }
    setMidi(editing.midi);
    setTracks(mt);
    setChoices(init);
    setOffsets(editing.offsets ?? {});
    setFilename(editing.filename);
    setEditName(editing.name);
  }, [editing]);

  // Space toggles Preview (unless you're typing in a field).
  const previewRef = useRef<() => void>(() => {});
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (e.code === "Space" && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag)) {
        e.preventDefault();
        previewRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const songTicks = useMemo(
    () =>
      tracks.reduce(
        (m, t) => Math.max(m, t.notes.reduce((mm, n) => Math.max(mm, n.ticks + n.durationTicks), 0)),
        0,
      ),
    [tracks],
  );

  async function loadFile(file: File) {
    stopPreview();
    setIsPlaying(false);
    setError(null);
    setNotice(null);
    setEditName(null);
    try {
      const parsed = parseMidi(new Uint8Array(await file.arrayBuffer()));
      const mt = melodicTracks(parsed);
      if (mt.length === 0) {
        setMidi(null);
        setTracks([]);
        setChoices({});
        setOffsets({});
        setFilename("");
        setError(`"${file.name}" has no playable tracks — it may be drums-only or empty.`);
        return;
      }
      const suggested = suggestAssignment(mt);
      const init: Record<number, Choice> = {};
      for (const t of mt) {
        const v = suggested[t.index];
        init[t.index] = v === 0 || v === 1 ? v : "off";
      }
      setFilename(file.name);
      setMidi(parsed);
      setTracks(mt);
      setChoices(init);
      setOffsets({});
    } catch {
      setError(`Couldn't read "${file.name}" as a MIDI file — is it a valid .mid?`);
    }
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    input.value = ""; // allow re-picking the same file
    if (file) await loadFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.midi?$/i.test(file.name)) {
      setError(`"${file.name}" isn't a MIDI file (.mid or .midi).`);
      return;
    }
    void loadFile(file);
  }

  function setChoice(index: number, choice: Choice) {
    setChoices((c) => ({ ...c, [index]: choice }));
  }

  function setOffset(index: number, delta: number) {
    setOffsets((o) => ({ ...o, [index]: Math.min(3, Math.max(-3, (o[index] ?? 0) + delta)) }));
  }

  function resetSuggestion() {
    const suggested = suggestAssignment(tracks);
    const init: Record<number, Choice> = {};
    for (const t of tracks) {
      const v = suggested[t.index];
      init[t.index] = v === 0 || v === 1 ? v : "off";
    }
    setChoices(init);
    // Keep any octave offsets the user tuned — only re-roll instrument assignment.
  }

  function resetSettings() {
    setSettings({ fold: true, maxPerChord: 3, maxGapSec: 1 });
  }

  function buildAssignment(): Assignment {
    const assignment: Assignment = {};
    for (const [idx, c] of Object.entries(choices)) {
      assignment[Number(idx)] = c === "off" ? null : c;
    }
    return assignment;
  }

  const hasInstrument = (a: Assignment) => Object.values(a).some((v) => v === 0 || v === 1);

  async function preview() {
    if (isPlaying) {
      stopPreview();
      setIsPlaying(false);
      return;
    }
    if (!midi) return;
    const assignment = buildAssignment();
    if (!hasInstrument(assignment)) {
      setError("Assign at least one track to Lute or Flute to preview.");
      return;
    }
    setError(null);
    const { partition } = prepareSong(midi, assignment, filename, offsets);
    setIsPlaying(true);
    try {
      await playVoices(toVoices(partition), () => setIsPlaying(false));
    } catch (err) {
      setError(String(err));
      setIsPlaying(false);
    }
  }
  previewRef.current = preview;

  async function send() {
    if (!midi) return;
    const assignment = buildAssignment();
    if (!hasInstrument(assignment)) {
      setError("Assign at least one track to Lute or Flute first.");
      return;
    }
    stopPreview();
    setIsPlaying(false);
    setBusy(true);
    try {
      const { name, partition } = prepareSong(midi, assignment, filename, offsets, editName ?? undefined, settings);
      await addSong(dir, name, partition);
      await saveProject({ name, filename, midi, assignment, offsets });
      setMidi(null);
      setTracks([]);
      setChoices({});
      setOffsets({});
      setFilename("");
      setEditName(null);
      setError(null);
      onAdded();
      setNotice(`Sent "${name}" to Mordhau ✓`);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Add a song</h2>
      <div
        className={`panel${dragging ? " dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="filerow">
          <input ref={fileInputRef} type="file" accept=".mid,.midi" onChange={onFile} hidden />
          <button type="button" className="btn-choose" onClick={() => fileInputRef.current?.click()}>
            Choose file
          </button>
          {onImport && (
            <button type="button" className="btn-choose" onClick={onImport}>
              Import project
            </button>
          )}
          <span className="chosen">{filename || "or drop a .mid here"}</span>
        </div>
        {error && <p className="error">{error}</p>}
        {notice && tracks.length === 0 && <p className="notice">{notice}</p>}
        {tracks.length > 0 && (
          <>
            <p className="hint">{filename} — assign tracks to Lute / Flute:</p>
            <p className="legend">
              <strong>Lute % / Flute %</strong> = how faithfully a track fits each instrument · the bar
              shows its notes over time · <strong>oct −/+</strong> shifts a track up/down to fit better.
            </p>
            <table className="tracks">
              <tbody>
                {tracks.map((t) => (
                  <tr key={t.index}>
                    <td>
                      <span className="tname">{t.name}</span>{" "}
                      <span className="meta">
                        ({t.notes.length} notes{t.pitchRange ? `, ${t.pitchRange[0]}–${t.pitchRange[1]}` : ""})
                      </span>
                      <div
                        className="fit"
                        title="How much of this track fits each instrument's range without being octave-shifted — higher means it plays more faithfully. Use the octave buttons to improve a low score."
                      >
                        <span className="lutec">Lute</span> <Pct f={rangeFit(t, 0, offsets[t.index] ?? 0)} />{" "}
                        · <span className="flutec">Flute</span>{" "}
                        <Pct f={rangeFit(t, 1, offsets[t.index] ?? 0)} />
                      </div>
                      <TrackRoll
                        track={t}
                        songTicks={songTicks}
                        color={rollColor(choices[t.index])}
                        octaveOffset={offsets[t.index] ?? 0}
                      />
                    </td>
                    <td>
                      <div className="seg" role="group" aria-label={`Assign ${t.name}`}>
                        <button
                          type="button"
                          className={`seg-btn off${choices[t.index] === "off" ? " on" : ""}`}
                          onClick={() => setChoice(t.index, "off")}
                        >
                          Off
                        </button>
                        <button
                          type="button"
                          className={`seg-btn lute${choices[t.index] === 0 ? " on" : ""}`}
                          onClick={() => setChoice(t.index, 0)}
                        >
                          Lute
                        </button>
                        <button
                          type="button"
                          className={`seg-btn flute${choices[t.index] === 1 ? " on" : ""}`}
                          onClick={() => setChoice(t.index, 1)}
                        >
                          Flute
                        </button>
                      </div>
                      <div className="oct" title="Shift this track up/down octaves to fit the instrument's range">
                        <span className="octlabel">oct</span>
                        <button
                          type="button"
                          className="step"
                          onClick={() => setOffset(t.index, -1)}
                          disabled={(offsets[t.index] ?? 0) <= -3}
                          aria-label={`Lower ${t.name} an octave`}
                        >
                          −
                        </button>
                        <span className="octval">{fmtOct(offsets[t.index] ?? 0)}</span>
                        <button
                          type="button"
                          className="step"
                          onClick={() => setOffset(t.index, 1)}
                          disabled={(offsets[t.index] ?? 0) >= 3}
                          aria-label={`Raise ${t.name} an octave`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="actions">
              <button type="button" onClick={send} disabled={busy}>
                {busy ? "Sending…" : "Send to Mordhau"}
              </button>
              <button
                type="button"
                className="btn-preview"
                onClick={preview}
                disabled={busy}
                title="Shortcut: Space"
              >
                {isPlaying ? "■ Stop" : "▶ Preview"}
              </button>
              <button type="button" className="btn-ghost" onClick={resetSuggestion}>
                Re-suggest instruments
              </button>
            </div>
            {isPlaying && <Playbar />}
            <div className="advanced">
              <button type="button" className="adv-toggle" onClick={() => setShowAdvanced((s) => !s)}>
                {showAdvanced ? "▾" : "▸"} Advanced
              </button>
              {showAdvanced && (
                <div className="adv-body">
                  <p className="adv-intro">
                    Fine-tune the conversion. The defaults suit most MIDIs — only change these if a song
                    sounds off.
                  </p>
                  <div className="adv-item">
                    <label className="adv-row">
                      <input
                        type="checkbox"
                        checked={settings.fold}
                        onChange={(e) => setSettings((s) => ({ ...s, fold: e.target.checked }))}
                      />
                      Octave-fold out-of-range notes
                    </label>
                    <p className="adv-desc">
                      The lute and flute can't reach every pitch. By default, notes that are too high or
                      low get shifted by whole octaves to fit (keeping the melody recognizable). Turn this
                      off to instead snap them to the nearest playable note.
                    </p>
                  </div>
                  <div className="adv-item">
                    <label className="adv-row">
                      Max chord size (1–6)
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={settings.maxPerChord}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            maxPerChord: Math.min(6, Math.max(1, Number(e.target.value) || 3)),
                          }))
                        }
                      />
                    </label>
                    <p className="adv-desc">
                      How many notes may sound at the same instant on one instrument. Lower it (e.g. 1–2)
                      for a cleaner, simpler sound; raise it for a fuller but busier one.
                    </p>
                  </div>
                  <div className="adv-item">
                    <label className="adv-row">
                      Compress silences over (0.5–10 sec)
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={settings.maxGapSec}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            maxGapSec: Math.min(10, Math.max(0.5, Number(e.target.value) || 1)),
                          }))
                        }
                      />
                    </label>
                    <p className="adv-desc">
                      In-game playback can stall on a long silent gap (like a verse where your chosen
                      tracks rest). Gaps longer than this are shortened to it. Raise this to keep more of
                      the song's original timing; lower it if playback stops partway.
                    </p>
                  </div>
                  <button type="button" className="btn-ghost adv-reset" onClick={resetSettings}>
                    Reset to defaults
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
