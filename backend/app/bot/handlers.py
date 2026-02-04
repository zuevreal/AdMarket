"""
Telegram bot message handlers.
"""

import json
import logging
from pathlib import Path
from typing import Any

from aiogram import Router
from aiogram.filters import CommandStart, ChatMemberUpdatedFilter, IS_NOT_MEMBER, ADMINISTRATOR
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    ChatMemberUpdated,
)
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.bot.setup import bot
from app.core.config import get_settings
from app.core.database import get_db
from app.models import User, Channel

logger = logging.getLogger(__name__)
router = Router(name="main")
settings = get_settings()

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


def get_webapp_keyboard() -> InlineKeyboardMarkup | None:
    """
    Create inline keyboard with WebApp button.
    Returns None if WEBAPP_URL is not configured.
    """
    if not settings.WEBAPP_URL:
        logger.warning("WEBAPP_URL not configured, skipping WebApp button")
        return None
    
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Open App",
                    web_app=WebAppInfo(url=settings.WEBAPP_URL),
                )
            ]
        ]
    )
    return keyboard


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    """
    Handle /start command.
    Creates or updates user in database and shows WebApp button.
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
    
    # Send welcome message with WebApp button
    welcome_text = get_text("start_message", lang)
    keyboard = get_webapp_keyboard()
    
    await message.answer(welcome_text, reply_markup=keyboard, parse_mode="HTML")


@router.my_chat_member(
    ChatMemberUpdatedFilter(member_status_changed=IS_NOT_MEMBER >> ADMINISTRATOR)
)
async def on_bot_added_as_admin(event: ChatMemberUpdated) -> None:
    """
    Handle when bot is added as administrator to a channel/group.
    Auto-registers the channel and notifies the user who added the bot.
    
    This enables the deep link flow:
    1. User clicks https://t.me/bot?startchannel=...
    2. Telegram prompts to select channel and add bot as admin
    3. This handler fires and auto-registers the channel
    4. User is notified via DM
    """
    chat = event.chat
    user = event.from_user  # User who added the bot
    
    # Only handle channels and supergroups
    if chat.type not in ("channel", "supergroup"):
        logger.info(f"Bot added to {chat.type} {chat.id}, skipping (not a channel)")
        return
    
    logger.info(f"Bot added as admin to channel: {chat.id} ({chat.title}) by user {user.id}")
    
    try:
        async with get_db() as session:
            # Find or create user first
            result = await session.execute(
                select(User).where(User.telegram_id == user.id)
            )
            db_user = result.scalar_one_or_none()
            
            if not db_user:
                # Create user if doesn't exist
                db_user = User(
                    telegram_id=user.id,
                    username=user.username,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    language_code=user.language_code or "en",
                )
                session.add(db_user)
                await session.flush()
                logger.info(f"Created user {user.id} during channel registration")
            
            # Upsert channel
            stmt = insert(Channel).values(
                telegram_id=chat.id,
                username=chat.username,
                title=chat.title or f"Channel {chat.id}",
                owner_id=db_user.id,
                is_active=True,
            )
            
            # On conflict, update existing channel (maybe transfer ownership)
            stmt = stmt.on_conflict_do_update(
                index_elements=["telegram_id"],
                set_={
                    "username": stmt.excluded.username,
                    "title": stmt.excluded.title,
                    "owner_id": stmt.excluded.owner_id,  # Transfer ownership
                    "is_active": True,
                },
            )
            
            await session.execute(stmt)
            logger.info(f"Channel upserted: {chat.id} ({chat.title}) for user {user.id}")
        
        # Notify user in DM
        lang = user.language_code or "en"
        message_text = get_text("channel_auto_connected", lang).format(title=chat.title)
        
        try:
            await bot.send_message(
                user.id,
                message_text,
                parse_mode="HTML",
                reply_markup=get_webapp_keyboard(),
            )
            logger.info(f"Sent channel connection notification to user {user.id}")
        except Exception as e:
            logger.warning(f"Failed to send DM to user {user.id}: {e}")
            # User might have blocked bot or never started it
            
    except Exception as e:
        logger.error(f"Failed to register channel {chat.id}: {e}")
