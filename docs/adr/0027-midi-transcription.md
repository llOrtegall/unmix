# 0027 — MIDI transcription with Basic Pitch (ONNX)

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

Users want the notes of a part, not only its audio: to read the bass line, load the melody into a DAW or a notation editor. Spotify's Basic Pitch (Apache-2.0) turns polyphonic audio into MIDI and ships its model in TensorFlow, TFLite, CoreML and ONNX formats. Version 0.4 requires `tensorflow<2.15.1` on Linux, which has no Python 3.12 wheels, so it cannot be installed next to Demucs as is.

## Decision

- **In the separation job, automatically.** After Demucs, each stem is transcribed while its preview is encoded and its files uploaded (all stems in parallel). Drums (no pitch) and silent stems are skipped (`should_transcribe` in the worker's domain).
- **ONNX, no TensorFlow.** `basic-pitch` is installed with uv `override-dependencies` that drop TensorFlow/CoreML; `onnxruntime` runs the bundled `nmp.onnx`. The lock is limited to Linux (`environments`).
- **A port, best effort.** `Transcriber.transcribe(src, dest) -> bool`. A failure is logged and the stem ships without MIDI; it never fails the job.
- **Contract.** `StemResult.midiKey` is optional, so older workers stay valid; the API returns `midiUrl` (presigned, `null` when absent) and the ZIP includes `midi/<stem>.mid`.
- **UI.** A MIDI download button per stem. No piano roll for now.
- **Existing tracks** keep no MIDI unless separated again. The demo song was re-seeded (`demo:seed --force`).

## Consequences

- About 8 s more per 5-minute song (4.4 s per 3-minute stem on CPU, run in parallel).
- The worker image grows from 1.62 GB to 2.31 GB (scipy, numba/llvmlite, scikit-learn, onnxruntime come with Basic Pitch).
- numba caches compiled code next to its sources by default; the image sets `NUMBA_CACHE_DIR=/tmp/numba` because the worker runs as non-root. The transcriber warms up at startup so the first job does not pay the compilation.
- Transcription quality is best on monophonic parts (bass, lead vocals) and rougher on dense mixes (`other`). It is a starting point for the user, not a finished score.
