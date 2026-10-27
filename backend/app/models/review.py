from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    stars: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text, default="")
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flagged_reason: Mapped[str] = mapped_column(String(200), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reviews")
    book = relationship("Book", back_populates="reviews")
