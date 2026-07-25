from unmix_worker.modules.shared.domain.domain_error import NotFoundError, ValidationError


class InvalidJobIdError(ValidationError):
    code = "separation.invalid_job_id"

    def __init__(self, value: str) -> None:
        super().__init__(f'"{value}" is not a valid job id')


class InvalidTrackIdError(ValidationError):
    code = "separation.invalid_track_id"

    def __init__(self, value: str) -> None:
        super().__init__(f'"{value}" is not a valid track id')


class InvalidObjectKeyError(ValidationError):
    code = "separation.invalid_object_key"

    def __init__(self, value: str) -> None:
        super().__init__(f'"{value}" is not a valid object key')


class InvalidModelError(ValidationError):
    code = "separation.invalid_model"

    def __init__(self, value: str) -> None:
        super().__init__(f'"{value}" is not a supported separation model')


class InvalidStemNameError(ValidationError):
    code = "separation.invalid_stem_name"

    def __init__(self, value: str) -> None:
        super().__init__(f'"{value}" is not a known stem')


class DuplicatedStemError(ValidationError):
    code = "separation.duplicated_stem"

    def __init__(self, name: str) -> None:
        super().__init__(f"The {name} stem appears more than once")


class NoStemsError(ValidationError):
    code = "separation.no_stems"

    def __init__(self) -> None:
        super().__init__("The separation produced no stems")


class InvalidLoudnessError(ValidationError):
    code = "separation.invalid_loudness"

    def __init__(self, value: float) -> None:
        super().__init__(f"{value} dB is not a valid relative loudness")


class InvalidPeaksError(ValidationError):
    code = "separation.invalid_peaks"

    def __init__(self, reason: str) -> None:
        super().__init__(f"Invalid waveform peaks: {reason}")


class InvalidFileSizeError(ValidationError):
    code = "separation.invalid_file_size"

    def __init__(self, value: int) -> None:
        super().__init__(f"{value} bytes is not a valid file size")


class InvalidProgressError(ValidationError):
    code = "separation.invalid_progress"

    def __init__(self, stage: str, percent: int) -> None:
        super().__init__(f"{percent} % is outside the {stage} stage")


class InvalidMediaError(ValidationError):
    code = "separation.invalid_media"

    def __init__(self, reason: str) -> None:
        super().__init__(reason)


class DurationExceededError(ValidationError):
    code = "separation.duration_exceeded"

    def __init__(self, seconds: float, limit_seconds: float) -> None:
        super().__init__(f"Track lasts {seconds:.0f} s; the limit is {limit_seconds:.0f} s.")


class InputNotFoundError(NotFoundError):
    code = "separation.input_not_found"

    def __init__(self, key: str) -> None:
        super().__init__(f"Missing {key}.")
