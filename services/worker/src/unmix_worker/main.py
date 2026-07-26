import asyncio
import logging
import signal
from functools import partial

from bullmq import Worker

from unmix_worker.config import Settings
from unmix_worker.consumers.separation_consumer import SeparationConsumer
from unmix_worker.contracts import SEPARATION_QUEUE
from unmix_worker.modules.separation.application.factory import separation_module
from unmix_worker.modules.separation.infrastructure.basic_pitch_transcriber_repository import (
    BasicPitchTranscriberRepository,
)
from unmix_worker.modules.separation.infrastructure.demucs_separator_repository import (
    DemucsSeparatorRepository,
)
from unmix_worker.modules.separation.infrastructure.s3_client import create_s3_client

log = logging.getLogger("unmix_worker")


async def run() -> None:
    settings = Settings()
    logging.basicConfig(
        level=settings.log_level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    separator = DemucsSeparatorRepository(threads=settings.torch_threads or None)
    log.info("loading model %s", settings.demucs_model)
    separator.preload(settings.demucs_model)
    transcriber = BasicPitchTranscriberRepository()
    transcriber.preload()

    build_module = partial(
        separation_module,
        s3_client=create_s3_client(
            endpoint=settings.s3_endpoint,
            region=settings.s3_region,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
        ),
        bucket=settings.s3_bucket,
        separator_repository=separator,
        transcriber_repository=transcriber,
        max_duration_seconds=settings.max_duration_seconds,
    )
    worker = Worker(
        SEPARATION_QUEUE,
        SeparationConsumer(build_module),
        {
            "connection": settings.redis_url,
            # One CPU-heavy job at a time per process; scale with more containers.
            "concurrency": 1,
            "lockDuration": 60_000,
            # A crashed worker leaves its job stalled; requeue it twice before failing it,
            # so one bad restart does not cost the user the song.
            "maxStalledCount": 2,
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
