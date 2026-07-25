import threading
import types
from collections.abc import Iterable, Iterator
from pathlib import Path
from typing import cast

import demucs.apply
import numpy as np
import soundfile as sf
import torch
from demucs.apply import BagOfModels, apply_model
from demucs.pretrained import get_model
from demucs.repo import AnyModel

from ..domain.model_name import ModelName
from ..domain.normalized_audio import NormalizedAudio
from ..domain.progress import Progress
from ..domain.progress_repository import ProgressRepository
from ..domain.relative_loudness import RelativeLoudness
from ..domain.separated_stem import SeparatedStem
from ..domain.separated_stem_list import SeparatedStemList
from ..domain.stage import Stage
from ..domain.stem_name import StemName
from ..domain.waveform_peaks import WaveformPeaks

# Enough points for a full-width waveform without a heavy JSON (about 6 KB).
PEAK_BUCKETS = 1000
_STEMS_DIRECTORY = "stems"


class DemucsSeparatorRepository:
    """Demucs on CPU. Audio I/O goes through soundfile, not torchaudio (see spike notes)."""

    def __init__(self, threads: int | None = None) -> None:
        if threads:
            torch.set_num_threads(threads)
        self._models: dict[ModelName, AnyModel] = {}
        # demucs reports progress through a module-level tqdm; patching it is not thread-safe.
        self._lock = threading.Lock()

    def preload(self, model: ModelName) -> None:
        self._model(model)

    def separate(
        self,
        audio: NormalizedAudio,
        model: ModelName,
        directory: Path,
        progress: ProgressRepository,
    ) -> SeparatedStemList:
        net = self._model(model)
        data, _ = sf.read(audio.path, dtype="float32", always_2d=True)
        mix = torch.from_numpy(data.T.copy())

        ref = mix.mean(0)
        mean, std = ref.mean(), ref.std()
        normalized = (mix - mean) / std

        with self._lock, _ProgressHook(net, progress):
            sources = apply_model(
                net, normalized[None], device="cpu", split=True, overlap=0.25, progress=True
            )[0]
        sources = sources * std + mean

        out_dir = directory / _STEMS_DIRECTORY
        out_dir.mkdir(parents=True, exist_ok=True)
        mix_db = _rms_db(mix.numpy())
        # Model attributes go through nn.Module.__getattr__, which mypy cannot see through.
        names, samplerate = cast(list[str], net.sources), cast(int, net.samplerate)
        stems = SeparatedStemList.create(
            self._write(name, source, out_dir, samplerate, mix_db)
            for name, source in zip(names, sources, strict=True)
        )
        progress.report(Progress.at(Stage.SEPARATING, 1.0))
        return stems

    def _model(self, name: ModelName) -> AnyModel:
        if name not in self._models:
            net = get_model(name.value)
            net.eval()
            self._models[name] = net
        return self._models[name]

    @staticmethod
    def _write(
        name: str, source: torch.Tensor, out_dir: Path, samplerate: int, mix_db: float
    ) -> SeparatedStem:
        samples = source.numpy().T.clip(-1.0, 1.0)
        path = out_dir / f"{name}.flac"
        sf.write(path, samples, samplerate, format="FLAC", subtype="PCM_16")
        return SeparatedStem.create(
            name=StemName.from_primitive(name),
            path=path,
            loudness=RelativeLoudness.create(_rms_db(samples) - mix_db),
            peaks=WaveformPeaks.create(_peaks(samples)),
        )


class _ProgressHook:
    """Swaps demucs' tqdm for a wrapper that reports separation progress."""

    def __init__(self, net: AnyModel, progress: ProgressRepository) -> None:
        self._progress = progress
        self._models = len(net.models) if isinstance(net, BagOfModels) else 1
        self._done = 0

    def __enter__(self) -> None:
        self._original = demucs.apply.tqdm  # type: ignore[attr-defined]
        demucs.apply.tqdm = types.SimpleNamespace(tqdm=self._wrap)  # type: ignore[attr-defined]

    def __exit__(self, *exc: object) -> None:
        demucs.apply.tqdm = self._original  # type: ignore[attr-defined]

    def _wrap[T](self, iterable: Iterable[T], **_: object) -> Iterator[T]:
        items = list(iterable)
        for i, item in enumerate(items, start=1):
            yield item
            fraction = (self._done + i / len(items)) / self._models
            self._progress.report(Progress.at(Stage.SEPARATING, fraction))
        self._done += 1


def _peaks(samples: np.ndarray, buckets: int = PEAK_BUCKETS) -> list[float]:
    """Max absolute amplitude per bucket (mono), rounded to keep the JSON small."""
    mono = np.abs(samples).max(axis=1)
    usable = len(mono) - len(mono) % buckets
    if usable == 0:
        return [0.0] * buckets
    return [round(float(v), 3) for v in mono[:usable].reshape(buckets, -1).max(axis=1)]


def _rms_db(samples: np.ndarray) -> float:
    return float(20 * np.log10(np.sqrt(np.mean(np.square(samples))) + 1e-12))
