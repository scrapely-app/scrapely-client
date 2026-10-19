# Changelog

All notable changes to this project will be documented in this file.

## [2.25.7] - 2026-10-19

- The warning about retrying a request with a stream body now names the Scrapely client.

## [2.25.6] - 2026-10-19

- A failed or refused run log stream never fails `Actor.call()`: an error opening the stream is logged like a mid-stream error, and `stop()` no longer rethrows.

## [2.25.5] - 2026-10-15

- Fixed base64url signing of signed storage URLs in the browser bundle.
- The package ships the Apache-2.0 licence text and NOTICE.

## [2.25.4] - 2026-10-13

- Builds are owner-only: `buildId` and `buildNumber` on runs and `build` in run options are optional, since runs of someone else's Actor carry no build info.
- `actor().update({ defaultNonOwnerBuild })` sets the User Build (the build everyone else runs); `null` clears it.

## [2.25.2] - 2026-09-08

Initial release.

- TypeScript client for the Scrapely API: Actors, runs, datasets, key-value stores, request queues, task management, and webhooks
