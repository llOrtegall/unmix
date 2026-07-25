from dataclasses import dataclass
from typing import Self

from .errors import InvalidFileSizeError


@dataclass(frozen=True, slots=True)
class FileSize:
    value: int

    def __post_init__(self) -> None:
        self._ensure_is_not_negative()

    @classmethod
    def create(cls, value: int) -> Self:
        return cls(value)

    @classmethod
    def from_primitive(cls, data: int) -> Self:
        return cls.create(data)

    def _ensure_is_not_negative(self) -> None:
        if self.value < 0:
            raise InvalidFileSizeError(self.value)

    def to_primitive(self) -> int:
        return self.value
