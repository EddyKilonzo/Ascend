from __future__ import annotations

import time

from fastapi import APIRouter, Depends
from schemas.requests import ProductivityScoreRequest, SocialImpactRequest
from schemas.responses import ProductivityScoreResponse, SocialImpactResponse
from engines.productivity_engine import compute_productivity_score
from engines.social_engine import analyze_social_impact
from dependencies import verify_api_key, rate_limit
from utils.cache import cache_get, cache_set, make_cache_key
from utils.logging import log_request

router = APIRouter(tags=["score"], dependencies=[Depends(verify_api_key), Depends(rate_limit)])


@router.post("/productivity", response_model=ProductivityScoreResponse)
async def score_productivity(req: ProductivityScoreRequest) -> ProductivityScoreResponse:
    # Include full request content in cache key — partial key causes stale results
    cache_key = make_cache_key("productivity", req.model_dump())
    cached = await cache_get(cache_key)
    if cached:
        return ProductivityScoreResponse(**cached)

    t0 = time.perf_counter()
    result = compute_productivity_score(req)
    latency_ms = (time.perf_counter() - t0) * 1000

    await cache_set(cache_key, result.model_dump(), ttl=120)
    log_request("/score/productivity", req.user_id, latency_ms, cached=False)
    return result


@router.post("/social-impact", response_model=SocialImpactResponse)
async def score_social_impact(req: SocialImpactRequest) -> SocialImpactResponse:
    t0 = time.perf_counter()
    result = analyze_social_impact(req)
    latency_ms = (time.perf_counter() - t0) * 1000
    log_request("/score/social-impact", req.user_id, latency_ms, cached=False)
    return result
