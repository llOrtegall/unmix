from dataclasses import dataclass
from pathlib import PurePosixPath
from typing import Self

from .errors import InvalidObjectKeyError

_SEPARATOR = "/"
_PARENT = ".."


@dataclass(frozen=True, slots=True)
class ObjectKey:
    value: str

    def __post_init__(self) -> None:
        self._ensure_is_relative_path()

    @classmethod
    def create(cls, value: str) -> Self:
        return cls(value.strip().rstrip(_SEPARATOR))

    @classmethod
    def from_primitive(cls, data: str) -> Self:
        return cls.create(data)

    def _ensure_is_relative_path(self) -> None:
        segments = self.value.split(_SEPARATOR)
        if not self.value or self.value.startswith(_SEPARATOR) or _PARENT in segments:
            raise InvalidObjectKeyError(self.value)

    def join(self, name: str) -> Self:
        return type(self).create(f"{self.value}{_SEPARATOR}{name}")

    def suffix(self) -> str:
        return PurePosixPath(self.value).suffix

    def to_primitive(self) -> str:
        return self.value
