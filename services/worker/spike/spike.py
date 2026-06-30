"""Phase 1 spike: separate one song into 6 stems on CPU and report timings.

Usage: uv run spike.py <input file> [--model htdemucs_6s] [--out output]
"""

import argparse
import json
import os
import resource
import subprocess
import time
from pathlib import Path


def ffprobe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    )
    return float(out.stdout.strip())


def normalize(src: Path, dst: Path) -> None:
    # Same step the worker will run: audio only, stereo, 44.1 kHz, 16-bit WAV.
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2", "-ar", "44100",
         "-c:a", "pcm_s16le", str(dst)],
        check=True,
    )


def peak_rss_mb() -> float:
    return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--model", default="htdemucs_6s")
    parser.add_argument("--out", type=Path, default=Path("output"))
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    report: dict = {"input": str(args.input), "model": args.model, "cpu_count": os.cpu_count()}

    t = time.perf_counter()
    wav = args.out / f"{args.input.stem}.wav"
    normalize(args.input, wav)
    report["normalize_s"] = round(time.perf_counter() - t, 2)
    report["duration_s"] = round(ffprobe_duration(wav), 2)

    import torch
    from demucs.pretrained import get_model
    from demucs.separate import main as demucs_main

    report["torch"] = torch.__version__
    report["torch_threads"] = torch.get_num_threads()

    t = time.perf_counter()
    get_model(args.model)  # downloads weights on first run
    report["model_load_s"] = round(time.perf_counter() - t, 2)

    t = time.perf_counter()
    demucs_main(["-n", args.model, "-d", "cpu", "-o", str(args.out), str(wav)])
    report["separate_s"] = round(time.perf_counter() - t, 2)
    report["realtime_factor"] = round(report["separate_s"] / report["duration_s"], 2)
    report["peak_rss_mb"] = round(peak_rss_mb())

    stems_dir = args.out / args.model / wav.stem
    report["stems"] = {
        p.stem: round(p.stat().st_size / 1_048_576, 1) for p in sorted(stems_dir.glob("*.wav"))
    }

    print(json.dumps(report, indent=2))
    (args.out / "report.json").write_text(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
