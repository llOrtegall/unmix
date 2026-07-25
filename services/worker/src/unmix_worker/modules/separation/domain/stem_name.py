from enum import StrEnum
from typing import Self

from .errors import InvalidStemNameError


class StemName(StrEnum):
    VOCALS = "vocals"
    DRUMS = "drums"
    BASS = "bass"
    GUITAR = "guitar"
    PIANO = "piano"
    OTHER = "other"

    @classmethod
    def from_primitive(cls, data: str) -> Self:
        try:
            return cls(data)
        except ValueError as error:
            raise InvalidStemNameError(data) from error

    def is_pitched(self) -> bool:
        return self is not StemName.DRUMS

    def to_primitive(self) -> str:
        return self.value
