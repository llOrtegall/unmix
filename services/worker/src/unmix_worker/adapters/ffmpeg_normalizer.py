import subprocess
from pathlib import Path

from unmix_worker.application.ports import NormalizedAudio
from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.result import Err, Ok, Result


class FfmpegNormalizer:
    """Extract audio (dropping video and cover art) as stereo 44.1 kHz 16-bit WAV."""

    def normalize(self, src: Path, dest: Path) -> Result[NormalizedAudio, SeparationFailure]:
        convert = subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2", "-ar", "44100",
             "-c:a", "pcm_s16le", str(dest)],
            capture_output=True, text=True,
        )
        if convert.returncode != 0:
            return Err(SeparationFailure(FailureCode.INVALID_MEDIA, _last_line(convert.stderr)))

        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
             str(dest)],
            capture_output=True, text=True,
        )
        try:
            duration = float(probe.stdout.strip())
        except ValueError:
            return Err(SeparationFailure(FailureCode.INVALID_MEDIA, "Unreadable duration."))
        if duration <= 0:
            return Err(SeparationFailure(FailureCode.INVALID_MEDIA, "Empty audio track."))
        return Ok(NormalizedAudio(dest, duration))


class FfmpegPreviewEncoder:
    """128 kbps MP3: plays everywhere and streams with plain <audio> elements."""

    def encode(self, src: Path, dest: Path) -> None:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-c:a", "libmp3lame", "-b:a", "128k",
             str(dest)],
            check=True, capture_output=True,
        )


def _last_line(text: str) -> str:
    lines = [line for line in text.strip().splitlines() if line]
    return lines[-1] if lines else "ffmpeg could not decode the file."
