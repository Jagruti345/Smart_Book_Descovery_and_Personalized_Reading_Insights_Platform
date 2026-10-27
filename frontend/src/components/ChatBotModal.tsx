"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircleHeart, X, Send, Sparkles, BookOpen, Compass, Headphones } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { RecommendedBook } from "@/types";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  books?: RecommendedBook[];
}

const QUICK_PROMPTS = [
  "A cozy mystery like Sherlock Holmes",
  "Inspiring Stoic philosophy for clarity",
  "Gothic horror set in a spooky manor",
  "A fast-paced classic under 200 pages",
];

export default function ChatBotModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "Welcome to the Folio Discovery Assistant! Tell me your mood, a favorite author, or how much time you have — I'll match you to genuine world literature.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, open]);

  async function handleSend(msgToSend?: string) {
    const message = (msgToSend || input).trim();
    if (!message || loading) return;
    setInput("");
    setTurns((t) => [...t, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = (await api.discover(message)) as { reply: string; books: RecommendedBook[] };
      setTurns((t) => [...t, { role: "assistant", content: res.reply, books: res.books }]);
    } catch {
      setTurns((t) => [
        ...t,
        { role: "assistant", content: "I had a momentary hitch exploring the catalog. Try another mood or query!" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-navy text-cream px-5 py-3.5 shadow-xl hover:bg-navy-deep hover:scale-105 transition-all duration-200 border border-amber/30 group"
          aria-label="Open Book Discovery Assistant"
        >
          <div className="relative">
            <MessageCircleHeart size={19} className="text-amber-bright group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-glow animate-ping" />
          </div>
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">Ask Folio AI</span>
        </button>
      )}

      {/* Slide-Up Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2.5rem)] sm:w-[440px] h-[600px] max-h-[85vh] rounded-card border border-ink/15 bg-cream shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/10 bg-navy px-4 py-3 text-cream">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber/20 flex items-center justify-center text-amber-bright">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="font-serif font-semibold text-sm leading-none">Discovery Assistant</h4>
                <p className="text-[10px] text-cream/70 font-sans mt-0.5">Offline Hybrid ML Matching</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1.5 rounded-full text-cream/70 hover:text-cream hover:bg-white/10 transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="thin-scroll flex-1 overflow-y-auto p-4 space-y-4 bg-paper/30">
            {turns.map((t, i) => (
              <div key={i} className={t.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[88%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    t.role === "user" ? "bg-navy text-cream rounded-br-none" : "bg-cream text-ink border border-ink/10 rounded-bl-none"
                  }`}
                >
                  {t.content}
                </div>

                {/* Rendered Book Recommendations */}
                {t.books && t.books.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-2.5 text-left">
                    {t.books.slice(0, 4).map((b) => (
                      <div
                        key={b.id}
                        className="rounded-lg border border-ink/10 bg-cream p-2 flex flex-col justify-between hover:border-amber/50 hover:shadow-sm transition-all"
                      >
                        <div className="flex gap-2">
                          {b.cover_url ? (
                            <img src={b.cover_url} alt={b.title} className="w-10 h-14 object-cover rounded shrink-0" />
                          ) : (
                            <div className="w-10 h-14 rounded bg-navy text-cream flex items-center justify-center text-[9px] text-center p-0.5 shrink-0">
                              {b.title.slice(0, 10)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-serif font-semibold text-xs leading-tight truncate text-navy">{b.title}</p>
                            <p className="text-[10px] text-ink-muted truncate">{b.author}</p>
                            <span className="inline-block mt-1 text-[9px] font-medium text-amber bg-amber/10 px-1 rounded">
                              {b.mood || b.genres?.[0]}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-ink/5">
                          <Link
                            href={`/reader/${b.id}`}
                            className="text-[10px] font-semibold text-navy hover:text-amber flex items-center gap-0.5"
                          >
                            <BookOpen size={10} /> Read
                          </Link>
                          <Link href={`/books/${b.id}`} className="text-[10px] text-ink-muted hover:text-ink">
                            Details →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-ink-muted p-2">
                <Sparkles size={13} className="animate-spin text-amber" />
                <span>Searching our literary vault...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-3 pt-2 pb-1 border-t border-ink/10 flex items-center gap-1.5 overflow-x-auto thin-scroll bg-cream">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="shrink-0 rounded-full border border-ink/10 bg-paper/50 hover:bg-amber/10 hover:border-amber/30 px-2.5 py-1 text-[11px] text-ink-soft whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2 p-3 bg-cream">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="E.g. A fast-paced mystery with a clever twist..."
              className="flex-1 rounded-full border border-ink/15 bg-paper px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber text-ink"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="w-8 h-8 rounded-full bg-navy text-cream flex items-center justify-center hover:bg-navy-deep disabled:opacity-40 transition-colors shrink-0"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
