from fastapi import APIRouter, Depends
from schemas.requests import RecommendationRequest
from schemas.responses import RecommendationResponse
from engines.recommendation_engine import generate_recommendations
from dependencies import verify_api_key, rate_limit
from utils.cache import cache_get, cache_set, make_cache_key

router = APIRouter(tags=["recommend"], dependencies=[Depends(verify_api_key), Depends(rate_limit)])


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(req: RecommendationRequest):
    cache_key = make_cache_key("recommend", req.model_dump())
    cached = await cache_get(cache_key)
    if cached:
        return RecommendationResponse(**cached)

    result = generate_recommendations(req)
    await cache_set(cache_key, result.model_dump(), ttl=1800)
    return result
