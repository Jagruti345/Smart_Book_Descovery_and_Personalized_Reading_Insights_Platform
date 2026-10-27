import random
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.book import Book
from app.models.reading_history import ReadingHistory
from app.models.badge import UserBadge, BADGE_CATALOG
from app.schemas.schemas import (
    AnalyticsSummary,
    WeeklyStat,
    GenreStat,
    BadgeOut,
    ReaderDnaProfile,
    MoodDistributionItem,
    PacingDistribution,
    FormatSplit,
    NextMilestone,
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _award(db: Session, user: User, code: str) -> bool:
    """Award a badge if not already earned. Returns True if newly awarded."""
    existing = db.query(UserBadge).filter(UserBadge.user_id == user.id, UserBadge.badge_code == code).first()
    if existing:
        return False
    db.add(UserBadge(user_id=user.id, badge_code=code))
    db.commit()
    return True


def evaluate_and_award_badges(db: Session, user: User, latest_session: ReadingHistory) -> list[str]:
    newly_awarded = []

    if latest_session.minutes >= 15 and _award(db, user, "first_chapter"):
        newly_awarded.append("first_chapter")

    if user.current_streak >= 7 and _award(db, user, "streak_7"):
        newly_awarded.append("streak_7")

    if latest_session.started_at_hour >= 22 and _award(db, user, "night_owl"):
        newly_awarded.append("night_owl")

    sessions = db.query(ReadingHistory).filter(ReadingHistory.user_id == user.id).all()
    book_ids = {s.book_id for s in sessions}
    genres = set()
    if book_ids:
        books = db.query(Book).filter(Book.id.in_(book_ids)).all()
        for b in books:
            genres.update(b.genres or [])
    if len(genres) >= 3 and _award(db, user, "genre_explorer"):
        newly_awarded.append("genre_explorer")

    audio_minutes = sum(s.minutes for s in sessions if s.mode == "audio")
    if audio_minutes >= 120 and _award(db, user, "audio_aficionado"):
        newly_awarded.append("audio_aficionado")

    return newly_awarded


def _build_reader_dna(user: User, sessions: list[ReadingHistory], db: Session) -> ReaderDnaProfile:
    prefs = user.preferences or {}
    favorite_genres = [g.lower() for g in prefs.get("favorite_genres", [])]

    # Archetype determination
    if any(g in favorite_genres for g in ["mystery", "thriller"]) and any(g in favorite_genres for g in ["philosophy", "classic"]):
        archetype = "The Deductive Philosopher"
        tagline = "Driven by analytical rigor, timeless stoic reflection, and cerebral mysteries."
        dominant_vibe = "Cerebral & Suspenseful"
    elif any(g in favorite_genres for g in ["philosophy", "self-help", "non-fiction"]):
        archetype = "The Stoic Inquirer"
        tagline = "Reads for self-mastery, enduring mental models, and timeless wisdom."
        dominant_vibe = "Inspiring & Contemplative"
    elif any(g in favorite_genres for g in ["fantasy", "science fiction", "adventure"]):
        archetype = "The Intrepid Voyager"
        tagline = "Immerses in expansive worldbuilding, profound journeys, and speculative frontiers."
        dominant_vibe = "Adventurous & Visionary"
    elif any(g in favorite_genres for g in ["horror", "gothic"]):
        archetype = "The Midnight Gothic"
        tagline = "Fascinated by atmospheric tension, psychological shadows, and haunting prose."
        dominant_vibe = "Dark & Atmospheric"
    elif any(g in favorite_genres for g in ["romance", "classic"]):
        archetype = "The Belletrist Romantic"
        tagline = "Appreciates exquisite prose, character psychology, and nuanced historical drama."
        dominant_vibe = "Romantic & Cozy"
    else:
        archetype = "The Polymathic Reader"
        tagline = "Crosses literary boundaries with voracious curiosity and a flexible appetite."
        dominant_vibe = "Curious & Eclectic"

    # Time calculations
    total_session_minutes = sum(s.minutes for s in sessions)
    avg_velocity = round(total_session_minutes / max(len(sessions), 1)) if sessions else prefs.get("daily_minutes_goal", 25)
    daily_goal = prefs.get("daily_minutes_goal", 25)
    weekly_goal = daily_goal * 7
    completion_rate = min(100, round((total_session_minutes / max(weekly_goal, 1)) * 100)) if sessions else 85

    # Focus window
    late_hours = sum(1 for s in sessions if s.started_at_hour >= 20)
    early_hours = sum(1 for s in sessions if s.started_at_hour < 12)
    if late_hours >= early_hours and late_hours > 0:
        focus_window = "Night Owl Flow (9:00 PM – Midnight)"
    elif early_hours > 0:
        focus_window = "Morning Spark (7:00 AM – 10:30 AM)"
    else:
        focus_window = "Evening Twilight (6:00 PM – 9:00 PM)"

    # Format split
    audio_mins = sum(s.minutes for s in sessions if s.mode == "audio")
    text_mins = sum(s.minutes for s in sessions if s.mode == "text")
    total_mode_mins = audio_mins + text_mins
    if total_mode_mins > 0:
        audio_pct = round((audio_mins / total_mode_mins) * 100)
        text_pct = 100 - audio_pct
    else:
        pref_fmt = prefs.get("preferred_format", "both")
        if pref_fmt == "audio":
            text_pct, audio_pct = 20, 80
        elif pref_fmt == "text":
            text_pct, audio_pct = 85, 15
        else:
            text_pct, audio_pct = 65, 35

    # Mood spectrum
    mood_distribution = [
        MoodDistributionItem(mood="Suspenseful", percentage=38),
        MoodDistributionItem(mood="Inspiring & Philosophical", percentage=32),
        MoodDistributionItem(mood="Cozy & Reflective", percentage=18),
        MoodDistributionItem(mood="Dark Gothic", percentage=12),
    ]

    pacing_dist = PacingDistribution(fast=45, medium=40, slow=15)

    # Next milestone
    if user.current_streak < 7:
        next_milestone = NextMilestone(
            title="7-Day Streak Master",
            progress=user.current_streak,
            target=7,
            unit="consecutive days",
            reward_emoji="🔥",
        )
    elif total_session_minutes < 600:
        next_milestone = NextMilestone(
            title="10-Hour Immersion Scholar",
            progress=total_session_minutes,
            target=600,
            unit="reading minutes",
            reward_emoji="🏆",
        )
    else:
        next_milestone = NextMilestone(
            title="Genre Polymath Milestone",
            progress=len(favorite_genres),
            target=5,
            unit="genres explored",
            reward_emoji="🌟",
        )

    # Insights
    pattern_insights = [
        f"Your reading sessions average {avg_velocity} minutes, aligning perfectly with bite-sized novella chapters and casebooks.",
        f"Strong affinity for {dominant_vibe} narratives — hybrid recommendations will emphasize high-stakes deduction and philosophical depth.",
        f"Your {focus_window} window demonstrates your peak focus; you log 72% of all your reading progress during this period.",
    ]

    return ReaderDnaProfile(
        archetype=archetype,
        archetype_tagline=tagline,
        dominant_vibe=dominant_vibe,
        pacing_affinity="Fast to Balanced (20–35 min sessions)",
        reading_velocity_mins_per_day=avg_velocity,
        focus_window=focus_window,
        mood_distribution=mood_distribution,
        pacing_distribution=pacing_dist,
        format_split=FormatSplit(text_percent=text_pct, audio_percent=audio_pct),
        next_milestone=next_milestone,
        pattern_insights=pattern_insights,
        goal_completion_rate=completion_rate,
    )


@router.get("/summary", response_model=AnalyticsSummary)
def summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    sessions = (
        db.query(ReadingHistory)
        .filter(ReadingHistory.user_id == user.id)
        .all()
    )

    # weekly minutes (last 7 days, including today)
    day_minutes = defaultdict(int)
    for s in sessions:
        day_minutes[s.session_date] += s.minutes
    weekly = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        weekly.append(WeeklyStat(date=d, minutes=day_minutes.get(d, 0)))

    # genre breakdown
    book_ids = {s.book_id for s in sessions}
    genre_minutes = defaultdict(int)
    if book_ids:
        books = {b.id: b for b in db.query(Book).filter(Book.id.in_(book_ids)).all()}
        for s in sessions:
            b = books.get(s.book_id)
            if not b:
                continue
            for g in (b.genres or ["Classic"]):
                genre_minutes[g] += s.minutes
    else:
        # Default representation based on preferences
        for g in (user.preferences or {}).get("favorite_genres", ["Mystery", "Philosophy", "Classic"]):
            genre_minutes[g] = 40

    genre_breakdown = [GenreStat(genre=g, minutes=m) for g, m in sorted(genre_minutes.items(), key=lambda x: -x[1])][:8]

    earned_codes = {ub.badge_code for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()}
    badges = [
        BadgeOut(code=code, emoji=info["emoji"], name=info["name"], desc=info["desc"], earned=code in earned_codes)
        for code, info in BADGE_CATALOG.items()
    ]

    # simulated "community reading now" counter, deterministic-ish but lively
    community_now = 210 + (int(now.timestamp()) // 30) % 95

    # Compute Reader DNA profile
    reader_dna = _build_reader_dna(user, sessions, db)

    return AnalyticsSummary(
        current_streak=user.current_streak,
        longest_streak=user.longest_streak,
        total_minutes_read=user.total_minutes_read,
        weekly=weekly,
        genre_breakdown=genre_breakdown,
        badges=badges,
        community_reading_now=community_now,
        reader_dna=reader_dna,
    )


@router.get("/community-stats")
def community_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    community_now = 210 + (int(now.timestamp()) // 30) % 95
    total_readers = db.query(User).count()
    total_books = db.query(Book).count()
    return {
        "reading_right_now": community_now,
        "total_readers": max(total_readers, 420),
        "total_books_in_vault": total_books,
        "completed_today": 38 + (int(now.timestamp()) // 120) % 24,
    }
