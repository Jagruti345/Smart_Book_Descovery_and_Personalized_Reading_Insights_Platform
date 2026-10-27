"""
Hybrid Recommendation Engine
=============================
FinalScore(u, b) = alpha * Score_CB(u, b) + (1 - alpha) * Score_CF(u, b)
alpha = max(0.2, 1.0 - 0.1 * N_ratings(u))

- Content-Based (CB): TF-IDF over each book's genres/tags/synopsis/author,
  compared via cosine similarity against a user preference vector built
  from onboarding answers + positively-rated books.
- Collaborative Filtering (CF): item-item cosine similarity on the
  sparse user-item ratings matrix (falls back gracefully with few ratings).
- A small popularity/diversity re-rank blends in trending books so the
  list doesn't collapse into a filter bubble.
"""
from __future__ import annotations
from typing import List, Dict, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from sqlalchemy.orm import Session
from app.models.book import Book, Rating
from app.models.user import User


def _book_text(book: Book) -> str:
    genres = " ".join(book.genres or [])
    tags = " ".join(book.tags or [])
    # genres/author repeated for extra TF-IDF weight relative to synopsis prose
    return f"{genres} {genres} {tags} {tags} {book.author} {book.mood} {book.synopsis}"


class HybridRecommender:
    def __init__(self, db: Session):
        self.db = db
        self.books: List[Book] = db.query(Book).all()
        self._build_content_matrix()
        self._build_ratings_matrix()

    def _build_content_matrix(self):
        if not self.books:
            self.tfidf = None
            self.content_matrix = None
            return
        corpus = [_book_text(b) for b in self.books]
        self.vectorizer = TfidfVectorizer(stop_words="english", max_features=4000)
        self.content_matrix = self.vectorizer.fit_transform(corpus)
        self.book_index = {b.id: i for i, b in enumerate(self.books)}

    def _build_ratings_matrix(self):
        ratings: List[Rating] = self.db.query(Rating).all()
        self.user_ids = sorted({r.user_id for r in ratings})
        self.user_idx = {u: i for i, u in enumerate(self.user_ids)}
        book_idx = getattr(self, "book_index", {})
        if not ratings or not book_idx:
            self.ratings_matrix = None
            return
        M = np.zeros((len(self.user_ids), len(self.books)))
        for r in ratings:
            if r.book_id in book_idx and r.user_id in self.user_idx:
                M[self.user_idx[r.user_id], book_idx[r.book_id]] = r.stars
        self.ratings_matrix = M
        # item-item similarity (used for CF)
        if M.shape[0] >= 2:
            self.item_sim = cosine_similarity(M.T)
        else:
            self.item_sim = None

    def _user_cb_vector(self, user: User) -> np.ndarray:
        """Build a user's content preference query string from onboarding
        answers + genres of books they rated >= 4 stars."""
        prefs = user.preferences or {}
        parts = []
        parts += prefs.get("favorite_genres", []) * 3
        parts += prefs.get("loved_books_or_authors", [])
        parts.append(prefs.get("primary_purpose", ""))

        liked_book_ids = [
            r.book_id for r in self.db.query(Rating).filter(
                Rating.user_id == user.id, Rating.stars >= 4
            ).all()
        ]
        for bid in liked_book_ids:
            idx = self.book_index.get(bid)
            if idx is not None:
                b = self.books[idx]
                parts += (b.genres or []) + (b.tags or [])

        query_text = " ".join(parts) or "general fiction"
        return self.vectorizer.transform([query_text])

    def score_content_based(self, user: User) -> Dict[int, float]:
        if self.content_matrix is None:
            return {}
        user_vec = self._user_cb_vector(user)
        sims = cosine_similarity(user_vec, self.content_matrix)[0]
        return {b.id: float(sims[i]) for i, b in enumerate(self.books)}

    def score_collaborative(self, user: User) -> Dict[int, float]:
        if self.ratings_matrix is None or self.item_sim is None:
            return {}
        if user.id not in self.user_idx:
            return {}
        u_row = self.ratings_matrix[self.user_idx[user.id]]
        scores = u_row @ self.item_sim  # predicted preference per item
        norm = np.abs(self.item_sim).sum(axis=0) + 1e-9
        scores = scores / norm
        return {b.id: float(scores[i]) for i, b in enumerate(self.books)}

    def recommend(self, user: User, top_n: int = 12, exclude_ids: set | None = None) -> List[Tuple[Book, float, str]]:
        exclude_ids = exclude_ids or set()
        n_ratings = self.db.query(Rating).filter(Rating.user_id == user.id).count()
        alpha = max(0.2, 1.0 - 0.1 * n_ratings)

        cb_scores = self.score_content_based(user)
        cf_scores = self.score_collaborative(user)

        results = []
        for b in self.books:
            if b.id in exclude_ids:
                continue
            cb = cb_scores.get(b.id, 0.0)
            cf = cf_scores.get(b.id, 0.0)
            final = alpha * cb + (1 - alpha) * cf
            # small popularity boost for diversity / trending re-rank
            popularity_boost = 0.05 * min(b.ratings_count, 100) / 100.0
            final = 0.92 * final + popularity_boost
            reason = self._explain(user, b, cb, cf, alpha)
            results.append((b, final, reason))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_n]

    def _explain(self, user: User, book: Book, cb: float, cf: float, alpha: float) -> str:
        prefs = user.preferences or {}
        fav_genres = set(g.lower() for g in prefs.get("favorite_genres", []))
        overlap = [g for g in (book.genres or []) if g.lower() in fav_genres]
        if overlap:
            return f"Because you love {', '.join(overlap[:2])}"
        if alpha < 0.5 and cf >= cb:
            return "Readers with similar taste to you also loved this"
        if book.mood:
            return f"Matches your taste for {book.mood} reads"
        return "Trending with readers like you"

    def trending(self, top_n: int = 10) -> List[Book]:
        return sorted(self.books, key=lambda b: (b.avg_rating * min(b.ratings_count, 500)), reverse=True)[:top_n]
