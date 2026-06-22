from __future__ import annotations

"""
OCR Vision API — authenticated REST endpoints.

POST /ocr/image       — general image
POST /ocr/document    — multi-page document
POST /ocr/screenshot  — screen capture (social media, productivity app, etc.)

Every response includes a structured `intelligence` block ready to be passed
to ml/ai/ or ml/maya/ for further coaching and analysis.
"""

import os
import base64
import hashlib
import tempfile
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(prefix="/ocr", tags=["ocr"])

_MAX_FILE_BYTES = 10 * 1024 * 1024  # 10MB
_ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}

OCR_API_KEY = os.getenv("OCR_API_KEY", "change-me-in-production")


def _verify_key(x_api_key: str = Header(..., alias="x-api-key")) -> None:
    if x_api_key != OCR_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")


class OCRResponse(BaseModel):
    request_id: str
    success: bool
    pipeline: str
    hint: str
    ocr_result: Optional[dict] = None
    structured: Optional[dict] = None
    intelligence: Optional[dict] = None  # Ready-to-send block for ml/ai/ or ml/maya/
    error: Optional[str] = None
    latency_ms: float


def _build_intelligence(structured: dict) -> dict:
    """
    Converts structured OCR output into an intelligence payload that NestJS
    can forward directly to ml/ai/ or ml/maya/.
    """
    if not structured:
        return {}
    intent = structured.get("type", "general_text")
    content = structured.get("content", [])
    return {
        "ocr_intent": intent,
        "extractable_items": content,
        "recommended_action": _recommend_action(intent, content),
        "ready_for_ingestion": bool(content),
    }


def _recommend_action(intent: str, content: list) -> str:
    if not content:
        return "no_action"
    mapping = {
        "task": "create_tasks",
        "habit": "create_habits",
        "goal": "create_goals",
        "calendar_event": "create_calendar_events",
        "social_media": "log_social_usage",
    }
    return mapping.get(intent, "review_manually")


@router.post("/image", response_model=OCRResponse, dependencies=[Depends(_verify_key)])
async def process_image(
    file: UploadFile = File(...),
    hint: str = Form(default="general"),
) -> OCRResponse:
    return await _run_pipeline(file, hint, pipeline_name="image")


@router.post("/document", response_model=OCRResponse, dependencies=[Depends(_verify_key)])
async def process_document(
    file: UploadFile = File(...),
    hint: str = Form(default="document"),
) -> OCRResponse:
    return await _run_pipeline(file, hint, pipeline_name="document")


@router.post("/screenshot", response_model=OCRResponse, dependencies=[Depends(_verify_key)])
async def process_screenshot(
    file: UploadFile = File(...),
) -> OCRResponse:
    return await _run_pipeline(file, hint="screenshot", pipeline_name="screenshot")


async def _run_pipeline(
    upload: UploadFile,
    hint: str,
    pipeline_name: str,
) -> OCRResponse:
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()

    # Validate size before reading
    content_bytes = await upload.read(_MAX_FILE_BYTES + 1)
    if len(content_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum is 10MB.")

    # Write to temp file — auto-deleted after processing (no permanent audio/image storage)
    with tempfile.NamedTemporaryFile(delete=True) as tmp:
        tmp.write(content_bytes)
        tmp.flush()

        try:
            if pipeline_name == "image":
                from pipelines.image_pipeline import run
                result = run(content_bytes, hint=hint)
            elif pipeline_name == "document":
                from pipelines.document_pipeline import run
                result = run(content_bytes, hint=hint)
            else:
                from pipelines.screenshot_pipeline import run
                result = run(content_bytes)
        except Exception as exc:
            latency_ms = (time.perf_counter() - t0) * 1000
            return OCRResponse(
                request_id=request_id,
                success=False,
                pipeline=pipeline_name,
                hint=hint,
                error=type(exc).__name__,
                latency_ms=round(latency_ms, 2),
            )

    structured = result.get("structured")
    intelligence = _build_intelligence(structured) if structured else None
    latency_ms = (time.perf_counter() - t0) * 1000

    return OCRResponse(
        request_id=request_id,
        success=result.get("success", False),
        pipeline=pipeline_name,
        hint=hint,
        ocr_result=result.get("ocr_result"),
        structured=structured,
        intelligence=intelligence,
        error=result.get("error"),
        latency_ms=round(latency_ms, 2),
    )
