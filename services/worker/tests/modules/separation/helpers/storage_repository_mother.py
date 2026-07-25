from pathlib import Path
from typing import Any
from unittest.mock import Mock

from faker import Faker

from unmix_worker.modules.separation.domain.file_size import FileSize
from unmix_worker.modules.separation.domain.object_key import ObjectKey
from unmix_worker.modules.separation.domain.storage_repository import StorageRepository

from .repository_mother import stub

_faker = Faker()


def _downloaded(key: ObjectKey, directory: Path) -> Path:
    return directory / f"source{key.suffix()}"


def create(**overrides: Any) -> Mock:
    repository = Mock(spec=StorageRepository)
    repository.download.side_effect = _downloaded
    repository.upload.return_value = FileSize.create(_faker.random_int(min=1, max=50_000_000))
    repository.upload_peaks.return_value = None
    return stub(repository, overrides)
