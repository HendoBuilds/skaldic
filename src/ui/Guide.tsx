import { useState, useEffect, useRef } from "react";

export const GUIDE_SEEN_KEY = "skaldic.guideSeen";

export function Guide({ onClose }: { onClose: () => void }) {
  const [dontShow, setDontShow] = useState(() => !!localStorage.getItem(GUIDE_SEEN_KEY));
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(checked: boolean) {
    setDontShow(checked);
    if (checked) localStorage.setItem(GUIDE_SEEN_KEY, "1");
    else localStorage.removeItem(GUIDE_SEEN_KEY);
  }

  return (
    <div className="guide-overlay" onClick={onClose}>
      <div className="guide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome to Skaldic</h2>
        <p className="guide-lead">Turn a MIDI into music you can perform in Mordhau on the lute and flute.</p>

        <h3>Before you start</h3>
        <p>
          You need <strong>Mordhau</strong> installed, plus <strong>LuteMod</strong> — the in-game mod that
          actually plays your songs. Skaldic prepares the songs; LuteMod performs them in-game.
        </p>

        <h3>Making a song</h3>
        <ol>
          <li>
            <strong>Choose a .mid file</strong> — click Choose file, or drag one onto the panel. This is
            how you start from a raw MIDI. (<strong>Import project</strong> is different: it opens a
            finished Skaldic arrangement that you exported or someone shared, ready to send.)
          </li>
          <li>
            Skaldic <strong>auto-assigns tracks</strong>: the backing parts stack on the <strong>Lute</strong>,
            the lead line goes to the <strong>Flute</strong>. Change any track with its Off / Lute / Flute buttons.
          </li>
          <li>
            The <strong>Lute % / Flute %</strong> show how well a track fits each instrument (gold = great,
            red = many notes get squashed into range). Use <strong>oct −/+</strong> to shift a track up or
            down to fit better.
          </li>
          <li>
            <strong>▶ Preview</strong> to hear it right here — this is just a rough guide to the
            arrangement; it does <strong>not</strong> sound the same as Mordhau's in-game instruments.{" "}
            <strong>Send to Mordhau</strong> when it sounds right, then check it in-game for the real sound.
          </li>
        </ol>

        <h3>Playing it in-game</h3>
        <p>With an instrument equipped, LuteMod uses your normal Mordhau keybinds:</p>
        <ul>
          <li>
            <strong>Kick</strong> — open the song menu (and page forward)
          </li>
          <li>
            <strong>Arrow Left / Right</strong> — change menu page
          </li>
          <li>
            <strong>Equipment Select (the 0–9 keys)</strong> — pick a song from the menu
          </li>
          <li>
            <strong>Feint</strong> — play / pause
          </li>
          <li>
            <strong>Num&nbsp;Pad&nbsp;1</strong> — toggle <strong>Voice mode</strong> (your song plays as
            character shouts; use sparingly so you don't drown out combat audio)
          </li>
        </ul>

        <h3>Your songbook</h3>
        <p>
          The list shows what's in your game. <strong>Edit</strong> re-opens a song to tweak,{" "}
          <strong>Rename</strong> renames it, <strong>Export</strong> saves it as a shareable file, and{" "}
          <strong>Remove</strong> deletes it. An{" "}
          <strong>"in-game only"</strong> tag means the song plays fine but wasn't made in Skaldic, so it can't
          be re-edited. Skaldic keeps an editable backup of every song you send, so you can always re-open or
          restore it.
        </p>

        <div className="guide-foot">
          <label className="guide-check">
            <input type="checkbox" checked={dontShow} onChange={(e) => toggle(e.target.checked)} />
            Don't show this automatically
          </label>
          <button type="button" ref={closeBtn} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
