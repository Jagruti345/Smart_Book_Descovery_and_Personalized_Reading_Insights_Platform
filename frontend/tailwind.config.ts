import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F3EA",
        "paper-dim": "#ECE4D2",
        "paper-dark": "#E2D7C0",
        ink: "#1C1917",
        "ink-soft": "#57534E",
        "ink-muted": "#78716C",
        navy: "#132238",
        "navy-deep": "#0B1524",
        "navy-light": "#1E3352",
        amber: "#C07D1C",
        "amber-bright": "#D98E28",
        "amber-glow": "#F59E0B",
        forest: "#28543E",
        "forest-dark": "#1D3D2D",
        wine: "#853333",
        "wine-deep": "#5E2424",
        cream: "#FDFBF7",
        gold: "#D4AF37",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        dyslexic: ["OpenDyslexic", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        pill: "9999px",
      },
      boxShadow: {
        book: "0 14px 28px rgba(19, 34, 56, 0.16), 0 10px 10px rgba(19, 34, 56, 0.10)",
        "book-hover": "0 22px 40px rgba(19, 34, 56, 0.24), 0 14px 14px rgba(19, 34, 56, 0.12)",
        glow: "0 0 20px rgba(192, 125, 28, 0.35)",
        "glow-lg": "0 0 40px rgba(192, 125, 28, 0.5)",
        "glass-sm": "0 8px 32px 0 rgba(19, 34, 56, 0.08)",
        "glass-lg": "0 24px 64px 0 rgba(19, 34, 56, 0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0B1524 0%, #132238 30%, #1D3D2D 60%, #1a1018 100%)",
        "amber-gradient": "linear-gradient(135deg, #C07D1C, #D98E28, #F59E0B)",
        "navy-gradient": "linear-gradient(135deg, #132238, #1E3352)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(3deg)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: "0.7" },
          "33%": { transform: "translate(-40%,-60%) scale(1.1) rotate(15deg)", opacity: "0.9" },
          "66%": { transform: "translate(-60%,-45%) scale(0.95) rotate(-10deg)", opacity: "0.6" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        waveBar: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "fade-in-up": "fadeInUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "spin-slow": "spinSlow 8s linear infinite",
        marquee: "marquee 28s linear infinite",
        aurora: "aurora 12s ease-in-out infinite",
        "gradient-shift": "gradientShift 4s ease infinite",
        "wave-bar": "waveBar 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
