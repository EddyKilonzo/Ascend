from __future__ import annotations

from typing import Optional
from pydantic_settings import BaseSettings


class VoiceSettings(BaseSettings):
    APP_NAME: str = "Maya Voice Pipeline"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 5003

    VOICE_API_KEY: str = "change-me-in-production"

    # Downstream services
    MAYA_URL: str = "http://localhost:5002"
    MAYA_API_KEY: str = "change-me-in-production"
    NESTJS_URL: str = "http://localhost:4000"

    # Wake word
    WAKE_WORDS: list[str] = ["hey maya", "maya"]
    WAKE_WORD_THRESHOLD: float = 0.5
    WAKE_WORD_MODEL_DIR: str = "models/wake_word"

    # VAD
    VAD_THRESHOLD: float = 0.5
    VAD_SILENCE_DURATION_MS: int = 700
    VAD_MIN_SPEECH_DURATION_MS: int = 300
    AUDIO_SAMPLE_RATE: int = 16000

    # STT (Faster Whisper)
    WHISPER_MODEL: str = "base.en"
    WHISPER_DEVICE: str = "cpu"      # "cuda" when GPU available
    WHISPER_COMPUTE_TYPE: str = "int8"
    WHISPER_LANGUAGE: str = "en"
    STT_MAX_AUDIO_SECONDS: float = 30.0

    # TTS (Piper)
    PIPER_VOICE: str = "en_US-lessac-medium"
    PIPER_SPEED: float = 1.0
    PIPER_MODEL_DIR: str = "models/tts"
    TTS_OUTPUT_FORMAT: str = "wav"

    # Redis memory
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 3
    SESSION_TTL_SECONDS: int = 3600
    SHORT_TERM_MEMORY_TURNS: int = 10
    LONG_TERM_TTL_SECONDS: int = 86400 * 30

    # Google Calendar
    GOOGLE_CREDENTIALS_FILE: str = "credentials/google_oauth.json"
    GOOGLE_TOKEN_FILE: str = "credentials/google_token.json"
    GOOGLE_CALENDAR_SCOPES: list[str] = ["https://www.googleapis.com/auth/calendar"]

    # Rate limiting
    RATE_LIMIT_PER_USER_PER_MINUTE: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = VoiceSettings()
