"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  BookOpen,
  Compass,
  LayoutDashboard,
  Headphones,
  Heart,
  ShieldCheck,
  Flame,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

const links = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/dashboard", label: "Reader DNA", icon: LayoutDashboard },
  { href: "/audiobooks", label: "Audiobooks", icon: Headphones },
  { href: "/wishlist", label: "Saved", icon: Heart },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to add shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hideChrome = pathname === "/login" || pathname === "/register" || pathname === "/onboarding";
  if (hideChrome) return null;

  // On hero (dark) pages, use cream text
  const isHeroPage = pathname === "/";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass-nav border-b border-ink/8 shadow-sm"
          : isHeroPage
          ? "bg-transparent border-b border-cream/8"
          : "glass-nav border-b border-ink/8"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(192,125,28,0.4)] transition-all duration-300 relative overflow-hidden shine-sweep">
              <BookOpen size={20} strokeWidth={2.2} className="text-amber relative z-10" />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-serif text-xl font-bold tracking-tight leading-none transition-colors ${
                  isHeroPage && !scrolled ? "text-cream" : "text-navy"
                }`}
              >
                Folio<span className="text-amber">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-ink-muted font-medium">
                Open Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 group ${
                    active
                      ? "bg-navy text-cream shadow-sm"
                      : isHeroPage && !scrolled
                      ? "text-cream/70 hover:text-cream hover:bg-cream/10"
                      : "text-ink-soft hover:text-navy hover:bg-ink/5"
                  }`}
                >
                  <Icon
                    size={13}
                    className={`transition-transform group-hover:scale-110 ${active ? "text-amber" : ""}`}
                  />
                  {label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber" />
                  )}
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                  pathname?.startsWith("/admin") ? "bg-navy text-cream" : "text-ink-soft hover:bg-ink/5"
                }`}
              >
                <ShieldCheck size={13} />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {!loading && user && (
              <>
                {/* Reading Streak Badge */}
                <div
                  className="flex items-center gap-1.5 rounded-full glass-amber border border-amber/25 px-3 py-1.5 text-xs font-bold text-amber"
                  title={`${user.current_streak} days consecutive reading streak`}
                >
                  <Flame size={13} className="animate-pulse" />
                  <span>{user.current_streak}d</span>
                </div>

                {/* User Name + Sign Out */}
                <div className="hidden lg:flex items-center gap-2 pl-2.5 border-l border-ink/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber to-amber-bright flex items-center justify-center text-ink text-[11px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`text-xs font-medium truncate max-w-[100px] ${
                      isHeroPage && !scrolled ? "text-cream/80" : "text-ink-soft"
                    }`}
                  >
                    {user.name.split(" ")[0]}
                  </span>
                  <button
                    onClick={logout}
                    aria-label="Sign out"
                    title="Sign out"
                    className="p-1.5 rounded-full text-ink-muted hover:text-wine hover:bg-wine/10 transition-colors"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </>
            )}

            {!loading && !user && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    isHeroPage && !scrolled
                      ? "text-cream/70 hover:text-cream hover:bg-cream/10"
                      : "text-ink-soft hover:text-navy hover:bg-ink/5"
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="glow-btn flex items-center gap-1.5 rounded-full bg-amber text-ink px-4 py-2 text-xs font-bold shadow-sm"
                >
                  <Sparkles size={11} />
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isHeroPage && !scrolled ? "text-cream/70 hover:bg-cream/10" : "text-ink-soft hover:bg-ink/5"
              }`}
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <div className="md:hidden border-t border-ink/10 py-4 px-2 space-y-1 animate-fade-in-down glass rounded-b-2xl mb-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname?.startsWith(href)
                    ? "bg-navy text-cream"
                    : "text-ink-soft hover:bg-ink/5 hover:text-navy"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-wine hover:bg-wine/10 transition-colors"
              >
                <LogOut size={16} />
                Sign out ({user.name})
              </button>
            )}
            {!user && (
              <div className="flex gap-2 pt-2 border-t border-ink/5">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-ink/15 py-2.5 text-center text-sm font-semibold text-ink-soft hover:bg-ink/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-amber text-ink py-2.5 text-center text-sm font-bold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
