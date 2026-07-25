import subprocess
from pathlib import Path

_PREVIEW_SUFFIX = ".preview.mp3"


class FfmpegPreviewRepository:
    """128 kbps MP3: plays everywhere and streams with plain <audio> elements."""

    def encode(self, stem: Path) -> Path:
        preview = stem.with_suffix(_PREVIEW_SUFFIX)
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-i",
                str(stem),
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                str(preview),
            ],
            check=True,
            capture_output=True,
        )
        return preview
