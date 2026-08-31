// Builds the updater manifest (latest.json) for a GitHub release.
//
// Run after `npm run tauri build` (with the signing key set, so the .sig
// exists next to the installer):
//
//   node scripts/make-latest-json.mjs --notes "What changed, shown in the in-app update prompt."
//
// Options:
//   --notes "<text>"  Release notes embedded in the manifest (recommended).
//   --url "<url>"     Override the installer download URL (used for local
//                     update-flow testing; defaults to the GitHub release URL).
//
// Output: src-tauri/target/release/bundle/nsis/latest.json — upload it to the
// GitHub release alongside the installer.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const conf = JSON.parse(readFileSync(join(root, "src-tauri", "tauri.conf.json"), "utf8"));
const version = conf.version;

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const bundleDir = join(root, "src-tauri", "target", "release", "bundle", "nsis");
const installer = `Skaldic_${version}_x64-setup.exe`;
const sigPath = join(bundleDir, `${installer}.sig`);
if (!existsSync(sigPath)) {
  console.error(
    `Missing ${sigPath}\n` +
      `Build with the updater signing key set (see docs/RELEASING.md) so the .sig is generated.`,
  );
  process.exit(1);
}

const manifest = {
  version,
  notes: opt("notes") ?? "",
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: readFileSync(sigPath, "utf8").trim(),
      url:
        opt("url") ??
        `https://github.com/shayhenderson/skaldic/releases/download/v${version}/${installer}`,
    },
  },
};

const out = join(bundleDir, "latest.json");
writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${out} for v${version}`);
