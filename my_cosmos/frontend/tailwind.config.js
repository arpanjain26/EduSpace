/** @type {import('tailwindcss').Config} */
export default {
  // Which files Tailwind scans for class names
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep space backgrounds
        space: { 900: "#05060F", 800: "#0B0D1A" },
        // Surface / card glass
        surface: "#12162B",
        // Primary – nebula purple
        nebula: { 400: "#8B7CF0", 500: "#6C5CE7", 600: "#5A4BD6" },
        // Secondary – cosmic cyan
        cyan: { 400: "#33E0FF", 500: "#00D4FF", 600: "#00B8DB" },
        // Accent – galaxy pink
        pink: { 400: "#FF8DD8", 500: "#FF6BCB", 600: "#E850B0" },
        // Accent – star gold
        gold: { 400: "#FFE08A", 500: "#FFD166", 600: "#F0B830" },
        // Text
        astro: { 100: "#EAEAF5", 400: "#9AA0C3" },
      },
      fontFamily: {
        sans: ['"Inter"', '"Poppins"', "system-ui", "sans-serif"],
        display: ['"Orbitron"', '"Space Grotesk"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon-purple": "0 0 20px -5px rgba(108,92,231,0.5), 0 0 40px -10px rgba(108,92,231,0.25)",
        "neon-cyan": "0 0 20px -5px rgba(0,212,255,0.5), 0 0 40px -10px rgba(0,212,255,0.25)",
        "neon-pink": "0 0 20px -5px rgba(255,107,203,0.4)",
        glass: "0 8px 32px -12px rgba(108,92,231,0.25)",
      },
      keyframes: {
        orbit: { to: { transform: "rotate(360deg)" } },
        twinkle: { "0%,100%": { opacity: "0.2" }, "50%": { opacity: "1" } },
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "shooting-star": {
          "0%": { transform: "translateX(0) translateY(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "translateX(300px) translateY(300px)", opacity: "0" },
        },
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%,100%": { boxShadow: "0 0 20px -5px rgba(108,92,231,0.4)" },
          "50%": { boxShadow: "0 0 30px -3px rgba(108,92,231,0.6)" },
        },
      },
      animation: {
        orbit: "orbit 18s linear infinite",
        "orbit-fast": "orbit 1.6s linear infinite",
        "orbit-slow": "orbit 60s linear infinite",
        "orbit-medium": "orbit 30s linear infinite",
        twinkle: "twinkle 4s ease-in-out infinite",
        rise: "rise .5s ease-out both",
        "shooting-star": "shooting-star 2s linear forwards",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-heading": "linear-gradient(135deg, #6C5CE7, #00D4FF)",
        "gradient-nebula": "radial-gradient(ellipse at 20% 50%, rgba(108,92,231,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,212,255,0.1) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(255,107,203,0.08) 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};
