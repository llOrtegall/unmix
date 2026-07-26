# 0032 — The web as clean-architecture modules, hooks and components

- **Status:** Accepted
- **Date:** 2026-10-29
- **Supersedes:** [0017](0017-frontend-clean-zustand.md) (layout)
- **Amends:** [0018](0018-dependency-rules-in-ci.md), [0024](0024-frontend-ui-and-i18n.md)
- **Follows:** [0028](0028-clean-architecture-skills.md), [0031](0031-worker-separation-module.md)

## Context

Step 6 moves the web to the shared rules (`clean-architecture-core` + `clean-architecture-frontend`). The web had plain TypeScript types as its domain, use case classes returning `Outcome` values, gateways wired in `container.ts` and handed to React through a `ServicesProvider`, and business rules inside JSX: when a song can be deleted, which failures can be retried, which stage to show.

## Decision

**Four modules.** `modules/<m>/{domain,application,infrastructure,test}`. Each `factory.ts` exports an instance (`tracks`, `separation`, `session`, `mixer`) that hooks import directly. There is no React context for services.
- **track:** `TrackSummary` (`canBeDeleted`, `isSeparating`), `Track` (`isReady`, `hasJob`), `TrackList` (`hasSeparating`, `remove`, `append`), `TrackPage`, `Stem`, and `StemList`, which is sorted in mixer order. `Waveforms` holds the peaks per stem (`loudest`). `UploadCandidate` resolves the media type from the MIME type or the extension and enforces the 200 MB limit. Use cases: `listTracks`, `findTrack` (with its waveforms), `deleteTrack` and `uploadTrack`.
- **separation:** `Job` (`isFinished`, `hasFailed`, `activeStage`) and `JobFailure` (`canBeRetried`). `watchJob` reads the job first, because an unknown job makes the SSE route answer 404 and `EventSource` cannot read the status. It then follows the stream if the job is still running. `requestSeparation` backs the retry button.
- **session:** `User` and its Value Objects. Use cases: `findCurrentUser`, `signInWithGoogle`, `signOut`, `watchSessionExpiry`. `BetterAuthSessionRepository` owns Better Auth's protocol details: the `?error=` it appends after a failed sign-in, and the return URL.
- **mixer:** `Mix` decides each channel's gain (solo wins over mute) from a `ChannelList` of `Channel`s with a `Volume`. Use cases load and unload the mix, toggle playback, seek, read the position, and change a channel. `HtmlAudioPlaybackRepository` keeps the streaming `<audio>` engine.

**Upload and separation stay apart.** `uploadTrack` ends by asking the API to separate through `TrackRepository.requestSeparation`. `separation.requestSeparation` makes the same call for a retry and returns the `Job`, so the track module never depends on the separation module.

**Errors.** Use cases throw `DomainError`s. `http.ts` turns an API error body into a `RequestFailedError` carrying the API's code (`track.busy`), a network failure into `request.network`, and a 401 into `SessionExpiredError` (`session.required`), which also notifies `watchSessionExpiry`. Hooks turn errors into view state. `i18n/errorMessages.ts` (`useErrorMessage`) is the only map from a code to text, for thrown errors and for job failures alike. Unknown codes fall back to `request.failed`. Local codes are renamed: `NETWORK_ERROR` to `request.network`, `UPLOAD_CANCELLED` to `upload.cancelled`, `AUTH_FAILED` to `session.sign_in_failed`, and `generic` to `request.failed`.

**API payloads** are typed with `@unmix/contracts` and validated by `fromPrimitive` in the domain. The runtime zod parse in the web is removed.

**Entrypoints.**
- `hooks/` connect use cases to React state. `useSession` and `useMixer` are zustand stores.
- `components/` are split into containers and presenters. Containers use hooks: `TrackLibrary`, `Uploader`, `JobProgress`, `Mixer`, `AccountMenu`. Presenters only take props.
- `pages/` hold the three routes.
- The shadcn primitives move to `components/ui/` unchanged.
- The language preference stays a persisted zustand store in `i18n/`. It is a UI preference, not domain state.

**Dependency rules (dependency-cruiser).**
- `domain` imports only domain code and no packages.
- `application` imports only its own folder and domain code, except `factory.ts`.
- Entrypoints (`hooks`, `components`, `pages`, `i18n`, `App.tsx`, `main.tsx`) never import infrastructure.
- Modules never import entrypoints.
- Production code never imports tests.
- No cycles.

## Consequences

- No business rule is left in JSX. The track page now reloads the track when a job fails too, so its badge no longer stays on "separating".
- More files and explicit mapping at every HTTP boundary.
- Domain and use case tests no longer need fakes written by hand. Container components get Testing Library tests against the mocked module instance. Playwright still runs against the real stack.
