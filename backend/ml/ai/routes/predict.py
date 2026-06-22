from fastapi import APIRouter, Depends
from schemas.requests import HabitPredictionRequest, GoalForecastRequest, BurnoutDetectionRequest, AntiCheatRequest
from schemas.responses import HabitPredictionResponse, GoalForecastResponse, BurnoutDetectionResponse, AntiCheatResponse
from engines.habit_engine import predict_habit_completion
from engines.goal_engine import forecast_goal
from engines.burnout_engine import detect_burnout
from engines.anticheat_engine import check_anticheat
from dependencies import verify_api_key, rate_limit
from utils.cache import cache_get, cache_set, make_cache_key

router = APIRouter(tags=["predict"], dependencies=[Depends(verify_api_key), Depends(rate_limit)])


@router.post("/habit", response_model=HabitPredictionResponse)
async def predict_habit(req: HabitPredictionRequest):
    cache_key = make_cache_key("habit_predict", req.model_dump())
    cached = await cache_get(cache_key)
    if cached:
        return HabitPredictionResponse(**cached)

    result = predict_habit_completion(req)
    await cache_set(cache_key, result.model_dump(), ttl=3600)
    return result


@router.post("/goal", response_model=GoalForecastResponse)
async def forecast_goal_endpoint(req: GoalForecastRequest):
    return forecast_goal(req)


@router.post("/burnout", response_model=BurnoutDetectionResponse)
async def detect_burnout_endpoint(req: BurnoutDetectionRequest):
    return detect_burnout(req)


@router.post("/anticheat", response_model=AntiCheatResponse)
async def check_anticheat_endpoint(req: AntiCheatRequest):
    return check_anticheat(req)
