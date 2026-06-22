from pydantic_settings import BaseSettings
from typing import Optional


class VisionSettings(BaseSettings):
    APP_NAME: str = "Ascend Vision Engine"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 5004

    AI_API_KEY: str = "change-me-in-production"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4000"]

    MAX_IMAGE_SIZE_MB: int = 10
    TEMP_IMAGE_DIR: str = "/tmp/ascend_ocr"
    IMAGE_RETENTION_SECONDS: int = 300

    TESSERACT_CMD: Optional[str] = None
    OCR_CONFIDENCE_THRESHOLD: float = 0.60

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None

    class Config:
        env_file = ".env"


vision_settings = VisionSettings()
