from dataclasses import dataclass
from pathlib import Path
from typing import Self, TypedDict

from .relative_loudness import RelativeLoudness
from .stem_name import StemName
from .waveform_peaks import WaveformPeaks


class SeparatedStemPrimitive(TypedDict):
    name: str
    path: str
    relative_db: float
    peaks: list[float]


@dataclass(frozen=True, slots=True)
class SeparatedStem:
    name: StemName
    path: Path
    loudness: RelativeLoudness
    peaks: WaveformPeaks

    @classmethod
    def create(
        cls, *, name: StemName, path: Path, loudness: RelativeLoudness, peaks: WaveformPeaks
    ) -> Self:
        return cls(name, path, loudness, peaks)

    @classmethod
    def from_primitive(cls, data: SeparatedStemPrimitive) -> Self:
        return cls.create(
            name=StemName.from_primitive(data["name"]),
            path=Path(data["path"]),
            loudness=RelativeLoudness.from_primitive(data["relative_db"]),
            peaks=WaveformPeaks.from_primitive(data["peaks"]),
        )

    def is_silent(self) -> bool:
        return self.loudness.is_silent()

    def should_be_transcribed(self) -> bool:
        return self.name.is_pitched() and not self.is_silent()

    def to_primitive(self) -> SeparatedStemPrimitive:
        return {
            "name": self.name.to_primitive(),
            "path": str(self.path),
            "relative_db": self.loudness.to_primitive(),
            "peaks": self.peaks.to_primitive(),
        }
