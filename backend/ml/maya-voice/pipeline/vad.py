from __future__ import annotations

"""Silero VAD wrapper — detects speech segments in PCM audio chunks."""

import io
import struct
from typing import Optional

import numpy as np

from config import settings

_model: Optional[object] = None
_VAD_AVAILABLE = False

try:
    from silero_vad import load_silero_vad, get_speech_timestamps
    _VAD_AVAILABLE = True
except ImportError:
    pass


def _load_model() -> Optional[object]:
    global _model
    if _model is None and _VAD_AVAILABLE:
        _model = load_silero_vad()
    return _model


def detect_speech(pcm_bytes: bytes, sample_rate: int = 16000) -> list[dict]:
    """
    Returns list of speech segments as {start, end} sample indices.
    Falls back to treating all audio as speech if VAD unavailable.
    """
    model = _load_model()
    if model is None:
        # Fallback: treat entire buffer as speech
        num_samples = len(pcm_bytes) // 2
        return [{"start": 0, "end": num_samples}]

    audio_np = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    timestamps = get_speech_timestamps(
        audio_np,
        model,
        threshold=settings.VAD_THRESHOLD,
        min_speech_duration_ms=settings.VAD_MIN_SPEECH_DURATION_MS,
        min_silence_duration_ms=settings.VAD_SILENCE_DURATION_MS,
        sampling_rate=sample_rate,
    )
    return timestamps


def has_speech(pcm_bytes: bytes, sample_rate: int = 16000) -> bool:
    return len(detect_speech(pcm_bytes, sample_rate)) > 0


def extract_speech_chunks(pcm_bytes: bytes, sample_rate: int = 16000) -> bytes:
    """Returns only the speech portions of the audio, concatenated."""
    segments = detect_speech(pcm_bytes, sample_rate)
    if not segments:
        return b""

    audio_np = np.frombuffer(pcm_bytes, dtype=np.int16)
    chunks = [audio_np[s["start"]:s["end"]] for s in segments]
    combined = np.concatenate(chunks)
    return combined.astype(np.int16).tobytes()
