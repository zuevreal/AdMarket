"""
Telegram bot message handlers.
"""

import json
import logging
from pathlib import Path
from typing import Any

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.database import get_db
from app.models import User

logger = logging.getLogger(__name__)
router = Router(name="main")

# Locales directory
LOCALES_DIR = Path(__file__).parent.parent / "locales"


def get_text(key: str, lang: str = "en") -> str:
    """
    Get localized text by key.
    Falls back to English if translation not found.
    
    Args:
        key: Translation key
        lang: Language code (e.g., 'en', 'ru')
    
    Returns:
        Localized string or key if not found
    """
    for try_lang in [lang, "en"]:
        locale_file = LOCALES_DIR / f"{try_lang}.json"
        if locale_file.exists():
            try:
                with open(locale_file, encoding="utf-8") as f:
                    translations: dict[str, Any] = json.load(f)
                    if key in translations:
                        return translations[key]
            except (json.JSONDecodeError, OSError) as e:
                logger.warning(f"Failed to load locale {try_lang}: {e}")
    
    return key


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """
    Handle /start command.
    Creates or updates user in database.
    """
    if not message.from_user:
        return
    
    user = message.from_user
    lang = user.language_code or "en"
    
    try:
        async with get_db() as session:
            # Upsert user: insert or update on conflict
            stmt = insert(User).values(
                telegram_id=user.id,
                username=user.username,
                first_name=user.first_name,
                last_name=user.last_name,
                language_code=lang[:10],  # Truncate to fit column
            )
            
            # On conflict, update existing user
            stmt = stmt.on_conflict_do_update(
                index_elements=["telegram_id"],
                set_={
                    "username": stmt.excluded.username,
                    "first_name": stmt.excluded.first_name,
                    "last_name": stmt.excluded.last_name,
                    "language_code": stmt.excluded.language_code,
                    # updated_at will auto-update via onupdate
                },
            )
            
            await session.execute(stmt)
            logger.info(f"User upserted: {user.id} (@{user.username})")
    
    except Exception as e:
        logger.error(f"Failed to upsert user {user.id}: {e}")
        # Don't fail the handler - still send welcome message
    
    # Send welcome message
    welcome_text = get_text("start_message", lang)
    await message.answer(welcome_text)
