from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from config import settings
from pipeline.wake_word import _OWW_AVAILABLE
from pipeline.stt import _STT_AVAILABLE
from pipeline.tts import _PIPER_AVAILABLE, _PIPER_PYTHON
from pipeline.vad import _VAD_AVAILABLE
from memory.session_memory import session_memory

router = APIRouter()


class VoiceHealthResponse(BaseModel):
    status: str
    version: str
    wake_word_available: bool
    vad_available: bool
    stt_available: bool
    tts_available: bool
    redis_connected: bool
    calendar_configured: bool
    maya_url: str


@router.get("/health", response_model=VoiceHealthResponse, tags=["system"])
async def health() -> VoiceHealthResponse:
    import os
    return VoiceHealthResponse(
        status="ok",
        version=settings.VERSION,
        wake_word_available=_OWW_AVAILABLE,
        vad_available=_VAD_AVAILABLE,
        stt_available=_STT_AVAILABLE,
        tts_available=_PIPER_PYTHON or _PIPER_AVAILABLE,
        redis_connected=session_memory._client is not None,
        calendar_configured=os.path.exists(settings.GOOGLE_CREDENTIALS_FILE),
        maya_url=settings.MAYA_URL,
    )
