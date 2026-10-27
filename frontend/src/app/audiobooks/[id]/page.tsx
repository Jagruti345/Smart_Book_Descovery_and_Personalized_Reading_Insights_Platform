"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AudioPlayer from "@/components/AudioPlayer";
import type { BookDetail } from "@/types";

interface Lang {
  code: string;
  label: string;
}
interface StreamInfo {
  source: "librivox" | "tts";
  url: string | null;
  tts_text?: string;
  narrator?: string;
}

export default function AudiobookPlayerPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [languages, setLanguages] = useState<Lang[]>([]);
  const startTime = useRef(Date.now());
  const loggedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api.getBook(id).then((b) => setBook(b as BookDetail));
    api.streamInfo(id).then((s) => setStreamInfo(s as StreamInfo));
    api.audioLanguages().then((r) => setLanguages((r as { languages: Lang[] }).languages));
  }, [id]);

  useEffect(() => {
    const start = startTime.current;
    return () => {
      if (!user || !book || loggedRef.current) return;
      const minutes = Math.max(1, Math.round((Date.now() - start) / 60000));
      loggedRef.current = true;
      api.logSession({ book_id: book.id, minutes, mode: "audio", progress_percent: 100 }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, book?.id]);

  if (!book || !streamInfo) return <div className="mx-auto max-w-3xl px-4 py-16 text-ink-soft">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link href={`/books/${book.id}`} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-6">
        <ArrowLeft size={14} /> Back to book
      </Link>

      <h1 className="font-serif text-2xl font-semibold text-navy mb-1">{book.title}</h1>
      <p className="text-ink-soft mb-1">by {book.author}</p>
      <p className="text-xs text-ink-soft mb-6">
        {streamInfo.source === "librivox" ? `Narrated by ${streamInfo.narrator}` : "Narrated on demand via text-to-speech"}
      </p>

      <AudioPlayer
        librivoxUrl={streamInfo.source === "librivox" ? streamInfo.url : null}
        ttsText={streamInfo.tts_text || book.full_text_excerpt || book.synopsis}
        languages={languages}
      />
    </div>
  );
}
