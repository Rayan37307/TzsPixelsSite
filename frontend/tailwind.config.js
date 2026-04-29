/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        foreground: "#ffffff",
        card: {
          DEFAULT: "#141414",
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "#141414",
          foreground: "#ffffff",
        },
        primary: {
          DEFAULT: "#99f6e4", // Teal/Cyan highlight from screenshot
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#262626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#262626",
          foreground: "#a3a3a3",
        },
        accent: {
          DEFAULT: "#262626",
          foreground: "#ffffff",
        },
        border: "#262626",
        input: "#262626",
        ring: "#99f6e4",
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
