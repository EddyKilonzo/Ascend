import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from training.base_trainer import BaseTrainer
from feature_store.feature_definitions import RECOMMENDATION_FEATURE_NAMES, RECOMMENDATION_LABELS


_LABEL_MAP = {label: idx for idx, label in enumerate(RECOMMENDATION_LABELS)}
_IDX_MAP   = {idx: label for label, idx in _LABEL_MAP.items()}


class RecommendationTrainer(BaseTrainer):
    model_name    = "recommendation_engine"
    feature_names = RECOMMENDATION_FEATURE_NAMES
    task_type     = "multiclass"

    def _build_model(self) -> XGBClassifier:
        return XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            num_class=len(RECOMMENDATION_LABELS),
            objective="multi:softprob",
            random_state=42,
            n_jobs=-1,
            verbosity=0,
            eval_metric="mlogloss",
        )

    def _prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        X = df[self.feature_names].fillna(0.0).values.astype(float)
        if df["target"].dtype == object:
            y = np.array([_LABEL_MAP.get(str(v).upper(), 0) for v in df["target"]], dtype=int)
        else:
            y = df["target"].values.astype(int)
        return X, y

    @staticmethod
    def generate_synthetic_data(n: int = 4000) -> pd.DataFrame:
        rng = np.random.default_rng(42)
        rows = []
        for _ in range(n):
            score      = float(rng.uniform(10, 95))
            habit_rate = float(rng.uniform(0, 1))
            focus_sc   = float(rng.uniform(0, 100))
            social_pen = float(rng.uniform(0, 20))
            streak     = int(rng.integers(0, 60))
            overdue    = float(rng.uniform(0, 0.6))
            focus_def  = int(focus_sc < 30)
            habit_def  = int(habit_rate < 0.4)
            social_ov  = int(social_pen > 10)

            # Rule-based label generation (reflects domain logic)
            if social_ov:
                label = _LABEL_MAP["SOCIAL"]
            elif focus_def:
                label = _LABEL_MAP["FOCUS"]
            elif habit_def:
                label = _LABEL_MAP["HABIT"]
            elif overdue > 0.3:
                label = _LABEL_MAP["TASK"]
            elif score < 40:
                label = _LABEL_MAP["RECOVERY"]
            else:
                label = _LABEL_MAP["SCHEDULE"]

            rows.append({
                "productivity_score":       score,
                "habit_completion_rate_7d": habit_rate,
                "focus_score_7d":           focus_sc,
                "social_penalty_7d":        social_pen,
                "streak_length":            streak,
                "overdue_task_rate":        overdue,
                "has_focus_deficit":        focus_def,
                "has_habit_deficit":        habit_def,
                "has_social_overuse":       social_ov,
                "target":                   label,
            })
        return pd.DataFrame(rows)
