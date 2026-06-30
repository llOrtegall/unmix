# spike

Phase 1 throwaway spike: separate one song with Demucs on CPU and report timings. Results: [docs/spike-demucs.md](../../../docs/spike-demucs.md).

```bash
uv sync
uv run spike.py /path/to/song.mp3            # default model htdemucs_6s
uv run spike.py /path/to/song.mp3 --model htdemucs_ft
```

Stems and `report.json` land in `output/` (git-ignored).
