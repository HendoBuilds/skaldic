# Releasing Skaldic

How a new version gets from this repo to users' machines. Users on v0.2.0+
auto-update: the app checks
`https://github.com/HendoBuilds/skaldic/releases/latest/download/latest.json`
on launch, verifies the new installer's signature against the public key baked
into the app, and installs it in place.

## One-time setup (per maintainer machine)

The updater needs its signing keypair (this is the free Tauri updater key,
**not** a Windows code-signing certificate — the two are unrelated):

```powershell
npm run tauri signer generate -- -w "$env:USERPROFILE\.tauri\skaldic-updater.key"
```

- The **public** key lives in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`).
- The **private** key must never be committed. Keep it outside the repo and
  back it up somewhere private, together with its password — if either is
  lost, shipped apps can no longer verify new releases, and every user has
  to reinstall manually.

## One-time setup (repository)

The release workflow signs on GitHub's runners, so the repository needs two
Actions secrets (Settings → Secrets and variables → Actions):

- `TAURI_SIGNING_PRIVATE_KEY` — the private key file's *content*, not its path.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — the key's password.

## Cutting a release

1. **Bump the version** (all three must match):
   - `package.json` → `version`
   - `src-tauri/tauri.conf.json` → `version`
   - `src-tauri/Cargo.toml` → `version` (then any `cargo` touch updates `Cargo.lock`)

2. **Write the update notes** in `docs/UPDATE_NOTES.txt` — one or two lines on
   what changed, written for players. The workflow uses them as the release
   description and as the text shown in the in-app update prompt.

3. **Commit, then tag and push**:

   ```powershell
   git tag v<ver>
   git push origin v<ver>
   ```

   The `Release` workflow (`.github/workflows/release.yml`) runs the tests,
   builds, signs, and attaches the installer, its `.sig`, and `latest.json`
   to a **draft** release. Drafts are invisible to users and to the updater.

4. **Test the update flow** against the draft's artifacts before publishing —
   see "Testing an update end to end" below.

5. **Publish the release** on GitHub. The
   `releases/latest/download/latest.json` URL the app polls only resolves for
   published releases, so nothing reaches users before this step.

6. **Verify**: install the previous version, launch it, and confirm it offers
   and completes the update.

## Cutting a release manually (fallback)

If Actions is unavailable, the same artifacts can be built locally: bump the
version as above, then:

1. **Check + build signed** — the env var makes the build emit
   `Skaldic_<ver>_x64-setup.exe.sig` next to the installer:

   ```powershell
   npm run test; npm run typecheck
   $env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\skaldic-updater.key"
   npm run tauri build
   # type the key's password at the "expect a prompt for password" prompt
   ```

   Notes, learned the hard way:
   - `TAURI_SIGNING_PRIVATE_KEY` takes the key file's path or its content.
     The `_PATH` variant the keygen mentions is not read by the bundler.
   - The password prompt needs an *interactive* shell. Non-interactive
     builds (scripts, CI) must supply it via the
     `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` environment variable instead.

2. **Generate the updater manifest**:

   ```powershell
   node scripts/make-latest-json.mjs --notes "One or two lines on what changed - shown inside the app's update prompt."
   ```

3. **Test, publish, verify** as in the main flow, uploading all three files
   from `src-tauri/target/release/bundle/nsis/`:

   ```powershell
   gh release create v<ver> `
     "src-tauri/target/release/bundle/nsis/Skaldic_<ver>_x64-setup.exe" `
     "src-tauri/target/release/bundle/nsis/Skaldic_<ver>_x64-setup.exe.sig" `
     "src-tauri/target/release/bundle/nsis/latest.json" `
     --title "Skaldic v<ver>" --notes "release notes"
   ```

   `latest.json` **must** be attached to the latest release — the
   `releases/latest/download/latest.json` URL the app polls resolves to it.

## Testing an update end to end

The updater refuses plain-HTTP endpoints in release builds unless explicitly
overridden, so local testing uses a config override on the command line.
Test builds never ship.

1. Build the "old" app pointing at a local manifest. Put the override in a
   small config file *outside* the repo (the version override lets you
   update *to* the real build):

   ```json
   { "version": "0.0.1",
     "plugins": { "updater": {
       "endpoints": ["http://localhost:8377/latest.json"],
       "dangerousInsecureTransportProtocol": true } } }
   ```

   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\skaldic-updater.key"
   npm run tauri build -- --config ..\update-test\test-config.json
   ```

   Install `Skaldic_0.0.1_x64-setup.exe`, launch it once, add a song
   (to verify data survives), close it.

2. Get the release candidate's installer and `.sig` into
   `src-tauri/target/release/bundle/nsis/` — either download them from the
   CI draft release, or build locally (fallback flow above) — and generate
   a manifest with a local URL:

   ```powershell
   node scripts/make-latest-json.mjs --url "http://localhost:8377/Skaldic_<ver>_x64-setup.exe" --notes "test"
   ```

3. Serve the bundle folder and run the old build:

   ```powershell
   npx serve -l 8377 src-tauri/target/release/bundle/nsis
   ```

   Launch Skaldic (the 0.0.1 install): it should offer v`<ver>`, download,
   install, and restart as the new version, with songs and projects intact.

4. Re-run `make-latest-json.mjs` **without** `--url` (so the manifest points
   at GitHub again) before attaching it to the release.

## Version and notes conventions

- Semver-ish: bump minor for features, patch for fixes. The updater only
  offers strictly newer versions.
- The `--notes` text is what users read in the update prompt — write it for
  players, not developers.
