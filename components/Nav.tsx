"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("cf_theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved === "light" ? "light" : "");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("cf_theme", next);
    document.documentElement.setAttribute("data-theme", next === "light" ? "light" : "");
  };

  const links = [
    { href: "/", label: "home" },
    { href: "/plan", label: "plan" },
    { href: "/about", label: "about" },
    { href: "/pricing", label: "pricing" },
  ];

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "var(--nav-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
      }}
    >
      {/* Left: toggle + logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            borderRadius: "4px",
            padding: "4px 10px",
            fontSize: "11px",
            cursor: "pointer",
            lineHeight: 1.5,
            letterSpacing: "0.04em",
          }}
        >
          {theme === "dark" ? "◑ light" : "◐ dark"}
        </button>
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          concept<span style={{ color: "var(--text-muted)" }}>//</span>fuel
        </Link>
      </div>

      {/* Right: nav links */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontSize: "13px",
              color: pathname === l.href ? "var(--accent)" : "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
