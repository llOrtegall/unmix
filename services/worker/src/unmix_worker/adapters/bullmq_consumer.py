"""Queue interface: translates BullMQ jobs to the SeparateTrack use case and back."""

import asyncio
import json
import logging
import tempfile
from pathlib import Path

from bullmq import Job, UnrecoverableError
from pydantic import ValidationError

from unmix_worker.application.separate_track import SeparateTrack
from unmix_worker.contracts.generated import (
    SeparationCompletedV1,
    SeparationFailureV1,
    SeparationProgressV1,
    SeparationRequestedV1,
    StemResult,
)
from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.model import SeparationOutcome, SeparationTask, Stage
from unmix_worker.domain.result import Err, Ok

log = logging.getLogger(__name__)


class BullMqProgress:
    """Reports progress from the worker thread to the event loop; skips repeated values."""

    def __init__(self, job: Job, loop: asyncio.AbstractEventLoop) -> None:
        self._job = job
        self._loop = loop
        self._last: tuple[Stage, int] | None = None

    def report(self, stage: Stage, progress: int) -> None:
        if self._last == (stage, progress):
            return
        self._last = (stage, progress)
        payload = SeparationProgressV1(stage=stage.value, progress=progress)
        asyncio.run_coroutine_threadsafe(
            self._job.updateProgress(payload.model_dump(mode="json")), self._loop
        )


class SeparationJobProcessor:
    def __init__(self, use_case: SeparateTrack) -> None:
        self._use_case = use_case

    async def __call__(self, job: Job, token: str) -> dict:
        try:
            message = SeparationRequestedV1.model_validate(job.data)
        except ValidationError as e:
            raise UnrecoverableError(
                _encode(SeparationFailure(FailureCode.INVALID_MESSAGE, str(e)))
            ) from e

        task = SeparationTask(
            job_id=str(message.jobId),
            track_id=str(message.trackId),
            input_key=message.inputKey,
            output_prefix=message.outputPrefix,
            model=message.model.root,
        )
        log.info("job started id=%s track=%s attempt=%s", job.id, task.track_id,
                 job.attemptsMade + 1)

        progress = BullMqProgress(job, asyncio.get_running_loop())
        with tempfile.TemporaryDirectory(prefix=f"unmix-{task.job_id}-") as tmp:
            try:
                # CPU-bound: run off the event loop so BullMQ keeps renewing the job lock.
                result = await asyncio.to_thread(
                    self._use_case.execute, task, progress, Path(tmp)
                )
            except Exception as e:
                log.exception("job crashed id=%s", job.id)
                raise RuntimeError(
                    _encode(SeparationFailure(FailureCode.SEPARATION_ERROR, str(e)))
                ) from e

        match result:
            case Err(failure):
                log.warning("job failed id=%s code=%s", job.id, failure.code)
                if failure.retryable:
                    raise RuntimeError(_encode(failure))
                raise UnrecoverableError(_encode(failure))
            case Ok(outcome):
                log.info("job completed id=%s stems=%d", job.id, len(outcome.stems))
                return _completed(outcome).model_dump(mode="json")


def _encode(failure: SeparationFailure) -> str:
    return SeparationFailureV1(
        code=failure.code.value, message=failure.message, retryable=failure.retryable
    ).model_dump_json()


def _completed(outcome: SeparationOutcome) -> SeparationCompletedV1:
    return SeparationCompletedV1(
        jobId=outcome.job_id,
        trackId=outcome.track_id,
        durationSeconds=round(outcome.duration_seconds, 3),
        stems=[
            StemResult(name=s.name.value, key=s.key, sizeBytes=s.size_bytes, format="flac",
                       silent=s.silent)
            for s in outcome.stems
        ],
    )


def decode_failure(reason: str) -> dict:
    """Parse a `failedReason` written by this worker (used by scripts and tests)."""
    return json.loads(reason)
