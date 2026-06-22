from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from pipeline.wake_word import detector
from memory.session_memory import session_memory
from memory.long_term import long_term_memory
from routes.voice import router as voice_router
from routes.ws import router as ws_router
from routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Connect Redis
    await session_memory.connect()
    await long_term_memory.connect()

    # Pre-load wake word model
    detector.load()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)
app.include_router(ws_router)
app.include_router(health_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
