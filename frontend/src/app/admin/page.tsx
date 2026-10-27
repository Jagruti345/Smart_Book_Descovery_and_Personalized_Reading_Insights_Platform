"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { AdminUser, AdminStats, Review } from "@/types";
import { ShieldCheck, Users, BookMarked, Flag, Clock3, Check, Trash2 } from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"stats" | "users" | "moderation">("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [queue, setQueue] = useState<Review[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.adminStats().then((s) => setStats(s as AdminStats));
    api.adminUsers().then((u) => setUsers(u as AdminUser[]));
    api.moderationQueue().then((q) => setQueue(q as Review[]));
  }, [user]);

  async function toggleStatus(u: AdminUser) {
    await api.updateUserStatus(u.id, !u.is_active);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x)));
  }

  async function approve(reviewId: number) {
    await api.approveReview(reviewId);
    setQueue((prev) => prev.filter((r) => r.id !== reviewId));
  }

  async function remove(reviewId: number) {
    await api.deleteReview(reviewId);
    setQueue((prev) => prev.filter((r) => r.id !== reviewId));
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={22} className="text-amber" />
        <h1 className="font-serif text-3xl font-semibold text-navy">Admin</h1>
      </div>
      <p className="text-ink-soft mb-8">User management, content moderation, and catalog health.</p>

      <div className="flex gap-1 mb-6 border-b border-ink/10">
        {[
          { key: "stats", label: "Overview" },
          { key: "users", label: "Users" },
          { key: "moderation", label: `Moderation${queue.length ? ` (${queue.length})` : ""}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-amber text-navy" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <MiniStat icon={Users} label="Users" value={stats.total_users} />
            <MiniStat icon={BookMarked} label="Books" value={stats.total_books} />
            <MiniStat icon={Flag} label="Flagged reviews" value={stats.flagged_reviews} />
            <MiniStat icon={Clock3} label="Reading minutes" value={stats.total_reading_minutes} />
          </div>
          <h2 className="font-serif text-lg font-semibold text-navy mb-3">Top rated books</h2>
          <div className="rounded-card border border-ink/10 bg-cream divide-y divide-ink/10">
            {stats.top_books.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{b.title}</span>
                <span className="text-ink-soft">
                  {b.avg_rating.toFixed(1)} ★ · {b.ratings_count} ratings
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="rounded-card border border-ink/10 bg-cream divide-y divide-ink/10">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-ink-soft">
                  {u.email} · {u.role}
                </p>
              </div>
              <button
                onClick={() => toggleStatus(u)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  u.is_active ? "bg-forest/10 text-forest" : "bg-wine/10 text-wine"
                }`}
              >
                {u.is_active ? "Active" : "Suspended"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "moderation" && (
        <div className="space-y-3">
          {queue.length === 0 && <p className="text-sm text-ink-soft py-10 text-center">No flagged reviews — queue is clean.</p>}
          {queue.map((r) => (
            <div key={r.id} className="rounded-card border border-wine/30 bg-wine/5 p-4">
              <p className="text-xs font-medium text-wine mb-1">{r.user_name || "Reader"} — {r.stars}★</p>
              <p className="text-sm text-ink mb-3">{r.text}</p>
              <div className="flex gap-2">
                <button onClick={() => approve(r.id)} className="flex items-center gap-1 rounded-full bg-forest text-cream px-3 py-1.5 text-xs font-medium">
                  <Check size={13} /> Approve
                </button>
                <button onClick={() => remove(r.id)} className="flex items-center gap-1 rounded-full border border-wine text-wine px-3 py-1.5 text-xs font-medium">
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-card border border-ink/10 bg-cream p-4">
      <Icon size={16} className="text-amber mb-2" />
      <p className="font-serif text-xl font-semibold text-navy">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
