"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

export default function Nav() {
  const pathname = usePathname();

  const primaryLinks = [
    { href: "/",        label: "club" },
    { href: "/plan",    label: "fuel" },
    { href: "/form",    label: "form" },
    { href: "/run",     label: "run" },
    { href: "/coach",   label: "coach" },
    { href: "/profile", label: "profile" },
  ];

  const secondaryLinks = [
    { href: "/method",  label: "method" },
    { href: "/about",   label: "about" },
    { href: "/contact", label: "contact" },
    { href: "/pricing", label: "pricing" },
  ];

  const linkStyle = (href: string): React.CSSProperties => ({
    fontSize: "13px",
    color: pathname === href ? "var(--accent)" : "var(--text-muted)",
    textDecoration: "none",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        background: "var(--nav-bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 100,
      }}
    >
      {/* Top row — logo + utilities */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          paddingTop: "calc(10px + env(safe-area-inset-top))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <ThemeToggle />
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--text)",
              textDecoration: "none",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub
          </Link>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {/* Secondary links — desktop only */}
          <div className="cf-nav-secondary">
            {secondaryLinks.map((l) => (
              <Link key={l.href} href={l.href} style={linkStyle(l.href)}>
                {l.label}
              </Link>
            ))}
          </div>
          <a
            href="https://instagram.com/conceptathletic"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            ig
          </a>
          <UserMenu />
        </div>
      </div>

      {/* Bottom row — primary tool links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0",
          borderTop: "1px solid var(--border)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          scrollbarWidth: "none" as React.CSSProperties["scrollbarWidth"],
          msOverflowStyle: "none" as React.CSSProperties["msOverflowStyle"],
        }}
      >
        {primaryLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontSize: "12px",
              letterSpacing: "0.06em",
              padding: "9px 16px",
              color: pathname === l.href ? "var(--accent)" : "var(--text-muted)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              borderBottom: pathname === l.href ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
              flexShrink: 0,
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
