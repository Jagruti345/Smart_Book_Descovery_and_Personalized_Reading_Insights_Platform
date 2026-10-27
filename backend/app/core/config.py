"""
Central configuration for the backend.
Zero-config by default: uses SQLite so the whole project runs with one command.
Set env vars (or a .env file) to point at Postgres/Redis and an LLM key in production.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Smart Book Discovery Platform"
    ENV: str = "development"

    # Database: defaults to local SQLite file, no setup required.
    DATABASE_URL: str = "sqlite:///./bookapp.db"

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-me-in-production-please"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Optional external providers. If unset, the app falls back to offline
    # TF-IDF / heuristic NLP so it works with zero API keys.
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    GOOGLE_BOOKS_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
