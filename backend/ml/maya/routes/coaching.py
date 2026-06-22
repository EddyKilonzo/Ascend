from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, status

from config import settings
from schemas.requests import CoachingModule, MayaRequest
from schemas.responses import MayaResponse
from coaching.productivity_coach import ProductivityCoach
from coaching.accountability_coach import AccountabilityCoach
from coaching.habit_coach import HabitCoach
from coaching.goal_coach import GoalCoach
from coaching.focus_coach import FocusCoach
from coaching.burnout_coach import BurnoutCoach
from coaching.schedule_coach import ScheduleCoach
from coaching.weekly_review_coach import WeeklyReviewCoach
from coaching.monthly_review_coach import MonthlyReviewCoach
from coaching.achievement_coach import AchievementCoach
from context.context_builder import validate_and_enrich
from security.input_validator import sanitize_user_message, validate_api_key
from security.rate_limiter import rate_limiter
from observability.logger import log_request, request_id_var
from observability.metrics import Timer, record

router = APIRouter()

_COACHES = {
    CoachingModule.PRODUCTIVITY: ProductivityCoach(),
    CoachingModule.ACCOUNTABILITY: AccountabilityCoach(),
    CoachingModule.HABIT: HabitCoach(),
    CoachingModule.GOAL: GoalCoach(),
    CoachingModule.FOCUS: FocusCoach(),
    CoachingModule.BURNOUT: BurnoutCoach(),
    CoachingModule.SCHEDULE: ScheduleCoach(),
    CoachingModule.WEEKLY_REVIEW: WeeklyReviewCoach(),
    CoachingModule.MONTHLY_REVIEW: MonthlyReviewCoach(),
    CoachingModule.ACHIEVEMENT: AchievementCoach(),
}


async def _auth(x_api_key: str = Header(..., alias="X-API-Key")) -> None:
    if x_api_key != settings.MAYA_API_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key.")


@router.post("/coach", response_model=MayaResponse, dependencies=[Depends(_auth)], tags=["coaching"])
async def coach(request: MayaRequest) -> MayaResponse:
    rid = str(uuid.uuid4())
    request_id_var.set(rid)

    await rate_limiter.check(request.user_context.user_id)

    sanitized_message = None
    if request.user_message:
        sanitized_message = sanitize_user_message(
            request.user_message,
            request.user_context.user_id,
            settings.MAX_USER_MESSAGE_LENGTH,
        )

    context = validate_and_enrich(request.user_context)
    coach_instance = _COACHES[request.coaching_module]

    with Timer() as t:
        try:
            response = await coach_instance.coach(context, sanitized_message)
            response.request_id = rid
            record(request.coaching_module.value, t.elapsed_ms)
            log_request(context.user_id, request.coaching_module.value, t.elapsed_ms, False)
            response.latency_ms = round(t.elapsed_ms, 2)
            return response
        except Exception as exc:
            record(request.coaching_module.value, t.elapsed_ms, error=True)
            raise
