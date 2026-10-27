"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getSpeechController, splitSentences, VOICE_OPTIONS } from "@/lib/speech";
import type { VoiceOption } from "@/lib/speech";
import type { BookDetail, Chapter } from "@/types";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  Clock,
  Type,
  Sun,
  Moon,
  Coffee,
  Contrast,
  Mic,
  Volume2,
  ChevronDown,
  Gauge,
} from "lucide-react";

type Theme = "parchment" | "sepia" | "night" | "forest";

interface ReaderPrefs {
  fontSize: number;
  theme: Theme;
  dyslexicFont: boolean;
  lineHeight: number;
}

const THEMES: {
  key: Theme;
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  accent: string;
}[] = [
  { key: "parchment", label: "Parchment", icon: Sun,      bg: "#FDFAF3", text: "#2C1A0E", border: "#E0CFA0", accent: "#92400e" },
  { key: "sepia",     label: "Sepia",     icon: Coffee,   bg: "#F2E8D5", text: "#3B2008", border: "#C8A87A", accent: "#78350f" },
  { key: "forest",    label: "Forest",    icon: Contrast, bg: "#1A2318", text: "#C8D9C0", border: "#2E3E2A", accent: "#059669" },
  { key: "night",     label: "Night",     icon: Moon,     bg: "#10121A", text: "#D4CBF0", border: "#232640", accent: "#6366f1" },
];

const DEFAULT_PREFS: ReaderPrefs = {
  fontSize: 19,
  theme: "parchment",
  dyslexicFont: false,
  lineHeight: 1.85,
};

/** Strip Gutenberg boilerplate headers from the top of text */
function cleanText(raw: string): string {
  if (!raw) return "";
  // Remove leading blank lines
  let text = raw.trimStart();
  // Remove common Gutenberg header patterns (Title, Author, Contents lists, Project Gutenberg headers)
  text = text.replace(/^(The Project Gutenberg.*?\n){1,10}/i, "");
  // Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Collapse 3+ consecutive newlines into 2 (paragraph break)
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

/** Split into non-empty paragraphs only */
function getParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 5); // skip very short/empty lines
}

