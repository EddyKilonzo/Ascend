from __future__ import annotations

"""
POST /voice/process — Push-to-talk endpoint.
Accepts raw audio bytes, returns text + coaching response + optional TTS audio.
"""

import base64
import time
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import settings
from pipeline.vad import extract_speech_chunks, has_speech
from pipeline.stt import transcribe
from pipeline.intent import classify
from pipeline.skill_router import route, SkillType
from pipeline.tts import synthesize
from memory.session_memory import session_memory, ConversationTurn
from memory.long_term import long_term_memory
from calendar.calendar_service import calendar_service

router = APIRouter(prefix="/voice")


class VoiceRequest(BaseModel):
    user_id: str
    audio_b64: str = Field(..., description="Base64-encoded PCM int16 audio at 16kHz")
    sample_rate: int = Field(default=16000)
    user_context: Optional[dict] = None  # Pre-fetched from NestJS; optional
    return_audio: bool = Field(default=True)
    session_id: Optional[str] = None


class VoiceResponse(BaseModel):
    request_id: str
    user_id: str
    transcript: str
    intent: str
    confidence: float
    coaching_module: Optional[str]
    response_text: str
    audio_b64: Optional[str] = None  # Base64 WAV if return_audio=True
    latency_ms: float


async def _auth(x_api_key: str = Header(..., alias="X-API-Key")) -> None:
    if x_api_key != settings.VOICE_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")


@router.post("/process", response_model=VoiceResponse, dependencies=[Depends(_auth)])
async def process_voice(request: VoiceRequest) -> VoiceResponse:
    t0 = time.perf_counter()
    request_id = str(uuid.uuid4())

    # Decode audio
    try:
        pcm_bytes = base64.b64decode(request.audio_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio.")

    # VAD — skip silent audio
    speech_bytes = extract_speech_chunks(pcm_bytes, request.sample_rate)
    if not speech_bytes:
        speech_bytes = pcm_bytes  # Skip VAD if it filtered everything

    # STT
    transcription = transcribe(speech_bytes, request.sample_rate)
    if not transcription.text:
        return VoiceResponse(
            request_id=request_id,
            user_id=request.user_id,
            transcript="",
            intent="unknown",
            confidence=0.0,
            coaching_module=None,
            response_text="I didn't catch that. Could you try again?",
            latency_ms=round((time.perf_counter() - t0) * 1000, 2),
        )

    # Intent classification
    intent_result = classify(transcription.text)
    routing = route(intent_result)

    # Log to session memory
    await session_memory.add_turn(
        request.user_id,
        ConversationTurn(role="user", text=transcription.text, intent=routing.intent.value),
    )
    await long_term_memory.update_interaction_count(request.user_id)

    # Dispatch to skill
    response_text = await _dispatch(routing, request, transcription.text)

    # Log Maya's response
    await session_memory.add_turn(
        request.user_id,
        ConversationTurn(role="maya", text=response_text),
    )

    # TTS
    audio_b64 = None
    if request.return_audio:
        wav_bytes = synthesize(response_text)
        if wav_bytes:
            audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

    return VoiceResponse(
        request_id=request_id,
        user_id=request.user_id,
        transcript=transcription.text,
        intent=routing.intent.value,
        confidence=routing.confidence,
        coaching_module=routing.coaching_module,
        response_text=response_text,
        audio_b64=audio_b64,
        latency_ms=round((time.perf_counter() - t0) * 1000, 2),
    )


async def _dispatch(routing: object, request: VoiceRequest, transcript: str) -> str:
    from pipeline.skill_router import SkillType

    if routing.skill == SkillType.COACHING and request.user_context:
        return await _call_maya_coaching(routing.coaching_module, request, transcript)

    if routing.skill == SkillType.CALENDAR_VIEW:
        return _handle_calendar_view()

    if routing.skill == SkillType.CALENDAR_MUTATE:
        return "Calendar scheduling via voice is available through the Ascend app. What time would you like to schedule?"

    if routing.skill == SkillType.OCR:
        return "Please upload an image in the Ascend app and Maya will extract tasks and goals from it."

    if routing.skill == SkillType.COACHING and not request.user_context:
        return "I need your productivity data to give you a personalized answer. Make sure you're logged into Ascend."

    return (
        "I'm Maya, your productivity coach. Ask me about your habits, goals, focus sessions, "
        "or say 'weekly review' for a full summary."
    )


async def _call_maya_coaching(module: str, request: VoiceRequest, transcript: str) -> str:
    payload = {
        "user_context": request.user_context,
        "coaching_module": module,
        "user_message": transcript[:500],
    }
    try:
        async with httpx.AsyncClient(timeout=9.0) as client:
            resp = await client.post(
                f"{settings.MAYA_URL}/coach",
                json=payload,
                headers={"X-API-Key": settings.MAYA_API_KEY},
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("explanation", "I couldn't generate a response right now.")
    except Exception:
        return "I'm having trouble connecting to my coaching system. Please try again in a moment."


def _handle_calendar_view() -> str:
    events = calendar_service.list_today()
    if not events:
        return "Your calendar is clear today. A great day for deep work!"
    summaries = ", ".join(e.to_voice_summary() for e in events[:3])
    suffix = f" and {len(events) - 3} more" if len(events) > 3 else ""
    return f"Today you have: {summaries}{suffix}."
