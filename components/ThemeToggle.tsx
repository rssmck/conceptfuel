"use client";
import { useEffect, useState } from "react";

type Theme = "light" | "sage" | "mocha" | "dark";

const THEMES: Theme[] = ["light", "sage", "mocha", "dark"];

const LABELS: Record<Theme, string> = {
  light: "◑ light",
  sage:  "◈ sage",
  mocha: "◍ mocha",
  dark:  "◐ dark",
};

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cf_theme") as Theme | null;
    const initial = saved && THEMES.includes(saved) ? saved : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    localStorage.setItem("cf_theme", next);
    applyTheme(next);
  };

  if (!mounted) return null;

  const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];

  return (
    <button
      onClick={cycle}
      title={`Switch to ${nextTheme} theme`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--text-muted)",
        borderRadius: "4px",
        padding: "3px 9px",
        fontSize: "11px",
        cursor: "pointer",
        lineHeight: 1.5,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {LABELS[theme]}
    </button>
  );
}
