from __future__ import annotations

"""Validates and enriches a UserContext received from NestJS before coaching."""

from schemas.requests import UserContext


def validate_and_enrich(context: UserContext) -> UserContext:
    """
    Clamp out-of-range values and derive any missing derived fields.
    NestJS is the source of truth — this is defensive normalization only.
    """
    p = context.productivity
    p.score_today = max(0.0, min(100.0, p.score_today))
    p.score_7d_avg = max(0.0, min(100.0, p.score_7d_avg))
    p.score_30d_avg = max(0.0, min(100.0, p.score_30d_avg))

    f = context.focus
    f.total_minutes_today = max(0, f.total_minutes_today)

    s = context.social
    s.avg_minutes_today = max(0, s.avg_minutes_today)

    return context
