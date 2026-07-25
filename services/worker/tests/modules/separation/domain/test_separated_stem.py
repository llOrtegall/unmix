from pathlib import Path

import pytest

from tests.modules.separation.helpers import separated_stem_mother
from unmix_worker.modules.separation.domain.errors import DuplicatedStemError, NoStemsError
from unmix_worker.modules.separation.domain.separated_stem import SeparatedStem
from unmix_worker.modules.separation.domain.separated_stem_list import SeparatedStemList
from unmix_worker.modules.separation.domain.stem_name import StemName


class TestSeparatedStem:
    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = separated_stem_mother.create_primitive()

        assert SeparatedStem.from_primitive(primitive).to_primitive() == primitive

    def test_transcribes_a_pitched_stem_with_content(self) -> None:
        assert separated_stem_mother.create(name="vocals").should_be_transcribed()

    def test_skips_transcribing_drums(self) -> None:
        assert not separated_stem_mother.create(name="drums").should_be_transcribed()

    def test_skips_transcribing_a_silent_stem(self) -> None:
        stem = separated_stem_mother.silent(name="piano")

        assert stem.is_silent()
        assert not stem.should_be_transcribed()


class TestSeparatedStemList:
    def test_keeps_the_separator_order(self, tmp_path: Path) -> None:
        stems = separated_stem_mother.every_stem(tmp_path)

        assert [stem.name for stem in stems] == list(StemName)
        assert stems.count() == len(StemName)

    def test_survives_a_primitive_round_trip(self, tmp_path: Path) -> None:
        primitive = separated_stem_mother.every_stem(tmp_path).to_primitive()

        assert SeparatedStemList.from_primitive(primitive).to_primitive() == primitive

    def test_rejects_an_empty_separation(self) -> None:
        with pytest.raises(NoStemsError):
            SeparatedStemList.create([])

    def test_rejects_the_same_stem_twice(self) -> None:
        with pytest.raises(DuplicatedStemError):
            SeparatedStemList.create(
                [
                    separated_stem_mother.create(name="bass"),
                    separated_stem_mother.create(name="bass"),
                ]
            )
