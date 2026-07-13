import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from unmix_worker.application.ports import (
    MediaNormalizer,
    ObjectStorage,
    PreviewEncoder,
    ProgressReporter,
    SeparatedStem,
    StemSeparator,
    Transcriber,
)
from unmix_worker.domain.errors import FailureCode, SeparationFailure
from unmix_worker.domain.model import (
    SeparationOutcome,
    SeparationTask,
    Stage,
    Stem,
    is_silent,
    overall_progress,
    should_transcribe,
)
from unmix_worker.domain.result import Err, Ok, Result


class SeparateTrack:
    """Download a track, normalize it, split it into stems and upload them."""

    def __init__(
        self,
        storage: ObjectStorage,
        normalizer: MediaNormalizer,
        separator: StemSeparator,
        previews: PreviewEncoder,
        transcriber: Transcriber,
        max_duration_seconds: float,
    ) -> None:
        self._storage = storage
        self._normalizer = normalizer
        self._separator = separator
        self._previews = previews
        self._transcriber = transcriber
        self._max_duration = max_duration_seconds

    def execute(
        self, task: SeparationTask, progress: ProgressReporter, workdir: Path
    ) -> Result[SeparationOutcome, SeparationFailure]:
        def step(stage: Stage, fraction: float) -> None:
            progress.report(stage, overall_progress(stage, fraction))

        step(Stage.DOWNLOADING, 0)
        source = workdir / f"source{Path(task.input_key).suffix}"
        match self._storage.download(task.input_key, source):
            case Err() as err:
                return err

        step(Stage.NORMALIZING, 0)
        match self._normalizer.normalize(source, workdir / "mix.wav"):
            case Err() as err:
                return err
            case Ok(audio):
                pass

        if audio.duration_seconds > self._max_duration:
            return Err(
                SeparationFailure(
                    FailureCode.DURATION_EXCEEDED,
                    f"Track lasts {audio.duration_seconds:.0f} s; "
                    f"the limit is {self._max_duration:.0f} s.",
                )
            )

        step(Stage.SEPARATING, 0)
        separated = self._separator.separate(
            audio.path,
            workdir / "stems",
            task.model,
            lambda fraction: step(Stage.SEPARATING, fraction),
        )
        if not separated:
            return Err(SeparationFailure(FailureCode.SEPARATION_ERROR, "No stems produced."))

        # Encoding, transcription and uploads release the GIL: one thread per stem.
        step(Stage.UPLOADING, 0)
        with ThreadPoolExecutor(max_workers=len(separated)) as pool:
            futures = [pool.submit(self._publish, task, item) for item in separated]
            for done, _ in enumerate(as_completed(futures), start=1):
                step(Stage.UPLOADING, done / len(separated))
            stems = tuple(f.result() for f in futures)

        return Ok(SeparationOutcome(task.job_id, task.track_id, audio.duration_seconds, stems))

    def _publish(self, task: SeparationTask, item: SeparatedStem) -> Stem:
        """Encode the preview, transcribe to MIDI and upload everything for one stem."""
        silent = is_silent(item.relative_db)
        preview = item.path.with_suffix(".preview.mp3")
        self._previews.encode(item.path, preview)

        # MIDI is a bonus: a stem that cannot be transcribed still ships without it.
        midi_key = None
        midi = item.path.with_suffix(".mid")
        if should_transcribe(item.name, silent) and self._transcriber.transcribe(item.path, midi):
            midi_key = task.midi_key(item.name)
            self._storage.upload(midi, midi_key, "audio/midi")

        key = task.stem_key(item.name)
        size = self._storage.upload(item.path, key, "audio/flac")
        self._storage.upload(preview, task.preview_key(item.name), "audio/mpeg")
        peaks = json.dumps({"version": 1, "peaks": item.peaks}, separators=(",", ":"))
        self._storage.put_bytes(peaks.encode(), task.peaks_key(item.name), "application/json")
        return Stem(
            item.name,
            key,
            size,
            silent,
            task.preview_key(item.name),
            task.peaks_key(item.name),
            midi_key,
        )
