from unittest.mock import Mock

from unmix_worker.modules.separation.domain.progress_repository import ProgressRepository


def create() -> Mock:
    return Mock(spec=ProgressRepository)
