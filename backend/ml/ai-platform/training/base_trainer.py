import time
import os
import numpy as np
import pandas as pd
import joblib
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score
from config import settings
from model_registry.registry import registry, ModelRecord


@dataclass
class TrainingResult:
    model_name: str
    version: int
    accuracy: float
    precision: float
    recall: float
    f1: float
    avg_latency_ms: float
    training_samples: int
    feature_importance: dict
    artifact_path: str
    model_record: Optional[ModelRecord] = None


class BaseTrainer(ABC):
    model_name: str
    feature_names: list[str]
    task_type: str          # 'regression' | 'binary' | 'multiclass'

    def train(self, df: pd.DataFrame) -> TrainingResult:
        X, y = self._prepare_features(df)
        model = self._build_model()
        model.fit(X, y)

        metrics   = self._evaluate(model, X, y)
        latency   = self._measure_latency(model, X)
        importance = self._extract_importance(model)

        version       = registry.get_next_version(self.model_name)
        artifact_path = os.path.join(settings.MODELS_DIR, f"{self.model_name}_v{version}.joblib")
        os.makedirs(os.path.dirname(artifact_path), exist_ok=True)
        joblib.dump(model, artifact_path)

        record = registry.register_model(
            model_name=self.model_name,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1_score=metrics["f1"],
            avg_latency_ms=latency,
            training_samples=len(X),
            feature_importance=importance,
            artifact_path=artifact_path,
        )

        return TrainingResult(
            model_name=self.model_name,
            version=version,
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1=metrics["f1"],
            avg_latency_ms=latency,
            training_samples=len(X),
            feature_importance=importance,
            artifact_path=artifact_path,
            model_record=record,
        )

    @abstractmethod
    def _prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        ...

    @abstractmethod
    def _build_model(self):
        ...

    def _evaluate(self, model, X: np.ndarray, y: np.ndarray) -> dict:
        if self.task_type == "regression":
            preds = model.predict(X)
            r2    = float(r2_score(y, preds))
            mae   = float(mean_absolute_error(y, preds))
            # Normalise MAE to a 0-1 precision-like value (lower MAE = higher precision)
            prec = max(0.0, round(1.0 - min(1.0, mae / 100.0), 4))
            return {
                "accuracy":  round(max(0.0, r2), 4),
                "precision": prec,
                "recall":    round(max(0.0, r2), 4),
                "f1":        round(max(0.0, r2), 4),
            }
        else:
            avg   = "binary" if self.task_type == "binary" else "weighted"
            preds = model.predict(X)
            return {
                "accuracy":  round(float(accuracy_score(y, preds)), 4),
                "precision": round(float(precision_score(y, preds, average=avg, zero_division=0)), 4),
                "recall":    round(float(recall_score(y, preds, average=avg, zero_division=0)), 4),
                "f1":        round(float(f1_score(y, preds, average=avg, zero_division=0)), 4),
            }

    def _measure_latency(self, model, X: np.ndarray, n: int = 200) -> float:
        sample = X[:min(n, len(X))]
        times: list[float] = []
        for row in sample:
            t0 = time.perf_counter()
            model.predict(row.reshape(1, -1))
            times.append((time.perf_counter() - t0) * 1000)
        return round(float(np.mean(times)), 3)

    def _extract_importance(self, model) -> dict:
        try:
            imp = model.feature_importances_
            return {n: round(float(v), 6) for n, v in zip(self.feature_names, imp)}
        except AttributeError:
            return {}

    def load_champion(self):
        record = registry.get_champion(self.model_name)
        if record is None:
            return None
        return joblib.load(record.artifact_path)
