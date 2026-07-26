import asyncio
from pathlib import Path
from typing import Any
from unittest.mock import Mock

import pytest
from bullmq import Job, UnrecoverableError
from faker import Faker

from tests.modules.separation.helpers import separation_task_mother, stem_mother
from unmix_worker.consumers.separation_consumer import SeparationConsumer
from unmix_worker.contracts.generated import SeparationCompletedV1, SeparationFailureV1
from unmix_worker.modules.separation.application.factory import SeparationModule
from unmix_worker.modules.separation.application.separate_track import SeparateTrackInput
from unmix_worker.modules.separation.domain.audio_duration import AudioDuration
from unmix_worker.modules.separation.domain.errors import (
    DurationExceededError,
    InputNotFoundError,
)
from unmix_worker.modules.separation.domain.separation_task import SeparationTask
from unmix_worker.modules.separation.domain.stem_list import StemList
from unmix_worker.modules.shared.domain.domain_error import DomainError

_faker = Faker()


def _job(task: SeparationTask, **data: Any) -> Mock:
    primitive = task.to_primitive()
    message = {
        "messageId": str(_faker.uuid4()),
        "jobId": primitive["job_id"],
        "trackId": primitive["track_id"],
        "inputKey": primitive["input_key"],
        "outputPrefix": primitive["output_prefix"],
        "model": primitive["model"],
    }
    job = Mock(spec=Job)
    job.id = primitive["job_id"]
    job.attemptsMade = 0
    job.data = {**message, **data}
    return job


class Consumer:
    def __init__(self, separate_track: Mock) -> None:
        self.separate_track = separate_track
        self.built_for: list[Job] = []

    def build(self, *, job: Job, loop: asyncio.AbstractEventLoop) -> SeparationModule:
        self.built_for.append(job)
        return SeparationModule(separate_track=self.separate_track)

    async def process(self, job: Mock) -> dict[str, Any]:
        return await SeparationConsumer(self.build)(job, "token")


def _failure(error: BaseException) -> SeparationFailureV1:
    return SeparationFailureV1.model_validate_json(str(error))


class TestBasicBehaviour:
    async def test_returns_the_completed_contract(self) -> None:
        task = separation_task_mother.create()
        stems = StemList.create(
            [
                stem_mother.create(name="vocals"),
                stem_mother.without_midi(name="piano", relative_db=-30.0),
            ]
        )
        consumer = Consumer(Mock(return_value=task.complete(AudioDuration.create(297.2749), stems)))

        result = await consumer.process(_job(task))

        completed = SeparationCompletedV1.model_validate(result)
        assert str(completed.jobId) == task.id.to_primitive()
        assert completed.durationSeconds == 297.275
        assert [
            (stem.name.root, stem.silent, stem.midiKey is None) for stem in completed.stems
        ] == [
            ("vocals", False, False),
            ("piano", True, True),
        ]

    async def test_runs_the_use_case_in_a_temporary_workdir(self) -> None:
        task = separation_task_mother.create()
        separate_track = Mock(
            return_value=task.complete(AudioDuration.create(60), stem_mother.every_stem())
        )
        consumer = Consumer(separate_track)

        await consumer.process(_job(task))

        command: SeparateTrackInput = separate_track.call_args.args[0]
        assert command.task == task.to_primitive()
        assert command.workdir.name.startswith(f"unmix-{task.id.to_primitive()}-")
        assert not Path(command.workdir).exists()


class TestErrorScenarios:
    async def test_rejects_a_message_that_breaks_the_contract_without_retries(self) -> None:
        consumer = Consumer(Mock())

        with pytest.raises(UnrecoverableError) as raised:
            await consumer.process(_job(separation_task_mother.create(), model="spleeter"))

        failure = _failure(raised.value)
        assert (failure.code.root, failure.retryable) == ("separation.invalid_message", False)
        assert consumer.built_for == []

    @pytest.mark.parametrize(
        "error",
        [DurationExceededError(720, 600), InputNotFoundError("tracks/t/original.mp3")],
        ids=["validation", "not-found"],
    )
    async def test_fails_business_errors_without_retries(self, error: DomainError) -> None:
        consumer = Consumer(Mock(side_effect=error))

        with pytest.raises(UnrecoverableError) as raised:
            await consumer.process(_job(separation_task_mother.create()))

        failure = _failure(raised.value)
        assert failure.code.root == error.code
        assert failure.message == str(error)
        assert not failure.retryable

    async def test_lets_the_queue_retry_an_unexpected_error(self) -> None:
        consumer = Consumer(Mock(side_effect=MemoryError("out of memory")))

        with pytest.raises(RuntimeError) as raised:
            await consumer.process(_job(separation_task_mother.create()))

        failure = _failure(raised.value)
        assert (failure.code.root, failure.message, failure.retryable) == (
            "separation.failed",
            "out of memory",
            True,
        )
