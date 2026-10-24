# Changelog

All notable changes to this project will be documented in this file.

## [2.25.12] - 2026-10-24

- In Node.js, the `SCRAPELY_API_URL` environment variable sets the API URL when the `baseUrl` option is not given; `baseUrl` still wins, and without either the client uses `https://api.scrape.ly`. An empty value is ignored. `publicBaseUrl` is unchanged, and the browser bundle does not read environment variables.
- Versions 2.25.2 to 2.25.6 defaulted to `https://api-staging.scrape.ly` and are deprecated on npm; upgrade to 2.25.9 or later.

## [2.25.11] - 2026-10-20

- Request ids are percent-encoded as one URL path segment in `getRequest`, `updateRequest`, `deleteRequest`, `prolongRequestLock` and `deleteRequestLock`; `''`, `.` and `..` are refused. `updateRequest` checks the id against the API's grammar (1-128 letters, digits, `-`, `_`, `~`). Key-value store record keys, resource ids (versions, env vars) and automation run ids are encoded the same way. An id such as `..` used to send the call to another resource.

## [2.25.10] - 2026-10-20

- Maintenance release.

## [2.25.9] - 2026-10-20

- New Scrapely-only `client.automations()` (`list` with `actorId`, `savedInputId` and `search` filters, `create`) and `client.automation(id)` (`get`, `update`, `delete`, `run`, `listRuns`, `getRun`, `duplicate`) for `/v2/automations`.

## [2.25.8] - 2026-10-20

- `reasonForChange`, `notifiedAboutFutureChangeAt` and `notifiedAboutChangeAt` are returned only to the Actor owner.

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
