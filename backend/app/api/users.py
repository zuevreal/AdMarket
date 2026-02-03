"""
Users API routes.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import update

from app.api.deps import TelegramUser, get_current_user
from app.core.database import get_db
from app.models import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["users"])


class WalletUpdateRequest(BaseModel):
    """Request body for wallet address update."""
    
    wallet_address: str = Field(
        ...,
        min_length=32,  # Minimum reasonable length
        max_length=128,  # Max to cover raw (66) and user-friendly (48) formats
        description="TON wallet address (raw or user-friendly format)",
        examples=[
            "0:e3ade4c44e46d9b51678f09b8e3fc....",  # raw format
            "EQDrjaLahLkMB-hMCmkzOyBuHJ139ZUYmPHu6RRBKnbRELWP",  # user-friendly
        ],
    )


class WalletUpdateResponse(BaseModel):
    """Response for wallet update."""
    
    success: bool
    wallet_address: str
    message: str


@router.post(
    "/wallet",
    response_model=WalletUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Link TON wallet to user",
    description="Update user's wallet address. Requires valid Telegram initData.",
)
async def update_wallet(
    body: WalletUpdateRequest,
    tg_user: Annotated[TelegramUser, Depends(get_current_user)],
) -> WalletUpdateResponse:
    """
    Link TON wallet address to the authenticated user.
    
    The user is identified by telegram_id from validated initData.
    """
    try:
        async with get_db() as session:
            # Update user's wallet address
            result = await session.execute(
                update(User)
                .where(User.telegram_id == tg_user.id)
                .values(wallet_address=body.wallet_address)
                .returning(User.id)
            )
            
            updated = result.scalar_one_or_none()
            
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found. Please start the bot first.",
                )
            
            logger.info(
                f"Wallet linked: user={tg_user.id}, wallet={body.wallet_address[:8]}..."
            )
            
            return WalletUpdateResponse(
                success=True,
                wallet_address=body.wallet_address,
                message="Wallet successfully linked to your account",
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update wallet for user {tg_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update wallet address",
        )
