from enum import StrEnum


class ContentType(StrEnum):
    FLAC = "audio/flac"
    MP3 = "audio/mpeg"
    MIDI = "audio/midi"

    def to_primitive(self) -> str:
        return self.value
