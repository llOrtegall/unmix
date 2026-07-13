"""Ports the use case depends on. Adapters in `unmix_worker.adapters` implement them.

Expected business failures come back as `Err`; anything else is raised and treated
as a transient error by the queue consumer.
"""

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from unmix_worker.domain.errors import SeparationFailure
from unmix_worker.domain.model import Stage, StemName
from unmix_worker.domain.result import Result


class ObjectStorage(Protocol):
    def download(self, key: str, dest: Path) -> Result[None, SeparationFailure]: ...

    def upload(self, src: Path, key: str, content_type: str) -> int:
        """Upload `src` to `key` and return its size in bytes."""
        ...

    def put_bytes(self, data: bytes, key: str, content_type: str) -> None: ...


@dataclass(frozen=True, slots=True)
class NormalizedAudio:
    path: Path
    duration_seconds: float


class MediaNormalizer(Protocol):
    def normalize(self, src: Path, dest: Path) -> Result[NormalizedAudio, SeparationFailure]:
        """Extract the audio track as stereo 44.1 kHz WAV."""
        ...


@dataclass(frozen=True, slots=True)
class SeparatedStem:
    name: StemName
    path: Path
    relative_db: float
    peaks: list[float]


class PreviewEncoder(Protocol):
    def encode(self, src: Path, dest: Path) -> None:
        """Write a lossy, streamable preview of `src` (MP3)."""
        ...


class Transcriber(Protocol):
    def transcribe(self, src: Path, dest: Path) -> bool:
        """Write a MIDI file of the notes in `src`; False if it could not be transcribed."""
        ...


class StemSeparator(Protocol):
    def separate(
        self,
        audio: Path,
        out_dir: Path,
        model: str,
        on_progress: Callable[[float], None],
    ) -> list[SeparatedStem]:
        """Write one FLAC per stem into `out_dir` with waveform peaks; report progress as 0..1."""
        ...


class ProgressReporter(Protocol):
    def report(self, stage: Stage, progress: int) -> None: ...
