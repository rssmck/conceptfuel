"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function EarlyAccessBanner() {
  const { user, openAuth } = useAuth();
  const [dismissed, setDismissed] = useState(true); // start hidden, check localStorage

  useEffect(() => {
    const wasDismissed = localStorage.getItem("cf_banner_dismissed") === "true";
    if (!wasDismissed && !user) {
      setDismissed(false);
    }
  }, [user]);

  if (dismissed) return null;

  return (
    <div
      style={{
        background: "var(--accent)",
        color: "var(--bg)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        flexWrap: "wrap",
      }}
    >
      <span>
        Early access · Performance tools for serious athletes ·{" "}
        <span style={{ opacity: 0.7, fontWeight: 400 }}>Free to join</span>
      </span>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={() => openAuth("signup")}
          style={{
            background: "var(--bg)",
            color: "var(--accent)",
            border: "none",
            borderRadius: "3px",
            padding: "5px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Join free →
        </button>
        <button
          onClick={() => {
            localStorage.setItem("cf_banner_dismissed", "true");
            setDismissed(true);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--bg)",
            opacity: 0.6,
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
            fontFamily: "inherit",
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
