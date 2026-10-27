"use client";
import { useState } from "react";
import Link from "next/link";
import { Star, Heart, Headphones, BookOpen, Eye, Sparkles } from "lucide-react";
import type { Book, RecommendedBook } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const SPINE_PALETTES = [
  { bg: "linear-gradient(135deg, #132238 0%, #1E3352 100%)", text: "#FDFBF7", accent: "#D4AF37" },
  { bg: "linear-gradient(135deg, #28543E 0%, #1D3D2D 100%)", text: "#FDFBF7", accent: "#E5C158" },
  { bg: "linear-gradient(135deg, #853333 0%, #5E2424 100%)", text: "#FDFBF7", accent: "#F2D06B" },
  { bg: "linear-gradient(135deg, #4A3B32 0%, #2E241E 100%)", text: "#FDFBF7", accent: "#E0A96D" },
  { bg: "linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)", text: "#FDFBF7", accent: "#F39C12" },
];

interface BookCardProps {
  book: Book | RecommendedBook;
  showReason?: boolean;
  onQuickPreview?: (book: Book | RecommendedBook) => void;
  priority?: boolean;
}

export default function BookCard({ book, showReason = false, onQuickPreview }: BookCardProps) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const rec = book as RecommendedBook;
  const matchPct = rec.match_percentage || (rec.score ? Math.min(99, Math.max(78, Math.round(rec.score * 100))) : null);
  const palette = SPINE_PALETTES[book.id % SPINE_PALETTES.length];

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    try {
      const res = await api.toggleWishlist(book.id);
      setWishlisted(res.wishlisted);
    } catch {
      /* ignore */
    }
  }

  function handleQuickPreview(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickPreview) {
      onQuickPreview(book);
    }
  }

  return (
    <div className="group relative flex flex-col h-full rounded-card border border-ink/10 bg-cream p-3 transition-all duration-300 hover:border-amber/50 hover:shadow-book-hover">
      {/* 3D Book Cover Wrap */}
      <div className="book-3d-wrap mb-3 relative">
        <Link href={`/books/${book.id}`} className="block">
          <div className="book-3d relative w-full aspect-[2/3] rounded-md overflow-hidden bg-navy-deep">
            {book.cover_url && !imgError ? (
              <img
                src={book.cover_url}
                alt={book.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              /* Fallback: Gold Embossed Fine Book Cloth Cover */
              <div
                className="w-full h-full flex flex-col justify-between p-4 text-center border-l-4 border-gold/40"
                style={{ background: palette.bg }}
              >
                <div className="text-[10px] tracking-widest uppercase font-serif text-gold/80 border-b border-gold/20 pb-1">
                  Folio Classic
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-sm leading-snug line-clamp-3 text-cream mb-1">
                    {book.title}
                  </h3>
                  <div className="w-8 h-0.5 mx-auto my-2 bg-gold/50 rounded-full" />
                  <p className="text-[11px] italic text-cream/80 line-clamp-1">{book.author}</p>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-gold/60">{book.genres?.[0] || "Literature"}</div>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {matchPct && (
                <span className="inline-flex items-center gap-1 rounded-full bg-navy/90 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-amber-bright border border-amber/30 shadow-sm">
                  <Sparkles size={10} />
                  {matchPct}% Match
                </span>
              )}
              {book.is_public_domain && (
                <span className="rounded-full bg-forest/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-cream border border-forest/30 shadow-sm">
                  Free Access
                </span>
              )}
            </div>

            {/* Quick Preview Hover Button */}
            {onQuickPreview && (
              <button
                onClick={handleQuickPreview}
                aria-label="Quick Preview"
                className="absolute bottom-2 right-2 rounded-full bg-navy/90 text-cream p-2 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-amber hover:scale-110 z-10"
                title="Quick Peek"
              >
                <Eye size={14} />
              </button>
            )}
          </div>
        </Link>

        {/* Wishlist Button */}
        {user && (
          <button
            onClick={toggleWishlist}
            aria-label="Save to Wishlist"
            className="absolute top-2 right-2 rounded-full bg-cream/90 backdrop-blur p-1.5 shadow-sm hover:scale-110 transition-transform z-20 border border-ink/10"
          >
            <Heart size={14} className={wishlisted ? "fill-wine text-wine" : "text-ink-soft hover:text-wine"} />
          </button>
        )}
      </div>

      {/* Book Metadata */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-ink-muted mb-1">
            <span className="truncate">{book.author}</span>
            <span>·</span>
            <span>{book.published_year > 0 ? book.published_year : `${Math.abs(book.published_year)} BCE`}</span>
          </div>

          <Link href={`/books/${book.id}`}>
            <h4 className="font-serif font-semibold text-navy text-sm leading-snug line-clamp-2 hover:text-amber transition-colors mb-1.5">
              {book.title}
            </h4>
          </Link>

          {/* Genre & Vibe Badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {(book.genres || []).slice(0, 2).map((g) => (
              <span key={g} className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                {g}
              </span>
            ))}
            {book.mood && (
              <span className="rounded-md bg-amber/10 px-1.5 py-0.5 text-[10px] font-medium text-amber capitalize">
                {book.mood}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Ratings, Audio & Action */}
        <div className="pt-2 border-t border-ink/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {book.avg_rating > 0 && (
              <div className="flex items-center gap-1 font-semibold text-ink">
                <Star size={12} className="fill-amber text-amber" />
                <span>{book.avg_rating.toFixed(1)}</span>
                <span className="text-[10px] font-normal text-ink-muted">({book.ratings_count})</span>
              </div>
            )}
            {book.librivox_url && (
              <span className="text-forest flex items-center gap-0.5" title="Human-narrated audiobook available">
                <Headphones size={12} />
              </span>
            )}
          </div>

          <Link
            href={`/reader/${book.id}`}
            className="flex items-center gap-1 text-[11px] font-semibold text-navy hover:text-amber transition-colors"
          >
            <BookOpen size={11} />
            Read
          </Link>
        </div>

        {/* Recommendation Reason / Synergy Explanation */}
        {showReason && (rec.why_matched || rec.reason) && (
          <div className="mt-2 pt-2 border-t border-amber/15 bg-amber/5 -mx-3 -mb-3 p-2.5 rounded-b-card">
            <p className="text-[11px] text-amber-bright font-medium flex items-center gap-1">
              <Sparkles size={11} />
              {rec.why_matched || rec.reason}
            </p>
            {rec.synergy_tags && rec.synergy_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {rec.synergy_tags.map((tag) => (
                  <span key={tag} className="text-[9px] rounded-full bg-amber/15 text-navy px-1.5 py-0.2 font-medium">
                    ✓ {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
