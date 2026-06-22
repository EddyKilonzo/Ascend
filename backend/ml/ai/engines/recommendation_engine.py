from datetime import datetime
from schemas.requests import RecommendationRequest
from schemas.responses import RecommendationResponse, Recommendation

_PRIORITY_HIGH = "HIGH"
_PRIORITY_MEDIUM = "MEDIUM"
_PRIORITY_LOW = "LOW"


def _build_habit_recommendations(req: RecommendationRequest) -> list[Recommendation]:
    recs: list[Recommendation] = []
    if not req.habits:
        return recs

    incomplete = [h for h in req.habits if not h.completed]
    if not incomplete:
        return recs

    highest_difficulty_incomplete = max(incomplete, key=lambda h: h.difficulty)

    if len(incomplete) > 3:
        recs.append(Recommendation(
            type="HABIT_FOCUS",
            priority=_PRIORITY_HIGH,
            title="Focus on your 3 most important habits",
            description=f"You have {len(incomplete)} incomplete habits. Completing all may cause decision fatigue.",
            action=f"Prioritize your top 3 habits. Start with difficulty-{highest_difficulty_incomplete.difficulty} habits while energy is highest.",
            estimated_impact="High — habit completion rate typically increases 40% when limited to 3 targets.",
        ))
    elif len(incomplete) == 1:
        recs.append(Recommendation(
            type="HABIT_CLOSE",
            priority=_PRIORITY_HIGH,
            title="Close the loop — one habit remaining",
            description="You are one habit away from a perfect completion day.",
            action="Complete your remaining habit in the next 30 minutes to lock in today's streak.",
            estimated_impact="High — completes today's chain and preserves streak.",
        ))

    return recs


def _build_focus_recommendations(req: RecommendationRequest) -> list[Recommendation]:
    recs: list[Recommendation] = []

    completed_sessions = [s for s in req.focus_sessions if s.completed]
    total_focus_minutes = sum(s.duration_minutes for s in completed_sessions)

    if total_focus_minutes == 0:
        recs.append(Recommendation(
            type="FOCUS_START",
            priority=_PRIORITY_HIGH,
            title="No focus sessions today",
            description="Focus sessions are the highest-leverage activity in Ascend. Even 25 minutes drives significant XP and productivity score.",
            action="Start a 25-minute Pomodoro session now. Close all social media tabs first.",
            estimated_impact="High — adds 25 focus-quality minutes, +8-12 productivity score points.",
        ))
    elif total_focus_minutes < 60:
        recs.append(Recommendation(
            type="FOCUS_EXTEND",
            priority=_PRIORITY_MEDIUM,
            title="Consider a second focus session",
            description=f"You have logged {total_focus_minutes} minutes. Target is 120 minutes for optimal score.",
            action="Add one more 30-60 minute session before end of day.",
            estimated_impact="Medium — closes the gap to peak productivity score.",
        ))

    high_interruption_sessions = [s for s in completed_sessions if s.interruptions > 3]
    if len(high_interruption_sessions) >= 2:
        recs.append(Recommendation(
            type="FOCUS_QUALITY",
            priority=_PRIORITY_MEDIUM,
            title="Reduce interruptions during focus sessions",
            description=f"{len(high_interruption_sessions)} sessions had 3+ interruptions, reducing quality score.",
            action="Enable Do Not Disturb mode before starting. Close communication apps during deep work blocks.",
            estimated_impact="Medium — each interruption reduces session quality multiplier by 10%.",
        ))

    return recs


