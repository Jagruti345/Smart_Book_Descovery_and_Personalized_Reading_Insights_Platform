from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.book import Book, Rating
from app.models.review import Review
from app.schemas.schemas import ReviewCreate, ReviewOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

# Lightweight moderation keyword filter -- flags for human review rather than
# auto-deleting, matching the Admin Moderation Queue spec.
FLAGGED_KEYWORDS = {"spam", "scam", "hate", "idiot", "stupid", "trash-book-fraud"}


def _check_profanity(text: str) -> tuple[bool, str]:
    lowered = text.lower()
    hit = next((w for w in FLAGGED_KEYWORDS if w in lowered), None)
    if hit:
        return True, f"Contains flagged term: '{hit}'"
    return False, ""


def _recompute_book_rating(db: Session, book_id: int):
    ratings = db.query(Rating).filter(Rating.book_id == book_id).all()
    book = db.get(Book, book_id)
    if not book:
        return
    if ratings:
        book.avg_rating = round(sum(r.stars for r in ratings) / len(ratings), 2)
        book.ratings_count = len(ratings)
    db.add(book)
    db.commit()


@router.post("", response_model=ReviewOut)
def create_review(payload: ReviewCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    book = db.get(Book, payload.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    is_flagged, reason = _check_profanity(payload.text)

    review = Review(
        user_id=user.id, book_id=payload.book_id, stars=payload.stars,
        text=payload.text, is_flagged=is_flagged, flagged_reason=reason,
    )
    db.add(review)

    # upsert rating used by the CF recommender
    existing_rating = db.query(Rating).filter(Rating.user_id == user.id, Rating.book_id == payload.book_id).first()
    if existing_rating:
        existing_rating.stars = payload.stars
    else:
        db.add(Rating(user_id=user.id, book_id=payload.book_id, stars=payload.stars))

    db.commit()
    db.refresh(review)
    _recompute_book_rating(db, payload.book_id)

    out = ReviewOut.model_validate(review)
    out.user_name = user.name
    return out


@router.get("/book/{book_id}", response_model=list[ReviewOut])
def get_reviews_for_book(book_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(Review)
        .filter(Review.book_id == book_id, Review.is_flagged == False)  # noqa: E712
        .order_by(Review.created_at.desc())
        .all()
    )
    out = []
    for r in reviews:
        item = ReviewOut.model_validate(r)
        item.user_name = r.user.name if r.user else None
        out.append(item)
    return out
