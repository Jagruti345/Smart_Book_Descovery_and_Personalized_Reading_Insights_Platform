from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app import models  # noqa: F401  (ensures models are registered on Base)

from app.api import auth, books, recommendations, chatbot, reading, audiobooks, reviews, analytics, admin

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(books.router)
app.include_router(recommendations.router)
app.include_router(chatbot.router)
app.include_router(reading.router)
app.include_router(audiobooks.router)
app.include_router(reviews.router)
app.include_router(analytics.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
