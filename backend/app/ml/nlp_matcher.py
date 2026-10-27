"""
Semantic mood/theme search & intent extraction for the Discovery Chatbot.

Works 100% offline via keyword/TF-IDF heuristics so the platform never
requires a third-party API key. If GEMINI_API_KEY or GROQ_API_KEY is set,
`chatbot.py` may use the LLM to *phrase* the reply, but the actual
candidate retrieval always runs through this matcher first, so results stay
explainable and deterministic even offline.
"""
from __future__ import annotations
from typing import Dict, List, Any
import re
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.models.book import Book

MOOD_KEYWORDS = {
    "suspenseful": ["suspense", "thriller", "edge of my seat", "tense", "page-turner", "page turner"],
    "cozy": ["cozy", "comfort", "warm", "gentle", "feel-good", "wholesome"],
    "dark": ["dark", "grim", "bleak", "haunting", "unsettling"],
    "inspiring": ["inspiring", "motivational", "uplifting", "self-improvement", "habit"],
    "romantic": ["romance", "romantic", "love story", "swoon"],
    "funny": ["funny", "hilarious", "witty", "humor", "humorous", "comedy"],
    "atmospheric": ["atmospheric", "moody", "immersive world", "vivid setting"],
    "adventurous": ["adventure", "quest", "epic journey", "exploration"],
}

GENRE_KEYWORDS = {
    "mystery": ["mystery", "detective", "whodunit", "sherlock", "agatha christie"],
    "thriller": ["thriller", "suspense"],
    "fantasy": ["fantasy", "dragons", "magic", "wizards"],
    "science fiction": ["sci-fi", "science fiction", "space", "dystopian"],
    "romance": ["romance", "love story"],
    "non-fiction": ["non-fiction", "nonfiction", "real story", "true story"],
    "self-help": ["self-help", "self help", "productivity", "habit building", "habits"],
    "horror": ["horror", "scary", "ghost"],
    "historical fiction": ["historical", "period drama", "war novel"],
    "biography": ["biography", "memoir"],
    "classic": ["classic", "classics", "literary"],
}

PACING_KEYWORDS = {
    "fast": ["fast-paced", "fast paced", "quick read", "page-turner", "short"],
    "slow": ["slow burn", "slow-paced", "literary", "meditative"],
}

FORMAT_KEYWORDS = {
    "audio": ["audiobook", "listen", "narration", "commute", "audio"],
    "text": ["read", "book", "novel"],
}


def extract_intent(message: str) -> Dict[str, Any]:
    text = message.lower()
    found_moods = [m for m, kws in MOOD_KEYWORDS.items() if any(k in text for k in kws)]
    found_genres = [g for g, kws in GENRE_KEYWORDS.items() if any(k in text for k in kws)]
    found_pacing = next((p for p, kws in PACING_KEYWORDS.items() if any(k in text for k in kws)), None)
    found_format = "audio" if any(k in text for k in FORMAT_KEYWORDS["audio"]) else None

    # crude "short book" / time-budget detection
    short_match = re.search(r"(\d+)\s*[- ]?min", text)
    time_budget = int(short_match.group(1)) if short_match else None

    # authors/comps mentioned e.g. "like Agatha Christie"
    comp_match = re.findall(r"like ([a-z .]+?)(?:,| in| set|\.|$)", text)
    comps = [c.strip().title() for c in comp_match if len(c.strip()) > 2]

    return {
        "moods": found_moods,
        "genres": found_genres,
        "pacing": found_pacing,
        "format": found_format,
        "time_budget_minutes": time_budget,
        "comps": comps,
        "raw_query": message,
    }


def search_books(db: Session, intent: Dict[str, Any], vectorizer=None, content_matrix=None, books: List[Book] = None, top_n: int = 8):
    """Rank books against extracted intent using keyword overlap + optional TF-IDF similarity."""
    books = books if books is not None else db.query(Book).all()
    if not books:
        return []

    scored = []
    for b in books:
        score = 0.0
        b_genres = [g.lower() for g in (b.genres or [])]
        b_tags = [t.lower() for t in (b.tags or [])]
        b_mood = (b.mood or "").lower()

        for g in intent.get("genres", []):
            if g in b_genres:
                score += 2.0
        for m in intent.get("moods", []):
            if m == b_mood or m in b_tags:
                score += 2.0
        if intent.get("pacing") and intent["pacing"] == (b.pacing or ""):
            score += 1.0
        for comp in intent.get("comps", []):
            if comp.lower() in (b.author or "").lower():
                score += 3.0
        if intent.get("time_budget_minutes"):
            # favor shorter books for short time budgets
            est_minutes = max(30, b.page_count * 0.8)
            if est_minutes <= intent["time_budget_minutes"] * 6:  # generous heuristic
                score += 1.0
        # small popularity tiebreaker
        score += min(b.avg_rating, 5) * 0.1

        if score > 0:
            scored.append((b, score))

    # TF-IDF fallback boost using the raw free-text query against synopsis/genres
    if vectorizer is not None and content_matrix is not None and intent.get("raw_query"):
        try:
            qvec = vectorizer.transform([intent["raw_query"]])
            sims = cosine_similarity(qvec, content_matrix)[0]
            book_list = books
            sim_map = {book_list[i].id: sims[i] for i in range(len(book_list))}
            boosted = []
            existing_ids = {b.id for b, _ in scored}
            for b, s in scored:
                boosted.append((b, s + float(sim_map.get(b.id, 0)) * 2))
            for b in book_list:
                if b.id not in existing_ids and sim_map.get(b.id, 0) > 0.05:
                    boosted.append((b, float(sim_map[b.id]) * 2))
            scored = boosted
        except Exception:
            pass

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_n]


def explain_match(book: Book, intent: Dict[str, Any]) -> str:
    reasons = []
    genres = [g for g in intent.get("genres", []) if g in [x.lower() for x in (book.genres or [])]]
    if genres:
        reasons.append(f"it's {genres[0]}")
    moods = [m for m in intent.get("moods", []) if m == (book.mood or "").lower()]
    if moods:
        reasons.append(f"it has a {moods[0]} feel")
    comps = intent.get("comps", [])
    if comps and any(c.lower() in (book.author or "").lower() for c in comps):
        reasons.append(f"similar style to {comps[0]}")
    if not reasons:
        reasons.append("it closely matches what you described")
    return "Recommended because " + " and ".join(reasons[:2])
