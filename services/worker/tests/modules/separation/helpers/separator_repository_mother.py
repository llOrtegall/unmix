from pathlib import Path
from typing import Any
from unittest.mock import Mock

from unmix_worker.modules.separation.domain.separator_repository import SeparatorRepository

from . import separated_stem_mother
from .repository_mother import stub


def create(**overrides: Any) -> Mock:
    repository = Mock(spec=SeparatorRepository)
    repository.separate.return_value = separated_stem_mother.every_stem(Path("/tmp/stems"))
    return stub(repository, overrides)
