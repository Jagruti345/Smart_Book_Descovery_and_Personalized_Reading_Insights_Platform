from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserBadge(Base):
    __tablename__ = "user_badges"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    badge_code: Mapped[str] = mapped_column(String(50))  # e.g. "first_chapter"
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="badges")


# Static badge catalog (code -> display info). Not a DB table; used by analytics.py.
BADGE_CATALOG = {
    "first_chapter": {"emoji": "🥉", "name": "First Chapter", "desc": "Read your first 15 minutes."},
    "streak_7": {"emoji": "🔥", "name": "7-Day Streak Master", "desc": "Read every day for a week."},
    "night_owl": {"emoji": "🦉", "name": "Night Owl", "desc": "Completed a session past 10 PM."},
    "genre_explorer": {"emoji": "🌍", "name": "Genre Explorer", "desc": "Read across 3 distinct genres."},
    "audio_aficionado": {"emoji": "🎧", "name": "Audio Aficionado", "desc": "Listened to 2 hours of audiobooks."},
}
