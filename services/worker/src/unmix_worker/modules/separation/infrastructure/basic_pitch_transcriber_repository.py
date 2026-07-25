"""Audio-to-MIDI with Spotify's Basic Pitch, through its bundled ONNX model (no TensorFlow)."""

import logging
import tempfile
import warnings
from pathlib import Path
from typing import Any

import numpy as np
import soundfile

log = logging.getLogger(__name__)

_MIDI_SUFFIX = ".mid"
_WARM_UP_RATE = 22050
_WARM_UP_SECONDS = 2
_WARM_UP_HZ = 440


class BasicPitchTranscriberRepository:
    def __init__(self) -> None:
        self._model: Any = None

    def preload(self) -> None:
        # Imported lazily: loading basic_pitch pulls in librosa and numba. On import it
        # warns about every backend it cannot find (TF, TFLite, CoreML); ONNX is the one used.
        # resampy also warns that pkg_resources is deprecated.
        logging.disable(logging.WARNING)
        try:
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message="pkg_resources is deprecated")
                from basic_pitch import ICASSP_2022_MODEL_PATH
                from basic_pitch.inference import Model
        finally:
            logging.disable(logging.NOTSET)

        import onnxruntime

        onnxruntime.disable_telemetry_events()
        self._model = Model(ICASSP_2022_MODEL_PATH)
        self._warm_up()

    def _warm_up(self) -> None:
        """librosa's numba functions compile on first use (~10 s): pay that at startup."""
        with tempfile.TemporaryDirectory() as tmp:
            tone = Path(tmp) / "a440.wav"
            t = np.arange(_WARM_UP_RATE * _WARM_UP_SECONDS) / _WARM_UP_RATE
            soundfile.write(tone, 0.5 * np.sin(2 * np.pi * _WARM_UP_HZ * t), _WARM_UP_RATE)
            self.transcribe(tone)

    def transcribe(self, stem: Path) -> Path | None:
        from basic_pitch.inference import predict

        if self._model is None:
            self.preload()
        try:
            # ONNX Runtime sessions are safe to share across the per-stem threads.
            _, midi, notes = predict(str(stem), self._model)
        except Exception:
            # MIDI is optional (ADR 0027): the stem ships without it.
            log.exception("transcription failed for %s", stem.name)
            return None
        if not notes:
            return None
        destination = stem.with_suffix(_MIDI_SUFFIX)
        midi.write(str(destination))
        return destination
