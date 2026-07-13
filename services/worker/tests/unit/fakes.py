from collections.abc import Callable
from pathlib import Path

from unmix_worker.application.ports import NormalizedAudio, SeparatedStem
from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.model import Stage, StemName
from unmix_worker.domain.result import Err, Ok, Result


class FakeStorage:
    def __init__(self, existing: set[str]) -> None:
        self.existing = existing
        self.uploaded: dict[str, str] = {}

    def download(self, key: str, dest: Path) -> Result[None, SeparationFailure]:
        if key not in self.existing:
            return Err(SeparationFailure(FailureCode.INPUT_NOT_FOUND, key))
        dest.write_bytes(b"media")
        return Ok(None)

    def upload(self, src: Path, key: str, content_type: str) -> int:
        self.uploaded[key] = content_type
        return 10

    def put_bytes(self, data: bytes, key: str, content_type: str) -> None:
        self.uploaded[key] = content_type


class FakePreviews:
    def encode(self, src: Path, dest: Path) -> None:
        dest.write_bytes(b"mp3")


class FakeTranscriber:
    def __init__(self, works: bool = True) -> None:
        self.works = works
        self.calls: list[str] = []

    def transcribe(self, src: Path, dest: Path) -> bool:
        self.calls.append(src.stem)
        if self.works:
            dest.write_bytes(b"MThd")
        return self.works


class FakeNormalizer:
    def __init__(self, duration: float = 240.0, failure: SeparationFailure | None = None):
        self.duration = duration
        self.failure = failure

    def normalize(self, src: Path, dest: Path) -> Result[NormalizedAudio, SeparationFailure]:
        if self.failure:
            return Err(self.failure)
        return Ok(NormalizedAudio(dest, self.duration))


class FakeSeparator:
    def __init__(self, levels: dict[StemName, float] | None = None) -> None:
        self.levels = levels or {name: -8.0 for name in StemName}
        self.calls = 0

    def separate(
        self, audio: Path, out_dir: Path, model: str, on_progress: Callable[[float], None]
    ) -> list[SeparatedStem]:
        self.calls += 1
        on_progress(0.5)
        on_progress(1.0)
        out_dir.mkdir(parents=True, exist_ok=True)
        return [
            SeparatedStem(n, out_dir / f"{n}.flac", db, [0.0, 0.5, 1.0])
            for n, db in self.levels.items()
        ]


class RecordingProgress:
    def __init__(self) -> None:
        self.events: list[tuple[Stage, int]] = []

    def report(self, stage: Stage, progress: int) -> None:
        self.events.append((stage, progress))
