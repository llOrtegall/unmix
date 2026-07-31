from pathlib import Path
from typing import Protocol

from .audio_duration import AudioDuration
from .normalized_audio import NormalizedAudio


class MediaRepository(Protocol):
    def normalize(self, source: Path, directory: Path, limit: AudioDuration) -> NormalizedAudio:
        """Decodes at most a little past `limit`, so an over-long input reports a duration
        above the limit without spending disk and CPU on the rest of it."""
        ...
