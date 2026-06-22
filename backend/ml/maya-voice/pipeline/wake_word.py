from __future__ import annotations

"""
OpenWakeWord detector.
Used client-side or as a server-side pre-filter for streaming audio.
"""

import numpy as np
from typing import Optional

from config import settings

_model: Optional[object] = None
_OWW_AVAILABLE = False

try:
    import openwakeword
    from openwakeword.model import Model as OWWModel
    _OWW_AVAILABLE = True
except ImportError:
    pass


class WakeWordDetector:
    def __init__(self) -> None:
        self._model: Optional[OWWModel] = None

    def load(self) -> None:
        if not _OWW_AVAILABLE:
            return
        try:
            self._model = OWWModel(
                wakeword_models=settings.WAKE_WORDS,
                inference_framework="onnx",
                enable_speex_noise_suppression=False,
            )
        except Exception:
            self._model = None

    def detect(self, pcm_chunk: bytes) -> DetectionResult:
        """
        Process one audio chunk (PCM int16, 80ms @ 16kHz = 1280 samples).
        Returns DetectionResult with detected word and confidence.
        """
        if self._model is None:
            return DetectionResult(detected=False, word=None, confidence=0.0)

        audio = np.frombuffer(pcm_chunk, dtype=np.int16)
        predictions = self._model.predict(audio)

        for word in settings.WAKE_WORDS:
            word_key = word.lower().replace(" ", "_")
            confidence = predictions.get(word_key, 0.0)
            if confidence >= settings.WAKE_WORD_THRESHOLD:
                return DetectionResult(detected=True, word=word, confidence=float(confidence))

        return DetectionResult(detected=False, word=None, confidence=0.0)

    def reset(self) -> None:
        if self._model:
            self._model.reset()


class DetectionResult:
    def __init__(self, detected: bool, word: Optional[str], confidence: float) -> None:
        self.detected = detected
        self.word = word
        self.confidence = confidence


# Singleton — loaded once at startup
detector = WakeWordDetector()
