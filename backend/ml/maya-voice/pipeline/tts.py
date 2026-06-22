from __future__ import annotations

"""Piper TTS wrapper. Returns WAV audio bytes from text."""

import io
import subprocess
import shutil
import tempfile
import os
from typing import Optional

from config import settings

_PIPER_BIN = shutil.which("piper") or shutil.which("piper-tts")
_PIPER_AVAILABLE = _PIPER_BIN is not None

try:
    from piper.voice import PiperVoice
    _PIPER_PYTHON = True
except ImportError:
    _PIPER_PYTHON = False

_voice_cache: Optional[object] = None


def _load_python_voice() -> Optional[object]:
    global _voice_cache
    if _voice_cache is None and _PIPER_PYTHON:
        model_path = os.path.join(
            settings.PIPER_MODEL_DIR,
            f"{settings.PIPER_VOICE}.onnx",
        )
        if os.path.exists(model_path):
            _voice_cache = PiperVoice.load(model_path)
    return _voice_cache


def synthesize(text: str) -> bytes:
    """
    Convert text to WAV audio bytes.
    Tries Python bindings first, then CLI, then returns empty bytes.
    """
    if not text.strip():
        return b""

    # Try Python bindings (faster, no subprocess overhead)
    voice = _load_python_voice()
    if voice is not None:
        return _synth_python(voice, text)

    # Try CLI
    if _PIPER_AVAILABLE:
        return _synth_cli(text)

    # Offline fallback: return empty audio (caller should surface text-only response)
    return b""


def _synth_python(voice: object, text: str) -> bytes:
    buf = io.BytesIO()
    with _wav_writer(buf) as wav:
        voice.synthesize(text, wav, length_scale=1.0 / settings.PIPER_SPEED)
    return buf.getvalue()


def _synth_cli(text: str) -> bytes:
    model_path = os.path.join(settings.PIPER_MODEL_DIR, f"{settings.PIPER_VOICE}.onnx")
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [
                _PIPER_BIN,
                "--model", model_path,
                "--output_file", tmp_path,
                "--length_scale", str(1.0 / settings.PIPER_SPEED),
            ],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=10,
        )
        if result.returncode == 0:
            with open(tmp_path, "rb") as f:
                return f.read()
        return b""
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _wav_writer(buf: io.BytesIO):
    import wave
    return wave.open(buf, "wb")
