import math

import pytest

from tests.modules.separation.helpers import normalized_audio_mother
from unmix_worker.modules.separation.domain.audio_duration import AudioDuration
from unmix_worker.modules.separation.domain.errors import (
    DurationExceededError,
    InvalidFileSizeError,
    InvalidLoudnessError,
    InvalidMediaError,
    InvalidPeaksError,
)
from unmix_worker.modules.separation.domain.file_size import FileSize
from unmix_worker.modules.separation.domain.normalized_audio import NormalizedAudio
from unmix_worker.modules.separation.domain.relative_loudness import RelativeLoudness
from unmix_worker.modules.separation.domain.waveform_peaks import WaveformPeaks


class TestRelativeLoudness:
    def test_is_silent_below_the_threshold(self) -> None:
        assert RelativeLoudness.create(-27.7).is_silent()
        assert not RelativeLoudness.create(-13.2).is_silent()

    def test_survives_a_primitive_round_trip(self) -> None:
        assert RelativeLoudness.from_primitive(-8.5).to_primitive() == -8.5

    @pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf])
    def test_rejects_values_that_are_not_finite(self, value: float) -> None:
        with pytest.raises(InvalidLoudnessError):
            RelativeLoudness.create(value)


class TestWaveformPeaks:
    def test_survives_a_primitive_round_trip(self) -> None:
        peaks = WaveformPeaks.from_primitive([0.0, 0.5, 1.0])

        assert peaks.to_primitive() == [0.0, 0.5, 1.0]
        assert peaks.count() == 3

    def test_rejects_empty_peaks(self) -> None:
        with pytest.raises(InvalidPeaksError):
            WaveformPeaks.create([])

    @pytest.mark.parametrize("value", [-0.1, 1.01])
    def test_rejects_values_outside_full_scale(self, value: float) -> None:
        with pytest.raises(InvalidPeaksError):
            WaveformPeaks.create([0.2, value])


class TestFileSize:
    def test_survives_a_primitive_round_trip(self) -> None:
        assert FileSize.from_primitive(0).to_primitive() == 0

    def test_rejects_a_negative_size(self) -> None:
        with pytest.raises(InvalidFileSizeError):
            FileSize.create(-1)


class TestAudioDuration:
    def test_survives_a_primitive_round_trip(self) -> None:
        assert AudioDuration.from_primitive(297.27).to_primitive() == 297.27

    def test_accepts_a_track_as_long_as_the_limit(self) -> None:
        AudioDuration.create(600).ensure_does_not_exceed(AudioDuration.create(600))

    def test_rejects_a_track_longer_than_the_limit(self) -> None:
        with pytest.raises(DurationExceededError, match="Track lasts 601 s; the limit is 600 s."):
            AudioDuration.create(601).ensure_does_not_exceed(AudioDuration.create(600))

    @pytest.mark.parametrize("seconds", [0, -3.5, math.nan])
    def test_treats_audio_without_duration_as_invalid_media(self, seconds: float) -> None:
        with pytest.raises(InvalidMediaError):
            AudioDuration.create(seconds)


class TestNormalizedAudio:
    def test_survives_a_primitive_round_trip(self) -> None:
        primitive = normalized_audio_mother.create_primitive()

        assert NormalizedAudio.from_primitive(primitive).to_primitive() == primitive
