# Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

**Status:** certificate application in progress. Until it is granted, installers are unsigned and Windows SmartScreen may warn about an unknown publisher (the [README](../README.md#install) explains how to proceed). Once signing is active, every Windows installer published on the [Releases](https://github.com/HendoBuilds/skaldic/releases) page carries a signature that Windows verifies against this repository's source.

## Build and signing process

Releases are built by the project's public CI pipeline ([release workflow](../.github/workflows/release.yml)) from the source in this repository, on a `v*` tag push. Only binaries produced by that pipeline are submitted for signing, and each signing request is manually approved by the maintainer before the release is published. Skaldic contains no proprietary components; see [NOTICE.md](../NOTICE.md) for third-party acknowledgments and licenses.

## Team and roles

Skaldic is maintained by a single developer, who holds all roles:

- **Shay Henderson** ([@HendoBuilds](https://github.com/HendoBuilds)): committer, reviewer, and release approver.

## Privacy policy

Skaldic does not collect, store, or transmit any personal data or telemetry.

The app's only network access: on launch it contacts GitHub Releases to check for a newer version and, if you accept, downloads the update (see [RELEASING.md](RELEASING.md) for how updates are signed and verified). No user information is sent beyond what any HTTPS request implies. Songs, projects, and settings are stored only on your machine.
