from dataclasses import dataclass
from typing import Self, TypedDict

from .file_size import FileSize
from .object_key import ObjectKey
from .relative_loudness import RelativeLoudness
from .stem_name import StemName


class StemPrimitive(TypedDict):
    name: str
    key: str
    size_bytes: int
    relative_db: float
    preview_key: str
    peaks_key: str
    midi_key: str | None


@dataclass(frozen=True, slots=True)
class Stem:
    name: StemName
    key: ObjectKey
    size: FileSize
    loudness: RelativeLoudness
    preview_key: ObjectKey
    peaks_key: ObjectKey
    midi_key: ObjectKey | None

    @classmethod
    def create(
        cls,
        *,
        name: StemName,
        key: ObjectKey,
        size: FileSize,
        loudness: RelativeLoudness,
        preview_key: ObjectKey,
        peaks_key: ObjectKey,
        midi_key: ObjectKey | None,
    ) -> Self:
        return cls(name, key, size, loudness, preview_key, peaks_key, midi_key)

    @classmethod
    def from_primitive(cls, data: StemPrimitive) -> Self:
        midi_key = data["midi_key"]
        return cls.create(
            name=StemName.from_primitive(data["name"]),
            key=ObjectKey.from_primitive(data["key"]),
            size=FileSize.from_primitive(data["size_bytes"]),
            loudness=RelativeLoudness.from_primitive(data["relative_db"]),
            preview_key=ObjectKey.from_primitive(data["preview_key"]),
            peaks_key=ObjectKey.from_primitive(data["peaks_key"]),
            midi_key=ObjectKey.from_primitive(midi_key) if midi_key is not None else None,
        )

    def is_silent(self) -> bool:
        return self.loudness.is_silent()

    def has_midi(self) -> bool:
        return self.midi_key is not None

    def to_primitive(self) -> StemPrimitive:
        return {
            "name": self.name.to_primitive(),
            "key": self.key.to_primitive(),
            "size_bytes": self.size.to_primitive(),
            "relative_db": self.loudness.to_primitive(),
            "preview_key": self.preview_key.to_primitive(),
            "peaks_key": self.peaks_key.to_primitive(),
            "midi_key": self.midi_key.to_primitive() if self.midi_key is not None else None,
        }
