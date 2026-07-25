from pathlib import Path
from typing import Protocol

from .model_name import ModelName
from .normalized_audio import NormalizedAudio
from .progress_repository import ProgressRepository
from .separated_stem_list import SeparatedStemList


class SeparatorRepository(Protocol):
    def separate(
        self,
        audio: NormalizedAudio,
        model: ModelName,
        directory: Path,
        progress: ProgressRepository,
    ) -> SeparatedStemList: ...
