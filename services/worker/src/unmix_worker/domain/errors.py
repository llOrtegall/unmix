from dataclasses import dataclass
from enum import StrEnum


class FailureCode(StrEnum):
    INVALID_MESSAGE = "separation.invalid_message"
    INPUT_NOT_FOUND = "separation.input_not_found"
    INVALID_MEDIA = "separation.invalid_media"
    DURATION_EXCEEDED = "separation.duration_exceeded"
    SEPARATION_ERROR = "separation.failed"


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
