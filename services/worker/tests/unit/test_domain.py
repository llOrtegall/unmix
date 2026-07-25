import pytest

from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.model import (
    SeparationTask,
    Stage,
    StemName,
    is_silent,
    overall_progress,
)


@pytest.mark.parametrize(
    ("stage", "fraction", "expected"),
    [
        (Stage.DOWNLOADING, 0, 0),
        (Stage.NORMALIZING, 0, 5),
        (Stage.SEPARATING, 0.5, 50),
        (Stage.UPLOADING, 1, 100),
        (Stage.SEPARATING, 2.0, 90),  # clamped
    ],
)
def test_overall_progress(stage: Stage, fraction: float, expected: int) -> None:
    assert overall_progress(stage, fraction) == expected


def test_silence_threshold() -> None:
    assert is_silent(-27.7)
    assert not is_silent(-13.2)


def test_stem_key_uses_prefix_without_double_slash() -> None:
    task = SeparationTask("j", "t", "in.mp3", "tracks/t/stems/", "htdemucs_6s")
    assert task.stem_key(StemName.VOCALS) == "tracks/t/stems/vocals.flac"


def test_only_transient_failures_are_retryable() -> None:
    assert not SeparationFailure(FailureCode.DURATION_EXCEEDED, "").retryable
    assert not SeparationFailure(FailureCode.INVALID_MEDIA, "").retryable
    assert SeparationFailure(FailureCode.SEPARATION_ERROR, "").retryable
