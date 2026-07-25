from pathlib import Path
from typing import Any
from unittest.mock import Mock

from unmix_worker.modules.separation.domain.preview_repository import PreviewRepository

from .repository_mother import stub


def _encoded(stem: Path) -> Path:
    return stem.with_suffix(".preview.mp3")


def create(**overrides: Any) -> Mock:
    repository = Mock(spec=PreviewRepository)
    repository.encode.side_effect = _encoded
    return stub(repository, overrides)
