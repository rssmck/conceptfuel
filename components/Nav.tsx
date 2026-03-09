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
    { href: "/profile", label: "profile" },
  ];

  const secondaryLinks = [
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

      {/* Right: nav links */}
      <div style={{ display: "flex", gap: "20px", alignItems: "center", marginLeft: "16px" }}>
        {/* Primary links — always visible */}
        {primaryLinks.map((l) => (
          <Link key={l.href} href={l.href} style={linkStyle(l.href)}>
            {l.label}
          </Link>
        ))}

        {/* Secondary links — hidden on mobile */}
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
            borderLeft: "1px solid var(--border)",
            paddingLeft: "16px",
            whiteSpace: "nowrap",
          }}
        >
          ig
        </a>
        <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "16px" }}>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
