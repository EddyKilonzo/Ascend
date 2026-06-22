from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class SessionType(str, Enum):
    POMODORO = "POMODORO"
    DEEP_WORK = "DEEP_WORK"
    ULTRA_FOCUS = "ULTRA_FOCUS"


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class HabitRecord(BaseModel):
    habit_id: str
    completed: bool
    difficulty: int = Field(default=3, ge=1, le=5)
    target_time: Optional[str] = None
    actual_completion_time: Optional[str] = None
    streak_length: int = Field(default=0, ge=0)


class FocusSessionRecord(BaseModel):
    session_id: str
    duration_minutes: int = Field(ge=0)
    session_type: SessionType
    completed: bool
    interruptions: int = Field(default=0, ge=0)


class TaskRecord(BaseModel):
    task_id: str
    completed: bool
    priority: Priority = Priority.MEDIUM
    overdue: bool = False


class SocialUsageRecord(BaseModel):
    platform: str
    duration_minutes: int = Field(ge=0)
    date: str


class ProductivityScoreRequest(BaseModel):
    user_id: str
    habits: list[HabitRecord] = []
    focus_sessions: list[FocusSessionRecord] = []
    tasks: list[TaskRecord] = []
    social_usage: list[SocialUsageRecord] = []
    period_days: int = Field(default=1, ge=1, le=30)
    historical_scores: list[float] = []


class HabitHistoryEntry(BaseModel):
    date: str
    completed: bool
    completion_time: Optional[str] = None


class HabitPredictionRequest(BaseModel):
    user_id: str
    habit_id: str
    difficulty: int = Field(default=3, ge=1, le=5)
    habit_age_days: int = Field(default=0, ge=0)
    current_streak: int = Field(default=0, ge=0)
    history: list[HabitHistoryEntry] = []
    target_time: Optional[str] = None
    # Cross-domain features — provided by NestJS from daily metrics
    avg_focus_minutes_7d: float = Field(default=0.0, ge=0.0)
    productivity_score_yesterday: float = Field(default=50.0, ge=0.0, le=100.0)


class MilestoneRecord(BaseModel):
    milestone_id: str
    completed: bool
    target_date: Optional[str] = None


class GoalForecastRequest(BaseModel):
    user_id: str
    goal_id: str
    current_progress_pct: float = Field(ge=0.0, le=100.0)
    target_date: Optional[str] = None
    start_date: str
    daily_progress_history: list[float] = []
    related_habits: list[HabitRecord] = []
    milestones: list[MilestoneRecord] = []
    difficulty: int = Field(default=3, ge=1, le=5)


class DailyMetrics(BaseModel):
    date: str
    habit_completion_rate: float = Field(ge=0.0, le=1.0)
    focus_minutes: int = Field(ge=0)
    task_completion_rate: float = Field(ge=0.0, le=1.0)
    social_usage_minutes: int = Field(ge=0)
    xp_earned: int = Field(ge=0)
    activity_timestamps: list[str] = []


class BurnoutDetectionRequest(BaseModel):
    user_id: str
    daily_metrics: list[DailyMetrics] = []
    current_streak: int = Field(default=0, ge=0)
    overdue_task_count: int = Field(default=0, ge=0)
    total_task_count: int = Field(default=0, ge=0)


class SocialImpactRequest(BaseModel):
    user_id: str
    social_usage: list[SocialUsageRecord] = []
    productivity_scores: list[float] = []
    period_days: int = Field(default=7, ge=1, le=30)


class RecommendationRequest(BaseModel):
    user_id: str
    habits: list[HabitRecord] = []
    focus_sessions: list[FocusSessionRecord] = []
    tasks: list[TaskRecord] = []
    social_usage: list[SocialUsageRecord] = []
    current_streak: int = Field(default=0, ge=0)
    productivity_score: float = Field(default=50.0, ge=0.0, le=100.0)
    weak_areas: list[str] = []


class XPEvent(BaseModel):
    event_id: str
    event_type: str
    xp_amount: int = Field(ge=0)
    timestamp: str
    metadata: dict = {}


class UserAction(BaseModel):
    action_id: str
    action_type: str
    timestamp: str
    metadata: dict = {}


class AntiCheatRequest(BaseModel):
    user_id: str
    xp_events: list[XPEvent] = []
    habit_completions: list[HabitHistoryEntry] = []
    recent_actions: list[UserAction] = []
    period_hours: int = Field(default=24, ge=1, le=168)


class ReportRequest(BaseModel):
    user_id: str
    period: str = Field(default="weekly", pattern="^(weekly|monthly)$")
    daily_metrics: list[DailyMetrics] = []
    habits: list[HabitRecord] = []
    goals_completed: int = Field(default=0, ge=0)
    achievements_earned: int = Field(default=0, ge=0)
    level_ups: int = Field(default=0, ge=0)
    total_xp: int = Field(default=0, ge=0)
    previous_period_score: Optional[float] = None
