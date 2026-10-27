"use client";
import React from "react";
import { BookOpen, ExternalLink, Globe, Star } from "lucide-react";
import type { OpenLibraryBook } from "@/types";

interface OpenLibraryCardProps {
  book: OpenLibraryBook;
}

export default function OpenLibraryCard({ book }: OpenLibraryCardProps) {
  return (
    <div className="group flex flex-col h-full rounded-card border border-ink/10 bg-cream p-3.5 transition-all duration-300 hover:border-navy/40 hover:shadow-book-hover">
      {/* Cover / Placeholder */}
      <div className="book-3d-wrap mb-3">
        <div className="book-3d relative w-full aspect-[2/3] rounded-md overflow-hidden bg-navy-deep">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center p-3 text-center bg-navy text-cream">
              <Globe size={24} className="text-amber mb-2 opacity-60" />
              <p className="font-serif font-semibold text-xs leading-tight line-clamp-3">{book.title}</p>
              <p className="text-[10px] text-cream/70 mt-1 truncate">{book.author}</p>
            </div>
          )}

          {book.has_fulltext && (
            <span className="absolute top-2 left-2 rounded-full bg-forest/90 backdrop-blur text-cream px-2 py-0.5 text-[10px] font-semibold border border-forest/30">
              Full Text Available
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-ink-muted mb-1">
            <span className="truncate">{book.author}</span>
            {book.first_publish_year && (
              <>
                <span>·</span>
                <span>{book.first_publish_year}</span>
              </>
            )}
          </div>

          <h4 className="font-serif font-semibold text-navy text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-amber transition-colors">
            {book.title}
          </h4>

          {book.subjects && book.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {book.subjects.slice(0, 2).map((s) => (
                <span key={s} className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-medium text-ink-soft truncate max-w-[120px]">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Open Library & Archive links */}
        <div className="pt-2 border-t border-ink/5 flex items-center justify-between text-xs mt-2">
          <span className="text-[10px] text-ink-muted">{book.edition_count} editions</span>

          {book.read_url ? (
            <a
              href={book.read_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-navy/10 hover:bg-navy hover:text-cream text-navy px-2.5 py-1 text-[11px] font-medium transition-colors"
            >
              <BookOpen size={11} />
              Open Archive
              <ExternalLink size={9} />
            </a>
          ) : (
            <a
              href={`https://openlibrary.org${book.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-ink-soft hover:text-navy text-[11px]"
            >
              Details <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
