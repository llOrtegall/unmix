"""Audio-to-MIDI with Spotify's Basic Pitch, through its bundled ONNX model (no TensorFlow)."""

import logging
import tempfile
import warnings
from pathlib import Path

import numpy as np
import soundfile

log = logging.getLogger(__name__)


class BasicPitchTranscriber:
    def __init__(self) -> None:
        self._model = None

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
            t = np.arange(22050 * 2) / 22050
            soundfile.write(tone, 0.5 * np.sin(2 * np.pi * 440 * t), 22050)
            self.transcribe(tone, Path(tmp) / "a440.mid")

    def transcribe(self, src: Path, dest: Path) -> bool:
        from basic_pitch.inference import predict

        if self._model is None:
            self.preload()
        try:
            # ONNX Runtime sessions are safe to share across the per-stem threads.
            _, midi, notes = predict(str(src), self._model)
        except Exception:
            log.exception("transcription failed for %s", src.name)
            return False
        if not notes:
            return False
        midi.write(str(dest))
        return True
