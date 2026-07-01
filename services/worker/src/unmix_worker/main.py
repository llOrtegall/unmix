"""Composition root (ADR 0015): read config, wire adapters, start the queue consumer."""

import asyncio
import logging
import os
import signal

from bullmq import Worker

from unmix_worker.adapters.bullmq_consumer import SeparationJobProcessor
from unmix_worker.adapters.demucs_separator import DemucsSeparator
from unmix_worker.adapters.ffmpeg_normalizer import FfmpegNormalizer
from unmix_worker.adapters.s3_storage import S3Storage
from unmix_worker.application.separate_track import SeparateTrack
from unmix_worker.contracts import SEPARATION_QUEUE

log = logging.getLogger("unmix_worker")


def env(name: str, default: str | None = None) -> str:
    value = os.environ.get(name, default)
    if value is None:
        raise RuntimeError(f"Missing environment variable {name}")
    return value


async def run() -> None:
    logging.basicConfig(
        level=env("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    separator = DemucsSeparator(threads=int(env("TORCH_THREADS", "0")) or None)
    model = env("DEMUCS_MODEL", "htdemucs_6s")
    log.info("loading model %s", model)
    separator.preload(model)

    use_case = SeparateTrack(
        storage=S3Storage(
            endpoint=env("S3_ENDPOINT"),
            region=env("S3_REGION", "us-east-1"),
            access_key=env("S3_ACCESS_KEY"),
            secret_key=env("S3_SECRET_KEY"),
            bucket=env("S3_BUCKET"),
        ),
        normalizer=FfmpegNormalizer(),
        separator=separator,
        max_duration_seconds=float(env("MAX_DURATION_SECONDS", "600")),
    )

    worker = Worker(
        SEPARATION_QUEUE,
        SeparationJobProcessor(use_case),
        {
            "connection": env("REDIS_URL"),
            # One CPU-heavy job at a time per process; scale with more containers.
            "concurrency": 1,
            "lockDuration": 60_000,
        },
    )
    log.info("worker listening on queue %s", SEPARATION_QUEUE)

    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    await stop.wait()

    log.info("shutting down")
    await worker.close()


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
