from pathlib import Path
from typing import Any
from unittest.mock import Mock

from unmix_worker.modules.separation.domain.transcriber_repository import TranscriberRepository

from .repository_mother import stub


def _transcribed(stem: Path) -> Path:
    return stem.with_suffix(".mid")


def create(**overrides: Any) -> Mock:
    repository = Mock(spec=TranscriberRepository)
    repository.transcribe.side_effect = _transcribed
    return stub(repository, overrides)


def without_notes() -> Mock:
    return create(transcribe=None)
