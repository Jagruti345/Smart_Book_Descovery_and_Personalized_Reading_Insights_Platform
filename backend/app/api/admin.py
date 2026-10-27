from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.book import Book
from app.models.review import Review
from app.models.reading_history import ReadingHistory
from app.schemas.schemas import AdminUserOut, AdminStats, ReviewOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return db.query(User).order_by(User.id).all()


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, role: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"id": user.id, "role": user.role}


@router.patch("/users/{user_id}/status")
def update_status(user_id: int, is_active: bool, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/moderation/queue", response_model=list[ReviewOut])
def moderation_queue(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    reviews = db.query(Review).filter(Review.is_flagged == True).order_by(Review.created_at.desc()).all()  # noqa: E712
    out = []
    for r in reviews:
        item = ReviewOut.model_validate(r)
        item.user_name = r.user.name if r.user else None
        out.append(item)
    return out


@router.post("/moderation/{review_id}/approve")
def approve_review(review_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.is_flagged = False
    db.commit()
    return {"id": review.id, "is_flagged": False}


@router.delete("/moderation/{review_id}")
def remove_review(review_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"deleted": True}


@router.get("/stats", response_model=AdminStats)
def catalog_stats(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_books = db.query(Book).count()
    total_reviews = db.query(Review).count()
    flagged_reviews = db.query(Review).filter(Review.is_flagged == True).count()  # noqa: E712
    total_minutes = sum(s.minutes for s in db.query(ReadingHistory).all())

    books = db.query(Book).order_by(Book.ratings_count.desc()).limit(5).all()
    top_books = [{"id": b.id, "title": b.title, "avg_rating": b.avg_rating, "ratings_count": b.ratings_count} for b in books]

    return AdminStats(
        total_users=total_users,
        total_books=total_books,
        total_reviews=total_reviews,
        flagged_reviews=flagged_reviews,
        total_reading_minutes=total_minutes,
        top_books=top_books,
    )
