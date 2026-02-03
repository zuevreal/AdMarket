"""
API dependencies for authentication and authorization.
Includes Telegram WebApp initData validation.
"""

import hashlib
import hmac
import json
import logging
import urllib.parse
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.models import User

logger = logging.getLogger(__name__)
settings = get_settings()


class TelegramUser(BaseModel):
    """Telegram user data from initData."""
    
    id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None
    is_premium: bool | None = None
    allows_write_to_pm: bool | None = None


def validate_init_data(init_data: str) -> TelegramUser:
    """
    Validate Telegram WebApp initData using HMAC-SHA256.
    
    Algorithm:
    1. Parse init_data as query string
    2. Extract hash and remove from data
    3. Sort remaining params alphabetically by key
    4. Join as key=value with newlines
    5. Compute HMAC-SHA256 with secret = HMAC-SHA256("WebAppData", bot_token)
    6. Compare with provided hash
    
    Args:
        init_data: Raw initData string from Telegram WebApp
        
    Returns:
        TelegramUser with validated user data
        
    Raises:
        HTTPException: If validation fails
    """
    if not init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing initData",
        )
    
    try:
        # Parse query string
        parsed = urllib.parse.parse_qs(init_data, keep_blank_values=True)
        
        # Extract hash
        received_hash = parsed.pop("hash", [None])[0]
        if not received_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing hash in initData",
            )
        
        # Build data check string (sorted alphabetically)
        data_check_items = []
        for key in sorted(parsed.keys()):
            # parse_qs returns lists, take first value
            value = parsed[key][0] if parsed[key] else ""
            data_check_items.append(f"{key}={value}")
        
        data_check_string = "\n".join(data_check_items)
        
        # Compute secret key: HMAC-SHA256("WebAppData", bot_token)
        secret_key = hmac.new(
            b"WebAppData",
            settings.BOT_TOKEN.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        
        # Compute hash: HMAC-SHA256(secret_key, data_check_string)
        computed_hash = hmac.new(
            secret_key,
            data_check_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        
        # Compare hashes
        if not hmac.compare_digest(computed_hash, received_hash):
            logger.warning("initData hash mismatch")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid initData signature",
            )
        
        # Parse user data
        user_data_str = parsed.get("user", [None])[0]
        if not user_data_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing user in initData",
            )
        
        user_data = json.loads(user_data_str)
        return TelegramUser(**user_data)
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse user data: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user data format",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"initData validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="initData validation failed",
        )


async def get_current_user(
    x_telegram_init_data: Annotated[str | None, Header()] = None,
) -> TelegramUser:
    """
    FastAPI dependency to validate initData and return current user.
    
    Expects header: X-Telegram-Init-Data
    """
    if not x_telegram_init_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Telegram-Init-Data header",
        )
    
    return validate_init_data(x_telegram_init_data)


async def get_db_user(
    tg_user: Annotated[TelegramUser, Depends(get_current_user)],
) -> User:
    """
    Get User from database by telegram_id.
    Creates user if not exists.
    """
    async with get_db() as session:
        result = await session.execute(
            select(User).where(User.telegram_id == tg_user.id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please start the bot first.",
            )
        
        return user
