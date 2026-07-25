from dataclasses import dataclass
from typing import Self, TypedDict

from .audio_duration import AudioDuration
from .job_id import JobId
from .stem import StemPrimitive
from .stem_list import StemList
from .track_id import TrackId


class SeparationOutcomePrimitive(TypedDict):
    job_id: str
    track_id: str
    duration_seconds: float
    stems: list[StemPrimitive]


@dataclass(frozen=True, slots=True)
class SeparationOutcome:
    job_id: JobId
    track_id: TrackId
    duration: AudioDuration
    stems: StemList

    @classmethod
    def create(
        cls, *, job_id: JobId, track_id: TrackId, duration: AudioDuration, stems: StemList
    ) -> Self:
        return cls(job_id, track_id, duration, stems)

    @classmethod
    def from_primitive(cls, data: SeparationOutcomePrimitive) -> Self:
        return cls.create(
            job_id=JobId.from_primitive(data["job_id"]),
            track_id=TrackId.from_primitive(data["track_id"]),
            duration=AudioDuration.from_primitive(data["duration_seconds"]),
            stems=StemList.from_primitive(data["stems"]),
        )

    def to_primitive(self) -> SeparationOutcomePrimitive:
        return {
            "job_id": self.job_id.to_primitive(),
            "track_id": self.track_id.to_primitive(),
            "duration_seconds": self.duration.to_primitive(),
            "stems": self.stems.to_primitive(),
        }
