from dataclasses import dataclass
from pathlib import Path
from typing import Self, TypedDict

from .audio_duration import AudioDuration


class NormalizedAudioPrimitive(TypedDict):
    path: str
    duration_seconds: float


@dataclass(frozen=True, slots=True)
class NormalizedAudio:
    path: Path
    duration: AudioDuration

    @classmethod
    def create(cls, path: Path, duration: AudioDuration) -> Self:
        return cls(path, duration)

    @classmethod
    def from_primitive(cls, data: NormalizedAudioPrimitive) -> Self:
        return cls.create(
            Path(data["path"]), AudioDuration.from_primitive(data["duration_seconds"])
        )

    def to_primitive(self) -> NormalizedAudioPrimitive:
        return {"path": str(self.path), "duration_seconds": self.duration.to_primitive()}
