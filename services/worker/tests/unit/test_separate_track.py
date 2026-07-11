from pathlib import Path

from tests.unit.fakes import (
    FakeNormalizer,
    FakePreviews,
    FakeSeparator,
    FakeStorage,
    RecordingProgress,
)
from unmix_worker.application.separate_track import SeparateTrack
from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.model import SeparationTask, StemName
from unmix_worker.domain.result import Err, Ok

TASK = SeparationTask(
    job_id="job-1",
    track_id="track-1",
    input_key="tracks/track-1/original.mp3",
    output_prefix="tracks/track-1/stems",
    model="htdemucs_6s",
)


def make(storage=None, normalizer=None, separator=None) -> SeparateTrack:
    return SeparateTrack(
        storage=storage or FakeStorage({TASK.input_key}),
        normalizer=normalizer or FakeNormalizer(),
        separator=separator or FakeSeparator(),
        previews=FakePreviews(),
        max_duration_seconds=600,
    )


def test_uploads_every_stem_and_reports_full_progress(tmp_path: Path) -> None:
    storage = FakeStorage({TASK.input_key})
    progress = RecordingProgress()

    result = make(storage=storage).execute(TASK, progress, tmp_path)

    assert isinstance(result, Ok)
    assert result.value.duration_seconds == 240.0
    assert {s.name for s in result.value.stems} == set(StemName)
    assert set(storage.uploaded) == {
        f"tracks/track-1/stems/{n}{suffix}"
        for n in StemName
        for suffix in (".flac", ".preview.mp3", ".peaks.json")
    }
    assert storage.uploaded["tracks/track-1/stems/vocals.peaks.json"] == "application/json"
    values = [p for _, p in progress.events]
    assert values == sorted(values)
    assert values[0] == 0 and values[-1] == 100


def test_marks_quiet_stems_as_silent(tmp_path: Path) -> None:
    levels = {name: -8.0 for name in StemName} | {StemName.PIANO: -27.7}

    result = make(separator=FakeSeparator(levels)).execute(TASK, RecordingProgress(), tmp_path)

    assert isinstance(result, Ok)
    silent = {s.name for s in result.value.stems if s.silent}
    assert silent == {StemName.PIANO}


def test_missing_input_fails_without_separating(tmp_path: Path) -> None:
    separator = FakeSeparator()

    result = make(storage=FakeStorage(set()), separator=separator).execute(
        TASK, RecordingProgress(), tmp_path
    )

    assert isinstance(result, Err)
    assert result.error.code is FailureCode.INPUT_NOT_FOUND
    assert separator.calls == 0


def test_rejects_tracks_over_duration_limit(tmp_path: Path) -> None:
    separator = FakeSeparator()

    result = make(normalizer=FakeNormalizer(duration=601), separator=separator).execute(
        TASK, RecordingProgress(), tmp_path
    )

    assert isinstance(result, Err)
    assert result.error.code is FailureCode.DURATION_EXCEEDED
    assert not result.error.retryable
    assert separator.calls == 0


def test_propagates_invalid_media(tmp_path: Path) -> None:
    failure = SeparationFailure(FailureCode.INVALID_MEDIA, "bad file")

    result = make(normalizer=FakeNormalizer(failure=failure)).execute(
        TASK, RecordingProgress(), tmp_path
    )

    assert result == Err(failure)


def test_publishes_stems_concurrently_in_separator_order(tmp_path: Path) -> None:
    import threading

    seen: set[int] = set()

    class ThreadRecordingPreviews(FakePreviews):
        def encode(self, src: Path, dest: Path) -> None:
            seen.add(threading.get_ident())
            super().encode(src, dest)

    use_case = SeparateTrack(
        storage=FakeStorage({TASK.input_key}),
        normalizer=FakeNormalizer(),
        separator=FakeSeparator(),
        previews=ThreadRecordingPreviews(),
        max_duration_seconds=600,
    )
    result = use_case.execute(TASK, RecordingProgress(), tmp_path)

    assert isinstance(result, Ok)
    assert [s.name for s in result.value.stems] == list(StemName)
    assert threading.get_ident() not in seen
