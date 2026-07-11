# 0020 — FLAC stems and silent-stem detection

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

The spike ([spike-demucs.md](../spike-demucs.md)) showed that the 6 stems as WAV take about 300 MB per song, and that a stem can end up almost empty (piano at −27.7 dB against the mix, in a song without piano).

## Decision

- The worker stores each stem as 16-bit FLAC (lossless). On the test song: 98 MB in total, 67% less than WAV.
- The worker flags `silent: true` when the stem's RMS sits more than 24 dB below the mix's. The rule lives in the worker's domain (`SILENCE_THRESHOLD_DB`).
- Preview audio for the mixer (MP3/OGG) will be decided in phase 4.

## Consequences

- Less storage and transfer with no quality loss.
- The UI can dim or hide stems with no content.
- The threshold is a heuristic; tune it with more test songs.
