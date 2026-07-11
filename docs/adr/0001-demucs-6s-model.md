# 0001 — Separation model: Demucs htdemucs_6s

- **Status:** Accepted
- **Date:** 2026-10-27

## Context

We need to split music into instruments with a freely usable tool. Options evaluated: Spleeter (abandoned, lower quality), Demucs v4 (Meta, MIT), MDX/RoFormer models (excellent on vocals, with mixed licenses and weights), commercial APIs (pay per use).

## Decision

Use Demucs v4 with the `htdemucs_6s` model: vocals, drums, bass, guitar, piano and other. Code and weights under the MIT license.

## Consequences

- Commercial use is allowed.
- More stems than the usual 4, but the piano stem's quality is uneven. Tell the client.
- The model name is configurable (`DEMUCS_MODEL`) to switch to `htdemucs_ft` (4 stems, higher quality) without touching code.