def _build_task_recommendations(req: RecommendationRequest) -> list[Recommendation]:
    recs: list[Recommendation] = []
    if not req.tasks:
        return recs

    urgent_incomplete = [t for t in req.tasks if t.priority == "URGENT" and not t.completed]
    overdue_tasks = [t for t in req.tasks if t.overdue and not t.completed]

    if urgent_incomplete:
        recs.append(Recommendation(
            type="TASK_URGENT",
            priority=_PRIORITY_HIGH,
            title=f"{len(urgent_incomplete)} urgent task(s) incomplete",
            description="Urgent tasks carry the highest priority weight and impact your task score most.",
            action="Complete urgent tasks before any MEDIUM or LOW priority work.",
            estimated_impact="High — urgent tasks are weighted 4x in the productivity score.",
        ))

    if overdue_tasks and len(overdue_tasks) > 3:
        recs.append(Recommendation(
            type="TASK_OVERDUE_CLEAR",
            priority=_PRIORITY_MEDIUM,
            title=f"Clear {len(overdue_tasks)} overdue tasks",
            description="A large overdue backlog increases cognitive load and correlates with burnout signals.",
            action="Batch-reschedule low-priority overdue tasks. Pick 2 to complete today and archive the rest.",
            estimated_impact="Medium — reduces burnout risk score and clears mental overhead.",
        ))

    return recs


def _build_social_recommendations(req: RecommendationRequest) -> list[Recommendation]:
    recs: list[Recommendation] = []
    if not req.social_usage:
        return recs

    total_social_minutes = sum(u.duration_minutes for u in req.social_usage)
    if total_social_minutes > 120:
        recs.append(Recommendation(
            type="SOCIAL_REDUCTION",
            priority=_PRIORITY_MEDIUM,
            title=f"Social media usage: {total_social_minutes} min today",
            description="High social usage correlates with lower habit completion and focus quality.",
            action="Set a hard limit of 30 minutes total per day. Use your phone's app timer feature.",
            estimated_impact="Medium — reducing to 30 min/day removes up to 10 penalty points from your score.",
        ))

    return recs


def _build_schedule_recommendation(req: RecommendationRequest) -> list[Recommendation]:
    recs: list[Recommendation] = []
    now = datetime.utcnow()
    hour = now.hour

    if hour < 9 and (not req.focus_sessions):
        recs.append(Recommendation(
            type="SCHEDULE_MORNING",
            priority=_PRIORITY_LOW,
            title="Morning focus window available",
            description="Morning hours (7-10am) have the highest cognitive performance for most people.",
            action="Schedule your most cognitively demanding habit or task in the next 2 hours.",
            estimated_impact="Low-Medium — timing habits to peak cognitive windows improves completion rates.",
        ))
    elif hour >= 20 and req.productivity_score < 50:
        recs.append(Recommendation(
            type="SCHEDULE_EOD",
            priority=_PRIORITY_MEDIUM,
            title="Evening recovery window",
            description="Score is below 50 with the day almost over.",
            action="Complete one habit and one short focus session before midnight to recover the day.",
            estimated_impact="Medium — even partial recovery significantly improves consistency score.",
        ))

    return recs


def _determine_focus_area(req: RecommendationRequest) -> str:
    if req.productivity_score < 30:
        return "Recovery — rebuild foundation habits first"
    if req.productivity_score < 60:
        if not req.focus_sessions:
            return "Focus sessions — highest untapped lever"
        return "Habit consistency — primary growth driver"
    if req.productivity_score >= 80:
        return "Optimization — fine-tune timing and eliminate remaining social penalty"
    return "Momentum — maintain current trajectory and address weak areas"


def generate_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    all_recs: list[Recommendation] = []
    all_recs.extend(_build_habit_recommendations(req))
    all_recs.extend(_build_focus_recommendations(req))
    all_recs.extend(_build_task_recommendations(req))
    all_recs.extend(_build_social_recommendations(req))
    all_recs.extend(_build_schedule_recommendation(req))

    priority_order = {_PRIORITY_HIGH: 0, _PRIORITY_MEDIUM: 1, _PRIORITY_LOW: 2}
    all_recs.sort(key=lambda r: priority_order.get(r.priority, 3))

    top_recs = all_recs[:6]
    focus_area = _determine_focus_area(req)

    return RecommendationResponse(
        user_id=req.user_id,
        recommendations=top_recs,
        focus_area=focus_area,
        generated_at=datetime.utcnow().isoformat(),
    )
