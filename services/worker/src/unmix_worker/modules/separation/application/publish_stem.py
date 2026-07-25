from collections.abc import Callable
from dataclasses import dataclass

from ..domain.content_type import ContentType
from ..domain.preview_repository import PreviewRepository
from ..domain.separated_stem import SeparatedStem
from ..domain.separation_task import SeparationTask
from ..domain.stem import Stem
from ..domain.storage_repository import StorageRepository
from ..domain.transcriber_repository import TranscriberRepository


@dataclass(frozen=True, slots=True)
class PublishStemInput:
    task: SeparationTask
    stem: SeparatedStem


type PublishStem = Callable[[PublishStemInput], Stem]


def publish_stem(
    *,
    storage_repository: StorageRepository,
    preview_repository: PreviewRepository,
    transcriber_repository: TranscriberRepository,
) -> PublishStem:
    def execute(command: PublishStemInput) -> Stem:
        task, separated = command.task, command.stem
        key, preview_key = task.stem_key(separated.name), task.preview_key(separated.name)
        peaks_key, midi_key = task.peaks_key(separated.name), task.midi_key(separated.name)

        preview = preview_repository.encode(separated.path)
        midi = (
            transcriber_repository.transcribe(separated.path)
            if separated.should_be_transcribed()
            else None
        )
        if midi is not None:
            storage_repository.upload(midi, midi_key, ContentType.MIDI)
        size = storage_repository.upload(separated.path, key, ContentType.FLAC)
        storage_repository.upload(preview, preview_key, ContentType.MP3)
        storage_repository.upload_peaks(separated.peaks, peaks_key)

        return Stem.create(
            name=separated.name,
            key=key,
            size=size,
            loudness=separated.loudness,
            preview_key=preview_key,
            peaks_key=peaks_key,
            midi_key=midi_key if midi is not None else None,
        )

    return execute
