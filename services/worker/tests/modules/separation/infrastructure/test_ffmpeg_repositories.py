import subprocess
from pathlib import Path

import pytest
import soundfile

from unmix_worker.modules.separation.domain.errors import InvalidMediaError
from unmix_worker.modules.separation.infrastructure.ffmpeg_media_repository import (
    FfmpegMediaRepository,
)
from unmix_worker.modules.separation.infrastructure.ffmpeg_preview_repository import (
    FfmpegPreviewRepository,
)

_SECONDS = 2


def _tone(path: Path) -> Path:
    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=440:duration={_SECONDS}",
            "-ac",
            "1",
            "-ar",
            "22050",
            str(path),
        ],
        check=True,
        capture_output=True,
    )
    return path


class TestFfmpegMediaRepository:
    def test_normalizes_to_stereo_wav_and_reads_its_duration(self, tmp_path: Path) -> None:
        source = _tone(tmp_path / "source.mp3")

        audio = FfmpegMediaRepository().normalize(source, tmp_path)

        info = soundfile.info(str(audio.path))
        assert audio.path == tmp_path / "mix.wav"
        assert (info.channels, info.samplerate) == (2, 44100)
        assert audio.duration.to_primitive() == pytest.approx(_SECONDS, abs=0.1)

    def test_rejects_a_file_without_audio(self, tmp_path: Path) -> None:
        source = tmp_path / "source.mp3"
        source.write_bytes(b"definitely not an mp3")

        with pytest.raises(InvalidMediaError):
            FfmpegMediaRepository().normalize(source, tmp_path)


class TestFfmpegPreviewRepository:
    def test_encodes_an_mp3_preview_next_to_the_stem(self, tmp_path: Path) -> None:
        stem = _tone(tmp_path / "vocals.flac")

        preview = FfmpegPreviewRepository().encode(stem)

        assert preview == tmp_path / "vocals.preview.mp3"
        assert soundfile.info(str(preview)).duration == pytest.approx(_SECONDS, abs=0.1)
