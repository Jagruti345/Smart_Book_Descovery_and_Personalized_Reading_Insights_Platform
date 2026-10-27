"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import BookCard from "@/components/BookCard";
import BookPreviewModal from "@/components/BookPreviewModal";
import type { Book, RecommendedBook } from "@/types";
import {
  BookOpenText, Sparkles, Headphones, Search, Library, Globe, ArrowRight,
  Star, BookOpen, Zap, ChevronRight, Volume2, Brain, Users, ChevronDown, ArrowUpRight, Flame,
} from "lucide-react";

const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top: (i * 17.3) % 100,
  left: (i * 23.7) % 100,
  size: (i % 3) * 0.8 + 0.6,
  delay: (i % 5) * 1.1,
  duration: 3 + (i % 4),
}));

const VIBE_CHIPS = [
  { label: "Victorian Mystery", mood: "suspenseful", genre: "Mystery", color: "border-amber/40 text-amber bg-amber/10 hover:bg-amber/20" },
  { label: "Stoic Philosophy", mood: "inspiring", genre: "Philosophy", color: "border-forest/40 text-forest bg-forest/10 hover:bg-forest/20" },
  { label: "Gothic Shadows", mood: "dark", genre: "Horror", color: "border-wine/40 text-wine bg-wine/10 hover:bg-wine/20" },
  { label: "Wholesome Comfort", mood: "cozy", genre: "Classic", color: "border-amber/40 text-amber bg-amber/10 hover:bg-amber/20" },
  { label: "High-Seas Quest", mood: "adventurous", genre: "Adventure", color: "border-navy-light/40 text-navy bg-navy/10 hover:bg-navy/20" },
  { label: "Sci-Fi Visions", mood: "inspiring", genre: "Science Fiction", color: "border-forest/40 text-forest bg-forest/10 hover:bg-forest/20" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Reader DNA & AI Profiling",
    desc: "Behavioral ML engine builds your unique reading archetype from pacing, genre patterns, and mood shifts.",
    accent: "from-amber/20 to-amber/5",
    iconColor: "text-amber",
    glow: "shadow-[0_0_20px_rgba(192,125,28,0.2)]",
  },
  {
    icon: BookOpenText,
    title: "Accessible In-App Reader",
    desc: "OpenDyslexic font, 14–32px typography, four color themes, and a focus ruler for distraction-free reading.",
    accent: "from-forest/20 to-forest/5",
    iconColor: "text-forest",
    glow: "shadow-[0_0_20px_rgba(40,84,62,0.2)]",
  },
  {
    icon: Volume2,
    title: "Free LibriVox Audiobooks",
    desc: "Human-narrated public domain recordings plus real-time multilingual text-to-speech for any text.",
    accent: "from-navy/20 to-navy/5",
    iconColor: "text-navy",
    glow: "shadow-[0_0_20px_rgba(19,34,56,0.3)]",
  },
  {
    icon: Globe,
    title: "Live Open Library Bridge",
    desc: "Instant access to millions of free books via the Open Library & Internet Archive APIs worldwide.",
    accent: "from-wine/20 to-wine/5",
    iconColor: "text-wine",
    glow: "shadow-[0_0_20px_rgba(133,51,51,0.2)]",
  },
];

