import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)"
      },
      boxShadow: {
        hush: "0 20px 80px rgba(5, 26, 21, 0.08)",
        halo: "0 0 0 1px rgba(255,255,255,0.35), 0 18px 60px rgba(0,0,0,0.08)"
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        quran: ["var(--font-quran)"]
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -10px, 0) scale(1.02)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" }
        }
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
