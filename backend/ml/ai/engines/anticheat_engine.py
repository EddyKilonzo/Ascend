from datetime import datetime, timedelta
from collections import defaultdict
import statistics
from schemas.requests import AntiCheatRequest, XPEvent, HabitHistoryEntry, UserAction
from schemas.responses import AntiCheatResponse, CheatDetection, CheatFlag

_MAX_NORMAL_XP_PER_HOUR = 500
_MAX_NORMAL_ACTIONS_PER_MINUTE = 8
_VELOCITY_WINDOW_SECONDS = 30
_EXACT_TIME_TOLERANCE_SECONDS = 30


def _detect_xp_farming(events: list[XPEvent], period_hours: int) -> list[CheatDetection]:
    detections: list[CheatDetection] = []
    if len(events) < 5:
        return detections

    hourly_xp: dict[str, int] = defaultdict(int)
    for event in events:
        try:
            hour_key = event.timestamp[:13]
            hourly_xp[hour_key] += event.xp_amount
        except Exception:
            continue

    xp_values = list(hourly_xp.values())
    if len(xp_values) < 2:
        return detections

    mean_xp = statistics.mean(xp_values)
    stdev_xp = statistics.stdev(xp_values) if len(xp_values) > 1 else 0.0

    for hour, xp in hourly_xp.items():
        if xp > _MAX_NORMAL_XP_PER_HOUR:
            confidence = min(0.99, 0.70 + (xp - _MAX_NORMAL_XP_PER_HOUR) / 1000.0)
            detections.append(CheatDetection(
                flag=CheatFlag.XP_FARMING,
                confidence=round(confidence, 3),
                evidence=f"Hour {hour}: {xp} XP — exceeds maximum normal threshold of {_MAX_NORMAL_XP_PER_HOUR}.",
                severity="HIGH" if xp > _MAX_NORMAL_XP_PER_HOUR * 2 else "MEDIUM",
            ))
        elif stdev_xp > 0 and (xp - mean_xp) / stdev_xp > 3.0:
            detections.append(CheatDetection(
                flag=CheatFlag.XP_FARMING,
                confidence=0.65,
                evidence=f"Hour {hour}: {xp} XP — {((xp - mean_xp) / stdev_xp):.1f} standard deviations above mean.",
                severity="LOW",
            ))

    return detections


def _detect_fake_streak(completions: list[HabitHistoryEntry]) -> list[CheatDetection]:
    detections: list[CheatDetection] = []
    if len(completions) < 5:
        return detections

    completed_entries = [c for c in completions if c.completed and c.completion_time]
    if len(completed_entries) < 3:
        return detections

    completion_hours: list[int] = []
    for entry in completed_entries:
        try:
            hour = datetime.fromisoformat(entry.completion_time).hour
            completion_hours.append(hour)
        except Exception:
            continue

    if not completion_hours:
        return detections

    exact_time_cluster = defaultdict(int)
    for entry in completed_entries:
        try:
            dt = datetime.fromisoformat(entry.completion_time)
            time_key = f"{dt.hour:02d}:{dt.minute:02d}"
            exact_time_cluster[time_key] += 1
        except Exception:
            continue

    max_cluster = max(exact_time_cluster.values()) if exact_time_cluster else 0
    if max_cluster >= 5 and max_cluster / len(completed_entries) >= 0.7:
        dominant_time = max(exact_time_cluster, key=exact_time_cluster.get)
        detections.append(CheatDetection(
            flag=CheatFlag.FAKE_STREAK,
            confidence=round(min(0.95, 0.60 + max_cluster * 0.05), 3),
            evidence=f"{max_cluster} completions at identical time {dominant_time} — statistically improbable for organic behavior.",
            severity="HIGH",
        ))

    off_hours_ratio = sum(1 for h in completion_hours if h < 5 or h > 22) / max(len(completion_hours), 1)
    if off_hours_ratio > 0.60 and len(completion_hours) >= 7:
        detections.append(CheatDetection(
            flag=CheatFlag.FAKE_STREAK,
            confidence=0.60,
            evidence=f"{off_hours_ratio:.0%} of habit completions logged between midnight and 5am.",
            severity="MEDIUM",
        ))

    return detections


