from collections.abc import Iterable
from pathlib import Path
from typing import Any, cast

from faker import Faker

from unmix_worker.modules.separation.domain.relative_loudness import SILENCE_THRESHOLD_DB
from unmix_worker.modules.separation.domain.separated_stem import (
    SeparatedStem,
    SeparatedStemPrimitive,
)
from unmix_worker.modules.separation.domain.separated_stem_list import SeparatedStemList
from unmix_worker.modules.separation.domain.stem_name import StemName

_faker = Faker()
_PEAKS = 10


def create_primitive(**overrides: Any) -> SeparatedStemPrimitive:
    name = overrides.get("name", _faker.random_element(list(StemName)).value)
    primitive: SeparatedStemPrimitive = {
        "name": name,
        "path": f"/tmp/{_faker.uuid4()}/{name}.flac",
        "relative_db": _faker.pyfloat(min_value=SILENCE_THRESHOLD_DB + 1, max_value=-1),
        "peaks": [_faker.pyfloat(min_value=0, max_value=1) for _ in range(_PEAKS)],
    }
    return cast(SeparatedStemPrimitive, {**primitive, **overrides})


def create(**overrides: Any) -> SeparatedStem:
    return SeparatedStem.from_primitive(create_primitive(**overrides))


def silent(**overrides: Any) -> SeparatedStem:
    return create(relative_db=SILENCE_THRESHOLD_DB - 3.7, **overrides)


def every_stem(directory: Path, silent_names: Iterable[StemName] = ()) -> SeparatedStemList:
    quiet = set(silent_names)
    return SeparatedStemList.create(
        (silent if name in quiet else create)(name=name.value, path=str(directory / f"{name}.flac"))
        for name in StemName
    )
