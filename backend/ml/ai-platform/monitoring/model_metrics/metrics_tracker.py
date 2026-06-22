import json
import os
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Optional
from config import settings


@dataclass
class ModelMetricSnapshot:
    model_name: str
    version: int
    accuracy: float
    f1_score: float
    avg_latency_ms: float
    prediction_count: int
    timestamp: str


_METRICS_FILE = os.path.join(settings.STORAGE_DIR, "model_metrics.jsonl")


def record_snapshot(
    model_name: str,
    version: int,
    accuracy: float,
    f1_score: float,
    avg_latency_ms: float,
    prediction_count: int,
) -> ModelMetricSnapshot:
    snapshot = ModelMetricSnapshot(
        model_name=model_name,
        version=version,
        accuracy=accuracy,
        f1_score=f1_score,
        avg_latency_ms=avg_latency_ms,
        prediction_count=prediction_count,
        timestamp=datetime.utcnow().isoformat(),
    )
    os.makedirs(os.path.dirname(_METRICS_FILE), exist_ok=True)
    with open(_METRICS_FILE, "a") as f:
        f.write(json.dumps(asdict(snapshot)) + "\n")
    return snapshot


def get_snapshots(model_name: Optional[str] = None, limit: int = 100) -> list[dict]:
    if not os.path.exists(_METRICS_FILE):
        return []
    rows: list[dict] = []
    with open(_METRICS_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if model_name is None or rec.get("model_name") == model_name:
                    rows.append(rec)
            except json.JSONDecodeError:
                continue
    return rows[-limit:]


def performance_is_degraded(
    model_name: str,
    current_accuracy: float,
    accuracy_threshold: float = settings.ACCURACY_THRESHOLD,
    window: int = 5,
) -> bool:
    """Returns True if the model's recent accuracy has fallen below threshold."""
    snapshots = get_snapshots(model_name, limit=window)
    if not snapshots:
        return current_accuracy < accuracy_threshold

    recent_acc = [s["accuracy"] for s in snapshots]
    avg_recent = sum(recent_acc) / len(recent_acc)
    return avg_recent < accuracy_threshold or current_accuracy < accuracy_threshold
