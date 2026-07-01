import threading
import types
from collections.abc import Callable, Iterable
from pathlib import Path

import demucs.apply
import numpy as np
import soundfile as sf
import torch
from demucs.apply import BagOfModels, apply_model
from demucs.pretrained import get_model

from unmix_worker.application.ports import SeparatedStem
from unmix_worker.domain.model import StemName


class DemucsSeparator:
    """Demucs on CPU. Audio I/O goes through soundfile, not torchaudio (see spike notes)."""

    def __init__(self, threads: int | None = None) -> None:
        if threads:
            torch.set_num_threads(threads)
        self._models: dict[str, torch.nn.Module] = {}
        # demucs reports progress through a module-level tqdm; patching it is not thread-safe.
        self._lock = threading.Lock()

    def preload(self, model: str) -> None:
        self._model(model)

    def separate(
        self,
        audio: Path,
        out_dir: Path,
        model: str,
        on_progress: Callable[[float], None],
    ) -> list[SeparatedStem]:
        net = self._model(model)
        data, _ = sf.read(audio, dtype="float32", always_2d=True)
        mix = torch.from_numpy(data.T.copy())

        ref = mix.mean(0)
        mean, std = ref.mean(), ref.std()
        normalized = (mix - mean) / std

        with self._lock, _progress_hook(net, on_progress):
            sources = apply_model(net, normalized[None], device="cpu", split=True,
                                  overlap=0.25, progress=True)[0]
        sources = sources * std + mean

        out_dir.mkdir(parents=True, exist_ok=True)
        mix_db = _rms_db(mix.numpy())
        stems: list[SeparatedStem] = []
        for name, source in zip(net.sources, sources, strict=True):
            samples = source.numpy().T.clip(-1.0, 1.0)
            path = out_dir / f"{name}.flac"
            sf.write(path, samples, net.samplerate, format="FLAC", subtype="PCM_16")
            stems.append(SeparatedStem(StemName(name), path, _rms_db(samples) - mix_db))
        on_progress(1.0)
        return stems

    def _model(self, name: str) -> torch.nn.Module:
        if name not in self._models:
            net = get_model(name)
            net.eval()
            self._models[name] = net
        return self._models[name]


class _progress_hook:
    """Swap demucs' tqdm for a wrapper that reports overall progress (0..1)."""

    def __init__(self, net: torch.nn.Module, on_progress: Callable[[float], None]) -> None:
        self._on_progress = on_progress
        self._models = len(net.models) if isinstance(net, BagOfModels) else 1
        self._done = 0

    def __enter__(self) -> None:
        self._original = demucs.apply.tqdm
        demucs.apply.tqdm = types.SimpleNamespace(tqdm=self._wrap)

    def __exit__(self, *exc: object) -> None:
        demucs.apply.tqdm = self._original

    def _wrap(self, iterable: Iterable, **_: object):
        items = list(iterable)
        for i, item in enumerate(items, start=1):
            yield item
            self._on_progress((self._done + i / len(items)) / self._models)
        self._done += 1


def _rms_db(samples: np.ndarray) -> float:
    return float(20 * np.log10(np.sqrt(np.mean(np.square(samples))) + 1e-12))
