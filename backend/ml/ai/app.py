from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn

from config import settings
from middleware import RequestIDMiddleware
from utils.logging import log_info, log_warning, log_error
from routes import score, predict, recommend, report, health


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if settings.AI_API_KEY == "change-me-in-production":
        log_warning("SECURITY: AI_API_KEY is set to the default value. Change before deploying!")

    # Warm up rate-limiter Redis connection
    from dependencies import _get_redis
    redis = await _get_redis()
    log_info(
        "startup",
        port=settings.PORT,
        redis_connected=redis is not None,
    )
    yield
    log_info("shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "message": "Validation failed"},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    log_error("unhandled_exception", error=type(exc).__name__, path=str(request.url.path))
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(health.router, prefix="/health")
app.include_router(score.router, prefix="/score")
app.include_router(predict.router, prefix="/predict")
app.include_router(recommend.router, prefix="/recommend")
app.include_router(report.router, prefix="/report")


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else 4,
    )
