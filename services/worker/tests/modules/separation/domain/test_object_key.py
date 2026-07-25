import pytest

from unmix_worker.modules.separation.domain.errors import InvalidObjectKeyError
from unmix_worker.modules.separation.domain.object_key import ObjectKey


class TestBasicBehaviour:
    def test_survives_a_primitive_round_trip(self) -> None:
        assert (
            ObjectKey.from_primitive("tracks/t/original.mp3").to_primitive()
            == "tracks/t/original.mp3"
        )

    def test_joins_a_name_without_doubling_the_separator(self) -> None:
        prefix = ObjectKey.create("tracks/t/stems/")

        assert prefix.join("vocals.flac") == ObjectKey.create("tracks/t/stems/vocals.flac")
        assert prefix == ObjectKey.create("tracks/t/stems")

    def test_reads_the_file_extension(self) -> None:
        assert ObjectKey.create("tracks/t/original.mp4").suffix() == ".mp4"


class TestEdgeCases:
    def test_has_no_extension_when_the_name_has_none(self) -> None:
        assert ObjectKey.create("tracks/t/original").suffix() == ""


class TestErrorScenarios:
    @pytest.mark.parametrize(
        "value", ["", "/", "  ", "/tracks/t/original.mp3", "tracks/../secrets"]
    )
    def test_rejects_keys_that_are_not_relative_paths(self, value: str) -> None:
        with pytest.raises(InvalidObjectKeyError):
            ObjectKey.create(value)
