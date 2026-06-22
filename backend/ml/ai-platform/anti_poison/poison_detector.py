"""
Flags users whose training data should be excluded.

Users excluded here are marked in the feature store so the dataset builder
skips them during training. This prevents XP farmers and bot accounts from
polluting the model's understanding of healthy productivity patterns.
"""

import json
import os
from datetime import datetime
from dataclasses import dataclass
from config import settings

_EXCLUDED_FILE = os.path.join(settings.STORAGE_DIR, "excluded_users.json")


@dataclass
class PoisonVerdict:
    user_id: str
    excluded: bool
    cheat_confidence: float
    reasons: list[str]
    evaluated_at: str


def _load_excluded() -> dict[str, dict]:
    if not os.path.exists(_EXCLUDED_FILE):
        return {}
    with open(_EXCLUDED_FILE) as f:
        return json.load(f)


def _save_excluded(data: dict[str, dict]) -> None:
    os.makedirs(os.path.dirname(_EXCLUDED_FILE) if os.path.dirname(_EXCLUDED_FILE) else ".", exist_ok=True)
    with open(_EXCLUDED_FILE, "w") as f:
        json.dump(data, f, indent=2)


def evaluate_user(
    user_id: str,
    cheat_confidence: float,
    cheat_flags: list[str],
) -> PoisonVerdict:
    threshold = settings.EXCLUDED_FROM_TRAINING_CHEAT_THRESHOLD
    excluded  = cheat_confidence >= threshold
    reasons   = cheat_flags if excluded else []

    if excluded:
        data = _load_excluded()
        data[user_id] = {
            "cheat_confidence": cheat_confidence,
            "reasons": reasons,
            "excluded_at": datetime.utcnow().isoformat(),
        }
        _save_excluded(data)

    return PoisonVerdict(
        user_id=user_id,
        excluded=excluded,
        cheat_confidence=round(cheat_confidence, 4),
        reasons=reasons,
        evaluated_at=datetime.utcnow().isoformat(),
    )


def is_excluded(user_id: str) -> bool:
    return user_id in _load_excluded()


def reinstate_user(user_id: str) -> bool:
    data = _load_excluded()
    if user_id not in data:
        return False
    del data[user_id]
    _save_excluded(data)
    return True


def get_excluded_users() -> list[str]:
    return list(_load_excluded().keys())


def get_excluded_count() -> int:
    return len(_load_excluded())
