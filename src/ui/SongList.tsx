import { useState } from "react";

interface SongListProps {
  songs: string[];
  onRemove: (name: string) => void;
  editable?: Set<string>;
  onEdit?: (name: string) => void;
  onExport?: (name: string) => void;
  onRename?: (oldName: string, newName: string) => void;
}

export function SongList({ songs, onRemove, editable, onEdit, onExport, onRename }: SongListProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  if (songs.length === 0) {
    return <p className="empty">Your songbook is empty — add a MIDI above.</p>;
  }

  function startRename(name: string) {
    setRenaming(name);
    setDraft(name);
  }
  function commitRename(oldName: string) {
    const next = draft.trim();
    setRenaming(null);
    if (onRename && next && next !== oldName) onRename(oldName, next);
  }

  const q = query.trim().toLowerCase();
  const shown = q ? songs.filter((name) => name.toLowerCase().includes(q)) : songs;

  return (
    <>
      <input
        className="song-search"
        type="search"
        value={query}
        placeholder="Search songs…"
        aria-label="Search your songs"
        onChange={(e) => setQuery(e.target.value)}
      />
      {shown.length === 0 ? (
        <p className="empty">No songs match “{query.trim()}”.</p>
      ) : (
        <ul className="song-list">
          {shown.map((name) =>
            renaming === name ? (
              <li key={name}>
                <input
                  className="rename-input"
                  value={draft}
                  autoFocus
                  aria-label={`New name for ${name}`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(name);
                    if (e.key === "Escape") setRenaming(null);
                  }}
                />
                <span className="song-actions">
                  <button className="btn-ghost" type="button" onClick={() => commitRename(name)}>
                    Save
                  </button>
                  <button className="btn-ghost" type="button" onClick={() => setRenaming(null)}>
                    Cancel
                  </button>
                </span>
              </li>
            ) : (
              <li key={name}>
                <span className="song-name">
                  {name}
                  {editable && !editable.has(name) && (
                    <span className="tag" title="In your game, but no Skaldic project — can't be re-edited here">
                      in-game only
                    </span>
                  )}
                </span>
                <span className="song-actions">
                  {editable?.has(name) && onEdit && (
                    <button
                      className="btn-ghost"
                      type="button"
                      aria-label={`Edit ${name}`}
                      onClick={() => onEdit(name)}
                    >
                      Edit
                    </button>
                  )}
                  {editable?.has(name) && onExport && (
                    <button
                      className="btn-ghost"
                      type="button"
                      aria-label={`Export ${name}`}
                      onClick={() => onExport(name)}
                    >
                      Export
                    </button>
                  )}
                  {onRename && (
                    <button
                      className="btn-ghost"
                      type="button"
                      aria-label={`Rename ${name}`}
                      onClick={() => startRename(name)}
                    >
                      Rename
                    </button>
                  )}
                  <button
                    className="btn-ghost danger"
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemove(name)}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </>
  );
}
