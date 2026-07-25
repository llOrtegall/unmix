from typing import Protocol

from .progress import Progress


class ProgressRepository(Protocol):
    def report(self, progress: Progress) -> None: ...
