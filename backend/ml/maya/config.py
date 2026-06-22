from __future__ import annotations

from typing import Optional
from pydantic_settings import BaseSettings


class MayaSettings(BaseSettings):
    APP_NAME: str = "Maya — Ascend Intelligence Agent"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 5002

    # Internal service auth
    MAYA_API_KEY: str = "change-me-in-production"

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    PRIMARY_MODEL: str = "claude-opus-4-8"
    MAX_TOKENS: int = 768
    LLM_TIMEOUT_SECONDS: float = 10.0

    # Input constraints
    MAX_USER_MESSAGE_LENGTH: int = 500

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 2
    RESPONSE_CACHE_TTL: int = 300

    # Rate limiting (sliding window per user)
    RATE_LIMIT_PER_USER_PER_MINUTE: int = 20
    RATE_LIMIT_GLOBAL_PER_MINUTE: int = 500

    # Performance target
    TARGET_RESPONSE_MS: int = 500

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = MayaSettings()
