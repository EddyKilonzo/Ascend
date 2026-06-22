from __future__ import annotations

"""
WebSocket /voice/stream — real-time streaming voice pipeline.

Protocol (client → server):
  - Binary frames: raw PCM int16 audio chunks (80ms @ 16kHz = 1280 samples)
  - Text frames: JSON control messages: {"type": "end"} to signal end of utterance

Protocol (server → client):
  - {"type": "wake_detected", "word": "hey maya"}
  - {"type": "transcript", "text": "...", "confidence": 0.95}
  - {"type": "intent", "intent": "habit", "confidence": 0.90}
  - {"type": "response_text", "text": "Your habit completion..."}
  - {"type": "audio_chunk", "data": "<base64 WAV chunk>"}
  - {"type": "done", "latency_ms": 342.1}
  - {"type": "error", "message": "..."}
"""

import asyncio
import base64
import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from config import settings
from pipeline.wake_word import detector
from pipeline.vad import has_speech, extract_speech_chunks
from pipeline.stt import transcribe
from pipeline.intent import classify
from pipeline.skill_router import route, SkillType
from pipeline.tts import synthesize
from memory.session_memory import session_memory, ConversationTurn
from memory.long_term import long_term_memory

router = APIRouter()

_CHUNK_SIZE = 1280 * 2  # 80ms @ 16kHz int16 = 1280 samples × 2 bytes
_MAX_BUFFER_BYTES = 16000 * 2 * settings.STT_MAX_AUDIO_SECONDS


@router.websocket("/voice/stream")
async def voice_stream(websocket: WebSocket) -> None:
    await websocket.accept()

    # Auth: first message must be {"type": "auth", "api_key": "..."}
    try:
        auth_msg = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
    except asyncio.TimeoutError:
        await websocket.close(code=4001)
        return

    if auth_msg.get("api_key") != settings.VOICE_API_KEY:
        await _send_json(websocket, {"type": "error", "message": "Unauthorized."})
        await websocket.close(code=4003)
        return

    user_id = auth_msg.get("user_id", "unknown")
    user_context = auth_msg.get("user_context")

    audio_buffer = bytearray()
    wake_armed = True  # Listen for wake word first
    t0 = time.perf_counter()

    try:
        while True:
            msg = await websocket.receive()

            # Binary: audio chunk
            if "bytes" in msg:
                chunk = msg["bytes"]

                # Wake word detection (process every 80ms chunk)
                if wake_armed:
                    detection = detector.detect(chunk)
                    if detection.detected:
                        wake_armed = False
                        audio_buffer.clear()
                        t0 = time.perf_counter()
                        await _send_json(websocket, {
                            "type": "wake_detected",
                            "word": detection.word,
                        })
                    continue

                # Post-wake: buffer audio
                audio_buffer.extend(chunk)
                if len(audio_buffer) > _MAX_BUFFER_BYTES:
                    audio_buffer = bytearray(audio_buffer[-int(_MAX_BUFFER_BYTES):])

            # Text: control message
            elif "text" in msg:
                try:
                    ctrl = json.loads(msg["text"])
                except json.JSONDecodeError:
                    continue

                if ctrl.get("type") == "end":
                    # End of utterance — process buffered audio
                    await _process_utterance(
                        websocket, bytes(audio_buffer), user_id, user_context, t0,
                    )
                    audio_buffer.clear()
                    wake_armed = True
                    detector.reset()

                elif ctrl.get("type") == "cancel":
                    audio_buffer.clear()
                    wake_armed = True
                    detector.reset()

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        if websocket.client_state != WebSocketState.DISCONNECTED:
            await _send_json(websocket, {"type": "error", "message": str(exc)})


async def _process_utterance(
    ws: WebSocket,
    pcm_bytes: bytes,
    user_id: str,
    user_context: Optional[dict],
    t0: float,
) -> None:
    if not pcm_bytes:
        return

    speech_bytes = extract_speech_chunks(pcm_bytes) or pcm_bytes

    # STT
    transcription = transcribe(speech_bytes)
    if not transcription.text:
        await _send_json(ws, {"type": "error", "message": "Could not transcribe audio."})
        return

    await _send_json(ws, {
        "type": "transcript",
        "text": transcription.text,
        "confidence": transcription.confidence,
    })
    await session_memory.add_turn(user_id, ConversationTurn("user", transcription.text))
    await long_term_memory.update_interaction_count(user_id)

    # Intent
    intent_result = classify(transcription.text)
    routing = route(intent_result)
    await _send_json(ws, {
        "type": "intent",
        "intent": routing.intent.value,
        "confidence": routing.confidence,
    })

    # Dispatch
    response_text = await _dispatch(routing, user_id, user_context, transcription.text)
    await _send_json(ws, {"type": "response_text", "text": response_text})
    await session_memory.add_turn(user_id, ConversationTurn("maya", response_text))

    # TTS
    wav_bytes = synthesize(response_text)
    if wav_bytes:
        audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")
        await _send_json(ws, {"type": "audio_chunk", "data": audio_b64})

    latency_ms = (time.perf_counter() - t0) * 1000
    await _send_json(ws, {"type": "done", "latency_ms": round(latency_ms, 2)})


async def _dispatch(routing: object, user_id: str, user_context: Optional[dict], transcript: str) -> str:
    from routes.voice import _call_maya_coaching as _coaching_call, _handle_calendar_view

    class _FakeRequest:
        def __init__(self) -> None:
            self.user_context = user_context

    if routing.skill == SkillType.COACHING and user_context:
        return await _coaching_call(routing.coaching_module, _FakeRequest(), transcript)
    if routing.skill == SkillType.CALENDAR_VIEW:
        return _handle_calendar_view()
    return (
        "I'm Maya, your productivity coach. Tell me what you'd like to work on today."
    )


async def _send_json(ws: WebSocket, data: dict) -> None:
    if ws.client_state != WebSocketState.DISCONNECTED:
        await ws.send_json(data)
