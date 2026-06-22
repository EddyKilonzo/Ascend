from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class CoachingModule(str, Enum):
    PRODUCTIVITY = "productivity"
    ACCOUNTABILITY = "accountability"
    HABIT = "habit"
    GOAL = "goal"
    FOCUS = "focus"
    BURNOUT = "burnout"
    SCHEDULE = "schedule"
    WEEKLY_REVIEW = "weekly_review"
    MONTHLY_REVIEW = "monthly_review"
    ACHIEVEMENT = "achievement"


class HabitSummary(BaseModel):
    habit_id: str
    name: str
    completion_rate_7d: float = Field(ge=0.0, le=1.0)
    completion_rate_30d: float = Field(ge=0.0, le=1.0)
    current_streak: int = Field(ge=0)
    longest_streak: int = Field(ge=0)
    difficulty: int = Field(ge=1, le=5)
    missed_yesterday: bool = False
    target_time_hour: Optional[int] = Field(None, ge=0, le=23)


class GoalSummary(BaseModel):
    goal_id: str
    title: str
    progress_pct: float = Field(ge=0.0, le=100.0)
    deadline_days: Optional[int] = None
    weekly_target_pct: float = Field(default=0.0, ge=0.0)
    weekly_actual_pct: float = Field(default=0.0, ge=0.0)
    is_on_track: bool = True


class FocusSummary(BaseModel):
    total_minutes_today: int = Field(ge=0)
    total_minutes_7d: int = Field(ge=0)
    total_minutes_30d: int = Field(ge=0)
    session_count_7d: int = Field(ge=0)
    avg_session_minutes_7d: float = Field(ge=0.0)
    deep_work_pct: float = Field(default=0.0, ge=0.0, le=1.0)
    trend_7d: float = 0.0  # positive = improving


class SocialSummary(BaseModel):
    avg_minutes_today: int = Field(ge=0)
    avg_minutes_7d: int = Field(ge=0)
    avg_minutes_30d: int = Field(ge=0)
    top_platform: Optional[str] = None
    top_platform_minutes_7d: int = Field(default=0, ge=0)
    trend_7d: float = 0.0  # positive = usage increasing (bad)


class ProductivitySnapshot(BaseModel):
    score_today: float = Field(ge=0.0, le=100.0)
    score_7d_avg: float = Field(ge=0.0, le=100.0)
    score_30d_avg: float = Field(ge=0.0, le=100.0)
    trend_7d: float = 0.0  # percentage change
    percentile_rank: Optional[float] = Field(None, ge=0.0, le=100.0)
    task_completion_rate_7d: float = Field(default=0.0, ge=0.0, le=1.0)
    overdue_task_count: int = Field(default=0, ge=0)


class BurnoutRisk(BaseModel):
    risk_level: str = "low"  # low / moderate / high / critical
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    consecutive_decline_days: int = Field(default=0, ge=0)
    days_with_zero_focus_7d: int = Field(default=0, ge=0)
    primary_signal: Optional[str] = None


class XPSummary(BaseModel):
    total_xp: int = Field(ge=0)
    level: int = Field(ge=1)
    xp_this_week: int = Field(ge=0)
    xp_last_week: int = Field(ge=0)
    rank_position: Optional[int] = None
    recent_achievements: list[str] = Field(default_factory=list)
    active_streak_days: int = Field(default=0, ge=0)


class UserContext(BaseModel):
    user_id: str
    display_name: str
    productivity: ProductivitySnapshot
    focus: FocusSummary
    social: SocialSummary
    burnout: BurnoutRisk
    habits: list[HabitSummary] = Field(default_factory=list)
    goals: list[GoalSummary] = Field(default_factory=list)
    xp: Optional[XPSummary] = None

    # Optional pre-computed ML predictions from ml/ai/
    ml_habit_risk_prediction: Optional[dict] = None
    ml_burnout_prediction: Optional[dict] = None
    ml_productivity_prediction: Optional[dict] = None


class MayaRequest(BaseModel):
    user_context: UserContext
    coaching_module: CoachingModule
    user_message: Optional[str] = Field(None, max_length=500)

    @field_validator("user_message")
    @classmethod
    def strip_message(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v else v


class ExplainPredictionRequest(BaseModel):
    user_id: str
    model_name: str  # productivity / habit / burnout / recommendation
    prediction_value: float
    confidence: float = Field(ge=0.0, le=1.0)
    feature_values: dict[str, float]
    shap_values: Optional[dict[str, float]] = None
    top_k_factors: int = Field(default=5, ge=1, le=10)
