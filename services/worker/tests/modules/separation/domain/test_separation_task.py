import pytest

from tests.modules.separation.helpers import separation_task_mother, stem_mother
from unmix_worker.modules.separation.domain.audio_duration import AudioDuration
from unmix_worker.modules.separation.domain.errors import (
    InvalidJobIdError,
    InvalidModelError,
    InvalidObjectKeyError,
    InvalidTrackIdError,
)
from unmix_worker.modules.separation.domain.object_key import ObjectKey
from unmix_worker.modules.separation.domain.separation_outcome import SeparationOutcome
from unmix_worker.modules.separation.domain.separation_task import SeparationTask
from unmix_worker.modules.separation.domain.stem_name import StemName
from unmix_worker.modules.shared.domain.domain_error import DomainError


class TestBasicBehaviour:
    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = separation_task_mother.create_primitive()

        assert SeparationTask.from_primitive(primitive).to_primitive() == primitive

    def test_places_every_file_of_a_stem_under_the_output_prefix(self) -> None:
        task = separation_task_mother.create(output_prefix="tracks/t/stems/")

        assert task.stem_key(StemName.VOCALS) == ObjectKey.create("tracks/t/stems/vocals.flac")
        assert task.preview_key(StemName.BASS) == ObjectKey.create(
            "tracks/t/stems/bass.preview.mp3"
        )
        assert task.peaks_key(StemName.DRUMS) == ObjectKey.create("tracks/t/stems/drums.peaks.json")
        assert task.midi_key(StemName.PIANO) == ObjectKey.create("tracks/t/stems/piano.mid")

    def test_completes_with_the_duration_and_the_stems(self) -> None:
        task = separation_task_mother.create()
        duration = AudioDuration.create(297.27)
        stems = stem_mother.every_stem()

        outcome = task.complete(duration, stems)

        assert outcome == SeparationOutcome.create(
            job_id=task.id, track_id=task.track_id, duration=duration, stems=stems
        )
        assert SeparationOutcome.from_primitive(outcome.to_primitive()) == outcome

    def test_compares_by_id(self) -> None:
        task = separation_task_mother.create()
        same_job = separation_task_mother.create(job_id=task.id.to_primitive())

        assert task == same_job
        assert hash(task) == hash(same_job)
        assert task != separation_task_mother.create()


class TestErrorScenarios:
    @pytest.mark.parametrize(
        ("field", "value", "error"),
        [
            ("job_id", "job-1", InvalidJobIdError),
            ("track_id", "track-1", InvalidTrackIdError),
            ("input_key", "/etc/passwd", InvalidObjectKeyError),
            ("output_prefix", "", InvalidObjectKeyError),
            ("model", "spleeter", InvalidModelError),
        ],
    )
    def test_rejects_invalid_data_when_rehydrating(
        self, field: str, value: str, error: type[DomainError]
    ) -> None:
        with pytest.raises(error):
            SeparationTask.from_primitive(separation_task_mother.create_primitive(**{field: value}))
