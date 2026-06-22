from __future__ import annotations

from pydantic import BaseModel
from typing import Optional
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CheatFlag(str, Enum):
    XP_FARMING = "XP_FARMING"
    FAKE_STREAK = "FAKE_STREAK"
    VELOCITY_ANOMALY = "VELOCITY_ANOMALY"
    STATISTICAL_OUTLIER = "STATISTICAL_OUTLIER"
    CLEAN = "CLEAN"


# ── Unified AI response envelope ──────────────────────────────────────────────
# Every ML prediction must be expressible in this format.
# NestJS uses this to build the Maya context and the Dashboard.

class AIFactor(BaseModel):
    name: str
    impact: str       # e.g. "+12.3 pts" or "-8.1%"
    direction: str    # "positive" | "negative" | "neutral"


class AIEnvelope(BaseModel):
    """Unified response contract for all ML predictions."""
    prediction: float
    confidence: float
    reasoning: str
    factors: list[AIFactor]
    recommendations: list[str]


# ── Component responses ───────────────────────────────────────────────────────

class ProductivityBreakdown(BaseModel):
    habit_score: float
    focus_score: float
    task_score: float
    social_penalty: float
    consistency_score: float


class ProductivityScoreResponse(BaseModel):
    user_id: str
    score: float
    confidence: float = 0.90   # heuristic-based formula, high confidence when data exists
    grade: str
    breakdown: ProductivityBreakdown
    insights: list[str]
    period_days: int
    computed_at: str

    def to_envelope(self) -> AIEnvelope:
        factors = [
            AIFactor(name="habit completion",    impact=f"{self.breakdown.habit_score:.1f}",      direction="positive" if self.breakdown.habit_score >= 60 else "negative"),
            AIFactor(name="focus quality",        impact=f"{self.breakdown.focus_score:.1f}",      direction="positive" if self.breakdown.focus_score >= 60 else "negative"),
            AIFactor(name="task completion",      impact=f"{self.breakdown.task_score:.1f}",       direction="positive" if self.breakdown.task_score >= 60 else "negative"),
            AIFactor(name="social media penalty", impact=f"-{self.breakdown.social_penalty:.1f}",  direction="negative" if self.breakdown.social_penalty > 5 else "neutral"),
            AIFactor(name="consistency",          impact=f"{self.breakdown.consistency_score:.1f}", direction="positive" if self.breakdown.consistency_score >= 60 else "negative"),
        ]
        return AIEnvelope(
            prediction=self.score,
            confidence=self.confidence,
            reasoning=self.insights[0] if self.insights else "Score computed from behavioral data.",
            factors=factors,
            recommendations=self.insights[1:] if len(self.insights) > 1 else [],
        )


class HabitPredictionResponse(BaseModel):
    user_id: str
    habit_id: str
    completion_probability: float
    confidence: float
    best_time_window: Optional[str]
    risk_factors: list[str]
    model_used: str

    def to_envelope(self) -> AIEnvelope:
        direction = "positive" if self.completion_probability >= 0.6 else "negative"
        return AIEnvelope(
            prediction=self.completion_probability,
            confidence=self.confidence,
            reasoning=f"Completion probability: {self.completion_probability:.0%} via {self.model_used}.",
            factors=[AIFactor(name=r, impact="risk", direction="negative") for r in self.risk_factors],
            recommendations=[f"Best time: {self.best_time_window}"] if self.best_time_window else [],
        )


class GoalForecastResponse(BaseModel):
    user_id: str
    goal_id: str
    completion_probability: float
    confidence: float = 0.80
    eta_days: Optional[int]
    on_track: bool
    projected_completion_date: Optional[str]
    velocity: float
    insights: list[str]

    def to_envelope(self) -> AIEnvelope:
        return AIEnvelope(
            prediction=self.completion_probability,
            confidence=self.confidence,
            reasoning=self.insights[0] if self.insights else "Goal forecast computed.",
            factors=[],
            recommendations=self.insights[1:] if len(self.insights) > 1 else [],
        )


class BurnoutSignal(BaseModel):
    signal_type: str
    severity: str
    description: str


class BurnoutDetectionResponse(BaseModel):
    user_id: str
    risk_level: RiskLevel
    risk_score: int
    confidence: float = 0.85
    signals: list[BurnoutSignal]
    recommendations: list[str]
    assessed_at: str

    def to_envelope(self) -> AIEnvelope:
        factors = [
            AIFactor(name=s.signal_type, impact=s.severity, direction="negative")
            for s in self.signals
        ]
        return AIEnvelope(
            prediction=float(self.risk_score) / 10.0,
            confidence=self.confidence,
            reasoning=f"Burnout risk: {self.risk_level.value}. Score {self.risk_score}/10.",
            factors=factors,
            recommendations=self.recommendations,
        )


class PlatformImpact(BaseModel):
    platform: str
    daily_avg_minutes: float
    productivity_correlation: float
    penalty_score: float


class SocialImpactResponse(BaseModel):
    user_id: str
    total_penalty: float
    platform_breakdown: list[PlatformImpact]
    most_impactful_platform: Optional[str]
    estimated_productivity_loss_pct: float
    recommendations: list[str]


class Recommendation(BaseModel):
    type: str
    priority: str
    title: str
    description: str
    action: str
    estimated_impact: str


class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: list[Recommendation]
    focus_area: str
    generated_at: str


class CheatDetection(BaseModel):
    flag: CheatFlag
    confidence: float
    evidence: str
    severity: str


class AntiCheatResponse(BaseModel):
    user_id: str
    is_suspicious: bool
    overall_risk: str
    confidence: float = 0.0
    detections: list[CheatDetection]
    xp_adjustment_recommended: bool
    recommended_xp_reduction_pct: float
    assessed_at: str

    def model_post_init(self, __context) -> None:
        # Derive overall confidence from the highest detection confidence
        suspicious = [d for d in self.detections if d.flag != CheatFlag.CLEAN]
        if suspicious:
            self.confidence = max(d.confidence for d in suspicious)


class WeeklyHighlight(BaseModel):
    metric: str
    value: str
    change_pct: float
    trend: str


class ReportResponse(BaseModel):
    user_id: str
    period: str
    period_label: str
    overall_score: float
    score_change: Optional[float]
    highlights: list[WeeklyHighlight]
    top_habit: Optional[str]
    improvement_areas: list[str]
    behavioral_insights: list[str]
    achievements_summary: str
    next_period_goals: list[str]
    generated_at: str
