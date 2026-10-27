"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import BookCard from "@/components/BookCard";
import type { Book } from "@/types";

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    api.myWishlist().then((b) => setBooks(b as Book[])).finally(() => setBusy(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Heart size={22} className="text-wine" />
        <h1 className="font-serif text-3xl font-semibold text-navy">Your wishlist</h1>
      </div>
      <p className="text-ink-soft mb-8">Saved books you want to come back to.</p>

      {busy ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-card bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <p className="text-sm text-ink-soft py-16 text-center">Nothing saved yet — tap the heart on any book to add it here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
