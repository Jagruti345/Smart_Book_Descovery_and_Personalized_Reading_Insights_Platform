"use client";
import { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Library,
  ListFilter,
  Sparkles,
  Globe,
  SlidersHorizontal,
  X,
  BookOpen,
  Headphones,
  Star,
} from "lucide-react";
import { api } from "@/lib/api";
import BookCard from "@/components/BookCard";
import BookShelfView from "@/components/BookShelfView";
import BookPreviewModal from "@/components/BookPreviewModal";
import OpenLibraryCard from "@/components/OpenLibraryCard";
import type { Book, RecommendedBook, OpenLibraryBook } from "@/types";

const GENRES = [
  "All",
  "Mystery",
  "Classic",
  "Philosophy",
  "Horror",
  "Science Fiction",
  "Adventure",
  "Romance",
  "Drama",
];

const MOODS = [
  { key: "suspenseful", label: "Suspenseful & Tense" },
  { key: "cozy", label: "Cozy & Wholesome" },
  { key: "dark", label: "Dark & Gothic" },
  { key: "inspiring", label: "Inspiring & Stoic" },
  { key: "adventurous", label: "Epic & Adventurous" },
];

const PACINGS = [
  { key: "fast", label: "Fast-Paced" },
  { key: "medium", label: "Balanced Flow" },
  { key: "slow", label: "Slow-Burn & Deep" },
];

