"""
External book catalog bridge: Open Library (search + covers + metadata) and
Gutendex/Project Gutenberg (full text for public-domain titles).

Both are free, public, and require no API key. Every call is wrapped so a
network hiccup degrades to "no external results" rather than crashing a
request -- the local seeded catalog always still works on its own.

Fetched books are upserted into the local `books` table (source="open_library")
so reviews, ratings, wishlist entries, and the recommender can all reference
them exactly like a seeded book.
"""
from __future__ import annotations
from typing import Optional
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.book import Book
from app.ml.nlp_matcher import GENRE_KEYWORDS


def _map_subjects_to_genres(subjects: list[str]) -> list[str]:
    """Best-effort mapping of Open Library's free-text subjects onto our
    canonical genre taxonomy, so external books mix naturally with seeded
    ones in genre filters and the recommender's TF-IDF space."""
    lowered = [s.lower() for s in subjects]
    matched = []
    for genre, keywords in GENRE_KEYWORDS.items():
        if any(any(kw in subj for kw in keywords) for subj in lowered):
            matched.append(genre.title())
    return matched or ["Fiction"]


def _map_ol_doc_to_book_fields(doc: dict) -> dict:
    cover_i = doc.get("cover_i")
    cover_url = f"{settings.OPEN_LIBRARY_COVER_URL}/{cover_i}-L.jpg" if cover_i else ""

    raw_subjects = doc.get("subject", [])[:8]
    first_sentence = doc.get("first_sentence")
    if isinstance(first_sentence, list) and first_sentence:
        synopsis = first_sentence[0]
    elif isinstance(first_sentence, str):
        synopsis = first_sentence
    else:
        synopsis = "No synopsis available yet -- open the book to read an excerpt."

    return dict(
        title=doc.get("title", "Untitled")[:500],
        author=(doc.get("author_name") or ["Unknown"])[0][:300],
        genres=_map_subjects_to_genres(raw_subjects),
        tags=[s.title() for s in raw_subjects[:5]],
        synopsis=synopsis,
        cover_url=cover_url,
        isbn=(doc.get("isbn") or [""])[0],
        published_year=doc.get("first_publish_year") or 2000,
        avg_rating=round(float(doc.get("ratings_average") or 0.0), 2),
        ratings_count=int(doc.get("ratings_count") or 0),
        page_count=int(doc.get("number_of_pages_median") or 250),
        is_public_domain=bool(doc.get("public_scan_b") or doc.get("ia")),
        mood="",
        pacing="medium",
        source="open_library",
        external_id=doc.get("key", ""),
    )


def search_open_library(query: str, limit: int = 12) -> list[dict]:
    """Raw search against Open Library. Returns [] on any network/parsing
    failure rather than raising, so callers can treat it as 'no extra results'."""
    if not query.strip():
        return []
    params = {
        "q": query,
        "limit": limit,
        "fields": "key,title,author_name,first_publish_year,cover_i,subject,"
                  "isbn,ia,public_scan_b,ratings_average,ratings_count,"
                  "number_of_pages_median,first_sentence",
    }
    try:
        with httpx.Client(timeout=settings.EXTERNAL_HTTP_TIMEOUT) as client:
            resp = client.get(settings.OPEN_LIBRARY_SEARCH_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("docs", [])
    except (httpx.HTTPError, ValueError):
        return []


def get_or_create_books_from_open_library(db: Session, query: str, limit: int = 12) -> list[Book]:
    """Search Open Library and upsert matches into the local catalog.
    Existing rows (matched by source+external_id) are returned as-is rather
    than duplicated, so wishlists/reviews/ratings on them keep working."""
    docs = search_open_library(query, limit=limit)
    if not docs:
        return []

    results = []
    for doc in docs:
        external_id = doc.get("key", "")
        if not external_id or not doc.get("title"):
            continue
        existing = (
            db.query(Book)
            .filter(Book.source == "open_library", Book.external_id == external_id)
            .first()
        )
        if existing:
            results.append(existing)
            continue

        fields = _map_ol_doc_to_book_fields(doc)
        book = Book(**fields)
        db.add(book)
        results.append(book)

    db.commit()
    for b in results:
        db.refresh(b)
    return results


def fetch_gutenberg_excerpt(title: str, author: str, max_chars: int = 3000) -> Optional[dict]:
    """
    Look up a public-domain title on Gutendex (Project Gutenberg's API) and
    pull the opening of the plain-text edition for the in-app reader.
    Returns {"gutenberg_id": str, "excerpt": str} or None if no match/no
    plain-text format is available.
    """
    try:
        with httpx.Client(timeout=settings.EXTERNAL_HTTP_TIMEOUT) as client:
            resp = client.get(settings.GUTENDEX_URL, params={"search": f"{title} {author}"})
            resp.raise_for_status()
            results = resp.json().get("results", [])
            if not results:
                return None
            book = results[0]
            formats = book.get("formats", {})
            text_url = next(
                (url for mime, url in formats.items() if mime.startswith("text/plain")),
                None,
            )
            if not text_url:
                return None

            with client.stream("GET", text_url) as stream:
                stream.raise_for_status()
                chunks = []
                collected = 0
                for chunk in stream.iter_text():
                    chunks.append(chunk)
                    collected += len(chunk)
                    if collected >= max_chars * 3:  # grab extra so we can trim boilerplate
                        break
                raw_text = "".join(chunks)

            # Gutenberg files open with a standard "*** START OF ..." marker;
            # skip past it so the excerpt starts at actual prose, not license text.
            marker = "*** START OF"
            idx = raw_text.find(marker)
            if idx != -1:
                idx = raw_text.find("\n", idx)
                raw_text = raw_text[idx + 1:] if idx != -1 else raw_text

            excerpt = raw_text.strip()[:max_chars]
            return {"gutenberg_id": str(book.get("id", "")), "excerpt": excerpt}
    except (httpx.HTTPError, ValueError):
        return None
