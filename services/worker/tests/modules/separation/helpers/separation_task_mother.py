from typing import Any, cast

from faker import Faker

from unmix_worker.modules.separation.domain.model_name import ModelName
from unmix_worker.modules.separation.domain.separation_task import (
    SeparationTask,
    SeparationTaskPrimitive,
)

_faker = Faker()


def create_primitive(**overrides: Any) -> SeparationTaskPrimitive:
    track_id = str(_faker.uuid4())
    extension = _faker.random_element(["mp3", "wav", "flac", "mp4"])
    primitive: SeparationTaskPrimitive = {
        "job_id": str(_faker.uuid4()),
        "track_id": track_id,
        "input_key": f"tracks/{track_id}/original.{extension}",
        "output_prefix": f"tracks/{track_id}/stems",
        "model": _faker.random_element(list(ModelName)).value,
    }
    return cast(SeparationTaskPrimitive, {**primitive, **overrides})


def create(**overrides: Any) -> SeparationTask:
    return SeparationTask.from_primitive(create_primitive(**overrides))
