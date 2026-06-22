import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from training.base_trainer import BaseTrainer
from feature_store.feature_definitions import (
    BURNOUT_FEATURE_NAMES,
    BURNOUT_LABEL_MAP,
    BURNOUT_IDX_MAP,
)


class BurnoutTrainer(BaseTrainer):
    model_name    = "burnout_detection"
    feature_names = BURNOUT_FEATURE_NAMES
    task_type     = "multiclass"

    def _build_model(self) -> XGBClassifier:
        return XGBClassifier(
            n_estimators=250,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            num_class=3,
            objective="multi:softprob",
            random_state=42,
            n_jobs=-1,
            verbosity=0,
            eval_metric="mlogloss",
        )

    def _prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        X = df[self.feature_names].fillna(0.0).values.astype(float)
        # Accept string labels or int labels
        if df["target"].dtype == object:
            y = np.array([BURNOUT_LABEL_MAP.get(str(v).upper(), 0) for v in df["target"]], dtype=int)
        else:
            y = df["target"].values.astype(int)
        return X, y

    @staticmethod
    def generate_synthetic_data(n: int = 3000) -> pd.DataFrame:
        rng = np.random.default_rng(42)
        rows = []
        for _ in range(n):
            prod_trend   = float(rng.uniform(-30, 10))
            focus_trend  = float(rng.uniform(-60, 30))
            habit_decline = float(rng.uniform(-0.5, 0.1))
            social_inc   = float(rng.uniform(-10, 60))
            streak       = int(rng.integers(0, 60))
            overdue      = float(rng.uniform(0, 0.8))
            avg_prod_7d  = float(rng.uniform(20, 90))
            avg_prod_14d = float(rng.uniform(20, 90))
            variance     = float(rng.uniform(0, 500))
            zero_days    = int(rng.integers(0, 8))
            consec_dec   = int(rng.integers(0, 15))

            # Risk score to determine burnout level
            risk = (
                -prod_trend * 0.3
                + (-focus_trend) * 0.02
                + (-habit_decline) * 20
                + social_inc * 0.1
                + overdue * 30
                + zero_days * 3
                + consec_dec * 2
                - avg_prod_7d * 0.1
                + rng.normal(0, 5)
            )

            if risk < 20:   label = 0   # LOW
            elif risk < 45: label = 1   # MEDIUM
            else:           label = 2   # HIGH

            rows.append({
                "productivity_trend_14d":     prod_trend,
                "focus_trend_14d":            focus_trend,
                "habit_decline_rate_14d":     habit_decline,
                "social_increase_rate_14d":   social_inc,
                "streak_length":              streak,
                "overdue_task_rate":          overdue,
                "avg_productivity_score_7d":  avg_prod_7d,
                "avg_productivity_score_14d": avg_prod_14d,
                "activity_variance_7d":       variance,
                "days_with_zero_focus_7d":    zero_days,
                "consecutive_decline_days":   consec_dec,
                "target":                     label,
            })
        return pd.DataFrame(rows)
