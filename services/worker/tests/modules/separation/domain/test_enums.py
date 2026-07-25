import pytest

from unmix_worker.modules.separation.domain.errors import InvalidModelError, InvalidStemNameError
from unmix_worker.modules.separation.domain.model_name import ModelName
from unmix_worker.modules.separation.domain.stem_name import StemName


class TestBasicBehaviour:
    def test_reads_a_supported_model(self) -> None:
        assert ModelName.from_primitive("htdemucs_6s") is ModelName.HTDEMUCS_6S
        assert ModelName.HTDEMUCS_FT.to_primitive() == "htdemucs_ft"

    def test_reads_a_known_stem(self) -> None:
        assert StemName.from_primitive("piano") is StemName.PIANO
        assert StemName.BASS.to_primitive() == "bass"

    @pytest.mark.parametrize("name", [name for name in StemName if name is not StemName.DRUMS])
    def test_every_stem_but_drums_is_pitched(self, name: StemName) -> None:
        assert name.is_pitched()

    def test_drums_are_not_pitched(self) -> None:
        assert not StemName.DRUMS.is_pitched()


class TestErrorScenarios:
    def test_rejects_an_unsupported_model(self) -> None:
        with pytest.raises(InvalidModelError):
            ModelName.from_primitive("spleeter")

    def test_rejects_an_unknown_stem(self) -> None:
        with pytest.raises(InvalidStemNameError):
            StemName.from_primitive("kazoo")
