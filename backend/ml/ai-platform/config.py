from pydantic_settings import BaseSettings
from typing import Optional
import os


class PlatformSettings(BaseSettings):
    APP_NAME: str = "Ascend AI Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 5001

    PLATFORM_API_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4000"]

    # Redis — DB 1 keeps this separate from the inference service on DB 0
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 1
    CACHE_TTL: int = 600

    # Storage
    STORAGE_DIR: str = "storage"
    MODELS_DIR: str = "storage/models"
    FEATURE_STORE_DIR: str = "storage/features"
    DATASETS_DIR: str = "storage/datasets"
    REGISTRY_DB_PATH: str = "storage/registry.db"

    # Training thresholds
    MIN_TRAINING_SAMPLES: int = 500
    RETRAINING_MIN_NEW_RECORDS: int = 10_000
    ACCURACY_THRESHOLD: float = 0.82
    F1_THRESHOLD: float = 0.78
    LATENCY_THRESHOLD_MS: float = 200.0

    # Drift detection
    PSI_THRESHOLD: float = 0.2
    KL_DIVERGENCE_THRESHOLD: float = 0.1
    DRIFT_CHECK_WINDOW_DAYS: int = 7
    DRIFT_REFERENCE_WINDOW_DAYS: int = 30

    # Champion / Challenger
    MIN_SHADOW_PREDICTIONS: int = 1000
    SHADOW_SAMPLE_RATE: float = 1.0

    # Anti-poisoning: users above this cheat-confidence are excluded from training
    EXCLUDED_FROM_TRAINING_CHEAT_THRESHOLD: float = 0.70

    class Config:
        env_file = ".env"


settings = PlatformSettings()

for _path in [settings.STORAGE_DIR, settings.MODELS_DIR, settings.FEATURE_STORE_DIR, settings.DATASETS_DIR]:
    os.makedirs(_path, exist_ok=True)
