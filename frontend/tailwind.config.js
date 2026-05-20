/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#0f1117",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#0f1117",
          foreground: "#ffffff",
        },
        primary: {
          DEFAULT: "#10b981", // Vibrant Emerald Green
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#161923",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#161923",
          foreground: "#71717a",
        },
        accent: {
          DEFAULT: "#1e1e2e",
          foreground: "#ffffff",
        },
        border: "rgba(255, 255, 255, 0.05)",
        input: "rgba(255, 255, 255, 0.05)",
        ring: "#10b981",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1.25rem",
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
