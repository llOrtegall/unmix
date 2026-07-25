from typing import Any, cast

from faker import Faker

from unmix_worker.modules.separation.domain.stem import Stem, StemPrimitive
from unmix_worker.modules.separation.domain.stem_list import StemList
from unmix_worker.modules.separation.domain.stem_name import StemName

_faker = Faker()


def create_primitive(**overrides: Any) -> StemPrimitive:
    name = overrides.get("name", _faker.random_element(list(StemName)).value)
    prefix = f"tracks/{_faker.uuid4()}/stems/{name}"
    primitive: StemPrimitive = {
        "name": name,
        "key": f"{prefix}.flac",
        "size_bytes": _faker.random_int(min=1, max=50_000_000),
        "relative_db": _faker.pyfloat(min_value=-20, max_value=-1),
        "preview_key": f"{prefix}.preview.mp3",
        "peaks_key": f"{prefix}.peaks.json",
        "midi_key": f"{prefix}.mid",
    }
    return cast(StemPrimitive, {**primitive, **overrides})


def create(**overrides: Any) -> Stem:
    return Stem.from_primitive(create_primitive(**overrides))


def without_midi(**overrides: Any) -> Stem:
    return create(midi_key=None, **overrides)


def every_stem() -> StemList:
    return StemList.create(create(name=name.value) for name in StemName)
