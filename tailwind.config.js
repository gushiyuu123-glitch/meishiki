/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],

  theme: {
    extend: {
      /* =========================
         Colors (tokens)
      ========================= */
      colors: {
        // Paper (light)
        paper: "#F3EFE6",
        paper2: "#EEE7DC",
        ink: "#1C1814",
        ink2: "#3B332B",
        muted: "#6D645B",
        line: "#D6CCBE",
        seal: "#B79A63",

        // Cosmic (for MEISHIKI / art sites)
        void: "#070210",
        void2: "#0A0417",
        nebula: "#140826",
        nebula2: "#1A0B32",
        mist: {
          300: "#D9BCFF",
          400: "#C89EFF",
          500: "#B98CFF",
          600: "#A56DFC",
        },

        // Optional: CSS variable driven semantic tokens (if you use them)
        // e.g. text-[color:var(--text-muted)] から移行したいとき用
        "v-text": "rgb(var(--text-primary) / <alpha-value>)",
        "v-sub": "rgb(var(--text-secondary) / <alpha-value>)",
        "v-muted": "rgb(var(--text-muted) / <alpha-value>)",
        "v-faint": "rgb(var(--text-faint) / <alpha-value>)",
        "v-border": "rgb(var(--border-soft) / <alpha-value>)",
      },

      /* =========================
         Typography
      ========================= */
      fontFamily: {
        serif: [
          '"Noto Serif JP"',
          '"Hiragino Mincho ProN"',
          '"Yu Mincho"',
          "serif",
        ],
        sans: ['"Noto Sans JP"', "ui-sans-serif", "system-ui", "sans-serif"],
        obj: ['"Cormorant Garamond"', '"Times New Roman"', "serif"], // 英字オブジェクト用
      },

      letterSpacing: {
        ritual: "0.22em",
        seal: "0.30em",
        wide: "0.18em",
        airy: "0.12em",
      },

      /* =========================
         Layout tokens
      ========================= */
      spacing: {
        // px-side を使うためのトークン
        side: "clamp(16px, 4vw, 44px)",
      },

      maxWidth: {
        content: "1120px",
        contentWide: "1280px",
      },

      borderRadius: {
        pill: "999px",
        soft: "18px",
      },

      /* =========================
         Shadow / Glow (薄く)
      ========================= */
      boxShadow: {
        hush: "0 18px 55px rgba(0,0,0,0.08)",
        glow: "0 0 40px rgba(171,112,255,0.16)",
        glowSoft: "0 0 28px rgba(160,100,255,0.14)",
      },

      dropShadow: {
        moon: "0 18px 30px rgba(12,6,22,0.42)",
        moonGlow: "0 0 28px rgba(190,145,255,0.18)",
      },

      /* =========================
         Background presets
      ========================= */
      backgroundImage: {
        // Hero / cosmic base
        "meishiki-base":
          "linear-gradient(170deg, #0f0818 0%, #0a0610 40%, #0d0920 100%)",

        // soft veils
        "meishiki-veil":
          "radial-gradient(circle at 46% 46%, rgba(194,148,255,0.10), rgba(0,0,0,0) 48%), radial-gradient(circle at 18% 30%, rgba(132,88,255,0.14), rgba(0,0,0,0) 32%)",

        // scanline
        scanline:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)",

        // dots
        "cosmic-dots":
          "radial-gradient(rgba(255,245,255,0.9) 1px, transparent 1px)",
      },

      /* =========================
         Keyframes / Animations
      ========================= */
      keyframes: {
        // background drift (A/B)
        spaceDriftA: {
          "0%": { transform: "translate3d(0%,0%,0) scale(1.06)", opacity: "0.16" },
          "50%": { transform: "translate3d(-1.1%,-0.9%,0) scale(1.10)", opacity: "0.22" },
          "100%": { transform: "translate3d(0%,0%,0) scale(1.06)", opacity: "0.16" },
        },
        spaceDriftB: {
          "0%": { transform: "translate3d(0%,0%,0) scale(1.08)", opacity: "0.10" },
          "50%": { transform: "translate3d(1.3%,1.0%,0) scale(1.14)", opacity: "0.16" },
          "100%": { transform: "translate3d(0%,0%,0) scale(1.08)", opacity: "0.10" },
        },

        // veil breathe
        veilBreathe: {
          "0%,100%": { opacity: "0.70", transform: "translate3d(0,0,0) scale(1)" },
          "50%": { opacity: "0.86", transform: "translate3d(0,-1%,0) scale(1.02)" },
        },

        // moon / orbit
        moonFloat: {
          "0%,100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-10px,0)" },
        },
        orbitSpin: {
          to: { transform: "rotate(360deg)" },
        },

        // gentle reveal
        fadeUp: {
          "0%": { opacity: "0", transform: "translate3d(0,16px,0) scale(0.995)" },
          "100%": { opacity: "1", transform: "translate3d(0,0,0) scale(1)" },
        },
      },

      animation: {
        spaceA: "spaceDriftA 26s ease-in-out infinite",
        spaceB: "spaceDriftB 36s ease-in-out infinite",
        veil: "veilBreathe 14s ease-in-out infinite",
        moon: "moonFloat 8s ease-in-out infinite",
        orbit: "orbitSpin 42s linear infinite",
        fadeUp: "fadeUp 1.08s cubic-bezier(.22,.56,.18,1) forwards",
      },
    },
  },

  plugins: [],
};