import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── Typography — Plus Jakarta Sans (guía Lumina, única familia) ─── */
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        headline: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        body: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
        label: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "system-ui",
          "sans-serif",
        ],
      },

      /**
       * Escala FreeTime Lumina (Mobile / Desktop)
       * @see docs/design/stitch/gu_a_de_tipograf_a_freetime_lumina.html
       * Usar: text-lumina-h1 md:text-lumina-h1-lg, etc.
       */
      fontSize: {
        "lumina-h1": [
          "2rem",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ], // 32px mobile
        "lumina-h1-lg": [
          "3rem",
          { lineHeight: "1.1", letterSpacing: "-0.02em" },
        ], // 48px desktop
        "lumina-h2": [
          "1.5rem",
          { lineHeight: "1.2", letterSpacing: "-0.01em" },
        ], // 24px mobile
        "lumina-h2-lg": [
          "2rem",
          { lineHeight: "1.2", letterSpacing: "-0.01em" },
        ], // 32px desktop
        "lumina-h3": ["1.25rem", { lineHeight: "1.3" }], // 20px
        "lumina-body-lg": ["1rem", { lineHeight: "1.5" }], // 16px
        "lumina-body": ["0.875rem", { lineHeight: "1.5" }], // 14px default
        "lumina-body-sm": ["0.75rem", { lineHeight: "1.5" }], // 12px
        "lumina-button": ["0.875rem", { lineHeight: "1.25" }], // 14px CTA
        "lumina-overline": [
          "0.6875rem",
          { lineHeight: "1.2", letterSpacing: "0.1em" },
        ], // 11px + tracking (usar con uppercase + font-bold)
      },

      /* ── Colors ──────────────────────────────────────────────────────── */
      colors: {
        /* shadcn/ui semantic tokens — CSS var (HSL) ──────────────────── */
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        /* Lumina semantic tokens — RGB channels (supports /opacity) ──── */

        // Primary  (#702ae1 light · #A78BFA dark)
        primary: {
          DEFAULT:             "rgb(var(--lt-primary) / <alpha-value>)",
          dim:                 "rgb(var(--lt-primary-dim) / <alpha-value>)",
          container:           "rgb(var(--lt-primary-container) / <alpha-value>)",
          fixed:               "rgb(var(--lt-primary-fixed) / <alpha-value>)",
          "fixed-dim":         "rgb(var(--lt-primary-fixed-dim) / <alpha-value>)",
          foreground:          "hsl(var(--primary-foreground))",
          // Legacy numeric scale
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#9333EA",
          600: "#7E22CE",
          700: "#6B21A8",
          800: "#581C87",
          900: "#3B0764",
        },
        "on-primary":                "rgb(var(--lt-on-primary) / <alpha-value>)",
        "on-primary-container":      "rgb(var(--lt-on-primary-container) / <alpha-value>)",
        "on-primary-fixed":          "rgb(var(--lt-on-primary-fixed) / <alpha-value>)",
        "on-primary-fixed-variant":  "rgb(var(--lt-on-primary-fixed-variant) / <alpha-value>)",
        "inverse-primary":           "rgb(var(--lt-inverse-primary) / <alpha-value>)",

        // Secondary  (#7742a6 light · #A1A1AA dark)
        secondary: {
          DEFAULT:             "rgb(var(--lt-secondary) / <alpha-value>)",
          dim:                 "rgb(var(--lt-secondary-dim) / <alpha-value>)",
          container:           "rgb(var(--lt-secondary-container) / <alpha-value>)",
          fixed:               "rgb(var(--lt-secondary-fixed) / <alpha-value>)",
          "fixed-dim":         "rgb(var(--lt-secondary-fixed-dim) / <alpha-value>)",
          foreground:          "hsl(var(--secondary-foreground))",
          // Legacy numeric scale
          100: "#E2E8F0",
          200: "#CBD5E1",
          300: "#94A3B8",
          400: "#64748B",
          500: "#475569",
          600: "#334155",
          700: "#1E293B",
          800: "#0F172A",
          900: "#020617",
        },
        "on-secondary":                "rgb(var(--lt-on-secondary) / <alpha-value>)",
        "on-secondary-container":      "rgb(var(--lt-on-secondary-container) / <alpha-value>)",
        "on-secondary-fixed":          "rgb(var(--lt-on-secondary-fixed) / <alpha-value>)",
        "on-secondary-fixed-variant":  "rgb(var(--lt-on-secondary-fixed-variant) / <alpha-value>)",

        // Tertiary  (#9e3657 light · #F472B6 dark)
        tertiary: {
          DEFAULT:             "rgb(var(--lt-tertiary) / <alpha-value>)",
          dim:                 "rgb(var(--lt-tertiary-dim) / <alpha-value>)",
          container:           "rgb(var(--lt-tertiary-container) / <alpha-value>)",
          fixed:               "rgb(var(--lt-tertiary-fixed) / <alpha-value>)",
          "fixed-dim":         "rgb(var(--lt-tertiary-fixed-dim) / <alpha-value>)",
        },
        "on-tertiary":                "rgb(var(--lt-on-tertiary) / <alpha-value>)",
        "on-tertiary-container":      "rgb(var(--lt-on-tertiary-container) / <alpha-value>)",
        "on-tertiary-fixed":          "rgb(var(--lt-on-tertiary-fixed) / <alpha-value>)",
        "on-tertiary-fixed-variant":  "rgb(var(--lt-on-tertiary-fixed-variant) / <alpha-value>)",

        // Surface  (#fef3ff light · #18181B dark)
        surface: {
          DEFAULT:  "rgb(var(--lt-surface) / <alpha-value>)",
          bright:   "rgb(var(--lt-surface-bright) / <alpha-value>)",
          dim:      "rgb(var(--lt-surface-dim) / <alpha-value>)",
          tint:     "rgb(var(--lt-surface-tint) / <alpha-value>)",
          variant:  "rgb(var(--lt-surface-variant) / <alpha-value>)",
        },
        "surface-container": {
          DEFAULT:  "rgb(var(--lt-surface-container) / <alpha-value>)",
          low:      "rgb(var(--lt-surface-container-low) / <alpha-value>)",
          lowest:   "rgb(var(--lt-surface-container-lowest) / <alpha-value>)",
          high:     "rgb(var(--lt-surface-container-high) / <alpha-value>)",
          highest:  "rgb(var(--lt-surface-container-highest) / <alpha-value>)",
        },

        // On-surface / On-background
        "on-background":        "rgb(var(--lt-on-background) / <alpha-value>)",
        "on-surface":           "rgb(var(--lt-on-surface) / <alpha-value>)",
        "on-surface-variant":   "rgb(var(--lt-on-surface-variant) / <alpha-value>)",
        "inverse-surface":      "rgb(var(--lt-inverse-surface) / <alpha-value>)",
        "inverse-on-surface":   "rgb(var(--lt-inverse-on-surface) / <alpha-value>)",

        // Outline
        outline: {
          DEFAULT: "rgb(var(--lt-outline) / <alpha-value>)",
          variant: "rgb(var(--lt-outline-variant) / <alpha-value>)",
        },

        // Error
        error: {
          DEFAULT:    "rgb(var(--lt-error) / <alpha-value>)",
          dim:        "rgb(var(--lt-error-dim) / <alpha-value>)",
          container:  "rgb(var(--lt-error-container) / <alpha-value>)",
        },
        "on-error":            "rgb(var(--lt-on-error) / <alpha-value>)",
        "on-error-container":  "rgb(var(--lt-on-error-container) / <alpha-value>)",

        // Guía tipografía — #09090B títulos / #52525B cuerpo secundario (light)
        "lumina-text-strong":
          "rgb(var(--lt-text-strong) / <alpha-value>)",
        "lumina-text-secondary":
          "rgb(var(--lt-text-body-secondary) / <alpha-value>)",

        // Accent (shadcn compat — points to Lumina surface layer)
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Legacy numeric scale
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
      },

      /* ── Border Radius — Lumina Roundedness Scale ────────────────────
         Cards/Sections: xl (3rem/48px)  — brand signature
         Buttons/Inputs: md (1.5rem/24px) — precise interaction
         Panels:         lg (2rem/32px)   — inner containers            */
      borderRadius: {
        none:    "0",
        sm:      "0.5rem",    /*  8px */
        DEFAULT: "1rem",      /* 16px */
        md:      "1.5rem",    /* 24px — buttons, inputs */
        lg:      "2rem",      /* 32px — panels */
        xl:      "3rem",      /* 48px — hero cards, main sections */
        "2xl":   "4rem",      /* 64px — large decorative elements */
        full:    "9999px",
      },

      /* ── Box Shadow — Lumina Ambient Shadows ─────────────────────────
         Never pure black. Always tinted with on_surface (#3a264b)       */
      boxShadow: {
        "lumina-xs":    "0 2px  8px rgba(58, 38, 75, 0.04)",
        "lumina-sm":    "0 4px 16px rgba(58, 38, 75, 0.04)",
        "lumina":       "0 8px 24px rgba(58, 38, 75, 0.06)",
        "lumina-lg":    "0 20px 40px rgba(58, 38, 75, 0.06)",
        "lumina-modal": "0 20px 60px rgba(58, 38, 75, 0.08)",
      },

      /* ── Backdrop Blur ───────────────────────────────────────────────── */
      backdropBlur: {
        "lumina":    "24px",
      },

      /* ── Letter Spacing — editorial tight for display text ──────────── */
      letterSpacing: {
        display: "-0.02em", // H1 hero
        headline: "-0.01em", // H2 sección
        overline: "0.1em", // etiquetas uppercase (guía tipografía)
      },

      /* ── Line Height — cuerpo 1.5 según guía tipografía ─────────────── */
      lineHeight: {
        body: "1.5",
        display: "1.1",
      },
    },
  },
  plugins: [animate],
};
