"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { BookDetail, PriceQuote, Review } from "@/types";
import {
  Star,
  Heart,
  BookOpenText,
  Headphones,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  Globe,
  Share2,
} from "lucide-react";

export default function BookDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [prices, setPrices] = useState<PriceQuote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<{ quick_takeaways: string[]; executive_summary: string } | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [reviewStars, setReviewStars] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getBook(id).then((b) => setBook(b as BookDetail)).catch(() => {});
    api.getPrices(id).then((p) => setPrices(p as PriceQuote[])).catch(() => {});
    api.bookReviews(id).then((r) => setReviews(r as Review[])).catch(() => {});
    api.getBookSummary(id)
      .then((s) => setSummary(s as { quick_takeaways: string[]; executive_summary: string }))
      .catch(() => {});
  }, [id]);

  async function toggleWishlist() {
    if (!user) return;
    const res = await api.toggleWishlist(id);
    setWishlisted(res.wishlisted);
  }

  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewBusy(true);
    setReviewMsg("");
    try {
      await api.createReview({ book_id: id, stars: reviewStars, text: reviewText });
      setReviewText("");
      setReviewMsg("Thank you! Your reader review was posted.");
      const r = await api.bookReviews(id);
      setReviews(r as Review[]);
    } catch (err) {
      setReviewMsg(err instanceof Error ? err.message : "Couldn't post review");
    } finally {
      setReviewBusy(false);
    }
  }

  if (!book) return <div className="mx-auto max-w-5xl px-4 py-20 text-ink-muted">Opening volume from vault…</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 min-h-screen">
      {/* Top Back Link */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/discover"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Back to catalog
        </Link>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-navy transition-colors"
        >
          <Share2 size={13} /> {copied ? "Link Copied!" : "Share Book"}
        </button>
      </div>

      {/* Main Book Presentation Card */}
      <div className="rounded-card border border-ink/10 bg-cream p-6 sm:p-8 mb-10 shadow-sm grid md:grid-cols-[220px_1fr] gap-8 items-start">
        {/* Cover with 3D Shadow */}
        <div className="book-3d-wrap mx-auto md:mx-0 w-full max-w-[200px]">
          <div className="book-3d aspect-[2/3] rounded-md overflow-hidden bg-navy-deep shadow-book">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-navy text-cream">
                <span className="font-serif font-semibold text-sm leading-snug">{book.title}</span>
                <span className="text-xs text-cream/70 mt-1">{book.author}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info & Synopsis */}
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {book.is_public_domain && (
              <span className="rounded-full bg-forest/15 text-forest px-3 py-0.5 text-xs font-semibold border border-forest/20">
                100% Free Public Domain
              </span>
            )}
            {(book.genres || []).map((g) => (
              <span key={g} className="rounded-full bg-ink/5 text-ink-soft px-2.5 py-0.5 text-xs font-medium">
                {g}
              </span>
            ))}
            {book.mood && (
              <span className="rounded-full bg-amber/15 text-amber px-2.5 py-0.5 text-xs font-semibold capitalize">
                {book.mood} Vibe
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy leading-tight mb-1">
            {book.title}
          </h1>
          <p className="text-sm text-ink-muted mb-3">
            by <strong className="text-navy">{book.author}</strong> · Published{" "}
            {book.published_year > 0 ? book.published_year : `${Math.abs(book.published_year)} BCE`} · {book.page_count} pages
          </p>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-ink mb-4">
            <div className="flex items-center gap-1 font-semibold text-amber">
              <Star size={15} className="fill-amber" />
              <span>{book.avg_rating.toFixed(1)}</span>
            </div>
            <span className="text-ink-muted">· {book.ratings_count} reader ratings</span>
            {book.isbn && <span className="text-ink-muted">· ISBN: {book.isbn}</span>}
          </div>

          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mb-6">{book.synopsis}</p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/reader/${book.id}`}
              className="flex items-center gap-2 rounded-full bg-navy text-cream px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-navy-deep transition-colors shadow-sm"
            >
              <BookOpenText size={15} />
              Read in Folio Reader
            </Link>

            {book.librivox_url && (
              <Link
                href={`/audiobooks/${book.id}`}
                className="flex items-center gap-2 rounded-full border border-forest/30 bg-forest/10 text-forest px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-forest/20 transition-colors"
              >
                <Headphones size={15} />
                Listen (LibriVox Stream)
              </Link>
            )}

            {user && (
              <button
                onClick={toggleWishlist}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-xs sm:text-sm font-medium text-ink-soft hover:bg-ink/5 transition-colors"
              >
                <Heart size={15} className={wishlisted ? "fill-wine text-wine" : ""} />
                <span>{wishlisted ? "Saved in Wishlist" : "Save Book"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- AI EXECUTIVE SUMMARY & KEY TAKEAWAYS --- */}
      {summary && (
        <section className="rounded-card border border-amber/30 bg-amber/5 p-6 mb-10 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-amber-bright" />
            <h2 className="font-serif text-xl font-bold text-navy">Folio AI Executive Overview</h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mb-4">{summary.executive_summary}</p>

          {summary.quick_takeaways?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-amber uppercase tracking-wider mb-2">Key Takeaways</h3>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-ink-soft">
                {summary.quick_takeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2 rounded-lg bg-cream/70 border border-ink/5 p-2.5">
                    <CheckCircle size={14} className="text-forest shrink-0 mt-0.5" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* --- MULTI-RETAILER PRICE COMPARISON --- */}
      <section className="rounded-card border border-ink/10 bg-cream p-6 mb-10 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-navy mb-2">Market Price Comparison</h2>
        <p className="text-xs text-ink-muted mb-4">
          Live simulated pricing quotes across major booksellers and free open repositories.
        </p>

        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-ink-muted font-medium">
                <th className="pb-2">Bookseller</th>
                <th className="pb-2">Price Quote</th>
                <th className="pb-2 text-right">Access Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {prices.map((p, idx) => (
                <tr key={idx} className="hover:bg-ink/5 transition-colors">
                  <td className="py-2.5 font-medium text-navy">{p.retailer}</td>
                  <td className="py-2.5 font-semibold text-forest">{p.price}</td>
                  <td className="py-2.5 text-right">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber hover:underline"
                    >
                      Search Outbound <ExternalLink size={11} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- COMMUNITY REVIEWS & RATINGS --- */}
      <section className="rounded-card border border-ink/10 bg-cream p-6 shadow-sm">
        <h2 className="font-serif text-xl font-bold text-navy mb-4">Reader Reviews ({reviews.length})</h2>

        {/* Review Form */}
        {user ? (
          <form onSubmit={submitReview} className="mb-8 p-4 rounded-lg bg-paper/40 border border-ink/10">
            <h3 className="font-serif font-semibold text-sm text-navy mb-2">Leave your review for this volume</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-ink-muted">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewStars(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={16}
                      className={star <= reviewStars ? "fill-amber text-amber" : "text-ink-muted"}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-navy ml-1">{reviewStars} Stars</span>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What did you think of the themes, pacing, and characters?"
              rows={3}
              className="w-full rounded-md border border-ink/15 bg-cream p-3 text-xs sm:text-sm focus:outline-none focus:border-amber mb-3"
            />

            <div className="flex items-center justify-between">
              {reviewMsg && <p className="text-xs text-forest font-medium">{reviewMsg}</p>}
              <button
                type="submit"
                disabled={reviewBusy}
                className="rounded-full bg-navy text-cream px-4 py-2 text-xs font-semibold hover:bg-navy-deep ml-auto disabled:opacity-50"
              >
                {reviewBusy ? "Posting…" : "Post Review"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-ink-muted mb-6">
            <Link href="/login" className="text-amber font-semibold hover:underline">
              Sign in
            </Link>{" "}
            to rate and review this book.
          </p>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p className="text-xs text-ink-muted py-6 text-center">
            No reviews posted yet for this masterwork. Be the first to share your thoughts!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-ink/5 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-navy">{r.user_name || "Community Reader"}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.stars ? "fill-amber text-amber" : "text-ink-muted opacity-30"}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">{r.text || "Rated this book."}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
