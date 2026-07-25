from pathlib import Path
from typing import Protocol


class PreviewRepository(Protocol):
    def encode(self, stem: Path) -> Path: ...
