from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ReadingHistory(Base):
    """One row per reading (or listening) session."""
    __tablename__ = "reading_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    minutes: Mapped[int] = mapped_column(Integer, default=0)
    mode: Mapped[str] = mapped_column(String(20), default="text")  # text | audio
    progress_percent: Mapped[float] = mapped_column(Float, default=0.0)
    session_date: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD
    started_at_hour: Mapped[int] = mapped_column(Integer, default=12)  # for "night owl" badge
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reading_sessions")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    location: Mapped[str] = mapped_column(String(100), default="")  # chapter/paragraph marker
    note: Mapped[str] = mapped_column(String(500), default="")
