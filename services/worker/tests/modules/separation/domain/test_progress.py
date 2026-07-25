import pytest

from unmix_worker.modules.separation.domain.errors import InvalidProgressError
from unmix_worker.modules.separation.domain.progress import Progress
from unmix_worker.modules.separation.domain.stage import Stage


class TestBasicBehaviour:
    @pytest.mark.parametrize(
        ("stage", "fraction", "percent"),
        [
            (Stage.DOWNLOADING, 0, 0),
            (Stage.NORMALIZING, 0, 5),
            (Stage.SEPARATING, 0.5, 50),
            (Stage.UPLOADING, 1, 100),
        ],
    )
    def test_maps_progress_inside_a_stage_to_the_whole_job(
        self, stage: Stage, fraction: float, percent: int
    ) -> None:
        assert Progress.at(stage, fraction).percent == percent

    def test_starts_a_stage_at_its_first_percent(self) -> None:
        assert Progress.start(Stage.SEPARATING) == Progress.create(Stage.SEPARATING, 10)

    def test_is_complete_only_at_one_hundred_percent(self) -> None:
        assert Progress.at(Stage.UPLOADING, 1).is_complete()
        assert not Progress.at(Stage.UPLOADING, 0.9).is_complete()

    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = Progress.at(Stage.SEPARATING, 0.4).to_primitive()

        assert primitive == {"stage": "separating", "progress": 42}
        assert Progress.from_primitive(primitive).to_primitive() == primitive


class TestEdgeCases:
    @pytest.mark.parametrize(("fraction", "percent"), [(2.0, 90), (-1.0, 10)])
    def test_clamps_fractions_outside_the_stage(self, fraction: float, percent: int) -> None:
        assert Progress.at(Stage.SEPARATING, fraction).percent == percent


class TestErrorScenarios:
    def test_rejects_a_percent_outside_its_stage(self) -> None:
        with pytest.raises(InvalidProgressError):
            Progress.create(Stage.DOWNLOADING, 50)

    def test_rejects_an_unknown_stage(self) -> None:
        with pytest.raises(InvalidProgressError):
            Progress.from_primitive({"stage": "mastering", "progress": 50})
