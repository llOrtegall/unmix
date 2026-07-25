import asyncio
import logging
import time

from bullmq import Job

from unmix_worker.contracts.generated import SeparationProgressV1

from ..domain.progress import Progress

log = logging.getLogger(__name__)


class BullMqProgressRepository:
    """Reports progress from the worker thread to the event loop; skips repeated values."""

    def __init__(self, job: Job, loop: asyncio.AbstractEventLoop) -> None:
        self._job = job
        self._loop = loop
        self._last: Progress | None = None
        self._stage_started = time.monotonic()

    def report(self, progress: Progress) -> None:
        if progress == self._last:
            return
        self._log_stage_durations(progress)
        self._last = progress
        payload = SeparationProgressV1.model_validate(progress.to_primitive())
        asyncio.run_coroutine_threadsafe(
            self._job.updateProgress(payload.model_dump(mode="json")), self._loop
        )

    def _log_stage_durations(self, progress: Progress) -> None:
        now = time.monotonic()
        if self._last is not None and self._last.stage is not progress.stage:
            self._log_took(self._last, now)
            self._stage_started = now
        if progress.is_complete():
            self._log_took(progress, now)

    def _log_took(self, progress: Progress, now: float) -> None:
        log.info(
            "job %s %s took %.1f s", self._job.id, progress.stage.value, now - self._stage_started
        )
