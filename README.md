# Folio — Smart Book Discovery & Personalized Reading Platform

A full-stack platform combining AI-driven hybrid recommendations, a conversational
discovery chatbot, an accessible reader with multilingual text-to-speech, free
public-domain audiobooks, reading analytics/gamification, and an admin panel.

Everything runs **zero-config, with no API keys required** — the recommender and
chatbot use offline TF-IDF/heuristic models by default, and the database is
SQLite out of the box.

---

## Project layout

```
backend/     FastAPI + SQLAlchemy + scikit-learn (hybrid recommender, NLP, summarizer)
frontend/    Next.js 14 (App Router) + TypeScript + Tailwind CSS
docker-compose.yml   Optional production stack (Postgres + Redis)
```

## Quick start (local evaluation / viva — single command each side)

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py               # seeds 32 books + a demo login
uvicorn app.main:app --reload --port 8000
```

Backend is now running at `http://localhost:8000` (interactive API docs at `/docs`).

**Demo login:** `demo@bookapp.dev` / `demo1234` (pre-seeded with onboarding
answers and ratings so recommendations work immediately). The **first account
you register** through the app is automatically made an admin, so you can also
just sign up fresh and get full admin access.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local     # points at http://localhost:8000 by default
npm install
npm run dev
```

Open `http://localhost:3000`.

That's it — no database server, no Redis, no API keys needed for the full demo.

---

## Moving to production (Postgres + Redis)

```bash
docker compose up --build
```

This builds both services and runs Postgres + Redis alongside them. Set
`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY` / `GROQ_API_KEY` (optional),
and `CORS_ORIGINS` via environment variables or a `.env` file in `backend/`.

---

## What's implemented

### Hybrid Recommendation Engine & Reader DNA (`backend/app/ml/hybrid_recommender.py`, `backend/app/api/analytics.py`)
- Content-Based: TF-IDF over genre/tags/synopsis/author, cosine similarity
  against a user preference vector seeded by onboarding answers.
- Collaborative Filtering: item-item cosine similarity over the ratings matrix.
- Dynamic cold-start blending: `alpha = max(0.2, 1.0 - 0.1 * n_ratings)`.
- **Reader DNA & Behavioral Profile**: Calculates Reader Archetypes (e.g. *The Deductive Philosopher*, *The Stoic Inquirer*), mood spectrum meters, pacing affinity gauges, format ratios, and explainable match drivers with synergy tags (e.g. `96% Match`).

### Real Classics & Live Open Library Integration (`backend/app/api/books.py`)
- **Zero Dummy Data**: 33 genuine, universally renowned world masterworks spanning Mystery, Philosophy, Gothic Horror, Classic Romance, Sci-Fi, and Epic Adventure.
- **High-Definition Open Library Covers**: Real cover images via `covers.openlibrary.org`, paired with a gold-embossed cloth spine fallback.
- **Live Open Library Global Search**: `/api/books/open-library/search` connects live to the Open Library Search API with direct Internet Archive reading and borrowing links.
- **Project Gutenberg Text Reader**: `/api/books/gutenberg/text/{id}` fetches clean public-domain full texts with chapter segmentation for in-app reading.

### Unique Front-End UI & Aesthetics
- **3D Book Perspective Hover**: Realistic spine sheen, page edge lines, and hover rotation.
- **Authentic Wooden Bookshelf View**: Displays vertical book spines on mahogany shelves with embossed lettering and hover pull-out animation.
- **Quick Peek Modal**: Instant book preview drawer with synopsis, AI summary takeaways, and direct read action.
- **Focus Reading Guide Ruler**: Interactive dyslexia-friendly reading overlay ruler.

### Chatbot (`backend/app/api/chatbot.py`, `backend/app/ml/nlp_matcher.py`)
- Guided onboarding flow and offline keyword/TF-IDF intent matching.

### Accessible Reader & Audiobooks
- Font scaling (14–32px), four themes (light/sepia/dark/max-contrast),
  OpenDyslexic font toggle, all in `AccessibilityBar.tsx`.
- Web Speech API narration with live sentence highlighting (`lib/speech.ts`).
- LibriVox streaming for public-domain titles, falling back to on-demand TTS.
- Extractive summarizer (`ml/summarizer.py`) on detail pages.

### Gamification & Analytics (`backend/app/api/analytics.py`)
- Daily streak tracking and milestone badges.
- Weekly minutes bar chart + genre-breakdown donut chart (Recharts) on `/dashboard`.
- Community reading pulse counter.
  sessions → badges → reviews → admin) during development.

## Tech stack

- **Backend**: FastAPI, SQLAlchemy 2.0, SQLite (dev) / PostgreSQL (prod),
  scikit-learn (TF-IDF, cosine similarity), python-jose (JWT), passlib (bcrypt).
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts,
  lucide-react, Web Speech API.
