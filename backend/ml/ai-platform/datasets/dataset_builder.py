"""
Assembles training datasets from the feature store.

For initial bootstrap (no user data yet), each trainer's generate_synthetic_data()
is used. Once real feature vectors accumulate in storage/features/, this module
loads them and merges into a DataFrame ready for training.
"""

import os
import json
import glob
import pandas as pd
from config import settings
from anti_poison.poison_detector import get_excluded_users


def build_dataset(model_type: str, min_records: int = settings.MIN_TRAINING_SAMPLES) -> pd.DataFrame:
    excluded  = set(get_excluded_users())
    base_path = os.path.join(settings.FEATURE_STORE_DIR, model_type, "*.jsonl")
    records: list[dict] = []

    for filepath in glob.glob(base_path):
        user_id = os.path.splitext(os.path.basename(filepath))[0]
        if user_id in excluded:
            continue
        with open(filepath) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if len(records) < min_records:
        return pd.DataFrame()

    df = pd.DataFrame(records)
    df = df.drop_duplicates()
    df = df.dropna(subset=["target"])
    return df.reset_index(drop=True)


def dataset_size(model_type: str) -> int:
    base_path = os.path.join(settings.FEATURE_STORE_DIR, model_type, "*.jsonl")
    excluded  = set(get_excluded_users())
    total = 0
    for filepath in glob.glob(base_path):
        user_id = os.path.splitext(os.path.basename(filepath))[0]
        if user_id in excluded:
            continue
        with open(filepath) as f:
            total += sum(1 for _ in f)
    return total
