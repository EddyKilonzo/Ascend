from datetime import datetime
from schemas.requests import BurnoutDetectionRequest, DailyMetrics
from schemas.responses import BurnoutDetectionResponse, BurnoutSignal, RiskLevel


def _check_habit_decline(metrics: list[DailyMetrics]) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    if len(metrics) < 3:
        return signals

    recent = [m.habit_completion_rate for m in metrics[-7:]]
    if len(recent) < 3:
        return signals

    declining_days = 0
    for i in range(1, len(recent)):
        if recent[i] < recent[i - 1] - 0.05:
            declining_days += 1

    avg_recent = sum(recent[-3:]) / 3

    if avg_recent < 0.20:
        signals.append(BurnoutSignal(
            signal_type="HABIT_COLLAPSE",
            severity="HIGH",
            description="Habit completion has dropped below 20% for 3+ consecutive days.",
        ))
    elif declining_days >= 5:
        signals.append(BurnoutSignal(
            signal_type="HABIT_DECLINE_SUSTAINED",
            severity="MEDIUM",
            description=f"Habit completion declining for {declining_days} consecutive days.",
        ))
    elif declining_days >= 3:
        signals.append(BurnoutSignal(
            signal_type="HABIT_DECLINE_EARLY",
            severity="LOW",
            description="Early signs of habit decline detected over 3 days.",
        ))

    return signals


