import asyncio
import logging
import tempfile
from pathlib import Path
from typing import Any, Protocol

import pydantic
from bullmq import Job, UnrecoverableError

from unmix_worker.contracts.generated import (
    SeparationCompletedV1,
    SeparationFailureV1,
    SeparationRequestedV1,
)
from unmix_worker.modules.separation.application.factory import SeparationModule
from unmix_worker.modules.separation.application.separate_track import SeparateTrackInput
from unmix_worker.modules.separation.domain.separation_outcome import SeparationOutcome
from unmix_worker.modules.separation.domain.separation_task import SeparationTaskPrimitive
from unmix_worker.modules.separation.domain.stem import Stem
from unmix_worker.modules.shared.domain.domain_error import NotFoundError, ValidationError

log = logging.getLogger(__name__)

INVALID_MESSAGE = "separation.invalid_message"
UNEXPECTED_FAILURE = "separation.failed"
_STEM_FORMAT = "flac"
_DURATION_DECIMALS = 3


class SeparationModuleBuilder(Protocol):
    def __call__(self, *, job: Job, loop: asyncio.AbstractEventLoop) -> SeparationModule: ...


class SeparationConsumer:
    """BullMQ processor: one `separation.requested.v1` job in, its result or failure out."""

    def __init__(self, build_module: SeparationModuleBuilder) -> None:
        self._build_module = build_module

    async def __call__(self, job: Job, token: str) -> dict[str, Any]:
        message = _parse(job)
        log.info(
            "job started id=%s track=%s attempt=%s", job.id, message.trackId, job.attemptsMade + 1
        )
        module = self._build_module(job=job, loop=asyncio.get_running_loop())

        with tempfile.TemporaryDirectory(prefix=f"unmix-{message.jobId}-") as workdir:
            command = SeparateTrackInput(task=_task(message), workdir=Path(workdir))
            try:
                # CPU-bound: run off the event loop so BullMQ keeps renewing the job lock.
                outcome = await asyncio.to_thread(module.separate_track, command)
            except (ValidationError, NotFoundError) as error:
                log.warning("job failed id=%s code=%s", job.id, error.code)
                raise UnrecoverableError(
                    _failure(error.code, str(error), retryable=False)
                ) from error
            except Exception as error:
                log.exception("job crashed id=%s", job.id)
                raise RuntimeError(
                    _failure(UNEXPECTED_FAILURE, str(error), retryable=True)
                ) from error

        log.info(
            "job completed id=%s stems=%d midi=%d",
            job.id,
            outcome.stems.count(),
            outcome.stems.count_with_midi(),
        )
        return _completed(outcome).model_dump(mode="json")


def _parse(job: Job) -> SeparationRequestedV1:
    try:
        return SeparationRequestedV1.model_validate(job.data)
    except pydantic.ValidationError as error:
        log.warning("job rejected id=%s code=%s", job.id, INVALID_MESSAGE)
        raise UnrecoverableError(_failure(INVALID_MESSAGE, str(error), retryable=False)) from error


def _task(message: SeparationRequestedV1) -> SeparationTaskPrimitive:
    return {
        "job_id": str(message.jobId),
        "track_id": str(message.trackId),
        "input_key": message.inputKey,
        "output_prefix": message.outputPrefix,
        "model": message.model.root,
    }


def _failure(code: str, message: str, *, retryable: bool) -> str:
    return SeparationFailureV1.model_validate(
        {"code": code, "message": message, "retryable": retryable}
    ).model_dump_json()


def _completed(outcome: SeparationOutcome) -> SeparationCompletedV1:
    return SeparationCompletedV1.model_validate(
        {
            "jobId": outcome.job_id.to_primitive(),
            "trackId": outcome.track_id.to_primitive(),
            "durationSeconds": round(outcome.duration.to_primitive(), _DURATION_DECIMALS),
            "stems": outcome.stems.map(_stem_result),
        }
    )


def _stem_result(stem: Stem) -> dict[str, Any]:
    return {
        "name": stem.name.to_primitive(),
        "key": stem.key.to_primitive(),
        "sizeBytes": stem.size.to_primitive(),
        "format": _STEM_FORMAT,
        "silent": stem.is_silent(),
        "previewKey": stem.preview_key.to_primitive(),
        "peaksKey": stem.peaks_key.to_primitive(),
        "midiKey": stem.midi_key.to_primitive() if stem.midi_key is not None else None,
    }
