"""
Application configuration via pydantic-settings.
All sensitive data loaded from environment variables.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Never hardcode secrets - always use .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    POSTGRES_USER: str = "admarket"
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str = "admarket"
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432

    # Application
    DEBUG: bool = False
    SECRET_KEY: str

    # Telegram Bot
    BOT_TOKEN: str = ""

    # TON Blockchain
    TON_NETWORK: Literal["mainnet", "testnet"] = "testnet"

    @property
    def DATABASE_URL(self) -> str:
        """Construct async PostgreSQL connection URL."""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Sync URL for Alembic migrations."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
