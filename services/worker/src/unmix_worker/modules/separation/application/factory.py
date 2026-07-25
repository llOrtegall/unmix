import asyncio
from dataclasses import dataclass
from typing import TYPE_CHECKING

from bullmq import Job

from ..domain.audio_duration import AudioDuration
from ..domain.separator_repository import SeparatorRepository
from ..domain.transcriber_repository import TranscriberRepository
from ..infrastructure.bullmq_progress_repository import BullMqProgressRepository
from ..infrastructure.ffmpeg_media_repository import FfmpegMediaRepository
from ..infrastructure.ffmpeg_preview_repository import FfmpegPreviewRepository
from ..infrastructure.s3_storage_repository import S3StorageRepository
from .separate_track import SeparateTrack, separate_track

if TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client


@dataclass(frozen=True, slots=True)
class SeparationModule:
    separate_track: SeparateTrack


def separation_module(
    *,
    s3_client: "S3Client",
    bucket: str,
    separator_repository: SeparatorRepository,
    transcriber_repository: TranscriberRepository,
    max_duration_seconds: float,
    job: Job,
    loop: asyncio.AbstractEventLoop,
) -> SeparationModule:
    return SeparationModule(
        separate_track=separate_track(
            storage_repository=S3StorageRepository(s3_client, bucket),
            media_repository=FfmpegMediaRepository(),
            separator_repository=separator_repository,
            preview_repository=FfmpegPreviewRepository(),
            transcriber_repository=transcriber_repository,
            progress_repository=BullMqProgressRepository(job, loop),
            max_duration=AudioDuration.create(max_duration_seconds),
        )
    )
