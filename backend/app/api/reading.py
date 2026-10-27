from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.reading_history import ReadingHistory
from app.schemas.schemas import ReadingSessionCreate, ReadingSessionOut, StreakUpdateResult
from app.api.deps import get_current_user
from app.api.analytics import evaluate_and_award_badges  # shared badge logic

router = APIRouter(prefix="/api/reading", tags=["reading"])


@router.post("/session", response_model=StreakUpdateResult)
def log_session(payload: ReadingSessionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    hour = payload.started_at_hour if payload.started_at_hour is not None else now.hour

    session = ReadingHistory(
        user_id=user.id,
        book_id=payload.book_id,
        minutes=payload.minutes,
        mode=payload.mode,
        progress_percent=payload.progress_percent,
        session_date=today_str,
        started_at_hour=hour,
    )
    db.add(session)

    # --- streak logic ---
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    if user.last_read_date == today_str:
        pass  # already logged today, streak unchanged
    elif user.last_read_date == yesterday_str:
        user.current_streak += 1
    else:
        user.current_streak = 1
    user.last_read_date = today_str
    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.total_minutes_read += payload.minutes

    db.add(user)
    db.commit()

    new_badges = evaluate_and_award_badges(db, user, session)

    return StreakUpdateResult(
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        total_minutes_read=user.total_minutes_read,
        new_badges=new_badges,
    )


@router.get("/history", response_model=list[ReadingSessionOut])
def my_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ReadingHistory)
        .filter(ReadingHistory.user_id == user.id)
        .order_by(ReadingHistory.created_at.desc())
        .limit(100)
        .all()
    )
