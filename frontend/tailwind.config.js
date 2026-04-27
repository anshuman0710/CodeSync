/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Space Mono'", "monospace"],
      },
      colors: {
        surface: { DEFAULT: "#030712", secondary: "#070b14", tertiary: "#0d1221", border: "rgba(255,255,255,0.07)" },
        accent: { blue: "#22d3ee", purple: "#c084fc", green: "#34d399", yellow: "#facc15", red: "#f87171", orange: "#fb923c" },
      },
      animation: {
        "border-pulse": "borderPulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
