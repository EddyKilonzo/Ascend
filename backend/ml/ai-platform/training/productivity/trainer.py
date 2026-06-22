import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from training.base_trainer import BaseTrainer
from feature_store.feature_definitions import PRODUCTIVITY_FEATURE_NAMES


class ProductivityTrainer(BaseTrainer):
    model_name    = "productivity_score"
    feature_names = PRODUCTIVITY_FEATURE_NAMES
    task_type     = "regression"

    def _build_model(self) -> XGBRegressor:
        return XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )

    def _prepare_features(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        X = df[self.feature_names].fillna(0.0).values.astype(float)
        y = df["target"].values.astype(float)
        return X, y

    @staticmethod
    def generate_synthetic_data(n: int = 3000) -> pd.DataFrame:
        rng = np.random.default_rng(42)
        rows = []
        for _ in range(n):
            focus_7d    = float(rng.uniform(0, 200))
            focus_30d   = float(rng.uniform(0, 180))
            habit_7d    = float(rng.uniform(0, 1))
            habit_30d   = float(rng.uniform(0, 1))
            task_7d     = float(rng.uniform(0, 1))
            social_7d   = float(rng.uniform(0, 120))
            streak      = int(rng.integers(0, 60))
            habits_cnt  = int(rng.integers(0, 10))
            xp_7d       = float(rng.uniform(0, 5000))
            goals       = int(rng.integers(0, 5))
            trend       = float(rng.uniform(-20, 20))
            overdue     = float(rng.uniform(0, 0.5))
            sessions    = int(rng.integers(0, 20))

            raw = (
                habit_7d * 35
                + (min(focus_7d, 120) / 120) * 25
                + task_7d * 20
                + (streak / 30) * 10
                - (social_7d / 60) * 5
                - overdue * 5
            )
            target = float(np.clip(raw + rng.normal(0, 5), 0, 100))

            rows.append({
                "avg_focus_minutes_7d":      focus_7d,
                "avg_focus_minutes_30d":     focus_30d,
                "focus_session_count_7d":    sessions,
                "habit_completion_rate_7d":  habit_7d,
                "habit_completion_rate_30d": habit_30d,
                "task_completion_rate_7d":   task_7d,
                "avg_social_minutes_7d":     social_7d,
                "streak_length":             streak,
                "active_habits_count":       habits_cnt,
                "xp_earned_7d":              xp_7d,
                "goal_count":                goals,
                "productivity_trend_7d":     trend,
                "overdue_task_rate":         overdue,
                "target":                    target,
            })
        return pd.DataFrame(rows)
