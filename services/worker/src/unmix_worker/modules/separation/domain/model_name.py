from enum import StrEnum
from typing import Self

from .errors import InvalidModelError


class ModelName(StrEnum):
    HTDEMUCS_6S = "htdemucs_6s"
    HTDEMUCS_FT = "htdemucs_ft"
    HTDEMUCS = "htdemucs"

    @classmethod
    def from_primitive(cls, data: str) -> Self:
        try:
            return cls(data)
        except ValueError as error:
            raise InvalidModelError(data) from error

    def to_primitive(self) -> str:
        return self.value
