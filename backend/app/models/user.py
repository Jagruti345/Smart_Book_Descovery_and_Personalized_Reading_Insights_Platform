from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")  # user | admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Onboarding-derived state
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    preferences: Mapped[dict] = mapped_column(JSON, default=dict)  # raw onboarding answers
    cb_profile: Mapped[dict] = mapped_column(JSON, default=dict)   # content-based pref vector (genre weights)
    accessibility_settings: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "fontSize": 18,
            "theme": "light",
            "dyslexicFont": False,
            "ttsSpeed": 1.0,
        },
    )

    # Gamification
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    total_minutes_read: Mapped[int] = mapped_column(Integer, default=0)
    last_read_date: Mapped[str] = mapped_column(String(10), default="")  # YYYY-MM-DD

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    reading_sessions = relationship("ReadingHistory", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
