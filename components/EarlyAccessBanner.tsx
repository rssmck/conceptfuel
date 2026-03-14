"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function EarlyAccessBanner() {
  const { user, openAuth } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem("cf_banner_dismissed") === "true";
    if (!wasDismissed && !user) setDismissed(false);
  }, [user]);

  if (dismissed) return null;

  return (
    <div className="cf-early-banner">
      <span style={{ fontWeight: 400, opacity: 0.9 }}>
        <strong>Early access</strong> · Performance tools built for you ·{" "}
        <span style={{ opacity: 0.7 }}>free to join</span>
      </span>
      <div className="cf-early-banner-actions">
        <button
          onClick={() => openAuth("signup")}
          style={{
            background: "var(--bg)",
            color: "var(--accent)",
            border: "none",
            borderRadius: "3px",
            padding: "5px 16px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
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
            opacity: 0.55,
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
            padding: "2px 4px",
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