const MARQUEE_GENRES = [
  "Victorian Mystery", "Gothic Horror", "Stoic Philosophy", "Epic Adventure",
  "Classic Romance", "Science Fiction", "Political Satire", "Greek Tragedy",
  "Russian Literature", "French Realism", "American Romanticism", "British Wit",
  "Existential Drama", "Public Domain", "LibriVox Audio", "Free Forever",
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [trending, setTrending] = useState<Book[]>([]);
  const [previewBook, setPreviewBook] = useState<Book | RecommendedBook | null>(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [community, setCommunity] = useState({ reading_right_now: 218, total_readers: 450, total_books_in_vault: 33, completed_today: 42 });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    api.trendingBooks(12).then((b) => setTrending(b as Book[])).catch(() => {});
    api.communityStats().then((c) => setCommunity(c as any)).catch(() => {});
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    const id = setInterval(() => setFeaturedIdx((i) => (i + 1) % Math.min(trending.length, 5)), 6000);
    return () => clearInterval(id);
  }, [trending.length]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setVisible((p) => ({ ...p, [e.target.id]: true })); }),
      { threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [trending]);

  const ref = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el; };
  const featured = trending[featuredIdx];

  return (
    <div className="min-h-screen" style={{ background: '#060b14' }}>

      {/* STAR FIELD */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {STARS.map((s) => (
          <div key={s.id} className="star" style={{ top: `${s.top}%`, left: `${s.left}%`, width: `${s.size}px`, height: `${s.size}px`, opacity: 0.3, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s` }} />
        ))}
      </div>

      {/* ==========================================
          CINEMATIC HERO
          ========================================== */}
      <section className="relative overflow-hidden hero-gradient hero-mesh min-h-screen flex flex-col justify-center z-10 grid-overlay">
        {/* Orbs */}
        <div className="orb orb-amber w-[600px] h-[600px] top-[-150px] left-[-100px] opacity-50" />
        <div className="orb orb-forest w-[700px] h-[700px] bottom-[-200px] right-[-120px] opacity-40" />
        <div className="orb orb-wine w-72 h-72 top-[35%] right-[18%] opacity-30" />
        {/* Particles */}
        <div className="particle particle-1 w-2 h-2 bg-amber/60 top-[12%] left-[8%]" />
        <div className="particle particle-2 w-1.5 h-1.5 bg-amber/50 top-[22%] left-[22%]" />
        <div className="particle particle-3 w-2.5 h-2.5 bg-emerald-500/40 top-[60%] left-[12%]" />
        <div className="particle particle-4 w-1 h-1 bg-white/30 top-[40%] right-[22%]" />
        <div className="particle particle-5 w-2 h-2 bg-amber/35 bottom-[22%] right-[12%]" />
        <div className="particle particle-6 w-3 h-3 bg-violet-500/25 top-[70%] left-[42%]" />
        {/* Rings */}
        <div className="absolute top-[8%] right-[4%] w-56 h-56 border border-amber/10 rounded-full animate-spin-slow opacity-30 hidden lg:block" />
        <div className="absolute top-[10%] right-[5.5%] w-40 h-40 border border-emerald-500/10 rounded-full animate-spin-slow opacity-20 hidden lg:block" style={{ animationDirection: 'reverse', animationDuration: '14s' }} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 w-full py-24">
          <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-12 xl:gap-20 items-center">

            {/* LEFT: Hero Content */}
            <div className="animate-fade-in-up">
              {/* Top badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full glass-amber px-5 py-2 text-xs font-bold text-amber mb-8 shine-sweep border border-amber/20">
                <Sparkles size={13} className="animate-pulse" />
                <span>AI-Powered · Zero-Config · 100% Free Classics</span>
                <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.02] tracking-tight mb-8">
                Where great{" "}
                <span className="text-gradient-amber italic block sm:inline">literature</span>{" "}
                <span className="text-white/90">finds you.</span>
              </h1>

              <p className="text-white/50 text-base sm:text-lg leading-relaxed mb-10 max-w-xl font-light">
                An intelligent reading sanctuary powered by offline hybrid ML recommendations,
                free LibriVox audiobooks, real Gutenberg texts, and the global Open Library index.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                {!loading && !user && (
                  <>
                    <Link
                      href="/register"
                      className="glow-btn flex items-center gap-2.5 rounded-full bg-amber text-ink px-7 py-3.5 text-sm font-bold shadow-lg hover:bg-amber-bright"
                    >
                      <Sparkles size={16} />
                      <span>Start Reading Interview</span>
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 rounded-full glass border border-cream/20 text-cream px-6 py-3.5 text-sm font-semibold hover:bg-cream/10 transition-all"
                    >
                      Browse Free Catalog
                      <ChevronRight size={15} />
                    </Link>
                  </>
                )}
                {!loading && user && (
                  <>
                    <Link
                      href={user.onboarding_complete ? "/dashboard" : "/onboarding"}
                      className="glow-btn flex items-center gap-2 rounded-full bg-amber text-ink px-7 py-3.5 text-sm font-bold shadow-lg"
                    >
                      <span>{user.onboarding_complete ? "View Your Reader DNA" : "Complete Onboarding"}</span>
                      <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 rounded-full glass border border-cream/20 text-cream px-6 py-3.5 text-sm font-semibold hover:bg-cream/10 transition-all"
                    >
                      Explore {community.total_books_in_vault} Masterpieces
                    </Link>
                  </>
                )}
              </div>

              {/* Reading Vibe Pills */}
              <div>
                <p className="text-xs font-semibold text-cream/40 uppercase tracking-wider mb-3">
                  Tonight&apos;s Reading Vibe:
                </p>
                <div className="flex flex-wrap gap-2">
                  {VIBE_CHIPS.map((chip) => (
                    <Link
                      key={chip.label}
                      href={`/discover?genre=${encodeURIComponent(chip.genre)}&mood=${encodeURIComponent(chip.mood)}`}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 ${chip.color}`}
                    >
                      {chip.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Featured Book Showcase */}
            <div className="relative flex justify-center animate-fade-in-up delay-400">
              {featured ? (
                <div className="relative w-full max-w-[340px]">
                  {/* Background decorative stacked books */}
                  <div className="absolute -top-6 -right-6 w-48 aspect-[2/3] rounded-2xl bg-violet-900/50 -rotate-6 shadow-2xl opacity-60 hidden sm:block border border-violet-500/20" />
                  <div className="absolute -bottom-6 -left-6 w-40 aspect-[2/3] rounded-2xl bg-emerald-900/50 rotate-8 shadow-2xl opacity-50 hidden sm:block border border-emerald-500/20" />
                  <div className="absolute -top-3 -left-8 w-32 aspect-[2/3] rounded-2xl bg-amber/20 rotate-12 shadow-xl opacity-40 hidden sm:block" />

                  {/* Main Featured Card */}
                  <div className="relative glass-premium rounded-3xl p-6 border border-white/10">
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber glass-amber px-3 py-1.5 rounded-full border border-amber/25">
                        <Sparkles size={10} />
                        Featured Classic
                      </span>
                      {featured.avg_rating > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-white/70">
                          <Star size={12} className="fill-amber text-amber" />
                          <span>{featured.avg_rating?.toFixed(1)}</span>
                          <span className="text-[10px] text-white/40">({featured.ratings_count?.toLocaleString()})</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-[120px_1fr] gap-5 items-start mb-5">
                      <div className="book-3d-wrap">
                        <div className="book-3d relative w-full aspect-[2/3] rounded-xl overflow-hidden">
                          {featured.cover_url ? (
                            <img src={featured.cover_url} alt={featured.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center" style={{ background: 'linear-gradient(135deg, #132238, #1E3352)' }}>
                              <span className="font-serif text-xs font-semibold text-white/90 leading-snug">{featured.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-white leading-snug mb-1.5">
                          {featured.title}
                        </h3>
                        <p className="text-xs text-white/45 mb-3">by {featured.author} · {featured.published_year}</p>
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-4 mb-3">
                          {featured.synopsis}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {featured.genres?.slice(0, 3).map((g) => (
                            <span key={g} className="rounded-md bg-white/8 px-2 py-0.5 text-[10px] font-medium text-white/50 border border-white/8">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="glow-line mb-5" />

                    <div className="flex items-center justify-between">
                      <Link
                        href={`/reader/${featured.id}`}
                        className="glow-btn inline-flex items-center gap-2 rounded-full bg-amber text-white px-5 py-2.5 text-xs font-bold shadow-lg"
                      >
                        <BookOpenText size={13} />
                        Read Free Now
                      </Link>
                      <button
                        onClick={() => setPreviewBook(featured)}
                        className="text-xs font-semibold text-amber/80 hover:text-amber flex items-center gap-1.5 transition-colors"
                      >
                        Quick Peek <ArrowUpRight size={12} />
                      </button>
                    </div>

                    {/* Navigation dots */}
                    {trending.length > 1 && (
                      <div className="flex items-center gap-1.5 justify-center mt-5">
                        {trending.slice(0, 5).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setFeaturedIdx(i)}
                            className={`rounded-full transition-all duration-300 ${i === featuredIdx ? "w-6 h-2 bg-amber shadow-[0_0_8px_rgba(192,125,28,0.8)]" : "w-2 h-2 bg-white/20 hover:bg-white/40"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[340px] glass-premium rounded-3xl p-6 space-y-5 border border-white/10">
                  <div className="shimmer-skeleton h-5 w-36" />
                  <div className="grid grid-cols-[120px_1fr] gap-5">
                    <div className="shimmer-skeleton aspect-[2/3] rounded-xl" />
                    <div className="space-y-3">
                      <div className="shimmer-skeleton h-4 w-full" />
                      <div className="shimmer-skeleton h-3 w-2/3" />
                      <div className="shimmer-skeleton h-3 w-full" />
                      <div className="shimmer-skeleton h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-float z-10">
          <span className="text-[10px] font-medium uppercase tracking-widest">Scroll to Explore</span>
          <ChevronDown size={18} />
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060b14] to-transparent z-10" />
      </section>

      {/* ==========================================
          LIVE STATS BAND
          ========================================== */}
      <section className="relative py-6 overflow-hidden z-10" style={{ background: 'rgba(10, 20, 50, 0.9)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { icon: <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />, value: community.reading_right_now.toString(), label: "Readers Active Now", sub: "Live" },
              { icon: <Flame size={18} className="text-amber" />, value: "100% Free", label: "Public Domain Access", sub: "Always" },
              { icon: <Library size={18} className="text-emerald-400" />, value: `${community.total_books_in_vault}+`, label: "Curated Masterpieces", sub: "Vault" },
              { icon: <Globe size={18} className="text-violet-400" />, value: "Millions+", label: "Via Open Library", sub: "Global" },
            ].map((stat, i) => (
              <div key={i} className="stat-card flex items-center gap-4 glass rounded-2xl p-4 group cursor-default">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 group-hover:bg-amber/10 transition-colors border border-white/8">
                  {stat.icon}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <p className="font-serif font-bold text-white text-xl leading-none">{stat.value}</p>
                    <span className="text-[10px] font-bold text-amber uppercase tracking-wider">{stat.sub}</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          GENRE MARQUEE
          ========================================== */}
      <section className="py-3 overflow-hidden z-10 relative" style={{ background: 'linear-gradient(90deg, #0a1f3d, #0d1a35, #0a1f3d)', borderBottom: '1px solid rgba(192,125,28,0.12)' }}>
        <div className="marquee-track">
          {[...MARQUEE_GENRES, ...MARQUEE_GENRES].map((g, i) => (
            <span key={i} className="inline-flex items-center gap-3 mx-8 text-[11px] font-bold text-white/35 uppercase tracking-widest whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber/50 inline-block" />
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* ==========================================
          TRENDING BOOKS SHOWCASE
          ========================================== */}
      <section
        id="trending"
        ref={ref("trending")}
        className="relative py-20 z-10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #060b14 0%, #0a1020 50%, #060b14 100%)' }}
      >
        <div className="orb orb-amber w-96 h-96 top-0 right-[-80px] opacity-15" />
        <div className="orb orb-forest w-80 h-80 bottom-0 left-[-60px] opacity-12" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 transition-all duration-700 ${visible.trending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber uppercase tracking-widest mb-3 glass-amber px-3 py-1.5 rounded-full border border-amber/20">
                <Library size={12} />
                Curated Literature Vault
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Trending Worldwide
              </h2>
              <p className="text-sm text-white/45 mt-2 max-w-lg">
                Genuine literary masterworks with authentic covers, free reader texts, and LibriVox audio.
              </p>
            </div>
            <Link
              href="/discover"
              className="glow-btn-outline inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-amber/80 hover:text-amber transition-all self-start sm:self-auto"
            >
              View All Books <ArrowRight size={14} />
            </Link>
          </div>

          {trending.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="shimmer-skeleton aspect-[2/3] rounded-2xl" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {trending.map((book, idx) => (
                <div
                  key={book.id}
                  className={`transition-all duration-700 ${visible.trending ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${idx * 0.05}s` }}
                >
                  <BookCard book={book} onQuickPreview={(b) => setPreviewBook(b)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          OPEN LIBRARY SEARCH CTA
          ========================================== */}
      <section
        id="openlibrary"
        ref={ref("openlibrary")}
        className="relative py-24 overflow-hidden z-10"
        style={{ background: 'linear-gradient(135deg, #0d1829 0%, #0a1525 50%, #0d1829 100%)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="orb orb-amber w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-25" />
        <div className="orb orb-forest w-[400px] h-[400px] bottom-[-80px] right-[-60px] opacity-20" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-700 ${visible.openlibrary ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <div className="inline-flex items-center gap-2 glass-amber rounded-full px-4 py-2 text-xs font-bold text-amber mb-6 border border-amber/20">
                <Globe size={13} />
                Live Open Library API
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-5">
                Search{" "}
                <span className="text-gradient-amber">Millions of</span>
                {" "}Free Books Instantly
              </h2>
              <p className="text-white/55 text-base leading-relaxed mb-8">
                Beyond our curated vault — access the entire Open Library and Internet Archive catalog.
                Free borrow, read online, download — all from one place.
              </p>
              <Link
                href="/discover?tab=openlibrary"
                className="glow-btn inline-flex items-center gap-3 rounded-full bg-amber text-white px-8 py-4 text-sm font-bold shadow-lg"
              >
                <Search size={16} />
                Explore Open Library
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "20M+", label: "Books Available", icon: <BookOpen size={20} className="text-amber" /> },
                { num: "150+", label: "Languages", icon: <Globe size={20} className="text-emerald-400" /> },
                { num: "100%", label: "Free Access", icon: <Sparkles size={20} className="text-violet-400" /> },
                { num: "Live", label: "Real-Time Search", icon: <Zap size={20} className="text-sky-400" /> },
              ].map((item, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 text-center border border-white/8 hover:border-amber/25 transition-all card-lift">
                  <div className="flex justify-center mb-3">{item.icon}</div>
                  <div className="font-serif text-3xl font-bold text-white mb-1">{item.num}</div>
                  <div className="text-xs text-white/45 font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PLATFORM FEATURES GRID
          ========================================== */}
      <section
        id="features"
        ref={ref("features")}
        className="relative py-24 z-10 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #060b14 0%, #080e1c 100%)' }}
      >
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${visible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 rounded-full glass-amber px-5 py-2 text-xs font-bold text-amber mb-5 border border-amber/20">
              <Zap size={12} />
              Platform Capabilities
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
              Engineered for{" "}
              <span className="text-gradient-amber">Readers</span>
            </h2>
            <p className="text-white/45 text-base leading-relaxed">
              Every detail engineered to eliminate friction between you and your next favorite chapter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, accent, iconBg, iconColor, tag }, idx) => (
              <div
                key={title}
                className={`group card-lift card-glow rounded-3xl border border-white/8 bg-gradient-to-br ${accent} p-7 hover:border-white/15 transition-all duration-400 cursor-default ${visible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${idx * 0.1}s`, transitionDuration: '0.7s' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${iconBg} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} className={iconColor} />
                  </div>
                  <span className={`text-[10px] font-bold ${iconColor} bg-white/5 px-2.5 py-1 rounded-full border border-white/8`}>{tag}</span>
                </div>
                <h4 className="font-serif font-bold text-white text-lg mb-3 leading-tight">{title}</h4>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-white/30 opacity-0 group-hover:opacity-100 group-hover:text-amber transition-all duration-300">
                  Learn more <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==========================================
          AUDIOBOOKS CTA BAND
          ========================================== */}
      <section
        id="audio"
        ref={ref("audio")}
        className="relative py-16 z-10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0f1e, #0d1829, #0a0f1e)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="orb orb-amber w-80 h-80 -top-20 -right-10 opacity-20" />
        <div className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 transition-all duration-700 ${visible.audio ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="glass-premium rounded-3xl p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-10 border border-white/10">
            <div className="relative z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 glass-amber rounded-full px-4 py-2 text-xs font-bold text-amber mb-5 border border-amber/20">
                <Headphones size={13} />
                LibriVox + Multilingual TTS
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
                Listen to Books for Free
              </h3>
              <p className="text-white/55 text-base leading-relaxed">
                Volunteer-narrated classics and real-time AI text-to-speech in English, Hindi, Tamil, Spanish, French, and more.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-6 shrink-0">
              <div className="audio-waveform">
                {[14, 22, 17, 26, 13, 20, 11, 24].map((h, i) => (
                  <div key={i} className="audio-waveform-bar" style={{ height: `${h}px` }} />
                ))}
              </div>
              <Link
                href="/audiobooks"
                className="glow-btn flex items-center gap-2.5 rounded-full bg-amber text-white px-8 py-4 text-sm font-bold shadow-lg whitespace-nowrap"
              >
                <Volume2 size={16} />
                Open Audiobooks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          FINAL CTA
          ========================================== */}
      <section className="relative py-32 z-10 overflow-hidden" style={{ background: 'linear-gradient(180deg, #060b14 0%, #030712 100%)' }}>
        <div className="orb orb-amber w-[400px] h-[400px] top-0 left-1/2 -translate-x-1/2 opacity-20" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass-amber px-5 py-2 text-xs font-bold text-amber mb-8 border border-amber/20">
            <Users size={13} />
            {community.reading_right_now} readers active now
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Your next favorite book{" "}
            <span className="text-gradient-amber italic">is waiting.</span>
          </h2>
          <p className="text-white/45 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of readers who discovered their reading identity through Folio.
            Free forever. No credit card. No ads.
          </p>
          {!user && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="glow-btn flex items-center gap-3 rounded-full bg-amber text-white px-10 py-5 text-base font-bold shadow-xl"
              >
                <Sparkles size={18} />
                Begin Your Reading Journey
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/discover"
                className="flex items-center gap-2 rounded-full border border-white/15 text-white/70 px-8 py-5 text-base font-semibold hover:bg-white/5 hover:border-white/25 transition-all"
              >
                Browse Free Books
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          QUICK PREVIEW MODAL
          ========================================== */}
      <BookPreviewModal book={previewBook} onClose={() => setPreviewBook(null)} />
    </div>
  );
}
