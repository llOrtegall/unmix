from dataclasses import dataclass
from enum import StrEnum


class FailureCode(StrEnum):
    INVALID_MESSAGE = "INVALID_MESSAGE"
    INPUT_NOT_FOUND = "INPUT_NOT_FOUND"
    INVALID_MEDIA = "INVALID_MEDIA"
    DURATION_EXCEEDED = "DURATION_EXCEEDED"
    SEPARATION_ERROR = "SEPARATION_ERROR"
    STORAGE_ERROR = "STORAGE_ERROR"


# Business failures that a retry cannot fix.
_PERMANENT = {
    FailureCode.INVALID_MESSAGE,
    FailureCode.INPUT_NOT_FOUND,
    FailureCode.INVALID_MEDIA,
    FailureCode.DURATION_EXCEEDED,
}


@dataclass(frozen=True, slots=True)
class SeparationFailure:
    code: FailureCode
    message: str

    @property
    def retryable(self) -> bool:
        return self.code not in _PERMANENT