def _check_focus_degradation(metrics: list[DailyMetrics]) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    if len(metrics) < 5:
        return signals

    early = metrics[:len(metrics) // 2]
    recent = metrics[len(metrics) // 2:]

    avg_early = sum(m.focus_minutes for m in early) / max(len(early), 1)
    avg_recent = sum(m.focus_minutes for m in recent) / max(len(recent), 1)

    if avg_early == 0:
        return signals

    drop_pct = (avg_early - avg_recent) / avg_early

    if drop_pct >= 0.60:
        signals.append(BurnoutSignal(
            signal_type="FOCUS_COLLAPSE",
            severity="HIGH",
            description=f"Focus session time dropped by {drop_pct:.0%} compared to earlier period.",
        ))
    elif drop_pct >= 0.35:
        signals.append(BurnoutSignal(
            signal_type="FOCUS_DEGRADATION",
            severity="MEDIUM",
            description=f"Focus output declining — {drop_pct:.0%} drop detected.",
        ))

    return signals


def _check_social_spike(metrics: list[DailyMetrics]) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    if len(metrics) < 4:
        return signals

    baseline = metrics[:-3]
    recent = metrics[-3:]

    avg_baseline = sum(m.social_usage_minutes for m in baseline) / max(len(baseline), 1)
    avg_recent = sum(m.social_usage_minutes for m in recent) / max(len(recent), 1)

    if avg_baseline == 0 and avg_recent > 60:
        signals.append(BurnoutSignal(
            signal_type="SOCIAL_MEDIA_SPIKE",
            severity="MEDIUM",
            description=f"Social media usage spiked to {avg_recent:.0f} min/day with no historical baseline.",
        ))
        return signals

    if avg_baseline > 0:
        ratio = avg_recent / avg_baseline
        if ratio >= 2.0:
            signals.append(BurnoutSignal(
                signal_type="SOCIAL_MEDIA_SPIKE",
                severity="HIGH" if ratio >= 3.0 else "MEDIUM",
                description=f"Social media usage increased {ratio:.1f}x above baseline — common escapism signal.",
            ))

    return signals


def _check_xp_decline(metrics: list[DailyMetrics]) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    if len(metrics) < 6:
        return signals

    first_half = metrics[:len(metrics) // 2]
    second_half = metrics[len(metrics) // 2:]

    avg_first = sum(m.xp_earned for m in first_half) / max(len(first_half), 1)
    avg_second = sum(m.xp_earned for m in second_half) / max(len(second_half), 1)

    if avg_first > 0:
        drop = (avg_first - avg_second) / avg_first
        if drop >= 0.50:
            signals.append(BurnoutSignal(
                signal_type="XP_DECLINE",
                severity="MEDIUM",
                description=f"XP earned dropped by {drop:.0%} — engagement significantly reduced.",
            ))

    return signals


def _check_late_night_activity(metrics: list[DailyMetrics]) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    late_night_days = 0

    for m in metrics[-7:]:
        late_actions = sum(
            1 for ts in m.activity_timestamps
            if _is_late_night(ts)
        )
        if late_actions > 0 and len(m.activity_timestamps) > 0:
            ratio = late_actions / len(m.activity_timestamps)
            if ratio > 0.5:
                late_night_days += 1

    if late_night_days >= 3:
        signals.append(BurnoutSignal(
            signal_type="LATE_NIGHT_PATTERN",
            severity="LOW",
            description=f"Activity shifting to late night hours on {late_night_days} days — potential sleep disruption.",
        ))

    return signals


def _is_late_night(ts: str) -> bool:
    try:
        hour = datetime.fromisoformat(ts).hour
        return hour >= 23 or hour < 5
    except Exception:
        return False


def _check_task_overload(req: BurnoutDetectionRequest) -> list[BurnoutSignal]:
    signals: list[BurnoutSignal] = []
    if req.total_task_count == 0:
        return signals

    overdue_ratio = req.overdue_task_count / req.total_task_count
    if overdue_ratio >= 0.60:
        signals.append(BurnoutSignal(
            signal_type="TASK_OVERLOAD",
            severity="HIGH",
            description=f"{overdue_ratio:.0%} of tasks are overdue — unsustainable workload or avoidance behavior.",
        ))
    elif overdue_ratio >= 0.35:
        signals.append(BurnoutSignal(
            signal_type="TASK_BACKLOG",
            severity="MEDIUM",
            description=f"{overdue_ratio:.0%} of tasks overdue — backlog accumulating.",
        ))

    return signals


_SEVERITY_SCORES = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
_RISK_THRESHOLDS = [(8, RiskLevel.CRITICAL), (5, RiskLevel.HIGH), (3, RiskLevel.MEDIUM), (0, RiskLevel.LOW)]


def _score_to_risk(score: int) -> RiskLevel:
    for threshold, level in _RISK_THRESHOLDS:
        if score >= threshold:
            return level
    return RiskLevel.LOW


def _build_recommendations(signals: list[BurnoutSignal], risk: RiskLevel) -> list[str]:
    recs: list[str] = []

    types = {s.signal_type for s in signals}

    if "HABIT_COLLAPSE" in types or "HABIT_DECLINE_SUSTAINED" in types:
        recs.append("Reduce habit count to 3 core habits and rebuild momentum from there.")
    if "FOCUS_COLLAPSE" in types or "FOCUS_DEGRADATION" in types:
        recs.append("Schedule one 25-minute focus block daily — start smaller to restart the pattern.")
    if "SOCIAL_MEDIA_SPIKE" in types:
        recs.append("Set a hard daily limit on social media. Use app-level blocking tools during productive hours.")
    if "XP_DECLINE" in types:
        recs.append("Re-examine which habits and goals still feel meaningful. Prune anything that does not.")
    if "LATE_NIGHT_PATTERN" in types:
        recs.append("Protect sleep — disable app notifications after 10pm. Sleep quality directly drives next-day performance.")
    if "TASK_OVERLOAD" in types or "TASK_BACKLOG" in types:
        recs.append("Archive or reschedule low-priority tasks. Focus on one URGENT item per day until the backlog clears.")

    if risk == RiskLevel.CRITICAL:
        recs.insert(0, "Critical burnout risk detected. Consider taking a structured 2-3 day break before resuming full workload.")
    elif risk == RiskLevel.HIGH:
        recs.insert(0, "High burnout risk. Scale back commitments by 40% this week and focus on recovery habits.")

    return recs or ["You are in a healthy productivity rhythm. Maintain your current patterns."]


def detect_burnout(req: BurnoutDetectionRequest) -> BurnoutDetectionResponse:
    all_signals: list[BurnoutSignal] = []
    all_signals.extend(_check_habit_decline(req.daily_metrics))
    all_signals.extend(_check_focus_degradation(req.daily_metrics))
    all_signals.extend(_check_social_spike(req.daily_metrics))
    all_signals.extend(_check_xp_decline(req.daily_metrics))
    all_signals.extend(_check_late_night_activity(req.daily_metrics))
    all_signals.extend(_check_task_overload(req))

    risk_score = sum(_SEVERITY_SCORES.get(s.severity, 0) for s in all_signals)
    risk_level = _score_to_risk(risk_score)
    recommendations = _build_recommendations(all_signals, risk_level)

    return BurnoutDetectionResponse(
        user_id=req.user_id,
        risk_level=risk_level,
        risk_score=risk_score,
        signals=all_signals,
        recommendations=recommendations,
        assessed_at=datetime.utcnow().isoformat(),
    )
