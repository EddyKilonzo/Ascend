from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status

from config import settings
from schemas.requests import ExplainPredictionRequest
from schemas.responses import ExplanationResponse
from explanation.explanation_engine import explanation_engine
from observability.logger import log_request, request_id_var
from observability.metrics import Timer, record

router = APIRouter()


async def _auth(x_api_key: str = Header(..., alias="X-API-Key")) -> None:
    if x_api_key != settings.MAYA_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")


@router.post(
    "/explain",
    response_model=ExplanationResponse,
    dependencies=[Depends(_auth)],
    tags=["explanation"],
)
async def explain_prediction(request: ExplainPredictionRequest) -> ExplanationResponse:
    rid = str(uuid.uuid4())
    request_id_var.set(rid)

    with Timer() as t:
        response = await explanation_engine.explain(request)
        response.request_id = rid
        response.latency_ms = round(t.elapsed_ms, 2)
        record("explain", t.elapsed_ms)
        log_request(request.user_id, "explain", t.elapsed_ms, False)
        return response
