from pathlib import Path
from typing import Any, cast

from faker import Faker

from unmix_worker.modules.separation.domain.normalized_audio import (
    NormalizedAudio,
    NormalizedAudioPrimitive,
)

_faker = Faker()


def create_primitive(**overrides: Any) -> NormalizedAudioPrimitive:
    primitive: NormalizedAudioPrimitive = {
        "path": str(Path("/tmp") / str(_faker.uuid4()) / "mix.wav"),
        "duration_seconds": _faker.pyfloat(min_value=30, max_value=590),
    }
    return cast(NormalizedAudioPrimitive, {**primitive, **overrides})


def create(**overrides: Any) -> NormalizedAudio:
    return NormalizedAudio.from_primitive(create_primitive(**overrides))
