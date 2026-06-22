from __future__ import annotations

from fastapi import APIRouter

from config import settings
from schemas.responses import HealthResponse
from security.rate_limiter import rate_limiter

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    redis_ok = rate_limiter._client is not None
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        model=settings.PRIMARY_MODEL,
        redis_connected=redis_ok,
        anthropic_configured=bool(settings.ANTHROPIC_API_KEY),
    )
