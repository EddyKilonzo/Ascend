from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Ascend AI Engine"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    AI_API_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4000"]

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    CACHE_TTL: int = 300

    RATE_LIMIT_REQUESTS: int = 200
    RATE_LIMIT_WINDOW: int = 60

    MODELS_DIR: str = "models/trained"

    class Config:
        env_file = ".env"


settings = Settings()
