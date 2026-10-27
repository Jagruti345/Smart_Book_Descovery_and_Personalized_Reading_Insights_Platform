"use client";

export interface VoiceOption {
  id: string;
  label: string;
  lang: string;
  gender: "male" | "female" | "neutral";
  accent: string;
  nameHints: string[];
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "hi-IN-female",
    label: "Priya",
    lang: "hi-IN",
    gender: "female",
    accent: "Hindi • Female",
    nameHints: ["Priya", "Heera", "Lekha", "Aditi", "Ritu"],
  },
  {
    id: "hi-IN-male",
    label: "Raj",
    lang: "hi-IN",
    gender: "male",
    accent: "Hindi • Male",
    nameHints: ["Raj", "Ravi", "Hemant", "Gaurav"],
  },
  {
    id: "en-IN-female",
    label: "Meera",
    lang: "en-IN",
    gender: "female",
    accent: "English India • Female",
    nameHints: ["Meera", "Veena", "Neerja", "Sunita"],
  },
  {
    id: "en-IN-male",
    label: "Arjun",
    lang: "en-IN",
    gender: "male",
    accent: "English India • Male",
    nameHints: ["Arjun", "Karan", "Anil"],
  },
  {
    id: "ta-IN",
    label: "Tamil",
    lang: "ta-IN",
    gender: "neutral",
    accent: "Tamil • Indian",
    nameHints: ["Valluvar"],
  },
  {
    id: "bn-IN",
    label: "Bengali",
    lang: "bn-IN",
    gender: "neutral",
    accent: "Bengali • Indian",
    nameHints: ["Bangla"],
  },
  {
    id: "en-US-female",
    label: "Aria",
    lang: "en-US",
    gender: "female",
    accent: "English US • Female",
    nameHints: ["Aria", "Zira", "Jenny", "Samantha", "Susan", "Karen"],
  },
  {
    id: "en-US-male",
    label: "David",
    lang: "en-US",
    gender: "male",
    accent: "English US • Male",
    nameHints: ["David", "Mark", "Guy", "Ryan", "Tom"],
  },
  {
    id: "en-GB",
    label: "British",
    lang: "en-GB",
    gender: "neutral",
    accent: "English UK",
    nameHints: ["Hazel", "George", "Lib", "Daniel", "Kate"],
  },
];

export interface SpeechController {
  speak: (
    text: string,
    opts: {
      voiceOption?: VoiceOption;
      lang?: string;
      rate?: number;
      pitch?: number;
      onSentence?: (charIndex: number, sentenceIdx: number) => void;
      onEnd?: () => void;
    }
  ) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: boolean;
  getAvailableVoices: () => SpeechSynthesisVoice[];
}

/** Pick the best browser voice for a given VoiceOption */
export function pickVoice(option: VoiceOption): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return null;

  // 1. Exact name hint match (case-insensitive)
  for (const hint of option.nameHints) {
    const match = all.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (match) return match;
  }

  // 2. Gender match within same locale
  const sameLocale = all.filter((v) => v.lang === option.lang);
  if (sameLocale.length) {
    if (option.gender === "female") {
      const fem = sameLocale.find((v) =>
        /female|woman|girl|f\b/i.test(v.name) ||
        ["heera", "lekha", "veena", "priya", "meera", "aditi", "neerja", "ritu"].some((n) =>
          v.name.toLowerCase().includes(n)
        )
      );
      if (fem) return fem;
    }
    if (option.gender === "male") {
      const mal = sameLocale.find((v) =>
        /male|man|boy|m\b/i.test(v.name) ||
        ["ravi", "raj", "hemant", "gaurav", "karan", "anil"].some((n) =>
          v.name.toLowerCase().includes(n)
        )
      );
      if (mal) return mal;
    }
    return sameLocale[0];
  }

  // 3. Language prefix fallback
  const prefix = option.lang.split("-")[0];
  const prefixMatch = all.find((v) => v.lang.startsWith(prefix));
  if (prefixMatch) return prefixMatch;

  return null;
}

export function getSpeechController(): SpeechController {
  let _sentences: string[] = [];
  let _opts: {
    voiceOption?: VoiceOption;
    lang?: string;
    rate?: number;
    pitch?: number;
    onSentence?: (i: number, s: number) => void;
    onEnd?: () => void;
  } = {};
  let _currentIdx = 0;
  let _paused = false;
  let _active = false;
  let _voicesReady = false;

  function isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  function ensureVoices(): Promise<void> {
    return new Promise((resolve) => {
      if (_voicesReady || !isSupported()) { resolve(); return; }
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) { _voicesReady = true; resolve(); return; }
      const handler = () => { _voicesReady = true; resolve(); };
      window.speechSynthesis.onvoiceschanged = handler;
      setTimeout(() => { _voicesReady = true; resolve(); }, 2500);
    });
  }

  function speakFrom(idx: number) {
    if (!isSupported() || _paused || !_active) return;
    if (idx >= _sentences.length) {
      _active = false;
      _opts.onEnd?.();
      return;
    }
    _currentIdx = idx;

    const utter = new SpeechSynthesisUtterance(_sentences[idx]);

    if (_opts.voiceOption) {
      const voice = pickVoice(_opts.voiceOption);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = _opts.voiceOption.lang;
      }
    } else {
      utter.lang = _opts.lang || "hi-IN";
    }

    utter.rate = _opts.rate || 1.0;
    utter.pitch = _opts.pitch ?? 1.0;

    utter.onstart = () => _opts.onSentence?.(0, idx);
    utter.onboundary = () => _opts.onSentence?.(0, idx);
    utter.onend = () => {
      if (!_paused && _active) speakFrom(idx + 1);
    };
    utter.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      if (!_paused && _active) speakFrom(idx + 1);
    };

    window.speechSynthesis.speak(utter);
  }

  function speak(
    text: string,
    opts: typeof _opts
  ) {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();

    _sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    _opts = opts;
    _currentIdx = 0;
    _paused = false;
    _active = true;

    ensureVoices().then(() => {
      if (_active && !_paused) speakFrom(0);
    });
  }

  function pause() {
    if (!isSupported() || !_active) return;
    _paused = true;
    window.speechSynthesis.cancel();
  }

  function resume() {
    if (!isSupported() || !_paused) return;
    _paused = false;
    speakFrom(_currentIdx);
  }

  function stop() {
    if (!isSupported()) return;
    _active = false;
    _paused = false;
    _currentIdx = 0;
    window.speechSynthesis.cancel();
  }

  function getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  return {
    speak,
    pause,
    resume,
    stop,
    getAvailableVoices,
    get isSupported() { return isSupported(); },
  };
}

export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}
