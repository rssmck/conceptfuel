"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("cf_theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("cf_theme", next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "");
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
      {theme === "dark" ? "◑ light" : "◐ dark"}
    </button>
  );
}
