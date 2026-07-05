from dataclasses import dataclass
from enum import StrEnum

# A stem whose energy sits this far below the mix is reported as silent
# (e.g. the piano stem of a song without piano measured -27.7 dB in the spike).
SILENCE_THRESHOLD_DB = -24.0


class StemName(StrEnum):
    VOCALS = "vocals"
    DRUMS = "drums"
    BASS = "bass"
    GUITAR = "guitar"
    PIANO = "piano"
    OTHER = "other"


class Stage(StrEnum):
    DOWNLOADING = "downloading"
    NORMALIZING = "normalizing"
    SEPARATING = "separating"
    UPLOADING = "uploading"


# Share of the overall progress bar owned by each stage, as (start, end) percent.
_STAGE_RANGES: dict[Stage, tuple[int, int]] = {
    Stage.DOWNLOADING: (0, 5),
    Stage.NORMALIZING: (5, 10),
    Stage.SEPARATING: (10, 90),
    Stage.UPLOADING: (90, 100),
}


def overall_progress(stage: Stage, fraction: float) -> int:
    """Map progress inside a stage (0..1) to overall job progress (0..100)."""
    start, end = _STAGE_RANGES[stage]
    fraction = min(max(fraction, 0.0), 1.0)
    return round(start + (end - start) * fraction)


@dataclass(frozen=True, slots=True)
class SeparationTask:
    job_id: str
    track_id: str
    input_key: str
    output_prefix: str
    model: str

    def stem_key(self, name: StemName) -> str:
        return f"{self._prefix}/{name}.flac"

    def preview_key(self, name: StemName) -> str:
        return f"{self._prefix}/{name}.preview.mp3"

    def peaks_key(self, name: StemName) -> str:
        return f"{self._prefix}/{name}.peaks.json"

    @property
    def _prefix(self) -> str:
        return self.output_prefix.rstrip("/")


@dataclass(frozen=True, slots=True)
class Stem:
    name: StemName
    key: str
    size_bytes: int
    silent: bool
    preview_key: str
    peaks_key: str


def is_silent(relative_db: float) -> bool:
    """`relative_db`: stem RMS minus mix RMS, in dB."""
    return relative_db < SILENCE_THRESHOLD_DB


@dataclass(frozen=True, slots=True)
class SeparationOutcome:
    job_id: str
    track_id: str
    duration_seconds: float
    stems: tuple[Stem, ...]
