# 00 — Vision and scope

## Problem

Musicians, producers, teachers and content creators want to isolate parts of a song: remove the vocals for karaoke, practice with the drums muted, or sample a bass line. Commercial tools charge per song. Free tools require a terminal and technical knowledge.

## Proposal

A simple website where the user:

1. Drags in an audio or video file.
2. Watches the separation progress in real time.
3. Listens to each instrument in a mixer (mute, solo, volume).
4. Downloads the stems they need.
5. Comes back later to their library of processed songs.

## Target user

A non-technical person. All the complexity (models, queues, formats) stays hidden. The experience must be clear, quick to understand and have error messages anyone can follow.

## PoC scope

- Input: audio (mp3, wav, flac, m4a, ogg) and video (mp4, mov, webm, mkv).
- Limit: 10 minutes long and 200 MB per file.
- Output: 6 stems — vocals, drums, bass, guitar, piano, other.
- Multitrack mixer with synchronized playback.
- Single-stem download (FLAC) or everything as a ZIP.
- Live progress.
- Job history.
- Google sign-in (phase 5).

## Out of scope (for now)

- GPU or cloud processing.
- Transcription to MIDI or sheet music.
- Audio editing (cuts, effects).
- Payments, plans or quotas.
- Native mobile app.

## PoC success criteria

- A 4-minute song is processed end to end without manual intervention.
- A non-technical user completes the flow without help.
- The system recovers from a worker failure without losing the job (retry).
