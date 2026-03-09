"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function UserMenu() {
  const { user, loading, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) return <div style={{ width: "28px" }} />;

  if (!user) {
    return (
      <button
        onClick={() => openAuth("signin")}
        style={{
          fontSize: "13px", color: "var(--text-muted)", background: "none",
          border: "1px solid var(--border)", borderRadius: "4px",
          padding: "4px 10px", cursor: "pointer", fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        sign in
      </button>
    );
  }

  // Derive initials / display
  const displayName = (user.user_metadata?.name as string | undefined) || user.email?.split("@")[0] || "?";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        style={{
          width: "28px", height: "28px", borderRadius: "50%",
          background: "var(--accent)", color: "var(--bg)",
          border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit", flexShrink: 0,
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "6px", padding: "6px", minWidth: "160px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 200,
          }}
        >
          <p style={{ fontSize: "11px", color: "var(--text-muted)", padding: "6px 10px 8px", borderBottom: "1px solid var(--border)", marginBottom: "4px" }}>
            {user.email}
          </p>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: "block", padding: "8px 10px", fontSize: "13px",
              color: "var(--text)", textDecoration: "none", borderRadius: "4px",
            }}
          >
            Profile
          </Link>
          <button
            onClick={async () => { setOpen(false); await signOut(); }}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 10px", fontSize: "13px", color: "var(--text-muted)",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", borderRadius: "4px",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
