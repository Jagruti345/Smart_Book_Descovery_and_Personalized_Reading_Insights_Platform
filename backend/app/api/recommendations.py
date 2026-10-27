from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.book import Wishlist
from app.schemas.schemas import RecommendedBookOut, BookOut
from app.ml.hybrid_recommender import HybridRecommender
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/personalized", response_model=list[RecommendedBookOut])
def personalized(limit: int = 12, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    engine = HybridRecommender(db)
    results = engine.recommend(user, top_n=limit)
    out = []

    prefs = user.preferences or {}
    fav_genres = [g.lower() for g in prefs.get("favorite_genres", [])]

    for book, score, reason in results:
        # Compute match percentage (75% - 99%)
        raw_pct = int(score * 100) if score > 0.6 else int(78 + score * 24)
        match_percentage = min(99, max(78, raw_pct))

        # Synergy tags
        synergy_tags = []
        b_genres = [g for g in (book.genres or []) if g.lower() in fav_genres]
        if b_genres:
            synergy_tags.append(f"{b_genres[0]} Match")
        if book.mood:
            synergy_tags.append(f"{book.mood.capitalize()} Vibe")
        if book.pacing:
            synergy_tags.append(f"{book.pacing.capitalize()} Pacing")
        if book.librivox_url:
            synergy_tags.append("Audio Available")

        why_matched = (
            f"Pattern Synergy: Matched your interest in {', '.join(book.genres[:2]) if book.genres else 'Classics'} "
            f"with {book.mood or 'immersive'} tone and {book.pacing or 'balanced'} narrative flow."
        )

        out.append(
            RecommendedBookOut(
                **BookOut.model_validate(book).model_dump(),
                score=round(score, 4),
                reason=reason,
                match_percentage=match_percentage,
                synergy_tags=synergy_tags[:3],
                why_matched=why_matched,
            )
        )
    return out


@router.get("/trending", response_model=list[BookOut])
def trending(limit: int = 10, db: Session = Depends(get_db)):
    engine = HybridRecommender(db)
    return engine.trending(top_n=limit)
