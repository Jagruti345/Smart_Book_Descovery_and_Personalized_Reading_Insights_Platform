"use client";
import React from "react";
import Link from "next/link";
import { Star, Headphones, Sparkles, BookOpen } from "lucide-react";
import type { Book, RecommendedBook } from "@/types";

const SPINE_STYLES = [
  { bg: "#132238", border: "#2A4365", text: "#FDFBF7", gold: "#D4AF37", width: "w-11 sm:w-14" },
  { bg: "#28543E", border: "#3B7A5A", text: "#FDFBF7", gold: "#E5C158", width: "w-12 sm:w-16" },
  { bg: "#853333", border: "#A84343", text: "#FDFBF7", gold: "#F2D06B", width: "w-10 sm:w-13" },
  { bg: "#4A3B32", border: "#6D574B", text: "#FDFBF7", gold: "#E0A96D", width: "w-12 sm:w-15" },
  { bg: "#2C3E50", border: "#3E5771", text: "#FDFBF7", gold: "#F39C12", width: "w-11 sm:w-14" },
  { bg: "#51361A", border: "#7A5228", text: "#FDFBF7", gold: "#E6B800", width: "w-13 sm:w-16" },
  { bg: "#1F2D3D", border: "#33475B", text: "#FDFBF7", gold: "#C5A059", width: "w-10 sm:w-14" },
];

interface BookShelfViewProps {
  books: (Book | RecommendedBook)[];
  onSelectBook?: (book: Book | RecommendedBook) => void;
}

export default function BookShelfView({ books, onSelectBook }: BookShelfViewProps) {
  // Partition into shelves of ~8-10 books each
  const shelfRows: (Book | RecommendedBook)[][] = [];
  const itemsPerShelf = 8;
  for (let i = 0; i < books.length; i += itemsPerShelf) {
    shelfRows.push(books.slice(i, i + itemsPerShelf));
  }

  return (
    <div className="space-y-10 my-6">
      {shelfRows.map((row, rIdx) => (
        <div key={rIdx} className="bookshelf-shelf flex items-end justify-start gap-1 sm:gap-2.5 overflow-x-auto pb-2 px-3 pt-8 thin-scroll">
          {row.map((b, idx) => {
            const style = SPINE_STYLES[(b.id + idx) % SPINE_STYLES.length];
            const rec = b as RecommendedBook;
            const matchPct = rec.match_percentage || (rec.score ? Math.round(rec.score * 100) : null);
            const heightClass = (b.page_count || 300) > 400 ? "h-64 sm:h-72" : (b.page_count || 300) > 250 ? "h-56 sm:h-64" : "h-52 sm:h-60";

            return (
              <div
                key={b.id}
                onClick={() => onSelectBook && onSelectBook(b)}
                className={`spine-book shrink-0 ${style.width} ${heightClass} rounded-t-sm flex flex-col justify-between p-2 select-none`}
                style={{
                  backgroundColor: style.bg,
                  borderLeft: `2px solid ${style.border}`,
                  borderRight: `2px solid rgba(0,0,0,0.4)`,
                  boxShadow: "-3px 0 8px rgba(0,0,0,0.5)",
                }}
                title={`${b.title} by ${b.author} (${b.published_year})`}
              >
                {/* Top Spine Ribbon / Accent */}
                <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-1.5">
                  <div className="w-4 h-1 rounded-full" style={{ backgroundColor: style.gold }} />
                  {matchPct && (
                    <span className="text-[8px] font-bold text-amber-bright tracking-tight" title={`${matchPct}% Match`}>
                      {matchPct}%
                    </span>
                  )}
                  {b.librivox_url && <Headphones size={9} className="text-forest-light text-cream/70" />}
                </div>

                {/* Vertical Spine Title */}
                <div className="flex-1 flex items-center justify-center my-2 overflow-hidden">
                  <p
                    className="font-serif font-semibold text-[11px] sm:text-xs text-cream tracking-wide whitespace-nowrap"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                    }}
                  >
                    {b.title}
                  </p>
                </div>

                {/* Bottom Spine Details */}
                <div className="flex flex-col items-center border-t border-white/10 pt-1.5 text-center">
                  <span
                    className="text-[9px] text-cream/70 font-sans truncate max-w-full"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {b.author.split(" ").slice(-1)[0]}
                  </span>
                  <div className="mt-1 flex items-center gap-0.5 text-[9px] text-gold">
                    <Star size={8} className="fill-gold" />
                    <span>{b.avg_rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Action Link Overlay on Hover */}
                <Link
                  href={`/books/${b.id}`}
                  className="absolute inset-0 z-30"
                  aria-label={`Open ${b.title}`}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
