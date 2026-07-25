from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from ..domain.audio_duration import AudioDuration
from ..domain.media_repository import MediaRepository
from ..domain.preview_repository import PreviewRepository
from ..domain.progress import Progress
from ..domain.progress_repository import ProgressRepository
from ..domain.separation_outcome import SeparationOutcome
from ..domain.separation_task import SeparationTask, SeparationTaskPrimitive
from ..domain.separator_repository import SeparatorRepository
from ..domain.stage import Stage
from ..domain.stem_list import StemList
from ..domain.storage_repository import StorageRepository
from ..domain.transcriber_repository import TranscriberRepository
from .publish_stem import PublishStemInput, publish_stem


@dataclass(frozen=True, slots=True)
class SeparateTrackInput:
    task: SeparationTaskPrimitive
    workdir: Path


type SeparateTrack = Callable[[SeparateTrackInput], SeparationOutcome]


def separate_track(
    *,
    storage_repository: StorageRepository,
    media_repository: MediaRepository,
    separator_repository: SeparatorRepository,
    preview_repository: PreviewRepository,
    transcriber_repository: TranscriberRepository,
    progress_repository: ProgressRepository,
    max_duration: AudioDuration,
) -> SeparateTrack:
    publish = publish_stem(
        storage_repository=storage_repository,
        preview_repository=preview_repository,
        transcriber_repository=transcriber_repository,
    )

    def execute(command: SeparateTrackInput) -> SeparationOutcome:
        task = SeparationTask.from_primitive(command.task)
        progress_repository.report(Progress.start(Stage.DOWNLOADING))
        source = storage_repository.download(task.input_key, command.workdir)

        progress_repository.report(Progress.start(Stage.NORMALIZING))
        audio = media_repository.normalize(source, command.workdir)
        audio.duration.ensure_does_not_exceed(max_duration)

        progress_repository.report(Progress.start(Stage.SEPARATING))
        separated = separator_repository.separate(
            audio, task.model, command.workdir, progress_repository
        )

        # Encoding, transcription and uploads release the GIL: one thread per stem.
        progress_repository.report(Progress.start(Stage.UPLOADING))
        with ThreadPoolExecutor(max_workers=separated.count()) as pool:
            futures = [pool.submit(publish, PublishStemInput(task, stem)) for stem in separated]
            for done, _ in enumerate(as_completed(futures), start=1):
                progress_repository.report(Progress.at(Stage.UPLOADING, done / len(futures)))

        return task.complete(audio.duration, StemList.create(future.result() for future in futures))

    return execute
