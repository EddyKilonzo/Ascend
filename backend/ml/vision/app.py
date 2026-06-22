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

from config import vision_settings
from api.routes import router as ocr_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if vision_settings.AI_API_KEY == "change-me-in-production":
        print("[WARN] OCR_API_KEY is set to the default. Change before deploying to production.")

    # Ensure temp directory exists
    os.makedirs(vision_settings.TEMP_IMAGE_DIR, exist_ok=True)
    print(f"[INFO] Vision service started on port {vision_settings.PORT}")
    yield
    print("[INFO] Vision service shutting down.")


app = FastAPI(
    title=vision_settings.APP_NAME,
    version=vision_settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs" if vision_settings.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=vision_settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def generic_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": vision_settings.APP_NAME, "version": vision_settings.VERSION}


app.include_router(ocr_router)


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=vision_settings.HOST,
        port=vision_settings.PORT,
        reload=vision_settings.DEBUG,
        workers=1 if vision_settings.DEBUG else 2,
    )
