import json
from collections.abc import Iterator
from pathlib import Path
from typing import TYPE_CHECKING

import pytest
from faker import Faker
from testcontainers.core.container import DockerContainer
from testcontainers.core.wait_strategies import HttpWaitStrategy

from unmix_worker.modules.separation.domain.content_type import ContentType
from unmix_worker.modules.separation.domain.errors import InputNotFoundError
from unmix_worker.modules.separation.domain.object_key import ObjectKey
from unmix_worker.modules.separation.domain.waveform_peaks import WaveformPeaks
from unmix_worker.modules.separation.infrastructure.s3_client import create_s3_client
from unmix_worker.modules.separation.infrastructure.s3_storage_repository import (
    S3StorageRepository,
)

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client

_IMAGE = "chrislusf/seaweedfs:4.50"
_S3_PORT = 8333
_faker = Faker()


@pytest.fixture(scope="module")
def client() -> Iterator["S3Client"]:
    container = (
        DockerContainer(_IMAGE)
        .with_command(f"server -dir=/data -ip.bind=0.0.0.0 -s3 -s3.port={_S3_PORT}")
        .with_exposed_ports(_S3_PORT)
        .waiting_for(HttpWaitStrategy(_S3_PORT, "/healthz"))
    )
    with container:
        host, port = container.get_container_host_ip(), container.get_exposed_port(_S3_PORT)
        yield create_s3_client(
            endpoint=f"http://{host}:{port}",
            region="us-east-1",
            access_key="test",
            secret_key="test",
        )


@pytest.fixture
def bucket(client: "S3Client") -> str:
    name = f"unmix-{_faker.pystr(min_chars=8, max_chars=8).lower()}"
    client.create_bucket(Bucket=name)
    return name


def _key(name: str) -> ObjectKey:
    return ObjectKey.create(f"tracks/{_faker.uuid4()}/{name}")


class TestBasicBehaviour:
    def test_uploads_a_file_with_its_content_type_and_reports_its_size(
        self, client: "S3Client", bucket: str, tmp_path: Path
    ) -> None:
        source = tmp_path / "vocals.flac"
        source.write_bytes(b"fLaC" + _faker.binary(length=2048))
        key = _key("stems/vocals.flac")

        size = S3StorageRepository(client, bucket).upload(source, key, ContentType.FLAC)

        stored = client.head_object(Bucket=bucket, Key=key.to_primitive())
        assert size.to_primitive() == source.stat().st_size == stored["ContentLength"]
        assert stored["ContentType"] == "audio/flac"

    def test_downloads_the_input_next_to_the_work_files(
        self, client: "S3Client", bucket: str, tmp_path: Path
    ) -> None:
        key = _key("original.mp3")
        content = _faker.binary(length=1024)
        client.put_object(Bucket=bucket, Key=key.to_primitive(), Body=content)

        downloaded = S3StorageRepository(client, bucket).download(key, tmp_path)

        assert downloaded == tmp_path / "source.mp3"
        assert downloaded.read_bytes() == content

    def test_stores_the_peaks_as_a_versioned_json_document(
        self, client: "S3Client", bucket: str
    ) -> None:
        key = _key("stems/bass.peaks.json")

        S3StorageRepository(client, bucket).upload_peaks(WaveformPeaks.create([0.0, 0.5, 1.0]), key)

        stored = client.get_object(Bucket=bucket, Key=key.to_primitive())
        assert stored["ContentType"] == "application/json"
        assert json.loads(stored["Body"].read()) == {"version": 1, "peaks": [0.0, 0.5, 1.0]}


class TestErrorScenarios:
    def test_reports_a_missing_input_as_not_found(
        self, client: "S3Client", bucket: str, tmp_path: Path
    ) -> None:
        with pytest.raises(InputNotFoundError):
            S3StorageRepository(client, bucket).download(_key("original.wav"), tmp_path)
