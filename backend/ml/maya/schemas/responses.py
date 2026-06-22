from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ExplanationFactor(BaseModel):
    name: str
    impact: str          # e.g. "+12.3" or "-8.1"
    direction: str       # "positive" | "negative" | "neutral"
    description: str


class MayaResponse(BaseModel):
    request_id: str
    user_id: str
    coaching_module: str
    prediction: Optional[float] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    factors: list[ExplanationFactor] = Field(default_factory=list)
    explanation: str
    recommendations: list[str] = Field(default_factory=list)
    urgency: str = "low"  # low / moderate / high / critical
    latency_ms: float = 0.0
    cached: bool = False


class ExplanationResponse(BaseModel):
    request_id: str
    model_name: str
    prediction: float
    confidence: float
    factors: list[ExplanationFactor]
    explanation: str
    recommendations: list[str]
    latency_ms: float = 0.0


class HealthResponse(BaseModel):
    status: str
    version: str
    model: str
    redis_connected: bool
    anthropic_configured: bool
