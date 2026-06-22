from fastapi import APIRouter
from datetime import datetime
from config import settings

router = APIRouter(tags=["health"])


@router.get("/")
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }
