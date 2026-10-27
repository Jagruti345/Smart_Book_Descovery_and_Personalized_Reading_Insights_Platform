from sqlalchemy import String, Text, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    author: Mapped[str] = mapped_column(String(300), index=True)
    genres: Mapped[list] = mapped_column(JSON, default=list)      # ["Mystery", "Thriller"]
    tags: Mapped[list] = mapped_column(JSON, default=list)        # ["atmospheric", "slow-burn"]
    synopsis: Mapped[str] = mapped_column(Text, default="")
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    isbn: Mapped[str] = mapped_column(String(20), default="")
    published_year: Mapped[int] = mapped_column(Integer, default=2000)
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0)
    ratings_count: Mapped[int] = mapped_column(Integer, default=0)
    page_count: Mapped[int] = mapped_column(Integer, default=200)
    is_public_domain: Mapped[bool] = mapped_column(default=False)
    gutenberg_id: Mapped[str] = mapped_column(String(20), default="")
    librivox_url: Mapped[str] = mapped_column(String(500), default="")
    full_text_excerpt: Mapped[str] = mapped_column(Text, default="")  # sample text for in-app reader
    mood: Mapped[str] = mapped_column(String(100), default="")     # e.g. "suspenseful", "cozy"
    pacing: Mapped[str] = mapped_column(String(50), default="medium")  # slow | medium | fast

    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")


class Wishlist(Base):
    __tablename__ = "wishlist"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))


class Rating(Base):
    """Separate from Review: a lightweight star rating used by the CF engine,
    even if the user didn't leave written review text."""
    __tablename__ = "ratings"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    stars: Mapped[float] = mapped_column(Float)  # 1-5
