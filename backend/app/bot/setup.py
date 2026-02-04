"""
Telegram bot initialization and setup.
Contains only bot and dispatcher creation - no router imports to avoid circular dependencies.
"""

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize bot with HTML parse mode
bot = Bot(
    token=settings.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML),
)

# Initialize dispatcher (router will be added in main.py to avoid circular import)
dp = Dispatcher()


async def start_polling() -> None:
    """
    Start bot polling.
    Should be called as asyncio task from FastAPI lifespan.
    Note: Router must be added to dp before calling this.
    """
    logger.info("Starting Telegram bot polling...")
    
    # Drop pending updates to avoid processing old messages
    await bot.delete_webhook(drop_pending_updates=True)
    
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    except asyncio.CancelledError:
        logger.info("Bot polling cancelled")
    except Exception as e:
        logger.error(f"Bot polling error: {e}")
        raise


async def stop_polling() -> None:
    """Stop bot and close session."""
    logger.info("Stopping Telegram bot...")
    await bot.session.close()
