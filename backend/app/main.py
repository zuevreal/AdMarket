"""
AdMarket FastAPI Application Entrypoint.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from app.bot.setup import start_polling, stop_polling
from app.core.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    FastAPI lifespan manager.
    Starts bot polling on startup, stops on shutdown.
    """
    logger.info("Starting AdMarket application...")
    
    # Start bot polling as background task
    polling_task = asyncio.create_task(start_polling())
    
    yield
    
    # Shutdown: cancel polling and cleanup
    logger.info("Shutting down AdMarket application...")
    polling_task.cancel()
    
    try:
        await polling_task
    except asyncio.CancelledError:
        pass
    
    await stop_polling()


app = FastAPI(
    title="AdMarket API",
    description="Telegram advertising marketplace with TON payments",
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Docker/K8s."""
    return {"status": "ok"}
