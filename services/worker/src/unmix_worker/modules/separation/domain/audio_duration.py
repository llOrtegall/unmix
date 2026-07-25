import math
from dataclasses import dataclass
from typing import Self

from .errors import DurationExceededError, InvalidMediaError


@dataclass(frozen=True, slots=True)
class AudioDuration:
    seconds: float

    def __post_init__(self) -> None:
        self._ensure_is_positive()

    @classmethod
    def create(cls, seconds: float) -> Self:
        return cls(seconds)

    @classmethod
    def from_primitive(cls, data: float) -> Self:
        return cls.create(data)

    def _ensure_is_positive(self) -> None:
        if not math.isfinite(self.seconds) or self.seconds <= 0:
            raise InvalidMediaError("The audio track is empty.")

    def ensure_does_not_exceed(self, limit: "AudioDuration") -> None:
        if self.seconds > limit.seconds:
            raise DurationExceededError(self.seconds, limit.seconds)

    def to_primitive(self) -> float:
        return self.seconds
