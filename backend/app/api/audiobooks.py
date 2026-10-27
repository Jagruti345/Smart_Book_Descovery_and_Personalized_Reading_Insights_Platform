from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.book import Book
from app.schemas.schemas import BookOut

router = APIRouter(prefix="/api/audiobooks", tags=["audiobooks"])

# Voice presets for the Web Speech / Edge-TTS narration bridge. The frontend
# passes the BCP-47 code to speechSynthesis; this list drives the language
# picker in the Audiobook Player and Accessible Reader.
LANGUAGE_PRESETS = [
    {"code": "hi-IN", "label": "Hindi (Indian)"},
    {"code": "en-IN", "label": "English (India)"},
    {"code": "mr-IN", "label": "Marathi"},
    {"code": "bn-IN", "label": "Bengali"},
    {"code": "ta-IN", "label": "Tamil"},
    {"code": "te-IN", "label": "Telugu"},
    {"code": "en-US", "label": "English (US)"},
    {"code": "en-GB", "label": "English (UK)"},
    {"code": "es-ES", "label": "Spanish"},
    {"code": "fr-FR", "label": "French"},
    {"code": "de-DE", "label": "German"},
]


@router.get("/languages")
def get_language_presets():
    return {"languages": LANGUAGE_PRESETS}


@router.get("", response_model=list[BookOut])
def list_audiobooks(limit: int = 30, db: Session = Depends(get_db)):
    return db.query(Book).filter(Book.librivox_url != "").order_by(Book.avg_rating.desc()).limit(limit).all()


@router.get("/{book_id}/stream-info")
def stream_info(book_id: int, db: Session = Depends(get_db)):
    book = db.get(Book, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if not book.librivox_url:
        # No LibriVox recording available -> fall back to on-the-fly TTS narration
        return {
            "source": "tts",
            "url": None,
            "message": "No public-domain narration found for this title; use the in-app TTS narrator instead.",
            "tts_text": book.full_text_excerpt or book.synopsis,
        }
    return {"source": "librivox", "url": book.librivox_url, "narrator": "LibriVox volunteer narrator"}
