from typing import Any
from unittest.mock import Mock

from unmix_worker.modules.separation.domain.media_repository import MediaRepository

from . import normalized_audio_mother
from .repository_mother import stub


def create(**overrides: Any) -> Mock:
    repository = Mock(spec=MediaRepository)
    repository.normalize.return_value = normalized_audio_mother.create()
    return stub(repository, overrides)
