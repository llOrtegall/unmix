from dataclasses import dataclass
from typing import Self, TypedDict

from .audio_duration import AudioDuration
from .job_id import JobId
from .model_name import ModelName
from .object_key import ObjectKey
from .separation_outcome import SeparationOutcome
from .stem_list import StemList
from .stem_name import StemName
from .track_id import TrackId


class SeparationTaskPrimitive(TypedDict):
    job_id: str
    track_id: str
    input_key: str
    output_prefix: str
    model: str


@dataclass(frozen=True, slots=True, eq=False)
class SeparationTask:
    id: JobId
    track_id: TrackId
    input_key: ObjectKey
    output_prefix: ObjectKey
    model: ModelName

    @classmethod
    def create(
        cls,
        *,
        job_id: JobId,
        track_id: TrackId,
        input_key: ObjectKey,
        output_prefix: ObjectKey,
        model: ModelName,
    ) -> Self:
        return cls(job_id, track_id, input_key, output_prefix, model)

    @classmethod
    def from_primitive(cls, data: SeparationTaskPrimitive) -> Self:
        return cls.create(
            job_id=JobId.from_primitive(data["job_id"]),
            track_id=TrackId.from_primitive(data["track_id"]),
            input_key=ObjectKey.from_primitive(data["input_key"]),
            output_prefix=ObjectKey.from_primitive(data["output_prefix"]),
            model=ModelName.from_primitive(data["model"]),
        )

    def stem_key(self, name: StemName) -> ObjectKey:
        return self.output_prefix.join(f"{name}.flac")

    def preview_key(self, name: StemName) -> ObjectKey:
        return self.output_prefix.join(f"{name}.preview.mp3")

    def peaks_key(self, name: StemName) -> ObjectKey:
        return self.output_prefix.join(f"{name}.peaks.json")

    def midi_key(self, name: StemName) -> ObjectKey:
        return self.output_prefix.join(f"{name}.mid")

    def complete(self, duration: AudioDuration, stems: StemList) -> SeparationOutcome:
        return SeparationOutcome.create(
            job_id=self.id, track_id=self.track_id, duration=duration, stems=stems
        )

    def __eq__(self, other: object) -> bool:
        return isinstance(other, SeparationTask) and self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)

    def to_primitive(self) -> SeparationTaskPrimitive:
        return {
            "job_id": self.id.to_primitive(),
            "track_id": self.track_id.to_primitive(),
            "input_key": self.input_key.to_primitive(),
            "output_prefix": self.output_prefix.to_primitive(),
            "model": self.model.to_primitive(),
        }
