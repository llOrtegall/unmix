from enum import StrEnum


class Stage(StrEnum):
    DOWNLOADING = "downloading"
    NORMALIZING = "normalizing"
    SEPARATING = "separating"
    UPLOADING = "uploading"

    def to_primitive(self) -> str:
        return self.value
