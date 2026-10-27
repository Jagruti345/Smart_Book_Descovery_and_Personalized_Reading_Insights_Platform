"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import BookCard from "@/components/BookCard";
import BookPreviewModal from "@/components/BookPreviewModal";
import { WeeklyMinutesChart, GenreDonutChart } from "@/components/ReadingCharts";
import type { AnalyticsSummary, RecommendedBook, Book } from "@/types";
import {
  Flame,
  Clock,
  Trophy,
  Users,
  Sparkles,
  Compass,
  BookOpen,
  Headphones,
  CheckCircle2,
  TrendingUp,
  Brain,
  Lightbulb,
  ArrowRight,
  Target,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recs, setRecs] = useState<RecommendedBook[]>([]);
  const [previewBook, setPreviewBook] = useState<Book | RecommendedBook | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !user.onboarding_complete) router.push("/onboarding");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.analyticsSummary().then((a) => setAnalytics(a as AnalyticsSummary)).catch(() => {});
    api.personalized(8).then((r) => setRecs(r as RecommendedBook[])).catch(() => {});
  }, [user]);

  if (!user) return null;

  const dna = analytics?.reader_dna;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 min-h-screen">
      {/* Page Title & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-8 border-b border-ink/10 pb-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Reading Intelligence &amp; DNA
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Welcome back, <strong className="text-navy">{user.name}</strong>. Here is your behavioral reading profile and AI-matched recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/discover"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/5"
          >
            <Compass size={13} />
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* --- READER DNA & ARCHETYPE HERO CARD --- */}
      {dna && (
        <section className="rounded-card border border-amber/30 bg-gradient-to-br from-cream via-cream to-amber/5 p-6 mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber/15 via-forest/10 to-transparent blur-3xl rounded-full pointer-events-none -z-0" />

          <div className="relative z-10">
            {/* Header / Archetype Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-xs font-bold text-amber border border-amber/25 mb-2">
                  <Brain size={14} />
                  Your Assigned Reader Archetype
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">{dna.archetype}</h2>
                <p className="text-xs sm:text-sm text-ink-soft max-w-xl mt-1 leading-relaxed">
                  {dna.archetype_tagline}
                </p>
              </div>

              {/* Focus Window & Goal Progress Box */}
              <div className="rounded-xl border border-ink/10 bg-cream/90 backdrop-blur p-3.5 flex flex-col gap-2 min-w-[240px] shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted flex items-center gap-1">
                    <Target size={13} className="text-amber" /> Weekly Target Pace:
                  </span>
                  <span className="font-bold text-navy">{dna.goal_completion_rate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber transition-all duration-500"
                    style={{ width: `${dna.goal_completion_rate}%` }}
                  />
                </div>
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <Clock size={11} /> {dna.focus_window}
                </p>
              </div>
            </div>

            {/* Pattern Spectrum Gauges */}
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-ink/10">
              {/* Mood Distribution */}
              <div className="rounded-lg bg-paper/50 p-3.5 border border-ink/5">
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber" /> Mood Spectrum
                </p>
                <div className="space-y-1.5">
                  {dna.mood_distribution.map((item) => (
                    <div key={item.mood} className="text-xs">
                      <div className="flex justify-between text-ink-soft mb-0.5">
                        <span>{item.mood}</span>
                        <span className="font-medium text-navy">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-bright"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pacing Distribution */}
              <div className="rounded-lg bg-paper/50 p-3.5 border border-ink/5">
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-forest" /> Pacing Affinity
                </p>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-ink-soft mb-0.5">
                      <span>Fast-Paced (Page-Turners)</span>
                      <span className="font-medium text-navy">{dna.pacing_distribution.fast}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full rounded-full bg-forest" style={{ width: `${dna.pacing_distribution.fast}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-ink-soft mb-0.5">
                      <span>Balanced Flow (Chapters 20-30m)</span>
                      <span className="font-medium text-navy">{dna.pacing_distribution.medium}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full rounded-full bg-navy" style={{ width: `${dna.pacing_distribution.medium}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-ink-soft mb-0.5">
                      <span>Slow-Burn (Deep Worldbuilding)</span>
                      <span className="font-medium text-navy">{dna.pacing_distribution.slow}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                      <div className="h-full rounded-full bg-ink-muted" style={{ width: `${dna.pacing_distribution.slow}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Format Split & Next Milestone */}
              <div className="rounded-lg bg-paper/50 p-3.5 border border-ink/5 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Headphones size={13} className="text-wine" /> Format Ratio
                  </p>
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="text-ink-soft flex items-center gap-1">
                      <BookOpen size={12} /> Text: {dna.format_split.text_percent}%
                    </span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-ink-soft flex items-center gap-1">
                      <Headphones size={12} /> Audio: {dna.format_split.audio_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex">
                    <div className="h-full bg-navy" style={{ width: `${dna.format_split.text_percent}%` }} />
                    <div className="h-full bg-wine" style={{ width: `${dna.format_split.audio_percent}%` }} />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-ink/10 text-xs">
                  <p className="text-[11px] font-semibold text-ink-muted uppercase">Next Milestone:</p>
                  <div className="flex items-center justify-between mt-1 font-medium text-navy">
                    <span>
                      {dna.next_milestone.reward_emoji} {dna.next_milestone.title}
                    </span>
                    <span className="text-amber font-bold">
                      {dna.next_milestone.progress}/{dna.next_milestone.target} {dna.next_milestone.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Pattern Insights List */}
            <div className="mt-4 pt-4 border-t border-ink/10">
              <p className="text-xs font-semibold text-amber-bright uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lightbulb size={13} /> Observations from Your Reading Telemetry:
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {dna.pattern_insights.map((insight, idx) => (
                  <div key={idx} className="rounded-lg bg-cream/90 border border-ink/10 p-3 text-xs text-ink-soft leading-relaxed flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-forest shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- TELEMETRY STAT CARDS --- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${analytics?.current_streak ?? user.current_streak} days`}
          accent="amber"
        />
        <StatCard
          icon={Trophy}
          label="Longest streak"
          value={`${analytics?.longest_streak ?? user.longest_streak} days`}
          accent="forest"
        />
        <StatCard
          icon={Clock}
          label="Total minutes read"
          value={`${analytics?.total_minutes_read ?? user.total_minutes_read} min`}
          accent="navy"
        />
        <StatCard
          icon={Users}
          label="Active readers now"
          value={`${analytics?.community_reading_now ?? 214}`}
          accent="wine"
        />
      </div>

      {/* --- READING TELEMETRY CHARTS --- */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="rounded-card border border-ink/10 bg-cream p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold text-navy">Weekly Reading Activity</h3>
            <span className="text-xs text-ink-muted">Goal: {user.preferences?.daily_minutes_goal || 25} min/day</span>
          </div>
          {analytics ? (
            <WeeklyMinutesChart data={analytics.weekly} dailyGoal={user.preferences?.daily_minutes_goal || 25} />
          ) : (
            <div className="h-[230px] animate-pulse bg-ink/5 rounded-lg" />
          )}
        </div>

        <div className="rounded-card border border-ink/10 bg-cream p-5 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-navy mb-3">Literary Genre Affinity</h3>
          {analytics ? (
            <GenreDonutChart data={analytics.genre_breakdown} />
          ) : (
            <div className="h-[230px] animate-pulse bg-ink/5 rounded-lg" />
          )}
        </div>
      </div>

      {/* --- GAMIFICATION BADGES --- */}
      <div className="rounded-card border border-ink/10 bg-cream p-5 mb-10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy">Reading Milestone Badges</h3>
            <p className="text-xs text-ink-muted">Badges are awarded automatically as you log sessions and maintain streaks.</p>
          </div>
          <span className="text-xs font-semibold text-amber bg-amber/10 px-2.5 py-1 rounded-full">
            {(analytics?.badges || []).filter((b) => b.earned).length} of {(analytics?.badges || []).length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(analytics?.badges || []).map((b) => (
            <div
              key={b.code}
              className={`rounded-card border p-3.5 text-center transition-all ${
                b.earned
                  ? "border-amber/50 bg-amber/10 shadow-sm"
                  : "border-ink/10 bg-paper/40 opacity-50 grayscale hover:grayscale-0"
              }`}
              title={b.desc}
            >
              <div className="text-3xl mb-1.5">{b.emoji}</div>
              <p className="text-xs font-semibold text-navy leading-tight">{b.name}</p>
              <p className="text-[10px] text-ink-muted mt-1 line-clamp-2 leading-tight">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* --- EXPLAINABLE HYBRID RECOMMENDATIONS --- */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6 border-b border-ink/10 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber uppercase tracking-wider mb-0.5">
              <Sparkles size={13} /> Explainable ML Matching Engine
            </div>
            <h2 className="font-serif text-2xl font-bold text-navy">Recommended for Your Pattern</h2>
            <p className="text-xs text-ink-muted">
              Books matched to your preferred pacing, author affinity, and daily reading minutes goal.
            </p>
          </div>
          <Link href="/discover" className="text-xs font-semibold text-amber hover:underline flex items-center gap-1">
            Explore complete catalog <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recs.map((b) => (
            <BookCard key={b.id} book={b} showReason onQuickPreview={(book) => setPreviewBook(book)} />
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      <BookPreviewModal book={previewBook} onClose={() => setPreviewBook(null)} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent: "amber" | "forest" | "navy" | "wine";
}) {
  const colors: Record<string, string> = {
    amber: "text-amber bg-amber/10 border-amber/20",
    forest: "text-forest bg-forest/10 border-forest/20",
    navy: "text-navy bg-navy/10 border-navy/20",
    wine: "text-wine bg-wine/10 border-wine/20",
  };

  return (
    <div className="rounded-card border border-ink/10 bg-cream p-4 shadow-sm hover:border-amber/30 transition-all">
      <div className={`inline-flex p-2 rounded-xl mb-2.5 border ${colors[accent]}`}>
        <Icon size={16} />
      </div>
      <p className="font-serif text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
