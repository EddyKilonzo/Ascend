"""
Collects recommendation feedback from NestJS and stores it in the registry.

Accepted recommendations with positive outcomes become future training labels
for the recommendation engine. This closes the feedback loop without requiring
NestJS to have any knowledge of ML internals.
"""

from dataclasses import dataclass
from typing import Optional
from model_registry.registry import registry


@dataclass
class FeedbackRecord:
    recommendation_id: str
    user_id: str
    recommendation_type: str
    accepted: bool
    helpful: Optional[bool]
    feedback_text: Optional[str]


def record_feedback(feedback: FeedbackRecord) -> None:
    registry.log_feedback(
        recommendation_id=feedback.recommendation_id,
        user_id=feedback.user_id,
        recommendation_type=feedback.recommendation_type,
        accepted=feedback.accepted,
        helpful=feedback.helpful,
        feedback_text=feedback.feedback_text,
    )


def get_acceptance_rate(recommendation_type: Optional[str] = None) -> dict:
    """Returns acceptance stats used to weight recommendation types during retraining."""
    with registry._conn() as conn:
        if recommendation_type:
            rows = conn.execute(
                """SELECT accepted, COUNT(*) as cnt
                   FROM recommendation_feedback
                   WHERE recommendation_type = ?
                   GROUP BY accepted""",
                (recommendation_type,),
            ).fetchall()
        else:
            rows = conn.execute(
                """SELECT recommendation_type, accepted, COUNT(*) as cnt
                   FROM recommendation_feedback
                   GROUP BY recommendation_type, accepted"""
            ).fetchall()

    result: dict = {}
    for row in rows:
        if recommendation_type:
            key = "accepted" if row["accepted"] else "rejected"
            result[key] = row["cnt"]
        else:
            rtype = row["recommendation_type"]
            if rtype not in result:
                result[rtype] = {"accepted": 0, "rejected": 0}
            key = "accepted" if row["accepted"] else "rejected"
            result[rtype][key] = row["cnt"]

    return result
