from __future__ import annotations

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from llm.claude_client import claude
from security.rate_limiter import rate_limiter
from observability.logger import log_error, log_info
from observability.metrics import snapshot
from routes.coaching import router as coaching_router
from routes.explain import router as explain_router
from routes.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await rate_limiter.connect()
    log_info("maya_startup", model=settings.PRIMARY_MODEL, port=settings.PORT)
    try:
        yield
    finally:
        await claude.close()
        log_info("maya_shutdown")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["X-API-Key", "Content-Type"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log_error("unhandled_exception", error=str(exc), path=str(request.url))
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


app.include_router(coaching_router)
app.include_router(explain_router)
app.include_router(health_router)


@app.get("/metrics", tags=["system"])
async def metrics() -> dict:
    return snapshot()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
