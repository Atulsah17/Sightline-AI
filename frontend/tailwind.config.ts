import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        glow: "0 0 0 1px hsl(var(--primary) / 0.3), 0 12px 40px -8px hsl(var(--primary) / 0.35)",
        "glow-cyan": "0 0 40px -8px hsl(190 95% 55% / 0.5)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.7" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
        "gradient-move": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        float: "float 5s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "gradient-move": "gradient-move 6s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
