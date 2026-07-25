import subprocess
from pathlib import Path

import soundfile

from ..domain.audio_duration import AudioDuration
from ..domain.errors import InvalidMediaError
from ..domain.normalized_audio import NormalizedAudio

_MIX_FILE = "mix.wav"
_UNDECODABLE = "ffmpeg could not decode the file."


class FfmpegMediaRepository:
    """Extracts the audio (dropping video and cover art) as stereo 44.1 kHz 16-bit WAV."""

    def normalize(self, source: Path, directory: Path) -> NormalizedAudio:
        destination = directory / _MIX_FILE
        convert = subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-i",
                str(source),
                "-vn",
                "-ac",
                "2",
                "-ar",
                "44100",
                "-c:a",
                "pcm_s16le",
                str(destination),
            ],
            capture_output=True,
            text=True,
        )
        if convert.returncode != 0:
            raise InvalidMediaError(_last_line(convert.stderr))

        # The output is our own WAV, so its header is exact; no ffprobe needed.
        try:
            seconds = soundfile.info(str(destination)).duration
        except RuntimeError as error:
            raise InvalidMediaError("Unreadable duration.") from error
        return NormalizedAudio.create(destination, AudioDuration.create(seconds))


def _last_line(text: str) -> str:
    lines = [line for line in text.strip().splitlines() if line]
    return lines[-1] if lines else _UNDECODABLE