export default function ReaderPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [showRuler, setShowRuler] = useState(false);
  const [rulerTop, setRulerTop] = useState(200);
  const [showToolbar, setShowToolbar] = useState(true);

  // TTS
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeSentence, setActiveSentence] = useState(-1);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [rate, setRate] = useState(1.0);
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  const [progressPct, setProgressPct] = useState(0);
  const speechRef = useRef(getSpeechController());
  const startTime = useRef<number>(Date.now());
  const loggedRef = useRef(false);
  const lastScrollY = useRef(0);
  const voicePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getBook(id).then((b) => setBook(b as BookDetail));
    api.getBookChapters(id)
      .then((chs) => setChapters(chs || []))
      .catch(() => setChapters([]));
  }, [id]);

  useEffect(() => {
    if (!user || !book) return;
    if (user.accessibility_settings) {
      setPrefs((p) => ({
        ...p,
        fontSize: user.accessibility_settings.fontSize || p.fontSize,
        dyslexicFont: user.accessibility_settings.dyslexicFont || p.dyslexicFont,
      }));
    }
  }, [user, book?.id]);

  // Scroll progress + toolbar auto-hide
  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setProgressPct(Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100))));
      }
      const delta = window.scrollY - lastScrollY.current;
      if (delta > 80) setShowToolbar(false);
      else if (delta < -30) setShowToolbar(true);
      lastScrollY.current = window.scrollY;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reading ruler
  useEffect(() => {
    if (!showRuler) return;
    const fn = (e: MouseEvent) => setRulerTop(e.clientY - 20);
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [showRuler]);

  // Close voice panel on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (voicePanelRef.current && !voicePanelRef.current.contains(e.target as Node)) {
        setShowVoicePanel(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const logProgress = useCallback(() => {
    if (!user || !book || loggedRef.current) return;
    const minutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
    loggedRef.current = true;
    api.logSession({ book_id: book.id, minutes, mode: "text", progress_percent: progressPct }).catch(() => {});
  }, [user, book, progressPct]);

  useEffect(() => {
    const ctrl = speechRef.current;
    return () => { logProgress(); ctrl.stop(); };
  }, [logProgress]);

  // Derive content
  const currentChapter = chapters[activeChapterIndex];
  const rawText = currentChapter?.content || book?.full_text_excerpt || book?.synopsis || "";
  const text = cleanText(rawText);
  const sentences = splitSentences(text);
  const paragraphs = getParagraphs(text);
  const wordsCount = currentChapter?.word_count || text.split(/\s+/).length;
  const estimatedMinsLeft = Math.max(1, Math.round((wordsCount * (1 - progressPct / 100)) / 200));

  const themeObj = THEMES.find((t) => t.key === prefs.theme)!;
  const isDark = prefs.theme === "night" || prefs.theme === "forest";

  // ── TTS controls ──────────────────────────────────────────────────────────
  function togglePlay() {
    if (!speechRef.current.isSupported) return;
    if (playing && !paused) {
      speechRef.current.pause();
      setPlaying(false);
      setPaused(true);
      return;
    }
    if (paused) {
      speechRef.current.resume();
      setPlaying(true);
      setPaused(false);
      return;
    }
    speechRef.current.speak(text, {
      voiceOption: selectedVoice,
      rate,
      onSentence: (_i, s) => setActiveSentence(s),
      onEnd: () => { setPlaying(false); setPaused(false); setActiveSentence(-1); },
    });
    setPlaying(true);
    setPaused(false);
  }

  function stopPlay() {
    speechRef.current.stop();
    setPlaying(false);
    setPaused(false);
    setActiveSentence(-1);
  }

  function changeVoice(voice: VoiceOption) {
    setSelectedVoice(voice);
    setShowVoicePanel(false);
    if (playing || paused) stopPlay();
  }

  function changeChapter(idx: number) {
    setActiveChapterIndex(idx);
    stopPlay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Theme derived styles ──────────────────────────────────────────────────
  const pageStyle: React.CSSProperties = {
    backgroundColor: themeObj.bg,
    color: themeObj.text,
    minHeight: "100vh",
    transition: "background-color 0.4s ease, color 0.4s ease",
  };

  const toolbarStyle: React.CSSProperties = {
    backgroundColor: isDark ? `${themeObj.bg}f0` : `${themeObj.bg}f5`,
    borderColor: themeObj.border,
    color: themeObj.text,
  };

  const accentColor = themeObj.accent;

  const btnActiveCls = `text-white shadow-sm`;
  const btnActiveStyle: React.CSSProperties = { backgroundColor: accentColor };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!book) {
    return (
      <div style={{ backgroundColor: "#FDFAF3", color: "#2C1A0E", minHeight: "100vh" }}
        className="flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full border-[3px] border-amber-200 border-t-amber-700 animate-spin" />
          <p className="text-sm opacity-50 font-serif italic">Opening volume…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Reading guide ruler */}
      {showRuler && (
        <div
          className="fixed left-0 right-0 h-10 pointer-events-none z-50 transition-none"
          style={{
            top: `${rulerTop}px`,
            backgroundColor: `${accentColor}15`,
            borderTop: `1px solid ${accentColor}44`,
            borderBottom: `1px solid ${accentColor}44`,
          }}
        />
      )}

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ backgroundColor: `${accentColor}20` }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}bb)`,
            boxShadow: `0 0 6px ${accentColor}88`,
          }}
        />
      </div>

      {/* ── Floating Toolbar — sits BELOW the sticky navbar (top-16 = 64px) ── */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 flex justify-center transition-all duration-300 px-4 pt-2 ${
          showToolbar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <div
          className="w-full max-w-3xl rounded-xl border shadow-lg backdrop-blur-xl"
          style={toolbarStyle}
        >
          {/* Row 1: nav breadcrumb + stats */}
          <div
            className="flex items-center justify-between gap-4 px-4 py-2 text-xs"
            style={{ borderBottom: `1px solid ${themeObj.border}60` }}
          >
            <Link
              href={`/books/${book.id}`}
              className="flex items-center gap-1.5 font-medium opacity-50 hover:opacity-90 transition-opacity shrink-0"
            >
              <ArrowLeft size={13} /> Back to book
            </Link>
            <div className="flex items-center gap-3 opacity-40 shrink-0">
              <span className="flex items-center gap-1"><Clock size={11} /> ~{estimatedMinsLeft}m left</span>
              <span className="font-semibold">{progressPct}%</span>
            </div>
          </div>

          {/* Row 2: controls */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
            {/* Theme pills */}
            <div className="flex items-center gap-1">
              {THEMES.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPrefs((p) => ({ ...p, theme: key }))}
                  title={label}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    prefs.theme === key ? `${btnActiveCls} scale-110` : "opacity-35 hover:opacity-70"
                  }`}
                  style={prefs.theme === key ? btnActiveStyle : {}}
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>

            <div className="w-px h-4 opacity-20" style={{ backgroundColor: themeObj.text }} />

            {/* Font size */}
            <div className="flex items-center gap-1.5">
              <Type size={12} className="opacity-40" />
              <input
                type="range" min={14} max={30} step={1} value={prefs.fontSize}
                onChange={(e) => setPrefs((p) => ({ ...p, fontSize: Number(e.target.value) }))}
                className="w-20 cursor-pointer"
                style={{ accentColor }}
              />
              <span className="text-[11px] opacity-40 tabular-nums w-6">{prefs.fontSize}</span>
            </div>

            {/* Line height */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] opacity-30 font-mono">≡</span>
              <input
                type="range" min={1.4} max={2.4} step={0.1} value={prefs.lineHeight}
                onChange={(e) => setPrefs((p) => ({ ...p, lineHeight: Number(e.target.value) }))}
                className="w-14 cursor-pointer"
                style={{ accentColor }}
              />
            </div>

            <div className="w-px h-4 opacity-20" style={{ backgroundColor: themeObj.text }} />

            {/* Dyslexic toggle */}
            <label className="flex items-center gap-1.5 text-[11px] opacity-50 hover:opacity-80 cursor-pointer select-none">
              <input
                type="checkbox" checked={prefs.dyslexicFont}
                onChange={(e) => setPrefs((p) => ({ ...p, dyslexicFont: e.target.checked }))}
                className="w-3 h-3 cursor-pointer"
                style={{ accentColor }}
              />
              Dyslexic
            </label>

            {/* Focus ruler */}
            <button
              onClick={() => setShowRuler((r) => !r)}
              className={`flex items-center gap-1 text-[11px] rounded-full px-2.5 py-1 transition-all ${
                showRuler ? "text-white shadow-sm" : "opacity-40 hover:opacity-70"
              }`}
              style={showRuler ? btnActiveStyle : {}}
            >
              <Eye size={11} /> Guide
            </button>

            {/* Right side: voice picker + play controls */}
            <div className="ml-auto flex items-center gap-2">
              {/* Voice picker */}
              <div className="relative" ref={voicePanelRef}>
                <button
                  onClick={() => setShowVoicePanel((v) => !v)}
                  className={`flex items-center gap-1.5 text-[11px] font-medium rounded-full px-3 py-1.5 border transition-all ${
                    showVoicePanel ? "text-white shadow-sm" : "opacity-55 hover:opacity-85"
                  }`}
                  style={{
                    borderColor: showVoicePanel ? accentColor : `${themeObj.border}`,
                    ...(showVoicePanel ? btnActiveStyle : {}),
                  }}
                >
                  <Mic size={11} />
                  {selectedVoice.label}
                  <ChevronDown size={10} className={`transition-transform duration-200 ${showVoicePanel ? "rotate-180" : ""}`} />
                </button>

                {showVoicePanel && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden animate-scale-in"
                    style={{
                      backgroundColor: isDark ? "#1c1f30" : "#ffffff",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                      color: isDark ? "#e2e8f0" : "#1a1a2e",
                    }}
                  >
                    <div className="px-4 py-2.5" style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                      <p className="text-[10px] font-bold tracking-widest uppercase opacity-40">Choose Narrator</p>
                    </div>

                    <div className="p-2.5 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-1.5" style={{ color: accentColor, opacity: 0.8 }}>
                          🇮🇳 Indian Voices
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {VOICE_OPTIONS.filter((v) => v.lang.endsWith("-IN")).map((voice) => (
                            <VoiceCard
                              key={voice.id}
                              voice={voice}
                              selected={selectedVoice.id === voice.id}
                              accentColor={accentColor}
                              isDark={isDark}
                              onClick={() => changeVoice(voice)}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-1.5 opacity-30">
                          🌐 Other Languages
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {VOICE_OPTIONS.filter((v) => !v.lang.endsWith("-IN")).map((voice) => (
                            <VoiceCard
                              key={voice.id}
                              voice={voice}
                              selected={selectedVoice.id === voice.id}
                              accentColor={accentColor}
                              isDark={isDark}
                              onClick={() => changeVoice(voice)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Speed control */}
                    <div className="px-4 py-3" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 opacity-60">
                          <Gauge size={12} />
                          <span className="text-[11px] font-medium">Speed</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: accentColor }}>{rate}×</span>
                      </div>
                      <input
                        type="range" min={0.5} max={2.0} step={0.25} value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-full cursor-pointer"
                        style={{ accentColor }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Play button */}
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${accentColor}55` }}
              >
                {playing ? <Pause size={12} /> : <Play size={12} />}
                {playing ? "Pause" : paused ? "Resume" : "Listen"}
              </button>

              {/* Stop button */}
              {(playing || paused) && (
                <button
                  onClick={stopPlay}
                  className="w-7 h-7 flex items-center justify-center rounded-full border opacity-50 hover:opacity-90 transition-opacity"
                  style={{ borderColor: themeObj.border }}
                  title="Stop"
                >
                  <Square size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover zone to reveal toolbar when hidden */}
      {!showToolbar && (
        <div className="fixed top-16 left-0 right-0 h-6 z-40" onMouseEnter={() => setShowToolbar(true)} />
      )}

      {/* ── Main content ── */}
      {/* pt-[calc(64px+60px)] ≈ navbar (64) + toolbar (≈56) + gap */}
      <div className="mx-auto max-w-[760px] px-4 sm:px-8 pt-36 pb-24">

        {/* Chapter selector */}
        {chapters.length > 1 && (
          <div
            className="mb-8 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ border: `1px solid ${themeObj.border}60`, backgroundColor: `${themeObj.border}20` }}
          >
            <button
              disabled={activeChapterIndex <= 0}
              onClick={() => changeChapter(Math.max(0, activeChapterIndex - 1))}
              className="p-1 rounded-lg disabled:opacity-20 opacity-50 hover:opacity-90 transition-opacity"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
              <BookOpen size={12} className="opacity-40 shrink-0" />
              <select
                value={activeChapterIndex}
                onChange={(e) => changeChapter(Number(e.target.value))}
                className="text-xs font-semibold border-none focus:outline-none cursor-pointer truncate w-full max-w-xs"
                style={{ background: "transparent", color: "inherit" }}
              >
                {chapters.map((ch, idx) => (
                  <option key={ch.index} value={idx}
                    style={{ backgroundColor: themeObj.bg, color: themeObj.text }}>
                    {ch.title} (~{ch.estimated_minutes} min)
                  </option>
                ))}
              </select>
            </div>
            <button
              disabled={activeChapterIndex >= chapters.length - 1}
              onClick={() => changeChapter(Math.min(chapters.length - 1, activeChapterIndex + 1))}
              className="p-1 rounded-lg disabled:opacity-20 opacity-50 hover:opacity-90 transition-opacity"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* ── Book Page Card ── */}
        <div
          className="relative rounded-sm"
          style={{
            boxShadow: isDark
              ? "0 2px 4px rgba(0,0,0,0.3), 0 12px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)"
              : "0 2px 4px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          {/* Left spine shadow */}
          <div
            className="absolute top-0 left-0 bottom-0 w-6 pointer-events-none rounded-l-sm"
            style={{
              background: isDark
                ? "linear-gradient(90deg,rgba(0,0,0,0.3) 0%,transparent 100%)"
                : "linear-gradient(90deg,rgba(0,0,0,0.07) 0%,transparent 100%)",
              zIndex: 2,
            }}
          />

          {/* Page content */}
          <div className="px-8 sm:px-16 py-12 sm:py-16 relative z-10">

            {/* Book header */}
            <header className="text-center mb-10" style={{ paddingBottom: "2.5rem", borderBottom: `1px solid ${themeObj.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] mb-3 opacity-35">
                {currentChapter?.title && chapters.length > 1 ? "Chapter" : "From the Library"}
              </p>
              <h1
                className={`font-serif font-bold leading-snug mb-2 ${prefs.dyslexicFont ? "reader-dyslexic" : ""}`}
                style={{ fontSize: `${Math.min(prefs.fontSize * 1.8, 42)}px` }}
              >
                {currentChapter?.title && chapters.length > 1 ? currentChapter.title : book.title}
              </h1>
              {!(currentChapter?.title && chapters.length > 1) && (
                <p className="text-sm opacity-45">
                  by <span className="font-medium">{book.author}</span>
                  {book.published_year ? ` · ${book.published_year}` : ""}
                </p>
              )}
              {/* Ornamental divider */}
              <div className="flex items-center justify-center gap-3 mt-5 opacity-25">
                <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${themeObj.text})` }} />
                <span className="text-sm">✦</span>
                <div className="h-px w-16" style={{ background: `linear-gradient(270deg, transparent, ${themeObj.text})` }} />
              </div>
            </header>

            {/* Now-playing bar */}
            {playing && (
              <div
                className="flex items-center gap-2 mb-8 px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: `${accentColor}12`,
                  border: `1px solid ${accentColor}30`,
                  color: accentColor,
                }}
              >
                <Volume2 size={12} className="shrink-0" />
                <span>Narrating as <strong>{selectedVoice.label}</strong> · {selectedVoice.accent}</span>
                <div className="ml-auto flex items-end gap-px h-3.5">
                  {[3, 5, 7, 6, 4, 6, 4].map((h, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full"
                      style={{ height: `${h}px`, backgroundColor: accentColor, animation: `wave-bar 0.9s ease-in-out infinite ${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Article text */}
            <article
              className={prefs.dyslexicFont ? "reader-dyslexic" : "font-serif"}
              style={{ fontSize: `${prefs.fontSize}px`, lineHeight: prefs.lineHeight }}
            >
              {paragraphs.map((para, pIdx) => {
                const paraSentences = splitSentences(para);
                const isFirstPara = pIdx === 0;

                // Build a lookup: does this paragraph contain an active sentence?
                return (
                  <p
                    key={pIdx}
                    style={{
                      marginBottom: `${prefs.lineHeight * prefs.fontSize * 0.8}px`,
                      textIndent: isFirstPara ? 0 : `${prefs.fontSize * 1.2}px`,
                      textAlign: "justify",
                    }}
                  >
                    {/* Drop cap — only for first real para, only when text is long enough */}
                    {isFirstPara && para.length > 20 && (
                      <span
                        className="float-left font-serif font-bold mr-1 select-none"
                        aria-hidden="true"
                        style={{
                          fontSize: `${prefs.fontSize * 3.5}px`,
                          lineHeight: `${prefs.fontSize * 2.8}px`,
                          color: accentColor,
                          marginTop: `${prefs.fontSize * 0.1}px`,
                          opacity: 0.85,
                        }}
                      >
                        {para[0]}
                      </span>
                    )}

                    {paraSentences.map((s, sIdx) => {
                      // For the first para, skip the first char of first sentence (drop-cap)
                      const displayS = isFirstPara && sIdx === 0 && para.length > 20 ? s.slice(1) : s;
                      const globalIdx = sentences.indexOf(s);
                      const isActive = globalIdx !== -1 && globalIdx === activeSentence && playing;
                      return (
                        <span
                          key={sIdx}
                          className={`transition-colors duration-150 ${isActive ? "tts-highlight font-medium" : ""}`}
                        >
                          {displayS}{" "}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </article>

            {/* End ornament */}
            <div className="flex items-center justify-center gap-3 mt-10 opacity-20">
              <div className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${themeObj.text})` }} />
              <span className="text-sm font-serif">❧</span>
              <div className="h-px w-20" style={{ background: `linear-gradient(270deg, transparent, ${themeObj.text})` }} />
            </div>
          </div>
        </div>

        {/* Bottom chapter nav */}
        {chapters.length > 1 && (
          <div className="mt-8 flex items-center justify-between">
            {activeChapterIndex > 0 ? (
              <button
                onClick={() => changeChapter(activeChapterIndex - 1)}
                className="flex items-center gap-2 text-xs font-semibold rounded-full px-5 py-2 border transition-all hover:scale-105 opacity-60 hover:opacity-100"
                style={{ borderColor: themeObj.border }}
              >
                <ChevronLeft size={13} /> Previous Chapter
              </button>
            ) : <div />}
            {activeChapterIndex < chapters.length - 1 && (
              <button
                onClick={() => changeChapter(activeChapterIndex + 1)}
                className="flex items-center gap-2 text-xs font-bold rounded-full px-5 py-2 text-white shadow-md transition-all hover:scale-105"
                style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${accentColor}55` }}
              >
                Next Chapter <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Voice Card ─────────────────────────────────────────────────────────────────
function VoiceCard({
  voice,
  selected,
  accentColor,
  isDark,
  onClick,
}: {
  voice: VoiceOption;
  selected: boolean;
  accentColor: string;
  isDark: boolean;
  onClick: () => void;
}) {
  const emoji = voice.gender === "female" ? "👩" : voice.gender === "male" ? "👨" : "🎙";
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
      style={{
        backgroundColor: selected
          ? `${accentColor}20`
          : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${selected ? accentColor + "50" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-sm leading-none">{emoji}</span>
        <span className="text-xs font-semibold" style={selected ? { color: accentColor } : {}}>
          {voice.label}
        </span>
      </div>
      <span className="text-[10px] opacity-35 leading-tight">{voice.accent}</span>
    </button>
  );
}
