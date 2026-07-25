import uuid
from dataclasses import dataclass
from typing import Self

from .errors import InvalidTrackIdError


@dataclass(frozen=True, slots=True)
class TrackId:
    value: str

    def __post_init__(self) -> None:
        self._ensure_is_uuid()

    @classmethod
    def create(cls, value: str) -> Self:
        return cls(value)

    @classmethod
    def from_primitive(cls, data: str) -> Self:
        return cls.create(data)

    def _ensure_is_uuid(self) -> None:
        try:
            uuid.UUID(self.value)
        except ValueError as error:
            raise InvalidTrackIdError(self.value) from error

    def to_primitive(self) -> str:
        return self.value
