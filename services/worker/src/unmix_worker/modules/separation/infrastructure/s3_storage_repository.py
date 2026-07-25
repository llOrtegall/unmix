import json
from pathlib import Path
from typing import TYPE_CHECKING

from botocore.exceptions import ClientError

from ..domain.content_type import ContentType
from ..domain.errors import InputNotFoundError
from ..domain.file_size import FileSize
from ..domain.object_key import ObjectKey
from ..domain.waveform_peaks import WaveformPeaks

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

_MISSING_OBJECT_CODES = {"404", "NoSuchKey"}
_PEAKS_FORMAT_VERSION = 1
_JSON = "application/json"


class S3StorageRepository:
    def __init__(self, client: "S3Client", bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    def download(self, key: ObjectKey, directory: Path) -> Path:
        destination = directory / f"source{key.suffix()}"
        try:
            self._client.download_file(self._bucket, key.to_primitive(), str(destination))
        except ClientError as error:
            if error.response.get("Error", {}).get("Code") in _MISSING_OBJECT_CODES:
                raise InputNotFoundError(key.to_primitive()) from error
            raise
        return destination

    def upload(self, source: Path, key: ObjectKey, content_type: ContentType) -> FileSize:
        self._client.upload_file(
            str(source),
            self._bucket,
            key.to_primitive(),
            ExtraArgs={"ContentType": content_type.to_primitive()},
        )
        return FileSize.create(source.stat().st_size)

    def upload_peaks(self, peaks: WaveformPeaks, key: ObjectKey) -> None:
        document = {"version": _PEAKS_FORMAT_VERSION, "peaks": peaks.to_primitive()}
        self._client.put_object(
            Bucket=self._bucket,
            Key=key.to_primitive(),
            Body=json.dumps(document, separators=(",", ":")).encode(),
            ContentType=_JSON,
        )
