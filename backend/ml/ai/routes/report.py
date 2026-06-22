from fastapi import APIRouter, Depends
from schemas.requests import ReportRequest
from schemas.responses import ReportResponse
from engines.reporting_engine import generate_report
from dependencies import verify_api_key, rate_limit
from utils.cache import cache_get, cache_set, make_cache_key

router = APIRouter(tags=["report"], dependencies=[Depends(verify_api_key), Depends(rate_limit)])


@router.post("/generate", response_model=ReportResponse)
async def generate_period_report(req: ReportRequest):
    try:
        cache_key = make_cache_key("report", {
            "user_id": req.user_id,
            "period": req.period,
            "days": len(req.daily_metrics),
        })
        cached = await cache_get(cache_key)
        if cached:
            return ReportResponse(**cached)

        result = generate_report(req)
        await cache_set(cache_key, result.model_dump(), ttl=3600)
        return result
    except Exception as e:
        raise
