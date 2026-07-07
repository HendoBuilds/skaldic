import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Phase = "hidden" | "available" | "downloading" | "failed";

/**
 * Checks GitHub Releases for a newer Skaldic once at startup and offers an
 * in-place update. Quiet by design: no network, no newer version, or a failed
 * check all leave the app untouched.
 */
export function UpdateBanner() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [update, setUpdate] = useState<Update | null>(null);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    check()
      .then((u) => {
        if (!cancelled && u) {
          setUpdate(u);
          setPhase("available");
        }
      })
      .catch(() => {
        // Offline or the check failed — never bother the user about it.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function install() {
    if (!update) return;
    setPhase("downloading");
    setPercent(0);
    try {
      let total = 0;
      let got = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") {
          got += event.data.chunkLength;
          if (total > 0) setPercent(Math.min(100, Math.round((got / total) * 100)));
        }
      });
      await relaunch();
    } catch {
      setPhase("failed");
    }
  }

  if (phase === "hidden") return null;

  return (
    <section className="update-banner" role="status">
      {phase === "available" && update && (
        <>
          <p className="update-lead">
            <strong>Skaldic v{update.version} is available.</strong>
          </p>
          {update.body && <p className="update-notes">{update.body}</p>}
          <p className="update-hint">
            Updating installs the new version in place — your songs and saved projects are untouched.
            Skaldic restarts when it's done.
          </p>
          <div className="update-actions">
            <button type="button" onClick={() => void install()}>
              Update now
            </button>
            <button className="btn-ghost" type="button" onClick={() => setPhase("hidden")}>
              Later
            </button>
          </div>
        </>
      )}
      {phase === "downloading" && (
        <p className="update-lead">
          Downloading update… {percent > 0 ? `${percent}%` : ""} Skaldic will restart itself when the
          install finishes.
        </p>
      )}
      {phase === "failed" && (
        <>
          <p className="update-lead">The update couldn't be downloaded.</p>
          <p className="update-hint">
            Check your connection and try again, or download the latest installer from{" "}
            <code>github.com/HendoBuilds/skaldic/releases</code> — installing it over this version keeps
            your songs and projects.
          </p>
          <div className="update-actions">
            <button type="button" onClick={() => void install()}>
              Try again
            </button>
            <button className="btn-ghost" type="button" onClick={() => setPhase("hidden")}>
              Dismiss
            </button>
          </div>
        </>
      )}
    </section>
  );
}
