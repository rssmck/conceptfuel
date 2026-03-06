"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "home" },
    { href: "/plan", label: "plan" },
    { href: "/pricing", label: "pricing" },
  ];

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 100,
      }}
    >
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
