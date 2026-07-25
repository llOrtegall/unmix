import threading
from pathlib import Path
from unittest.mock import Mock

import pytest

from tests.modules.separation.helpers import (
    media_repository_mother,
    normalized_audio_mother,
    preview_repository_mother,
    progress_repository_mother,
    separated_stem_mother,
    separation_task_mother,
    separator_repository_mother,
    storage_repository_mother,
    transcriber_repository_mother,
)
from unmix_worker.modules.separation.application.separate_track import (
    SeparateTrackInput,
    separate_track,
)
from unmix_worker.modules.separation.domain.audio_duration import AudioDuration
from unmix_worker.modules.separation.domain.errors import (
    DurationExceededError,
    InputNotFoundError,
    InvalidJobIdError,
    InvalidMediaError,
)
from unmix_worker.modules.separation.domain.progress import Progress
from unmix_worker.modules.separation.domain.separation_outcome import SeparationOutcome
from unmix_worker.modules.separation.domain.stem_name import StemName

MAX_DURATION_SECONDS = 600


class Repositories:
    def __init__(self, **overrides: Mock) -> None:
        self.storage = overrides.get("storage", storage_repository_mother.create())
        self.media = overrides.get("media", media_repository_mother.create())
        self.separator = overrides.get("separator", separator_repository_mother.create())
        self.preview = overrides.get("preview", preview_repository_mother.create())
        self.transcriber = overrides.get("transcriber", transcriber_repository_mother.create())
        self.progress = progress_repository_mother.create()

    def run(self, workdir: Path, **task: str) -> SeparationOutcome:
        use_case = separate_track(
            storage_repository=self.storage,
            media_repository=self.media,
            separator_repository=self.separator,
            preview_repository=self.preview,
            transcriber_repository=self.transcriber,
            progress_repository=self.progress,
            max_duration=AudioDuration.create(MAX_DURATION_SECONDS),
        )
        return use_case(
            SeparateTrackInput(separation_task_mother.create_primitive(**task), workdir)
        )

    def reported(self) -> list[Progress]:
        return [report.args[0] for report in self.progress.report.call_args_list]


class TestBasicBehaviour:
    def test_separates_the_track_and_publishes_every_stem(self, tmp_path: Path) -> None:
        audio = normalized_audio_mother.create()
        repositories = Repositories(media=media_repository_mother.create(normalize=audio))
        task = separation_task_mother.create()

        outcome = repositories.run(tmp_path, **task.to_primitive())

        repositories.storage.download.assert_called_once_with(task.input_key, tmp_path)
        repositories.media.normalize.assert_called_once_with(
            tmp_path / f"source{task.input_key.suffix()}", tmp_path
        )
        repositories.separator.separate.assert_called_once_with(
            audio, task.model, tmp_path, repositories.progress
        )
        assert outcome.job_id == task.id
        assert outcome.track_id == task.track_id
        assert outcome.duration == audio.duration
        assert outcome.stems.map(lambda stem: stem.name) == list(StemName)

    def test_reports_progress_from_zero_to_one_hundred_in_order(self, tmp_path: Path) -> None:
        repositories = Repositories()

        repositories.run(tmp_path)

        percents = [progress.percent for progress in repositories.reported()]
        assert percents == sorted(percents)
        assert percents[0] == 0
        assert repositories.reported()[-1].is_complete()

    def test_marks_quiet_stems_as_silent(self, tmp_path: Path) -> None:
        separated = separated_stem_mother.every_stem(tmp_path, silent_names=[StemName.PIANO])
        repositories = Repositories(
            separator=separator_repository_mother.create(separate=separated)
        )

        outcome = repositories.run(tmp_path)

        assert [stem.name for stem in outcome.stems.stems if stem.is_silent()] == [StemName.PIANO]

    def test_publishes_the_stems_off_the_calling_thread(self, tmp_path: Path) -> None:
        threads: set[int] = set()

        def encode(stem: Path) -> Path:
            threads.add(threading.get_ident())
            return stem

        preview = preview_repository_mother.create()
        preview.encode.side_effect = encode
        repositories = Repositories(preview=preview)

        repositories.run(tmp_path)

        assert threads
        assert threading.get_ident() not in threads


class TestErrorScenarios:
    def test_fails_without_normalizing_when_the_input_is_missing(self, tmp_path: Path) -> None:
        storage = storage_repository_mother.create(
            download=InputNotFoundError("tracks/t/original.mp3")
        )
        repositories = Repositories(storage=storage)

        with pytest.raises(InputNotFoundError):
            repositories.run(tmp_path)
        repositories.media.normalize.assert_not_called()

    def test_rejects_a_track_over_the_limit_without_separating(self, tmp_path: Path) -> None:
        audio = normalized_audio_mother.create(duration_seconds=MAX_DURATION_SECONDS + 1)
        repositories = Repositories(media=media_repository_mother.create(normalize=audio))

        with pytest.raises(DurationExceededError):
            repositories.run(tmp_path)
        repositories.separator.separate.assert_not_called()

    def test_propagates_invalid_media_without_separating(self, tmp_path: Path) -> None:
        media = media_repository_mother.create(normalize=InvalidMediaError("moov atom not found"))
        repositories = Repositories(media=media)

        with pytest.raises(InvalidMediaError):
            repositories.run(tmp_path)
        repositories.separator.separate.assert_not_called()

    def test_rejects_an_invalid_task_before_downloading(self, tmp_path: Path) -> None:
        repositories = Repositories()

        with pytest.raises(InvalidJobIdError):
            repositories.run(tmp_path, job_id="job-1")
        repositories.storage.download.assert_not_called()
