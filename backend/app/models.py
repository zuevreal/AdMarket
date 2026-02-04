"""
SQLAlchemy 2.0 Async models for AdMarket.
Defines User, Channel, and Deal entities.
"""

import enum
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


# ============================================================================
# ENUMS
# ============================================================================


class UserRole(str, enum.Enum):
    """User roles in the system."""

    USER = "user"
    ADVERTISER = "advertiser"
    ADMIN = "admin"


class DealStatus(str, enum.Enum):
    """
    Deal lifecycle statuses.
    
    Flow: PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED
                  |            |
                  v            v
              CANCELLED    DISPUTED -> RESOLVED
    """

    PENDING = "pending"  # Deal created, waiting for advertiser payment
    CONFIRMED = "confirmed"  # Payment received, waiting for channel owner
    IN_PROGRESS = "in_progress"  # Ad is being posted
    COMPLETED = "completed"  # Ad posted successfully, funds released
    DISPUTED = "disputed"  # Conflict between parties
    CANCELLED = "cancelled"  # Deal cancelled before completion


# ============================================================================
# MODELS
# ============================================================================


class User(Base):
    """
    Telegram user model.
    Stores basic info and role for access control.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(
        BigInteger, unique=True, nullable=False, index=True
    )
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    language_code: Mapped[str] = mapped_column(String(10), default="en")
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        default=UserRole.USER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    wallet_address: Mapped[str | None] = mapped_column(
        String(128),  # TON address: raw (66) or user-friendly (48)
        nullable=True,
        unique=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    channels: Mapped[list["Channel"]] = relationship(
        "Channel", back_populates="owner", lazy="selectin"
    )
    deals_as_advertiser: Mapped[list["Deal"]] = relationship(
        "Deal",
        back_populates="advertiser",
        foreign_keys="Deal.advertiser_id",
        lazy="selectin",
    )


class Channel(Base):
    """
    Telegram channel available for advertising.
    Stores verified statistics as JSONB for flexibility.
    """

    __tablename__ = "channels"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(
        BigInteger, unique=True, nullable=False, index=True
    )
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    
    # JSONB field for flexible stats storage
    # Example: {"subscribers": 50000, "avg_views": 12000, "er": 2.4, "verified_at": "..."}
    verified_stats: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB, nullable=True, default=None
    )
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    price_per_post: Mapped[Decimal | None] = mapped_column(
        Numeric(18, 9),  # TON with 9 decimal places (nanotons precision)
        nullable=True,
    )
    category: Mapped[str | None] = mapped_column(
        String(50),  # crypto, business, tech, news, entertainment, other
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="channels")
    deals: Mapped[list["Deal"]] = relationship(
        "Deal", back_populates="channel", lazy="selectin"
    )


class Deal(Base):
    """
    Advertising deal between advertiser and channel.
    Links to TON smart contract for escrow payments.
    """

    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Participants
    advertiser_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[int] = mapped_column(
        ForeignKey("channels.id", ondelete="CASCADE"), nullable=False
    )
    
    # Deal details
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus, name="deal_status"),
        default=DealStatus.PENDING,
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=9),  # TON has 9 decimal places
        nullable=False,
    )
    
    # Smart contract reference (TON address)
    smart_contract_address: Mapped[str | None] = mapped_column(
        String(48),  # TON address length
        nullable=True,
        unique=True,
    )
    
    # Ad content (can be extended)
    ad_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    advertiser: Mapped["User"] = relationship(
        "User", back_populates="deals_as_advertiser", foreign_keys=[advertiser_id]
    )
    channel: Mapped["Channel"] = relationship("Channel", back_populates="deals")
