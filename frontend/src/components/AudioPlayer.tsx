"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, Square, Gauge, Volume2, VolumeX, Mic, ChevronDown,
} from "lucide-react";
import { getSpeechController, splitSentences, VOICE_OPTIONS } from "@/lib/speech";
import type { VoiceOption } from "@/lib/speech";

interface Lang { code: string; label: string; }

export default function AudioPlayer({
  librivoxUrl,
  ttsText,
  languages,
}: {
  librivoxUrl?: string | null;
  ttsText: string;
  languages: Lang[];
}) {
  const mode = librivoxUrl ? "librivox" : "tts";
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [activeSentence, setActiveSentence] = useState(-1);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [ttsSupported, setTtsSupported] = useState<boolean | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef(getSpeechController());
  const voiceMenuRef = useRef<HTMLDivElement>(null);
  const sentences = splitSentences(ttsText);

  useEffect(() => {
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    const controller = speechRef.current;
    return () => controller.stop();
  }, []);

  // Audio element tracking
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setAudioTime(el.currentTime);
    const onLoad = () => setAudioDuration(el.duration);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoad);
    return () => { el.removeEventListener("timeupdate", onTime); el.removeEventListener("loadedmetadata", onLoad); };
  }, []);

  // Close voice menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handlePlayPause() {
    if (mode === "librivox" && audioRef.current) {
      if (playing) audioRef.current.pause();
      else audioRef.current.play().catch(console.warn);
      setPlaying(!playing);
      return;
    }

    // TTS
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
    if (ttsSupported === false) return;
    speechRef.current.speak(ttsText, {
      voiceOption: selectedVoice,
      rate: speed,
      onSentence: (_i, s) => setActiveSentence(s),
      onEnd: () => { setPlaying(false); setPaused(false); setActiveSentence(-1); },
    });
    setPlaying(true);
    setPaused(false);
  }

  function handleStop() {
    if (mode === "librivox" && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } else {
      speechRef.current.stop();
    }
    setPlaying(false);
    setPaused(false);
    setActiveSentence(-1);
  }

  function handleVoiceChange(voice: VoiceOption) {
    setSelectedVoice(voice);
    setShowVoiceMenu(false);
    if (playing || paused) { handleStop(); }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = t; }
    setAudioTime(t);
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }

  function formatTime(sec: number) {
    if (!sec || isNaN(sec)) return "0:00";
    return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2, "0")}`;
  }

  const playLabel = playing ? "Pause" : paused ? "Resume" : "Play";

  return (
    <div className="rounded-2xl overflow-hidden border border-amber/15 audio-player-bg shadow-xl">
      {mode === "librivox" && librivoxUrl && (
        <audio
          ref={audioRef}
          src={librivoxUrl}
          className="hidden"
          onEnded={() => { setPlaying(false); setAudioTime(0); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber/15 flex items-center justify-center">
            <Volume2 size={15} className="text-amber" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-cream/90 uppercase tracking-wider">
              {mode === "librivox" ? "LibriVox Audio" : "AI Narration"}
            </p>
            <p className="text-[10px] text-cream/40">
              {mode === "librivox" ? "Public domain narration" : "Real-time multilingual TTS"}
            </p>
          </div>
        </div>
        {playing && (
          <div className="audio-waveform">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="audio-waveform-bar" style={{ height: `${8 + (i % 3) * 5}px` }} />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 space-y-3.5">
        {/* Controls row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Play */}
          <button
            onClick={handlePlayPause}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-amber text-ink shadow-lg hover:bg-amber-bright transition-all hover:scale-110 active:scale-95"
            aria-label={playLabel}
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-cream/15 text-cream/60 hover:bg-cream/10 hover:text-cream transition-all"
            aria-label="Stop"
          >
            <Square size={12} />
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-cream/15 text-cream/60 hover:bg-cream/10 hover:text-cream transition-all"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1.5">
            <Gauge size={12} className="text-cream/40" />
            <select
              value={speed}
              onChange={(e) => {
                const s = Number(e.target.value);
                setSpeed(s);
                if (mode === "librivox" && audioRef.current) audioRef.current.playbackRate = s;
              }}
              className="text-xs bg-cream/10 border border-cream/15 rounded-full px-2 py-1 text-cream focus:outline-none focus:border-amber/40"
            >
              {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                <option key={s} value={s} className="bg-navy text-cream">{s}×</option>
              ))}
            </select>
          </div>

          {/* Voice picker (TTS only) */}
          {mode === "tts" && (
            <div className="relative ml-auto" ref={voiceMenuRef}>
              <button
                onClick={() => setShowVoiceMenu((v) => !v)}
                className="flex items-center gap-1.5 text-xs bg-cream/10 border border-cream/15 rounded-full px-3 py-1.5 text-cream hover:border-amber/40 transition-all"
              >
                <Mic size={11} />
                {selectedVoice.label}
                <ChevronDown size={10} className={`transition-transform ${showVoiceMenu ? "rotate-180" : ""}`} />
              </button>

              {showVoiceMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-72 rounded-2xl bg-navy border border-cream/10 shadow-2xl z-50 overflow-hidden animate-scale-in">
                  <div className="px-3 py-2.5 border-b border-cream/8">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-cream/40">Choose Narrator</p>
                  </div>

                  <div className="px-2.5 pt-2.5 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-amber/60 px-1 mb-1.5">🇮🇳 Indian Voices</p>
                    <div className="grid grid-cols-2 gap-1">
                      {VOICE_OPTIONS.filter((v) => v.lang.endsWith("-IN")).map((voice) => (
                        <VoiceBtn
                          key={voice.id}
                          voice={voice}
                          selected={selectedVoice.id === voice.id}
                          onClick={() => handleVoiceChange(voice)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="px-2.5 pt-2 pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-cream/30 px-1 mb-1.5">🌐 Other</p>
                    <div className="grid grid-cols-2 gap-1">
                      {VOICE_OPTIONS.filter((v) => !v.lang.endsWith("-IN")).map((voice) => (
                        <VoiceBtn
                          key={voice.id}
                          voice={voice}
                          selected={selectedVoice.id === voice.id}
                          onClick={() => handleVoiceChange(voice)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrubber (LibriVox) */}
        {mode === "librivox" && (
          <div className="space-y-1">
            <input
              type="range" min={0} max={audioDuration || 100} value={audioTime}
              onChange={handleSeek}
              className="w-full h-1.5 accent-amber rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, #C07D1C ${audioDuration ? (audioTime / audioDuration) * 100 : 0}%, rgba(255,255,255,0.1) 0%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-cream/40">
              <span>{formatTime(audioTime)}</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>
        )}

        {/* Volume slider (LibriVox) */}
        {mode === "librivox" && (
          <div className="flex items-center gap-2">
            <Volume2 size={10} className="text-cream/30" />
            <input
              type="range" min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="flex-1 h-1.5 accent-amber rounded-full cursor-pointer"
            />
          </div>
        )}

        {/* TTS sentence highlight */}
        {mode === "tts" && (
          <div className="thin-scroll max-h-40 overflow-y-auto text-xs leading-relaxed text-cream/50 border-t border-cream/8 pt-3">
            {sentences.map((s, i) => (
              <span
                key={i}
                className={`transition-all duration-200 ${i === activeSentence && playing ? "tts-highlight text-cream/90 font-medium" : ""}`}
              >
                {s + " "}
              </span>
            ))}
            {ttsSupported === false && (
              <p className="text-wine text-xs mt-2">
                ⚠ Your browser doesn&apos;t support speech synthesis — try Chrome or Edge.
              </p>
            )}
          </div>
        )}

        {/* Status bar */}
        <p className="text-[10px] text-cream/25 border-t border-cream/8 pt-2.5">
          {mode === "librivox"
            ? "Streaming free public-domain narration via LibriVox."
            : `Narrating as ${selectedVoice.label} (${selectedVoice.accent}) · Web Speech API`}
        </p>
      </div>
    </div>
  );
}

function VoiceBtn({ voice, selected, onClick }: { voice: VoiceOption; selected: boolean; onClick: () => void }) {
  const emoji = voice.gender === "female" ? "👩" : voice.gender === "male" ? "👨" : "🎙";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-xl px-2.5 py-2 text-left transition-all hover:scale-[1.02] ${
        selected
          ? "bg-amber/20 border border-amber/35 text-cream"
          : "bg-cream/5 border border-cream/8 text-cream/70 hover:bg-cream/8"
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm leading-none">{emoji}</span>
        <span className={`text-[11px] font-semibold ${selected ? "text-amber" : ""}`}>{voice.label}</span>
      </div>
      <span className="text-[9px] text-cream/30 leading-tight">{voice.accent}</span>
    </button>
  );
}
