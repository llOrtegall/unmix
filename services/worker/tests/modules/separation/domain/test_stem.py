import pytest

from tests.modules.separation.helpers import stem_mother
from unmix_worker.modules.separation.domain.errors import DuplicatedStemError, NoStemsError
from unmix_worker.modules.separation.domain.stem import Stem
from unmix_worker.modules.separation.domain.stem_list import StemList
from unmix_worker.modules.separation.domain.stem_name import StemName


class TestStem:
    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = stem_mother.create_primitive()

        assert Stem.from_primitive(primitive).to_primitive() == primitive

    def test_survives_a_round_trip_without_midi(self) -> None:
        primitive = stem_mother.create_primitive(midi_key=None)

        assert Stem.from_primitive(primitive).to_primitive() == primitive
        assert not Stem.from_primitive(primitive).has_midi()

    def test_is_silent_when_its_loudness_is(self) -> None:
        assert stem_mother.create(relative_db=-30.0).is_silent()
        assert not stem_mother.create(relative_db=-6.0).is_silent()


class TestStemList:
    def test_counts_the_stems_with_midi(self) -> None:
        stems = StemList.create(
            [stem_mother.create(name="vocals"), stem_mother.without_midi(name="drums")]
        )

        assert stems.count() == 2
        assert stems.count_with_midi() == 1

    def test_maps_every_stem_in_order(self) -> None:
        assert stem_mother.every_stem().map(lambda stem: stem.name) == list(StemName)

    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = stem_mother.every_stem().to_primitive()

        assert StemList.from_primitive(primitive).to_primitive() == primitive

    def test_rejects_an_empty_list(self) -> None:
        with pytest.raises(NoStemsError):
            StemList.create([])

    def test_rejects_the_same_stem_twice(self) -> None:
        with pytest.raises(DuplicatedStemError):
            StemList.create([stem_mother.create(name="other"), stem_mother.create(name="other")])
