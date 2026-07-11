# Spike — Demucs htdemucs_6s on CPU (phase 1)

- **Date:** 2026-10-27
- **Script:** [`services/worker/spike/spike.py`](../services/worker/spike/spike.py)
- **Machine:** WSL2, 16 logical threads, 15 GB RAM, no GPU
- **Software:** Python 3.12, torch 2.8.0+cpu, torchaudio 2.8.0, demucs 4.0.1

## Input

`thecure.mp3`: stereo MP3, 44.1 kHz, 4:57 (297 s), 12 MB, with embedded cover art (`mjpeg` stream). ffmpeg dropped the cover while normalizing (`-vn`) without errors.

## Results

| Metric | Value |
|--------|-------|
| ffmpeg normalization → WAV | 1.4 s |
| Model load (first time, includes downloading weights) | 10.3 s |
| **Separation** | **84 s** |
| **Real-time factor** | **0.28** (≈ 17 s of processing per minute of song) |
| Peak RAM | 2.2 GB |
| torch threads | 8 |
| Output | 6 WAV files of 50 MB (≈ 300 MB per song) |

**Acceptance criterion (4-minute song in < ~15 min): met by a wide margin.** A 10-minute song (the input limit) would take ≈ 3 minutes.

## Energy per stem

| Stem | RMS vs mix |
|------|------------|
| vocals | −7.0 dB |
| guitar | −8.0 dB |
| bass | −9.5 dB |
| other | −10.8 dB |
| drums | −13.2 dB |
| piano | −27.7 dB |

Reconstruction residual (mix − sum of stems): −16.2 dB.

## Observations

- The **piano** stem is almost empty for this song (−27.7 dB). That is expected when there is no piano; keyboards and synths land in `other`. It confirms the warning in [ADR 0001](adr/0001-demucs-6s-model.md): the UI must detect near-silent stems and show them dimmed or as "no content".
- The −16 dB residual means the sum of the stems does not rebuild the mix exactly. That is normal for `htdemucs_6s`; keep it in mind if an exported "remix" is ever offered.
- torch uses 8 threads by default (physical cores). With one worker per machine there is no point raising it; with several workers, split the threads (`torch.set_num_threads`).
- torchaudio 2.8 warns that its save backend changes in 2.9. **Action for phase 2:** the Demucs adapter saves stems with `soundfile` instead of `torchaudio.save`, so torch can be upgraded without breaking anything.
- 300 MB of WAV per song: consider FLAC (≈ 50% smaller, lossless) for storage and MP3/OGG for the mixer preview.
- Perceived quality: **pending a listening test** by the user.

## Decision

Keep `htdemucs_6s` on CPU. The PoC does not need a GPU.
