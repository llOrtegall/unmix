import asyncio
import logging
from unittest.mock import AsyncMock

import pytest

from unmix_worker.modules.separation.domain.progress import Progress
from unmix_worker.modules.separation.domain.stage import Stage
from unmix_worker.modules.separation.infrastructure.bullmq_progress_repository import (
    BullMqProgressRepository,
)


async def _report(job: AsyncMock, *progresses: Progress) -> None:
    repository = BullMqProgressRepository(job, asyncio.get_running_loop())
    for progress in progresses:
        await asyncio.to_thread(repository.report, progress)
    await asyncio.sleep(0)


class TestBasicBehaviour:
    async def test_publishes_the_progress_contract_from_a_worker_thread(self) -> None:
        job = AsyncMock()

        await _report(job, Progress.at(Stage.SEPARATING, 0.5))

        job.updateProgress.assert_awaited_once_with({"stage": "separating", "progress": 50})

    async def test_logs_how_long_each_stage_took(self, caplog: pytest.LogCaptureFixture) -> None:
        job = AsyncMock(id="job-1")

        with caplog.at_level(logging.INFO):
            await _report(
                job,
                Progress.start(Stage.DOWNLOADING),
                Progress.start(Stage.NORMALIZING),
                Progress.at(Stage.UPLOADING, 1),
            )

        took = [record.getMessage() for record in caplog.records if "took" in record.getMessage()]
        assert [message.split(" took")[0] for message in took] == [
            "job job-1 downloading",
            "job job-1 normalizing",
            "job job-1 uploading",
        ]


class TestEdgeCases:
    async def test_skips_a_repeated_progress(self) -> None:
        job = AsyncMock()

        await _report(job, Progress.start(Stage.UPLOADING), Progress.start(Stage.UPLOADING))

        job.updateProgress.assert_awaited_once()
