"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { BookOpen } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@bookapp.dev");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <BookOpen size={26} className="text-amber" />
          <span className="font-serif text-2xl font-semibold text-navy">Folio</span>
        </Link>
        <div className="rounded-card border border-ink/10 bg-cream p-7">
          <h1 className="font-serif text-xl font-semibold text-navy mb-1">Welcome back</h1>
          <p className="text-sm text-ink-soft mb-6">Sign in to pick up your recommendations and streak.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-soft">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-2.5 text-sm focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-wine">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-navy text-cream py-2.5 text-sm font-semibold hover:bg-navy-deep disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-xs text-ink-soft mt-4 text-center">
            Demo login is pre-filled. Or{" "}
            <Link href="/register" className="text-amber font-medium hover:underline">
              create an account
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
