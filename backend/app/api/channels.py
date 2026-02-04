"""
Channels API routes.
Manage Telegram channels for advertising marketplace.
"""

import logging
import re
from decimal import Decimal
from typing import Annotated

from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert

from app.api.deps import TelegramUser, get_current_user
from app.bot.setup import bot
from app.core.database import get_db
from app.models import Channel, User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["channels"])


# === Request/Response Models ===

class ChannelCreateRequest(BaseModel):
    """Request body for creating a channel."""
    
    url: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Channel URL or @username",
        examples=["https://t.me/my_channel", "@my_channel"],
    )
    description: str | None = Field(
        None,
        max_length=1000,
        description="Channel description for advertisers",
    )
    price_per_post: Decimal = Field(
        ...,
        gt=0,
        le=1000000,
        description="Price per advertising post in TON",
        examples=[10.5, 100],
    )
    
    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Extract username from URL or validate @username format."""
        v = v.strip()
        
        # Handle t.me URLs
        if "t.me/" in v:
            match = re.search(r"t\.me/([a-zA-Z][a-zA-Z0-9_]{3,})", v)
            if match:
                return f"@{match.group(1)}"
        
        # Handle @username format
        if v.startswith("@"):
            username = v[1:]
            if re.match(r"^[a-zA-Z][a-zA-Z0-9_]{3,}$", username):
                return v
        
        # Handle plain username
        if re.match(r"^[a-zA-Z][a-zA-Z0-9_]{3,}$", v):
            return f"@{v}"
        
        raise ValueError("Invalid channel URL or username format")


class ChannelResponse(BaseModel):
    """Channel data in response."""
    
    id: int
    telegram_id: int
    username: str | None
    title: str
    description: str | None
    price_per_post: Decimal | None
    is_active: bool
    
    class Config:
        from_attributes = True


class ChannelListResponse(BaseModel):
    """List of channels response."""
    
    channels: list[ChannelResponse]
    total: int


class MessageResponse(BaseModel):
    """Simple message response."""
    
    success: bool
    message: str


# === Helper Functions ===

async def extract_channel_username(url: str) -> str:
    """Extract @username from URL or return as-is if already @username."""
    url = url.strip()
    
    if url.startswith("@"):
        return url
    
    # Extract from t.me URL
    match = re.search(r"t\.me/([a-zA-Z][a-zA-Z0-9_]{3,})", url)
    if match:
        return f"@{match.group(1)}"
    
    return f"@{url}"


async def verify_bot_is_admin(bot: Bot, chat_id: int) -> bool:
    """Check if bot is an administrator of the channel."""
    try:
        bot_member = await bot.get_chat_member(chat_id, bot.id)
        return bot_member.status in ["administrator", "creator"]
    except TelegramBadRequest:
        return False


# === API Endpoints ===

@router.post(
    "/",
    response_model=ChannelResponse,
    responses={
        200: {"description": "Channel updated successfully"},
        201: {"description": "Channel created successfully"},
    },
    summary="Add or update a channel",
    description="Add a Telegram channel to the marketplace or update if owned by user. Bot must be admin.",
)
async def create_channel(
    body: ChannelCreateRequest,
    tg_user: Annotated[TelegramUser, Depends(get_current_user)],
) -> ChannelResponse:
    """
    Add or update a channel in the marketplace.
    
    1. Validates the channel URL/username
    2. Fetches channel info from Telegram API
    3. Verifies bot is admin of the channel
    4. If channel exists and owned by user: UPDATE price/description
    5. If channel exists but owned by another: 409 Conflict
    6. If channel doesn't exist: CREATE new
    """
    username = body.url  # Already validated and normalized by Pydantic
    
    try:
        # Get channel info from Telegram
        chat = await bot.get_chat(username)
        
        if chat.type not in ["channel", "supergroup"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only channels and supergroups are supported",
            )
        
        # Verify bot is admin
        if not await verify_bot_is_admin(bot, chat.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bot is not an administrator of this channel. Please add the bot as admin first.",
            )
        
        # Get user from database
        async with get_db() as session:
            # Find user by telegram_id
            result = await session.execute(
                select(User).where(User.telegram_id == tg_user.id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found. Please start the bot first.",
                )
            
            # Check if channel already exists
            result = await session.execute(
                select(Channel).where(Channel.telegram_id == chat.id)
            )
            existing_channel = result.scalar_one_or_none()
            
            if existing_channel:
                # Channel exists - check ownership
                if existing_channel.owner_id == user.id:
                    # EDIT MODE: Update existing channel (owned by current user)
                    existing_channel.price_per_post = body.price_per_post
                    if body.description is not None:
                        existing_channel.description = body.description
                    # Also update title/username in case they changed
                    existing_channel.title = chat.title or username
                    existing_channel.username = chat.username
                    existing_channel.is_active = True
                    
                    await session.flush()
                    await session.refresh(existing_channel)
                    
                    logger.info(f"Channel updated: {existing_channel.id} ({existing_channel.title}) by user {tg_user.id}")
                    
                    return ChannelResponse.model_validate(existing_channel)
                else:
                    # Channel owned by another user
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This channel is already registered by another user",
                    )
            
            # CREATE MODE: New channel
            channel = Channel(
                telegram_id=chat.id,
                username=chat.username,
                title=chat.title or username,
                description=body.description,
                owner_id=user.id,
                price_per_post=body.price_per_post,
                is_active=True,
            )
            
            session.add(channel)
            await session.flush()
            await session.refresh(channel)
            
            logger.info(f"Channel created: {channel.id} ({channel.title}) by user {tg_user.id}")
            
            return ChannelResponse.model_validate(channel)
            
    except HTTPException:
        raise
    except TelegramBadRequest as e:
        logger.error(f"Telegram API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel not found or bot cannot access it",
        )
    except Exception as e:
        logger.error(f"Failed to create channel: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add channel",
        )


@router.get(
    "/my",
    response_model=ChannelListResponse,
    summary="Get my channels",
    description="Get list of channels owned by current user",
)
async def get_my_channels(
    tg_user: Annotated[TelegramUser, Depends(get_current_user)],
) -> ChannelListResponse:
    """Get all channels owned by the current user."""
    async with get_db() as session:
        # Find user
        result = await session.execute(
            select(User).where(User.telegram_id == tg_user.id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Get channels
        result = await session.execute(
            select(Channel)
            .where(Channel.owner_id == user.id)
            .order_by(Channel.created_at.desc())
        )
        channels = result.scalars().all()
        
        return ChannelListResponse(
            channels=[ChannelResponse.model_validate(ch) for ch in channels],
            total=len(channels),
        )


@router.delete(
    "/{channel_id}",
    response_model=MessageResponse,
    summary="Delete a channel",
    description="Remove a channel from the marketplace",
)
async def delete_channel(
    channel_id: int,
    tg_user: Annotated[TelegramUser, Depends(get_current_user)],
) -> MessageResponse:
    """Delete a channel owned by the current user."""
    async with get_db() as session:
        # Find user
        result = await session.execute(
            select(User).where(User.telegram_id == tg_user.id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Find and verify ownership
        result = await session.execute(
            select(Channel).where(
                Channel.id == channel_id,
                Channel.owner_id == user.id,
            )
        )
        channel = result.scalar_one_or_none()
        
        if not channel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Channel not found or you don't have permission to delete it",
            )
        
        # Delete channel
        await session.execute(
            delete(Channel).where(Channel.id == channel_id)
        )
        
        logger.info(f"Channel deleted: {channel_id} by user {tg_user.id}")
        
        return MessageResponse(
            success=True,
            message="Channel deleted successfully",
        )
