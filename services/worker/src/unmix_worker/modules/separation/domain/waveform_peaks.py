from collections.abc import Iterable
from dataclasses import dataclass
from typing import Self

from .errors import InvalidPeaksError

_SILENCE = 0.0
_FULL_SCALE = 1.0


@dataclass(frozen=True, slots=True)
class WaveformPeaks:
    values: tuple[float, ...]

    def __post_init__(self) -> None:
        self._ensure_is_not_empty()
        self._ensure_values_are_amplitudes()

    @classmethod
    def create(cls, values: Iterable[float]) -> Self:
        return cls(tuple(values))

    @classmethod
    def from_primitive(cls, data: Iterable[float]) -> Self:
        return cls.create(data)

    def _ensure_is_not_empty(self) -> None:
        if not self.values:
            raise InvalidPeaksError("there are no peaks")

    def _ensure_values_are_amplitudes(self) -> None:
        if any(not _SILENCE <= value <= _FULL_SCALE for value in self.values):
            raise InvalidPeaksError(f"every peak must be between {_SILENCE} and {_FULL_SCALE}")

    def count(self) -> int:
        return len(self.values)

    def to_primitive(self) -> list[float]:
        return list(self.values)
