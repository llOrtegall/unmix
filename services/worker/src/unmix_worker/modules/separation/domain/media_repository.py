from pathlib import Path
from typing import Protocol

from .normalized_audio import NormalizedAudio


class MediaRepository(Protocol):
    def normalize(self, source: Path, directory: Path) -> NormalizedAudio: ...
