from schemas.requests import SocialImpactRequest, SocialUsageRecord
from schemas.responses import SocialImpactResponse, PlatformImpact

_PLATFORM_IMPACT_COEFFICIENTS: dict[str, float] = {
    "TikTok": 2.0,
    "tiktok": 2.0,
    "Instagram": 1.5,
    "instagram": 1.5,
    "Facebook": 1.2,
    "facebook": 1.2,
    "Twitter": 1.0,
    "twitter": 1.0,
    "X": 1.0,
    "Reddit": 1.3,
    "reddit": 1.3,
    "YouTube": 1.4,
    "youtube": 1.4,
    "Snapchat": 1.5,
    "snapchat": 1.5,
    "LinkedIn": 0.5,
    "linkedin": 0.5,
}

_LOW_IMPACT_COEFFICIENT = 0.8
_MAX_PENALTY = 25.0


def _normalize_platform(platform: str) -> str:
    return platform.strip().title()


def _aggregate_by_platform(usage: list[SocialUsageRecord]) -> dict[str, float]:
    totals: dict[str, float] = {}
    for record in usage:
        key = _normalize_platform(record.platform)
        totals[key] = totals.get(key, 0.0) + record.duration_minutes
    return totals


def _compute_platform_penalty(platform: str, total_minutes: float, period_days: int) -> float:
    daily_avg = total_minutes / max(period_days, 1)
    coefficient = _PLATFORM_IMPACT_COEFFICIENTS.get(
        platform, _PLATFORM_IMPACT_COEFFICIENTS.get(platform.lower(), _LOW_IMPACT_COEFFICIENT)
    )
    raw_penalty = (daily_avg * coefficient) / 30.0
    return round(min(5.0, raw_penalty), 3)


def _compute_productivity_correlation(
    platform: str,
    total_minutes: float,
    productivity_scores: list[float],
    period_days: int,
) -> float:
    if not productivity_scores:
        return -0.1

    daily_avg = total_minutes / max(period_days, 1)
    coefficient = _PLATFORM_IMPACT_COEFFICIENTS.get(
        platform, _PLATFORM_IMPACT_COEFFICIENTS.get(platform.lower(), _LOW_IMPACT_COEFFICIENT)
    )

    if daily_avg > 120:
        base_correlation = -0.6 * (coefficient / 2.0)
    elif daily_avg > 60:
        base_correlation = -0.35 * (coefficient / 2.0)
    elif daily_avg > 30:
        base_correlation = -0.15 * (coefficient / 2.0)
    else:
        base_correlation = 0.0

    return round(max(-1.0, min(0.0, base_correlation)), 3)


def _build_recommendations(
    platform_impacts: list[PlatformImpact],
    total_penalty: float,
    most_impactful: str | None,
) -> list[str]:
    recs: list[str] = []

    if total_penalty < 2.0:
        recs.append("Social media usage is well-controlled. No action needed.")
        return recs

    if most_impactful:
        worst = next((p for p in platform_impacts if p.platform == most_impactful), None)
        if worst:
            recs.append(
                f"{most_impactful} is your biggest productivity drain ({worst.daily_avg_minutes:.0f} min/day). "
                f"Capping it at 20 min/day could recover {worst.penalty_score:.1f} productivity points."
            )

    heavy_platforms = [p for p in platform_impacts if p.daily_avg_minutes > 60]
    if heavy_platforms:
        names = ", ".join(p.platform for p in heavy_platforms)
        recs.append(f"Heavy usage detected on: {names}. Schedule a single 20-minute session after work instead of passive browsing.")

    if total_penalty > 10:
        recs.append(
            "Total social media penalty exceeds 10 points. "
            "Consider a 7-day reduced-usage challenge — studies show habits form within 3 days of reduction."
        )
    elif total_penalty > 5:
        recs.append("Moderate social media impact on productivity. Batch all usage to one time block (e.g., 8pm-8:30pm).")

    return recs


def analyze_social_impact(req: SocialImpactRequest) -> SocialImpactResponse:
    platform_totals = _aggregate_by_platform(req.social_usage)

    platform_impacts: list[PlatformImpact] = []
    for platform, total_minutes in platform_totals.items():
        daily_avg = total_minutes / max(req.period_days, 1)
        penalty = _compute_platform_penalty(platform, total_minutes, req.period_days)
        correlation = _compute_productivity_correlation(
            platform, total_minutes, req.productivity_scores, req.period_days
        )
        platform_impacts.append(PlatformImpact(
            platform=platform,
            daily_avg_minutes=round(daily_avg, 1),
            productivity_correlation=correlation,
            penalty_score=penalty,
        ))

    platform_impacts.sort(key=lambda p: p.penalty_score, reverse=True)
    total_penalty = min(_MAX_PENALTY, sum(p.penalty_score for p in platform_impacts))
    most_impactful = platform_impacts[0].platform if platform_impacts else None

    avg_score = sum(req.productivity_scores) / max(len(req.productivity_scores), 1) if req.productivity_scores else 70.0
    estimated_loss_pct = round(min(30.0, (total_penalty / avg_score) * 100), 1) if avg_score > 0 else 0.0

    recommendations = _build_recommendations(platform_impacts, total_penalty, most_impactful)

    return SocialImpactResponse(
        user_id=req.user_id,
        total_penalty=round(total_penalty, 2),
        platform_breakdown=platform_impacts,
        most_impactful_platform=most_impactful,
        estimated_productivity_loss_pct=estimated_loss_pct,
        recommendations=recommendations,
    )
