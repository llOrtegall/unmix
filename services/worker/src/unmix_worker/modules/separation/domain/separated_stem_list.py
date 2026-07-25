from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from typing import Self

from .errors import DuplicatedStemError, NoStemsError
from .separated_stem import SeparatedStem, SeparatedStemPrimitive


@dataclass(frozen=True, slots=True)
class SeparatedStemList:
    stems: tuple[SeparatedStem, ...]

    def __post_init__(self) -> None:
        self._ensure_is_not_empty()
        self._ensure_has_no_duplicates()

    @classmethod
    def create(cls, stems: Iterable[SeparatedStem]) -> Self:
        return cls(tuple(stems))

    @classmethod
    def from_primitive(cls, data: Iterable[SeparatedStemPrimitive]) -> Self:
        return cls.create(SeparatedStem.from_primitive(item) for item in data)

    def _ensure_is_not_empty(self) -> None:
        if not self.stems:
            raise NoStemsError()

    def _ensure_has_no_duplicates(self) -> None:
        names = [stem.name for stem in self.stems]
        duplicated = next((name for name in names if names.count(name) > 1), None)
        if duplicated:
            raise DuplicatedStemError(duplicated.to_primitive())

    def __iter__(self) -> Iterator[SeparatedStem]:
        return iter(self.stems)

    def count(self) -> int:
        return len(self.stems)

    def to_primitive(self) -> list[SeparatedStemPrimitive]:
        return [stem.to_primitive() for stem in self.stems]
