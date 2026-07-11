# 0008 — Input: audio and video, 10 minutes max

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Users may have the song as a video. On CPU, long files tie up the worker for a long time.

## Decision

Accept audio (mp3, wav, flac, m4a, ogg) and video (mp4, mov, webm, mkv). ffmpeg extracts and normalizes it to 44.1 kHz stereo WAV. Limits: 10 minutes and 200 MB, both configurable.

## Consequences

- Validation happens in two places: the client (size and type) and the worker (real duration with ffprobe).
- A clear message for the user when a limit is exceeded.
