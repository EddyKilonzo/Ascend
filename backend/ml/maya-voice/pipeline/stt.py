from __future__ import annotations

"""Speech-to-Text using Faster Whisper (CTranslate2). Falls back gracefully."""

import io
import tempfile
import os
from typing import Optional

import numpy as np

from config import settings

_model: Optional[object] = None
_STT_AVAILABLE = False

try:
    from faster_whisper import WhisperModel
    _STT_AVAILABLE = True
except ImportError:
    pass


def _load_model() -> Optional[object]:
    global _model
    if _model is None and _STT_AVAILABLE:
        _model = WhisperModel(
            settings.WHISPER_MODEL,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )
    return _model


def transcribe(pcm_bytes: bytes, sample_rate: int = 16000) -> TranscriptionResult:
    """
    Transcribe raw 16-bit PCM audio bytes to text.
    Returns TranscriptionResult with text, language, confidence.
    """
    model = _load_model()
    if model is None:
        return TranscriptionResult(text="", language="en", confidence=0.0, fallback=True)

    if len(pcm_bytes) == 0:
        return TranscriptionResult(text="", language="en", confidence=0.0, fallback=False)

    # Faster Whisper expects float32 numpy array
    audio_np = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    segments, info = model.transcribe(
        audio_np,
        language=settings.WHISPER_LANGUAGE or None,
        beam_size=5,
        vad_filter=False,  # We run VAD separately
        word_timestamps=False,
    )

    text_parts = [s.text for s in segments]
    text = " ".join(text_parts).strip()

    return TranscriptionResult(
        text=text,
        language=info.language,
        confidence=info.language_probability,
        fallback=False,
    )


class TranscriptionResult:
    def __init__(
        self,
        text: str,
        language: str,
        confidence: float,
        fallback: bool = False,
    ) -> None:
        self.text = text
        self.language = language
        self.confidence = confidence
        self.fallback = fallback  # True if STT model was unavailable

    def to_dict(self) -> dict:
        return {
            "text": self.text,
            "language": self.language,
            "confidence": round(self.confidence, 3),
            "fallback": self.fallback,
        }