const LENGTHS = [
  { key: "short", label: "Short (<200p)" },
  { key: "medium", label: "Standard (200-400p)" },
  { key: "long", label: "Epic (400p+)" },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get("genre") || "All";
  const initialMood = searchParams.get("mood") || null;

  // Tabs: Vault vs Open Library
  const [activeTab, setActiveTab] = useState<"vault" | "openlibrary">("vault");

  // Filters
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<string>(initialGenre);
  const [mood, setMood] = useState<string | null>(initialMood);
  const [pacing, setPacing] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("rating");

  // View Mode: Grid, Shelf, List
  const [viewMode, setViewMode] = useState<"grid" | "shelf" | "list">("grid");

  // Data
  const [books, setBooks] = useState<Book[]>([]);
  const [openLibraryBooks, setOpenLibraryBooks] = useState<OpenLibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [olLoading, setOlLoading] = useState(false);
  const [previewBook, setPreviewBook] = useState<Book | RecommendedBook | null>(null);

  // Active filter count
  const activeFilterCount =
    (genre !== "All" ? 1 : 0) +
    (mood ? 1 : 0) +
    (pacing ? 1 : 0) +
    (length ? 1 : 0) +
    (format ? 1 : 0);

  // Fetch from Folio Curated Vault
  useEffect(() => {
    if (activeTab !== "vault") return;
    setLoading(true);
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (genre !== "All") params.genre = genre;
    if (mood) params.mood = mood;
    if (pacing) params.pacing = pacing;
    if (length) params.length = length;
    if (format) params.format = format;
    if (sort) params.sort = sort;

    const timer = setTimeout(() => {
      api.listBooks(params)
        .then((b) => setBooks(b as Book[]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [q, genre, mood, pacing, length, format, sort, activeTab]);

  // Fetch from Open Library API Live
  useEffect(() => {
    if (activeTab !== "openlibrary") return;
    const query = q.trim() || (genre !== "All" ? genre : "classic literature");
    setOlLoading(true);

    const timer = setTimeout(() => {
      api.searchOpenLibrary(query, 24)
        .then((data) => setOpenLibraryBooks(data))
        .catch(() => setOpenLibraryBooks([]))
        .finally(() => setOlLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [q, genre, activeTab]);

  function resetFilters() {
    setQ("");
    setGenre("All");
    setMood(null);
    setPacing(null);
    setLength(null);
    setFormat(null);
    setSort("rating");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 min-h-screen">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-ink/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Intelligent Catalog & Global Discovery
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">Explore Masterpieces</h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 max-w-2xl">
            Search our curated vault of genuine world classics, or toggle the Live Open Library Explorer to search
            millions of volumes with free borrow and reader access.
          </p>
        </div>

        {/* Discovery Mode Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex p-1 rounded-full border border-ink/15 bg-paper/80 shadow-sm">
            <button
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === "vault" ? "bg-navy text-cream shadow-sm" : "text-ink-soft hover:text-navy"
              }`}
            >
              <Library size={13} />
              <span>Folio Curated Vault (33)</span>
            </button>
            <button
              onClick={() => setActiveTab("openlibrary")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === "openlibrary" ? "bg-navy text-cream shadow-sm" : "text-ink-soft hover:text-navy"
              }`}
            >
              <Globe size={13} className="text-amber-bright" />
              <span>Live Open Library API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            activeTab === "vault"
              ? "Search by title, author, keyword (e.g. 'Sherlock Holmes', 'Austen', 'Gothic')..."
              : "Search Open Library API globally for any book, author, or subject..."
          }
          className="w-full rounded-full border border-ink/15 bg-cream pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 shadow-sm transition-all"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Advanced Multi-Dimensional Filter Suite (for Curated Vault) */}
      {activeTab === "vault" && (
        <div className="rounded-card border border-ink/10 bg-cream/70 p-4 mb-8 space-y-4 shadow-sm">
          {/* Genre Chips */}
          <div className="flex items-center gap-2 overflow-x-auto thin-scroll pb-1">
            <span className="text-xs font-semibold text-ink-muted shrink-0 mr-1">Genre:</span>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
                  genre === g
                    ? "bg-navy text-cream shadow-sm font-semibold"
                    : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Vibe / Mood Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/5">
            <span className="text-xs font-semibold text-ink-muted shrink-0 mr-1">Vibe:</span>
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMood(mood === m.key ? null : m.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  mood === m.key
                    ? "bg-amber text-cream shadow-sm font-semibold"
                    : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Pacing, Length, Format, Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-ink/5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink-muted mr-1">Pacing:</span>
              {PACINGS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPacing(pacing === p.key ? null : p.key)}
                  className={`rounded-full px-2.5 py-1 transition-colors ${
                    pacing === p.key ? "bg-forest text-cream font-semibold" : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <span className="font-semibold text-ink-muted ml-2 mr-1">Format:</span>
              <button
                onClick={() => setFormat(format === "audio" ? null : "audio")}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors ${
                  format === "audio" ? "bg-navy text-cream font-semibold" : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                }`}
              >
                <Headphones size={11} /> Audiobooks
              </button>
              <button
                onClick={() => setFormat(format === "public_domain" ? null : "public_domain")}
                className={`rounded-full px-2.5 py-1 transition-colors ${
                  format === "public_domain" ? "bg-forest text-cream font-semibold" : "border border-ink/15 text-ink-soft hover:bg-ink/5"
                }`}
              >
                Free In-App Text
              </button>
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1">
                <span className="text-ink-muted font-medium">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-full border border-ink/15 bg-paper px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="popular">Most Popular</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="year">Publication Year</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-wine font-semibold hover:underline flex items-center gap-1"
                >
                  <X size={12} /> Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Result Count & View Toggle */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="text-xs sm:text-sm text-ink-muted">
          {activeTab === "vault" ? (
            <span>
              Showing <strong className="text-navy">{books.length}</strong> masterworks in Curated Vault
            </span>
          ) : (
            <span>
              Showing <strong className="text-navy">{openLibraryBooks.length}</strong> live Open Library volumes
            </span>
          )}
        </div>

        {/* View Mode: Grid vs Shelf vs List (for Vault) */}
        {activeTab === "vault" && (
          <div className="inline-flex p-1 rounded-full border border-ink/15 bg-paper/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "grid" ? "bg-navy text-cream shadow-sm" : "text-ink-soft hover:text-navy"
              }`}
              title="Editorial 3D Grid"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("shelf")}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "shelf" ? "bg-navy text-cream shadow-sm" : "text-ink-soft hover:text-navy"
              }`}
              title="Authentic Bookshelf View"
            >
              <Library size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "list" ? "bg-navy text-cream shadow-sm" : "text-ink-soft hover:text-navy"
              }`}
              title="Reader Dossier List"
            >
              <ListFilter size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Content Rendering: Folio Vault */}
      {activeTab === "vault" && (
        <>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-card bg-ink/5 animate-pulse" />
              ))}
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 rounded-card border border-dashed border-ink/15 bg-cream/40">
              <p className="font-serif text-lg text-navy mb-2">No masterworks match those exact filters.</p>
              <p className="text-xs text-ink-muted mb-4">Try clearing one of the filters or searching for an author.</p>
              <button
                onClick={resetFilters}
                className="rounded-full bg-navy text-cream px-5 py-2 text-xs font-semibold hover:bg-navy-deep"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {books.map((b) => (
                <BookCard key={b.id} book={b} onQuickPreview={(book) => setPreviewBook(book)} />
              ))}
            </div>
          ) : viewMode === "shelf" ? (
            <BookShelfView books={books} onSelectBook={(book) => setPreviewBook(book)} />
          ) : (
            /* Reader Dossier List View */
            <div className="space-y-3">
              {books.map((b) => (
                <div
                  key={b.id}
                  className="rounded-card border border-ink/10 bg-cream p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-16 rounded bg-navy-deep overflow-hidden shrink-0 shadow-sm">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-cream">
                          {b.title.slice(0, 3)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif font-semibold text-base text-navy hover:text-amber transition-colors truncate">
                        <a href={`/books/${b.id}`}>{b.title}</a>
                      </h4>
                      <p className="text-xs text-ink-muted">
                        by {b.author} · {b.published_year} · {b.page_count} pages
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(b.genres || []).map((g) => (
                          <span key={g} className="text-[10px] rounded-md bg-ink/5 px-1.5 py-0.5 text-ink-soft">
                            {g}
                          </span>
                        ))}
                        {b.mood && (
                          <span className="text-[10px] rounded-md bg-amber/10 px-1.5 py-0.5 text-amber capitalize">
                            {b.mood}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs font-semibold text-navy justify-end">
                        <Star size={12} className="fill-amber text-amber" />
                        <span>{b.avg_rating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-ink-muted">{b.ratings_count} ratings</span>
                    </div>

                    <button
                      onClick={() => setPreviewBook(b)}
                      className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-ink/5 transition-colors"
                    >
                      Peek
                    </button>

                    <a
                      href={`/reader/${b.id}`}
                      className="flex items-center gap-1 rounded-full bg-navy text-cream px-3.5 py-1.5 text-xs font-semibold hover:bg-navy-deep transition-colors"
                    >
                      <BookOpen size={12} /> Read
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Content Rendering: Live Open Library Explorer */}
      {activeTab === "openlibrary" && (
        <>
          {olLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-card bg-ink/5 animate-pulse" />
              ))}
            </div>
          ) : openLibraryBooks.length === 0 ? (
            <div className="text-center py-20 rounded-card border border-dashed border-ink/15 bg-cream/40">
              <Globe size={32} className="mx-auto text-ink-muted mb-3 opacity-60" />
              <p className="font-serif text-lg text-navy mb-1">Search the Open Library Global Index</p>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                Type an author, book title, or topic in the search box above to retrieve live volumes from the Open Library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {openLibraryBooks.map((olBook) => (
                <OpenLibraryCard key={olBook.key} book={olBook} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Book Preview Modal */}
      <BookPreviewModal book={previewBook} onClose={() => setPreviewBook(null)} />
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block w-8 h-8 rounded-full border-2 border-amber border-t-transparent animate-spin mb-3" />
          <p className="font-serif text-sm text-ink-muted">Accessing Folio Literature Vault…</p>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
