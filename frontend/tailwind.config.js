/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-paper)",
        foreground: "var(--color-ink)",
        card: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-ink)",
        },
        popover: {
          DEFAULT: "var(--color-paper-2)",
          foreground: "var(--color-ink)",
        },
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-paper)",
        },
        secondary: {
          DEFAULT: "var(--color-paper-3)",
          foreground: "var(--color-ink)",
        },
        muted: {
          DEFAULT: "var(--color-paper-3)",
          foreground: "var(--color-ink-dim)",
        },
        accent: {
          DEFAULT: "var(--color-paper-3)",
          foreground: "var(--color-ink)",
        },
        destructive: {
          DEFAULT: "var(--color-danger)",
          foreground: "var(--color-paper)",
        },
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--color-accent)",
      },
      borderRadius: {
        "3xl": "var(--radius-2xl)",
        "2xl": "var(--radius-xl)",
        xl: "var(--radius-lg)",
        lg: "var(--radius-md)",
        md: "var(--radius-sm)",
        sm: "0.125rem",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        mono: ["'SF Mono'", "ui-monospace", "'Cascadia Code'", "'JetBrains Mono'", "monospace"],
      },
      borderWidth: {
        thick: "2px",
      },
    },
  },
  plugins: [],
}
