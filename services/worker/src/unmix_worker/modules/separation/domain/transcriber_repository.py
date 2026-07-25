from pathlib import Path
from typing import Protocol


class TranscriberRepository(Protocol):
    def transcribe(self, stem: Path) -> Path | None: ...
