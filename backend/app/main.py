"""
AdMarket FastAPI Application Entrypoint.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.bot.setup import start_polling, stop_polling
from app.core.config import get_settings
from app.core.database import engine
# Import all models BEFORE create_all so SQLAlchemy sees them
from app.models import Base, User, Channel, Deal  # noqa: F401

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
    Creates database tables, starts bot polling on startup, stops on shutdown.
    """
    logger.info("Starting AdMarket application...")
    
    # Create all database tables (force create on startup)
    logger.info("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")
    
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
    version="0.2.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# CORS middleware for Telegram WebApp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Telegram WebApp runs on various domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(users_router, prefix="/api/users")


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for Docker/K8s."""
    return {"status": "ok"}
