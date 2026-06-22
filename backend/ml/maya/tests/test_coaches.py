import sys
import os
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from schemas.requests import (
    UserContext, ProductivitySnapshot, FocusSummary, SocialSummary,
    BurnoutRisk, HabitSummary, GoalSummary, XPSummary,
)
from coaching.productivity_coach import ProductivityCoach
from coaching.habit_coach import HabitCoach
from coaching.goal_coach import GoalCoach
from coaching.focus_coach import FocusCoach
from coaching.burnout_coach import BurnoutCoach
from coaching.accountability_coach import AccountabilityCoach
from coaching.achievement_coach import AchievementCoach
from coaching.weekly_review_coach import WeeklyReviewCoach
from coaching.schedule_coach import ScheduleCoach


def _context(**overrides) -> UserContext:
    defaults = dict(
        user_id="test_user",
        display_name="Test User",
        productivity=ProductivitySnapshot(
            score_today=72.0,
            score_7d_avg=68.0,
            score_30d_avg=70.0,
            trend_7d=-5.0,
            percentile_rank=55.0,
            task_completion_rate_7d=0.65,
            overdue_task_count=2,
        ),
        focus=FocusSummary(
            total_minutes_today=45,
            total_minutes_7d=350,
            total_minutes_30d=1400,
            session_count_7d=6,
            avg_session_minutes_7d=58.3,
            deep_work_pct=0.35,
            trend_7d=-8.0,
        ),
        social=SocialSummary(
            avg_minutes_today=80,
            avg_minutes_7d=75,
            avg_minutes_30d=68,
            top_platform="TikTok",
            top_platform_minutes_7d=320,
            trend_7d=6.0,
        ),
        burnout=BurnoutRisk(
            risk_level="moderate",
            risk_score=0.45,
            consecutive_decline_days=3,
            days_with_zero_focus_7d=1,
            primary_signal="productivity decline",
        ),
        habits=[
            HabitSummary(
                habit_id="h1", name="Morning Run",
                completion_rate_7d=0.85, completion_rate_30d=0.80,
                current_streak=12, longest_streak=15,
                difficulty=3, missed_yesterday=False, target_time_hour=7,
            ),
            HabitSummary(
                habit_id="h2", name="Evening Reading",
                completion_rate_7d=0.43, completion_rate_30d=0.55,
                current_streak=2, longest_streak=10,
                difficulty=2, missed_yesterday=True, target_time_hour=21,
            ),
        ],
        goals=[
            GoalSummary(
                goal_id="g1", title="Learn Python",
                progress_pct=65.0, deadline_days=14,
                weekly_target_pct=10.0, weekly_actual_pct=7.0,
                is_on_track=False,
            ),
            GoalSummary(
                goal_id="g2", title="Run 5K",
                progress_pct=80.0, deadline_days=30,
                weekly_target_pct=5.0, weekly_actual_pct=6.0,
                is_on_track=True,
            ),
        ],
        xp=XPSummary(
            total_xp=4200, level=8, xp_this_week=350,
            xp_last_week=280, rank_position=42, active_streak_days=5,
            recent_achievements=["7-day streak", "First 5K"],
        ),
    )
    defaults.update(overrides)
    return UserContext(**defaults)


# ── Productivity Coach ──────────────────────────────────────────────────────
def test_productivity_analysis_returns_score():
    ctx = _context()
    result = ProductivityCoach().analyze(ctx)
    assert result["prediction"] == ctx.productivity.score_today
    assert "bottleneck" in result
    assert len(result["factors"]) >= 3


def test_productivity_high_trend_low_urgency():
    ctx = _context()
    ctx.productivity.trend_7d = 10.0
    result = ProductivityCoach().analyze(ctx)
    assert result["urgency"] == "low"


def test_productivity_declining_urgency():
    ctx = _context()
    ctx.productivity.trend_7d = -15.0
    result = ProductivityCoach().analyze(ctx)
    assert result["urgency"] == "high"


# ── Habit Coach ─────────────────────────────────────────────────────────────
def test_habit_analysis_identifies_at_risk():
    ctx = _context()
    result = HabitCoach().analyze(ctx)
    assert result["at_risk_habits"]  # Evening Reading at 43%
    assert result["urgency"] in ("low", "moderate", "high")


def test_habit_no_habits():
    ctx = _context()
    ctx.habits = []
    result = HabitCoach().analyze(ctx)
    assert result["at_risk_habits"] == []
    assert result["total_habits"] == 0


# ── Goal Coach ──────────────────────────────────────────────────────────────
def test_goal_analysis_detects_behind():
    ctx = _context()
    result = GoalCoach().analyze(ctx)
    assert result["behind_count"] == 1  # "Learn Python" is behind


def test_goal_analysis_no_goals():
    ctx = _context()
    ctx.goals = []
    result = GoalCoach().analyze(ctx)
    assert result["total_goals"] == 0


# ── Focus Coach ─────────────────────────────────────────────────────────────
def test_focus_analysis_gap():
    ctx = _context()
    result = FocusCoach().analyze(ctx)
    assert result["daily_avg_minutes"] == ctx.focus.total_minutes_7d // 7
    assert result["vs_target_minutes"] < 0  # Below 90min target


def test_focus_high_urgency_when_low():
    ctx = _context()
    ctx.focus.total_minutes_7d = 70  # ~10min/day
    result = FocusCoach().analyze(ctx)
    assert result["urgency"] == "high"


# ── Burnout Coach ────────────────────────────────────────────────────────────
def test_burnout_moderate_risk():
    ctx = _context()
    result = BurnoutCoach().analyze(ctx)
    assert result["risk_level"] == "moderate"
    assert 0.0 <= result["risk_score"] <= 1.0


def test_burnout_critical_urgency():
    ctx = _context()
    ctx.burnout.risk_level = "critical"
    ctx.burnout.risk_score = 0.90
    result = BurnoutCoach().analyze(ctx)
    assert result["urgency"] == "critical"


# ── Accountability Coach ─────────────────────────────────────────────────────
def test_accountability_identifies_overdue():
    ctx = _context()
    result = AccountabilityCoach().analyze(ctx)
    assert any("overdue" in item.lower() for item in result["accountability_items"])


def test_accountability_clean_slate():
    ctx = _context()
    ctx.productivity.overdue_task_count = 0
    ctx.goals = [GoalSummary(
        goal_id="g1", title="Goal", progress_pct=50, is_on_track=True,
        weekly_target_pct=5, weekly_actual_pct=5,
    )]
    ctx.habits = []
    ctx.social.avg_minutes_7d = 30
    result = AccountabilityCoach().analyze(ctx)
    assert result["urgency"] == "low"


# ── Achievement Coach ─────────────────────────────────────────────────────────
def test_achievement_xp_momentum():
    ctx = _context()
    result = AchievementCoach().analyze(ctx)
    assert result["xp_momentum"] == "accelerating"  # 350 > 280 * 1.1


def test_achievement_no_xp():
    ctx = _context()
    ctx.xp = None
    result = AchievementCoach().analyze(ctx)
    assert result["prediction"] == 0.0


# ── Weekly Review Coach ────────────────────────────────────────────────────────
def test_weekly_review_identifies_weak_habits():
    ctx = _context()
    result = WeeklyReviewCoach().analyze(ctx)
    assert "Evening Reading" in result["weak_habits"]


# ── Schedule Coach ─────────────────────────────────────────────────────────────
def test_schedule_identifies_peak_window():
    ctx = _context()
    result = ScheduleCoach().analyze(ctx)
    assert "peak_window" in result
    assert len(result["schedule_recommendations"]) >= 2
