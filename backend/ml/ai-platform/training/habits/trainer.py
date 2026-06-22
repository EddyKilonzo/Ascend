import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from training.base_trainer import BaseTrainer
from feature_store.feature_definitions import HABIT_FEATURE_NAMES


class HabitTrainer(BaseTrainer):
    model_name    = "habit_completion"
    feature_names = HABIT_FEATURE_NAMES
    task_type     = "binary"

    def _build_model(self) -> XGBClassifier:
        return XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=1.2,   # slight class-imbalance correction
            random_state=42,
            n_jobs=-1,
            verbosity=0,
            eval_metric="logloss",
        )

    def _prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        X = df[self.feature_names].fillna(0.0).values.astype(float)
        y = df["target"].values.astype(int)
        return X, y

    @staticmethod
    def generate_synthetic_data(n: int = 4000) -> pd.DataFrame:
        rng = np.random.default_rng(42)
        rows = []
        for _ in range(n):
            difficulty   = int(rng.integers(1, 6))
            age_days     = int(rng.integers(0, 180))
            streak       = int(rng.integers(0, 60))
            rate_7d      = float(rng.uniform(0, 1))
            rate_30d     = float(rng.uniform(0, 1))
            hour         = int(rng.integers(0, 24))
            dow          = int(rng.integers(0, 7))
            focus        = float(rng.uniform(0, 180))
            score_yest   = float(rng.uniform(10, 100))
            missed_yest  = int(rng.integers(0, 2))

            # Probability of completion based on known drivers
            p = (
                0.3 * rate_7d
                + 0.2 * (streak / 60)
                + 0.15 * (1.0 - difficulty / 5.0)
                + 0.15 * (score_yest / 100.0)
                + 0.1 * (focus / 180.0)
                - 0.1 * missed_yest
                + rng.normal(0, 0.05)
            )
            target = int(np.clip(p, 0.0, 1.0) > 0.5)

            rows.append({
                "habit_difficulty":             difficulty,
                "habit_age_days":               age_days,
                "current_streak":               streak,
                "completion_rate_7d":           rate_7d,
                "completion_rate_30d":          rate_30d,
                "hour_of_target":               hour,
                "day_of_week":                  dow,
                "avg_focus_minutes_7d":         focus,
                "productivity_score_yesterday": score_yest,
                "missed_yesterday":             missed_yest,
                "target":                       target,
            })
        return pd.DataFrame(rows)
