"use client";
import { Type, Contrast, SunMedium, Moon, Coffee } from "lucide-react";

export interface ReaderPrefs {
  fontSize: number;
  theme: "light" | "sepia" | "dark" | "max-contrast";
  dyslexicFont: boolean;
}

const THEMES: Array<{ key: ReaderPrefs["theme"]; label: string; icon: React.ElementType }> = [
  { key: "light", label: "Light", icon: SunMedium },
  { key: "sepia", label: "Sepia", icon: Coffee },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "max-contrast", label: "Max contrast", icon: Contrast },
];

export default function AccessibilityBar({
  prefs,
  onChange,
}: {
  prefs: ReaderPrefs;
  onChange: (next: ReaderPrefs) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-card border border-ink/10 bg-cream px-4 py-3">
      <div className="flex items-center gap-2">
        <Type size={16} className="text-ink-soft" />
        <input
          type="range"
          min={14}
          max={32}
          step={1}
          value={prefs.fontSize}
          aria-label="Font size"
          onChange={(e) => onChange({ ...prefs, fontSize: Number(e.target.value) })}
          className="w-28 accent-amber"
        />
        <span className="text-xs text-ink-soft w-8">{prefs.fontSize}px</span>
      </div>

      <div className="h-5 w-px bg-ink/10" />

      <div className="flex items-center gap-1">
        {THEMES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onChange({ ...prefs, theme: key })}
            aria-pressed={prefs.theme === key}
            title={label}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
              prefs.theme === key ? "bg-navy text-cream" : "text-ink-soft hover:bg-ink/5"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-ink/10" />

      <label className="flex items-center gap-2 text-xs font-medium text-ink-soft cursor-pointer">
        <input
          type="checkbox"
          checked={prefs.dyslexicFont}
          onChange={(e) => onChange({ ...prefs, dyslexicFont: e.target.checked })}
          className="accent-amber"
        />
        Dyslexia-friendly font
      </label>
    </div>
  );
}
