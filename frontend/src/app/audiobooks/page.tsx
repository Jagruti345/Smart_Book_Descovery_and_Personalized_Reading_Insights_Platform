"use client";
import { useEffect, useState } from "react";
import { Headphones, Search, Volume2, Globe, Mic, Sparkles, Music } from "lucide-react";
import { api } from "@/lib/api";
import BookCard from "@/components/BookCard";
import BookPreviewModal from "@/components/BookPreviewModal";
import type { Book, RecommendedBook } from "@/types";

const STATS = [
  { icon: Headphones, label: "Human-narrated", sub: "LibriVox volunteers", color: "text-amber" },
  { icon: Mic, label: "AI Text-to-Speech", sub: "10+ Languages", color: "text-forest" },
  { icon: Globe, label: "100% Free", sub: "Public domain", color: "text-navy" },
];

export default function AudiobooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewBook, setPreviewBook] = useState<Book | RecommendedBook | null>(null);

  useEffect(() => {
    api.listAudiobooks()
      .then((b) => setBooks(b as Book[]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = books.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen">
      {/* Dark Hero Header */}
      <div className="relative overflow-hidden hero-gradient py-16 mb-10">
        <div className="orb orb-amber w-64 h-64 -top-16 -left-8 opacity-40" />
        <div className="orb orb-forest w-80 h-80 -bottom-20 -right-10 opacity-30" />

        {/* Animated rings */}
        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-32 h-32 border border-amber/15 rounded-full animate-spin-slow opacity-40 hidden lg:block" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 glass-amber rounded-full px-4 py-1.5 text-xs font-bold text-amber mb-4">
                <Headphones size={12} className="animate-pulse" />
                Human-Narrated &amp; Multilingual TTS
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-cream leading-tight mb-3">
                Audiobooks{" "}
                <span className="text-gradient-amber italic">Vault</span>
              </h1>
              <p className="text-cream/60 text-sm sm:text-base max-w-xl leading-relaxed">
                Stream free, full-cast volunteer-narrated public-domain audiobooks via LibriVox.
                Every title also supports real-time multilingual text-to-speech with live sentence tracking.
              </p>
            </div>

            {/* Stats chips */}
            <div className="flex flex-col gap-3 animate-fade-in-up delay-200">
              {STATS.map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="flex items-center gap-3 glass-dark rounded-xl px-4 py-2.5 border border-cream/8">
                  <div className="w-8 h-8 rounded-lg bg-cream/5 flex items-center justify-center">
                    <Icon size={16} className={color} />
                  </div>
                  <div>
                    <p className="text-cream text-xs font-semibold">{label}</p>
                    <p className="text-cream/40 text-[10px]">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search bar inside hero */}
          <div className="mt-8 max-w-lg animate-fade-in-up delay-300">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search audiobooks by title or author…"
                className="w-full rounded-full glass border border-cream/15 pl-11 pr-5 py-3 text-sm text-cream placeholder-cream/35 focus:outline-none focus:border-amber/50"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-paper to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        {/* Result count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-ink-muted">
              <span className="font-bold text-navy">{filtered.length}</span> audiobooks available
              {search && <span> matching &ldquo;<span className="text-amber font-medium">{search}</span>&rdquo;</span>}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted glass-amber border border-amber/20 rounded-full px-3 py-1">
              <Music size={11} className="text-amber" />
              <span className="font-medium text-amber">All free to stream</span>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="shimmer-skeleton aspect-[2/3] rounded-card" style={{ animationDelay: `${i * 0.06}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-dashed border-ink/12 bg-cream/40">
            <Headphones size={40} className="mx-auto text-ink-muted mb-3 opacity-30" />
            <p className="font-serif text-lg text-navy mb-1">No audiobooks match that search.</p>
            <p className="text-xs text-ink-muted">Try a different title or author name.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((b, idx) => (
              <div key={b.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                <BookCard book={b} onQuickPreview={(book) => setPreviewBook(book)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <BookPreviewModal book={previewBook} onClose={() => setPreviewBook(null)} />
    </div>
  );
}
