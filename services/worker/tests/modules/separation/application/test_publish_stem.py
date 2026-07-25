from unittest.mock import Mock, call

import pytest

from tests.modules.separation.helpers import (
    preview_repository_mother,
    separated_stem_mother,
    separation_task_mother,
    storage_repository_mother,
    transcriber_repository_mother,
)
from unmix_worker.modules.separation.application.publish_stem import (
    PublishStem,
    PublishStemInput,
    publish_stem,
)
from unmix_worker.modules.separation.domain.content_type import ContentType
from unmix_worker.modules.separation.domain.file_size import FileSize
from unmix_worker.modules.separation.domain.separated_stem import SeparatedStem
from unmix_worker.modules.separation.domain.stem_name import StemName


def _use_case(storage: Mock | None = None, transcriber: Mock | None = None) -> PublishStem:
    return publish_stem(
        storage_repository=storage or storage_repository_mother.create(),
        preview_repository=preview_repository_mother.create(),
        transcriber_repository=transcriber or transcriber_repository_mother.create(),
    )


class TestBasicBehaviour:
    def test_uploads_the_stem_its_preview_its_peaks_and_its_midi(self) -> None:
        task = separation_task_mother.create()
        separated = separated_stem_mother.create(name="vocals")
        size = FileSize.create(9_808_880)
        storage = storage_repository_mother.create(upload=size)

        stem = _use_case(storage=storage)(PublishStemInput(task, separated))

        name = StemName.VOCALS
        assert storage.upload.call_args_list == [
            call(separated.path.with_suffix(".mid"), task.midi_key(name), ContentType.MIDI),
            call(separated.path, task.stem_key(name), ContentType.FLAC),
            call(
                separated.path.with_suffix(".preview.mp3"), task.preview_key(name), ContentType.MP3
            ),
        ]
        storage.upload_peaks.assert_called_once_with(separated.peaks, task.peaks_key(name))
        assert stem.to_primitive() == {
            "name": "vocals",
            "key": task.stem_key(name).to_primitive(),
            "size_bytes": size.to_primitive(),
            "relative_db": separated.loudness.to_primitive(),
            "preview_key": task.preview_key(name).to_primitive(),
            "peaks_key": task.peaks_key(name).to_primitive(),
            "midi_key": task.midi_key(name).to_primitive(),
        }


class TestEdgeCases:
    @pytest.mark.parametrize(
        "separated",
        [separated_stem_mother.create(name="drums"), separated_stem_mother.silent(name="piano")],
        ids=["drums", "silent"],
    )
    def test_skips_midi_for_stems_without_notes_to_transcribe(
        self, separated: SeparatedStem
    ) -> None:
        transcriber = transcriber_repository_mother.create()
        storage = storage_repository_mother.create()

        stem = _use_case(storage=storage, transcriber=transcriber)(
            PublishStemInput(separation_task_mother.create(), separated)
        )

        transcriber.transcribe.assert_not_called()
        assert not stem.has_midi()
        assert ContentType.MIDI not in [upload.args[2] for upload in storage.upload.call_args_list]

    def test_ships_the_stem_without_midi_when_transcription_finds_no_notes(self) -> None:
        storage = storage_repository_mother.create()

        stem = _use_case(
            storage=storage, transcriber=transcriber_repository_mother.without_notes()
        )(
            PublishStemInput(
                separation_task_mother.create(), separated_stem_mother.create(name="bass")
            )
        )

        assert not stem.has_midi()
        assert storage.upload.call_count == 2


class TestErrorScenarios:
    def test_propagates_a_storage_failure(self) -> None:
        storage = storage_repository_mother.create(upload=ConnectionError("S3 is down"))

        with pytest.raises(ConnectionError):
            _use_case(storage=storage)(
                PublishStemInput(separation_task_mother.create(), separated_stem_mother.create())
            )
