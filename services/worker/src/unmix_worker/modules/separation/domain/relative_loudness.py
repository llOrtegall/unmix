import math
from dataclasses import dataclass
from typing import Self

from .errors import InvalidLoudnessError

# A stem whose energy sits this far below the mix is reported as silent
# (e.g. the piano stem of a song without piano measured -27.7 dB in the spike).
SILENCE_THRESHOLD_DB = -24.0


@dataclass(frozen=True, slots=True)
class RelativeLoudness:
    decibels: float

    def __post_init__(self) -> None:
        self._ensure_is_finite()

    @classmethod
    def create(cls, decibels: float) -> Self:
        return cls(decibels)

    @classmethod
    def from_primitive(cls, data: float) -> Self:
        return cls.create(data)

    def _ensure_is_finite(self) -> None:
        if not math.isfinite(self.decibels):
            raise InvalidLoudnessError(self.decibels)

    def is_silent(self) -> bool:
        return self.decibels < SILENCE_THRESHOLD_DB

    def to_primitive(self) -> float:
        return self.decibels