def _detect_velocity_anomaly(actions: list[UserAction]) -> list[CheatDetection]:
    detections: list[CheatDetection] = []
    if len(actions) < 10:
        return detections

    windows: dict[str, list[str]] = defaultdict(list)
    for action in actions:
        try:
            dt = datetime.fromisoformat(action.timestamp)
            window_key = f"{dt.year}-{dt.month:02d}-{dt.day:02d}-{dt.hour:02d}-{dt.minute // 2}"
            windows[window_key].append(action.action_type)
        except Exception:
            continue

    for window, action_types in windows.items():
        rate_per_30s = len(action_types) / 2.0
        if rate_per_30s > _MAX_NORMAL_ACTIONS_PER_MINUTE:
            detections.append(CheatDetection(
                flag=CheatFlag.VELOCITY_ANOMALY,
                confidence=round(min(0.95, 0.65 + (rate_per_30s - _MAX_NORMAL_ACTIONS_PER_MINUTE) * 0.05), 3),
                evidence=f"Window {window}: {len(action_types)} actions in 2 minutes — exceeds human interaction rate.",
                severity="HIGH" if rate_per_30s > _MAX_NORMAL_ACTIONS_PER_MINUTE * 2 else "MEDIUM",
            ))

    return detections


def _detect_statistical_outliers(
    xp_events: list[XPEvent],
    completions: list[HabitHistoryEntry],
) -> list[CheatDetection]:
    detections: list[CheatDetection] = []

    daily_xp: dict[str, int] = defaultdict(int)
    for event in xp_events:
        try:
            date_key = event.timestamp[:10]
            daily_xp[date_key] += event.xp_amount
        except Exception:
            continue

    if len(daily_xp) < 5:
        return detections

    values = list(daily_xp.values())
    mean = statistics.mean(values)
    stdev = statistics.stdev(values) if len(values) > 1 else 0.0

    if stdev == 0:
        return detections

    for date, xp in daily_xp.items():
        z_score = (xp - mean) / stdev
        if z_score > 4.0:
            detections.append(CheatDetection(
                flag=CheatFlag.STATISTICAL_OUTLIER,
                confidence=round(min(0.88, 0.60 + (z_score - 4.0) * 0.05), 3),
                evidence=f"Date {date}: {xp} XP — z-score {z_score:.1f}, statistically anomalous.",
                severity="MEDIUM",
            ))

    return detections


def _compute_overall_risk(detections: list[CheatDetection]) -> str:
    if not detections:
        return "CLEAN"
    max_confidence = max(d.confidence for d in detections)
    high_severity = any(d.severity == "HIGH" for d in detections)

    if high_severity and max_confidence > 0.80:
        return "HIGH"
    if max_confidence > 0.65 or len(detections) >= 3:
        return "MEDIUM"
    return "LOW"


def _recommend_xp_reduction(detections: list[CheatDetection], overall_risk: str) -> tuple[bool, float]:
    if overall_risk == "CLEAN" or overall_risk == "LOW":
        return False, 0.0
    if overall_risk == "HIGH":
        avg_conf = sum(d.confidence for d in detections) / max(len(detections), 1)
        return True, round(min(100.0, avg_conf * 80), 1)
    return True, 20.0


def check_anticheat(req: AntiCheatRequest) -> AntiCheatResponse:
    all_detections: list[CheatDetection] = []
    all_detections.extend(_detect_xp_farming(req.xp_events, req.period_hours))
    all_detections.extend(_detect_fake_streak(req.habit_completions))
    all_detections.extend(_detect_velocity_anomaly(req.recent_actions))
    all_detections.extend(_detect_statistical_outliers(req.xp_events, req.habit_completions))

    if not all_detections:
        all_detections.append(CheatDetection(
            flag=CheatFlag.CLEAN,
            confidence=1.0,
            evidence="No anomalies detected.",
            severity="NONE",
        ))

    overall_risk = _compute_overall_risk([d for d in all_detections if d.flag != CheatFlag.CLEAN])
    is_suspicious = overall_risk not in ("CLEAN",) and any(d.flag != CheatFlag.CLEAN for d in all_detections)
    xp_adjust, xp_reduction_pct = _recommend_xp_reduction(all_detections, overall_risk)

    return AntiCheatResponse(
        user_id=req.user_id,
        is_suspicious=is_suspicious,
        overall_risk=overall_risk,
        detections=all_detections,
        xp_adjustment_recommended=xp_adjust,
        recommended_xp_reduction_pct=xp_reduction_pct,
        assessed_at=datetime.utcnow().isoformat(),
    )
