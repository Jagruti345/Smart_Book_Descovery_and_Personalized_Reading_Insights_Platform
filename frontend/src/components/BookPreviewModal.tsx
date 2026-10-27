"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Star, BookOpen, Headphones, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import type { Book, RecommendedBook } from "@/types";
import { api } from "@/lib/api";

interface BookPreviewModalProps {
  book: Book | RecommendedBook | null;
  onClose: () => void;
}

export default function BookPreviewModal({ book, onClose }: BookPreviewModalProps) {
  const [summary, setSummary] = useState<{ quick_takeaways: string[]; executive_summary: string } | null>(null);

  useEffect(() => {
    if (!book) {
      setSummary(null);
      return;
    }
    api.getBookSummary(book.id)
      .then((s) => setSummary(s as { quick_takeaways: string[]; executive_summary: string }))
      .catch(() => {});
  }, [book]);

  if (!book) return null;

  const rec = book as RecommendedBook;
  const matchPct = rec.match_percentage || (rec.score ? Math.round(rec.score * 100) : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-ink/10 bg-cream shadow-2xl p-6 thin-scroll">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Preview"
          className="absolute top-4 right-4 rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        <div className="grid sm:grid-cols-[160px_1fr] gap-6 items-start">
          {/* Cover */}
          <div className="w-full aspect-[2/3] rounded-md overflow-hidden bg-navy-deep shadow-book mx-auto max-w-[180px]">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-navy text-cream">
                <span className="font-serif text-sm font-semibold">{book.title}</span>
                <span className="text-xs text-cream/70 mt-1">{book.author}</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {matchPct && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 text-amber px-2.5 py-0.5 text-xs font-semibold">
                  <Sparkles size={11} />
                  {matchPct}% Pattern Match
                </span>
              )}
              {book.is_public_domain && (
                <span className="rounded-full bg-forest/15 text-forest px-2.5 py-0.5 text-xs font-medium">
                  Free Public Domain
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl font-semibold text-navy leading-snug mb-1">{book.title}</h3>
            <p className="text-sm text-ink-muted mb-3">
              by <span className="text-ink font-medium">{book.author}</span> · {book.published_year} · {book.page_count} pages
            </p>

            <div className="flex items-center gap-1 text-xs text-ink mb-3">
              <Star size={13} className="fill-amber text-amber" />
              <span className="font-semibold">{book.avg_rating.toFixed(1)}</span>
              <span className="text-ink-muted">({book.ratings_count} reader ratings)</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(book.genres || []).map((g) => (
                <span key={g} className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed line-clamp-4 mb-4">{book.synopsis}</p>

            {/* AI Summary Bullets if available */}
            {summary && summary.quick_takeaways?.length > 0 && (
              <div className="rounded-lg bg-amber/5 border border-amber/20 p-3 mb-4">
                <p className="text-xs font-semibold text-amber-bright mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} />
                  Key Takeaways
                </p>
                <ul className="space-y-1 text-xs text-ink-soft">
                  {summary.quick_takeaways.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10">
              <Link
                href={`/reader/${book.id}`}
                onClick={onClose}
                className="flex items-center gap-1.5 rounded-full bg-navy text-cream px-4 py-2 text-xs font-semibold hover:bg-navy-deep transition-colors shadow-sm"
              >
                <BookOpen size={13} />
                Read in Reader
              </Link>

              {book.librivox_url && (
                <Link
                  href={`/audiobooks/${book.id}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/10 text-forest px-4 py-2 text-xs font-semibold hover:bg-forest/20 transition-colors"
                >
                  <Headphones size={13} />
                  Listen
                </Link>
              )}

              <Link
                href={`/books/${book.id}`}
                onClick={onClose}
                className="flex items-center gap-1 rounded-full border border-ink/15 px-3 py-2 text-xs font-medium text-ink-soft hover:bg-ink/5 transition-colors ml-auto"
              >
                Full details <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
