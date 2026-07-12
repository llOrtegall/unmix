# 0023 — MP3 previews, waveform peaks and `<audio>` playback

- **Status:** Accepted
- **Date:** 2026-10-27
- **Supersedes:** wavesurfer.js in [0005](0005-frontend-react-vite.md) and [0017](0017-frontend-clean-zustand.md); completes the phase 4 part of [0020](0020-flac-stems-and-silence.md)

## Context

Decoding six 5-minute FLAC stems in the browser with Web Audio takes about 630 MB of RAM (stereo float32 PCM). On top of that, wavesurfer.js decodes the whole file to draw the waveform.

## Decision

- For each stem, the worker also produces:
  - `{stem}.preview.mp3`: 128 kbps MP3 (about 4.7 MB for 5 minutes).
  - `{stem}.peaks.json`: `{ "version": 1, "peaks": number[] }`, 1000 values from 0 to 1 (about 6 KB).
- The `StemResult` contract includes `previewKey` and `peaksKey`. The API returns presigned `previewUrl` and `peaksUrl`.
- The browser streams each stem in its own `<audio>` element. `HtmlAudioEngine` keeps them aligned to the first one: every 250 ms it corrects any drift above 40 ms.
- The waveform is drawn on a `<canvas>` from the peaks JSON, with the same scale for every track.
- S3 storage has CORS for the web origin (`s3-init`): the browser uploads with a presigned PUT and downloads peaks and previews.

## Consequences

- Low browser memory and instant playback; the lossless FLAC download is still available.
- Volume goes from 0 to 100% (`HTMLMediaElement.volume`); iOS does not offer that control.
- Synchronization is good for listening, not for sample-accurate editing. If that is ever needed, move the `AudioEngine` adapter to Web Audio with buffers decoded in chunks, without touching the rest.
- Encoding the previews added about 16 s per song in the worker; since all stems are encoded and uploaded in parallel, the whole upload stage takes a few seconds.
