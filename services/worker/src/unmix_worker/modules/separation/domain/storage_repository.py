from pathlib import Path
from typing import Protocol

from .content_type import ContentType
from .file_size import FileSize
from .object_key import ObjectKey
from .waveform_peaks import WaveformPeaks


class StorageRepository(Protocol):
    def download(self, key: ObjectKey, directory: Path) -> Path: ...

    def upload(self, source: Path, key: ObjectKey, content_type: ContentType) -> FileSize: ...

    def upload_peaks(self, peaks: WaveformPeaks, key: ObjectKey) -> None: ...
