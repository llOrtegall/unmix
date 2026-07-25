from collections.abc import Callable, Iterable
from dataclasses import dataclass
from typing import Self

from .errors import DuplicatedStemError, NoStemsError
from .stem import Stem, StemPrimitive


@dataclass(frozen=True, slots=True)
class StemList:
    stems: tuple[Stem, ...]

    def __post_init__(self) -> None:
        self._ensure_is_not_empty()
        self._ensure_has_no_duplicates()

    @classmethod
    def create(cls, stems: Iterable[Stem]) -> Self:
        return cls(tuple(stems))

    @classmethod
    def from_primitive(cls, data: Iterable[StemPrimitive]) -> Self:
        return cls.create(Stem.from_primitive(item) for item in data)

    def _ensure_is_not_empty(self) -> None:
        if not self.stems:
            raise NoStemsError()

    def _ensure_has_no_duplicates(self) -> None:
        names = [stem.name for stem in self.stems]
        duplicated = next((name for name in names if names.count(name) > 1), None)
        if duplicated:
            raise DuplicatedStemError(duplicated.to_primitive())

    def map[T](self, transform: Callable[[Stem], T]) -> list[T]:
        return [transform(stem) for stem in self.stems]

    def count(self) -> int:
        return len(self.stems)

    def count_with_midi(self) -> int:
        return sum(1 for stem in self.stems if stem.has_midi())

    def to_primitive(self) -> list[StemPrimitive]:
        return [stem.to_primitive() for stem in self.stems]
