from dataclasses import dataclass
from typing import Self, TypedDict

from .errors import InvalidProgressError
from .stage import Stage

# Share of the overall progress bar owned by each stage, as (start, end) percent.
_PERCENT_RANGES: dict[Stage, tuple[int, int]] = {
    Stage.DOWNLOADING: (0, 5),
    Stage.NORMALIZING: (5, 10),
    Stage.SEPARATING: (10, 90),
    Stage.UPLOADING: (90, 100),
}
_COMPLETE = 100


class ProgressPrimitive(TypedDict):
    stage: str
    progress: int


@dataclass(frozen=True, slots=True)
class Progress:
    stage: Stage
    percent: int

    def __post_init__(self) -> None:
        self._ensure_percent_is_within_stage()

    @classmethod
    def create(cls, stage: Stage, percent: int) -> Self:
        return cls(stage, percent)

    @classmethod
    def start(cls, stage: Stage) -> Self:
        return cls.at(stage, 0.0)

    @classmethod
    def at(cls, stage: Stage, fraction: float) -> Self:
        start, end = _PERCENT_RANGES[stage]
        clamped = min(max(fraction, 0.0), 1.0)
        return cls.create(stage, round(start + (end - start) * clamped))

    @classmethod
    def from_primitive(cls, data: ProgressPrimitive) -> Self:
        try:
            stage = Stage(data["stage"])
        except ValueError as error:
            raise InvalidProgressError(data["stage"], data["progress"]) from error
        return cls.create(stage, data["progress"])

    def _ensure_percent_is_within_stage(self) -> None:
        start, end = _PERCENT_RANGES[self.stage]
        if not start <= self.percent <= end:
            raise InvalidProgressError(self.stage.value, self.percent)

    def is_complete(self) -> bool:
        return self.percent == _COMPLETE

    def to_primitive(self) -> ProgressPrimitive:
        return {"stage": self.stage.to_primitive(), "progress": self.percent}
