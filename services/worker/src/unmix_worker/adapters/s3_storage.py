from pathlib import Path

import boto3
from botocore.exceptions import ClientError

from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.result import Err, Ok, Result


class S3Storage:
    def __init__(
        self, endpoint: str, region: str, access_key: str, secret_key: str, bucket: str
    ) -> None:
        self._bucket = bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    def download(self, key: str, dest: Path) -> Result[None, SeparationFailure]:
        try:
            self._client.download_file(self._bucket, key, str(dest))
        except ClientError as e:
            if e.response.get("Error", {}).get("Code") in {"404", "NoSuchKey"}:
                return Err(SeparationFailure(FailureCode.INPUT_NOT_FOUND, f"Missing {key}."))
            raise
        return Ok(None)

    def upload(self, src: Path, key: str, content_type: str) -> int:
        self._client.upload_file(
            str(src), self._bucket, key, ExtraArgs={"ContentType": content_type}
        )
        return src.stat().st_size
