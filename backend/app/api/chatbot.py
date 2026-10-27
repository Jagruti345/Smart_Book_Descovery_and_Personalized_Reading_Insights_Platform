from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.schemas import OnboardingAnswers, UserOut, DiscoveryQuery, DiscoveryResponse, RecommendedBookOut, BookOut
from app.ml.nlp_matcher import extract_intent, search_books, explain_match
from app.ml.hybrid_recommender import HybridRecommender
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

# The 5-6 guided onboarding questions, sent to the frontend so the chat UI
# can render them one at a time without hardcoding copy client-side.
ONBOARDING_QUESTIONS = [
    {
        "key": "reading_frequency",
        "prompt": "How much do you usually read? Pick what feels closest to you.",
        "type": "single_choice",
        "options": [
            {"value": "casual", "label": "Casual — about 10 minutes a day"},
            {"value": "regular", "label": "Regular — 20-30 minutes a day"},
            {"value": "bookworm", "label": "Bookworm — an hour or more a day"},
        ],
    },
    {
        "key": "favorite_genres",
        "prompt": "Which genres pull you in? Choose as many as you like.",
        "type": "multi_choice",
        "options": [
            "Mystery", "Thriller", "Fantasy", "Science Fiction", "Romance",
            "Non-Fiction", "Self-Help", "Horror", "Historical Fiction", "Biography", "Classic",
        ],
    },
    {
        "key": "loved_books_or_authors",
        "prompt": "Name a book or author you loved (or a few) — this helps us find your next favorite.",
        "type": "free_text_list",
    },
    {
        "key": "preferred_format",
        "prompt": "Would you rather read, listen, or both?",
        "type": "single_choice",
        "options": [
            {"value": "text", "label": "Reading text"},
            {"value": "audio", "label": "Listening to audiobooks"},
            {"value": "both", "label": "Both, depending on my mood"},
        ],
    },
    {
        "key": "primary_purpose",
        "prompt": "What are you mostly reading for right now?",
        "type": "single_choice",
        "options": [
            {"value": "pleasure", "label": "Pure enjoyment / escapism"},
            {"value": "self_improvement", "label": "Self-improvement"},
            {"value": "academic", "label": "Academic / professional knowledge"},
        ],
    },
    {
        "key": "accessibility",
        "prompt": "Any accessibility preferences we should set up for you now?",
        "type": "accessibility_picker",
        "options": [
            {"value": "large_text", "label": "Larger text by default"},
            {"value": "dyslexic_font", "label": "Dyslexia-friendly font"},
            {"value": "high_contrast", "label": "High-contrast theme"},
            {"value": "none", "label": "No changes needed"},
        ],
    },
]


@router.get("/onboarding/questions")
def get_onboarding_questions():
    return {"questions": ONBOARDING_QUESTIONS}


@router.post("/onboarding/submit", response_model=UserOut)
def submit_onboarding(payload: OnboardingAnswers, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    daily_goal = {"casual": 10, "regular": 25, "bookworm": 60}.get(payload.reading_frequency, 15)

    user.preferences = {
        "reading_frequency": payload.reading_frequency,
        "daily_minutes_goal": daily_goal,
        "favorite_genres": payload.favorite_genres,
        "loved_books_or_authors": payload.loved_books_or_authors,
        "preferred_format": payload.preferred_format,
        "primary_purpose": payload.primary_purpose,
    }

    # Content-based profile seed: simple genre weight map used by the recommender
    cb_profile = {g: 1.0 for g in payload.favorite_genres}
    user.cb_profile = cb_profile

    # Fold accessibility choices into settings
    acc = dict(user.accessibility_settings or {})
    a = payload.accessibility or {}
    if a.get("large_text"):
        acc["fontSize"] = 22
    if a.get("dyslexic_font"):
        acc["dyslexicFont"] = True
    if a.get("high_contrast"):
        acc["theme"] = "high-contrast"
    user.accessibility_settings = acc

    user.onboarding_complete = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/discover", response_model=DiscoveryResponse)
def discover(payload: DiscoveryQuery, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Conversational discovery search. Fully offline by default (TF-IDF +
    keyword intent extraction). If an LLM key is configured this could be
    swapped to phrase `reply` more naturally -- retrieval stays local either way.
    """
    intent = extract_intent(payload.message)

    engine = HybridRecommender(db)
    scored = search_books(
        db, intent,
        vectorizer=getattr(engine, "vectorizer", None),
        content_matrix=engine.content_matrix,
        books=engine.books,
        top_n=6,
    )

    books_out = []
    for book, score in scored:
        reason = explain_match(book, intent)
        books_out.append(
            RecommendedBookOut(**BookOut.model_validate(book).model_dump(), score=round(float(score), 3), reason=reason)
        )

    if books_out:
        top_titles = ", ".join(b.title for b in books_out[:3])
        reply = f"Based on what you described, you might love: {top_titles}. Here's the full list with why each one fits."
    else:
        reply = "I couldn't find a strong match yet — try mentioning a genre, mood, or an author/book you enjoyed, like 'a cozy mystery similar to Agatha Christie'."

    return DiscoveryResponse(reply=reply, books=books_out, extracted=intent)
