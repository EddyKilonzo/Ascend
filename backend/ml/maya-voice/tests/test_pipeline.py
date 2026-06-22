import sys
import os
import struct
import math
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pipeline.stt import transcribe, TranscriptionResult
from pipeline.skill_router import route, SkillType
from pipeline.intent import classify, Intent


def _make_silence(duration_seconds: float = 0.5, sample_rate: int = 16000) -> bytes:
    num_samples = int(duration_seconds * sample_rate)
    return (np.zeros(num_samples, dtype=np.int16)).tobytes()


def _make_tone(freq: float = 440.0, duration: float = 0.5, sample_rate: int = 16000) -> bytes:
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    wave = (np.sin(2 * np.pi * freq * t) * 16000).astype(np.int16)
    return wave.tobytes()


# ── STT fallback behavior ────────────────────────────────────────────────────
def test_stt_empty_audio_returns_empty():
    result = transcribe(b"")
    assert result.text == ""


def test_stt_returns_transcription_result():
    silence = _make_silence()
    result = transcribe(silence)
    assert isinstance(result, TranscriptionResult)
    assert hasattr(result, "text")
    assert hasattr(result, "confidence")
    assert hasattr(result, "language")


def test_stt_to_dict():
    result = TranscriptionResult(text="hello", language="en", confidence=0.95)
    d = result.to_dict()
    assert d["text"] == "hello"
    assert d["language"] == "en"
    assert d["confidence"] == 0.95


# ── Skill router ─────────────────────────────────────────────────────────────
def test_router_coaching_productivity():
    intent = classify("Why did my productivity drop?")
    routing = route(intent)
    assert routing.skill == SkillType.COACHING
    assert routing.coaching_module == "productivity"
    assert routing.needs_user_context is True


def test_router_calendar_view():
    intent = classify("What's on my calendar today?")
    routing = route(intent)
    assert routing.skill == SkillType.CALENDAR_VIEW
    assert routing.coaching_module is None
    assert routing.needs_user_context is False


def test_router_calendar_add():
    intent = classify("Schedule a meeting tomorrow")
    routing = route(intent)
    assert routing.skill == SkillType.CALENDAR_MUTATE


def test_router_ocr():
    intent = classify("Scan this screenshot for tasks")
    routing = route(intent)
    assert routing.skill == SkillType.OCR


def test_router_unknown_falls_back():
    intent = classify("What's the weather today?")
    routing = route(intent)
    assert routing.skill == SkillType.FALLBACK


def test_router_burnout_is_coaching():
    intent = classify("I feel burned out and exhausted")
    routing = route(intent)
    assert routing.skill == SkillType.COACHING
    assert routing.coaching_module == "burnout"


def test_router_achievement():
    intent = classify("How much XP did I earn this week?")
    routing = route(intent)
    assert routing.skill == SkillType.COACHING
    assert routing.coaching_module == "achievement"
