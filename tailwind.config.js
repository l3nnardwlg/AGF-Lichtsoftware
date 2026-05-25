/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Lightkey-inspired Mac-style dark palette
        workspace: "#121212",
        panel: "#1e1e1e",
        "panel-2": "#262626",
        "panel-3": "#2e2e2e",
        border: "rgba(255,255,255,0.08)",
        "border-strong": "rgba(255,255,255,0.14)",
        muted: "#8e8e93",
        "muted-2": "#636366",
        text: "#f2f2f2",
        "text-dim": "#c7c7cc",
        accent: {
          DEFAULT: "#007aff",
          hover: "#0a84ff",
          dim: "#0040a0",
        },
        ok: "#30d158",
        warn: "#ff9f0a",
        err: "#ff453a",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        panel:
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.45)",
        "panel-sm":
          "0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 14px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(0,122,255,0.4), 0 0 24px rgba(0,122,255,0.25)",
      },
      backdropBlur: {
        macos: "20px",
      },
    },
  },
  plugins: [],
};
