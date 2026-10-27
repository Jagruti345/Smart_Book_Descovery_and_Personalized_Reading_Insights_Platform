"""
Text Summarizer
================
Offline extractive summarization (TF-IDF sentence scoring, a lightweight
TextRank-style approach) so summaries work with zero API keys. If an LLM
key is configured, chatbot.py/reading.py may layer an abstractive rewrite
on top -- but the extractive summary is always the reliable fallback.
"""
from __future__ import annotations
import re
from typing import List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _split_sentences(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 15]


def extractive_summary(text: str, n_sentences: int = 3) -> List[str]:
    sentences = _split_sentences(text)
    if len(sentences) <= n_sentences:
        return sentences

    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return sentences[:n_sentences]

    sim_matrix = cosine_similarity(matrix)
    # TextRank-lite: score = sum of similarity to all other sentences
    scores = sim_matrix.sum(axis=1)
    # Slight bias toward earlier sentences (topic sentences)
    position_bias = np.linspace(1.15, 0.9, len(sentences))
    scores = scores * position_bias

    ranked_idx = np.argsort(-scores)[:n_sentences]
    ranked_idx = sorted(ranked_idx)  # keep original order for readability
    return [sentences[i] for i in ranked_idx]


def summarize_book(title: str, synopsis: str, excerpt: str = "") -> Dict[str, object]:
    combined = f"{synopsis} {excerpt}".strip() or synopsis
    quick_takeaways = extractive_summary(combined, n_sentences=3)
    executive = extractive_summary(combined, n_sentences=6)
    return {
        "title": title,
        "quick_takeaways": quick_takeaways,
        "executive_summary": " ".join(executive) if executive else synopsis,
        "method": "extractive-tfidf",
    }
