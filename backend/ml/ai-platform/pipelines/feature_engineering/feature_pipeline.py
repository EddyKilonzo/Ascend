"""
Transforms raw feature vectors before training / inference.

Current transforms:
- Clip numeric features to their defined min/max bounds
- Fill missing values with feature defaults
- Cast boolean features to 0/1
"""

import numpy as np
import pandas as pd
from feature_store.feature_definitions import (
    FeatureSpec,
    PRODUCTIVITY_FEATURES,
    HABIT_FEATURES,
    BURNOUT_FEATURES,
    RECOMMENDATION_FEATURES,
)

_FEATURE_MAP: dict[str, list[FeatureSpec]] = {
    "productivity":    PRODUCTIVITY_FEATURES,
    "habits":          HABIT_FEATURES,
    "burnout":         BURNOUT_FEATURES,
    "recommendations": RECOMMENDATION_FEATURES,
}


def transform(df: pd.DataFrame, model_type: str) -> pd.DataFrame:
    specs = _FEATURE_MAP.get(model_type, [])
    df = df.copy()

    for spec in specs:
        if spec.name not in df.columns:
            df[spec.name] = spec.default
            continue
        df[spec.name] = df[spec.name].fillna(spec.default)
        if spec.min_val is not None and spec.max_val is not None:
            df[spec.name] = df[spec.name].clip(spec.min_val, spec.max_val)
        if spec.dtype == "bool":
            df[spec.name] = df[spec.name].astype(int)
        elif spec.dtype == "int":
            df[spec.name] = df[spec.name].round().astype(int)
        else:
            df[spec.name] = df[spec.name].astype(float)

    return df


def transform_vector(vector: dict, model_type: str) -> dict:
    specs = _FEATURE_MAP.get(model_type, [])
    result: dict = {}
    for spec in specs:
        val = vector.get(spec.name, spec.default)
        if val is None:
            val = spec.default
        if spec.min_val is not None:
            val = max(spec.min_val, val)
        if spec.max_val is not None:
            val = min(spec.max_val, val)
        if spec.dtype == "bool":
            val = int(bool(val))
        elif spec.dtype == "int":
            val = int(round(val))
        else:
            val = float(val)
        result[spec.name] = val
    return result
