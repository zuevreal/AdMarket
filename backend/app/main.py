"""
AdMarket FastAPI Application Entrypoint.
"""

from fastapi import FastAPI

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="AdMarket API",
    description="Telegram advertising marketplace with TON payments",
    version="0.1.0",
    debug=settings.DEBUG,
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Docker/K8s."""
    return {"status": "ok"}
