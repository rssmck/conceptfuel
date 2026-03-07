"use client";
import { useState, useEffect } from "react";

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("cf_access") === "true") setUnlocked(true);
  }, []);

  const VALID_CODES = ["FIRST", "LEEDS", "BFR", "LYTHAM", "BLACKPOOL", "WESHAM", "LEEDSCITY"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = code.trim().toUpperCase();
    if (VALID_CODES.includes(entered)) {
      localStorage.setItem("cf_access", "true");
      localStorage.setItem("cf_access_code", entered);
      setUnlocked(true);
    } else {
      setError(true);
      setCode("");
    }
  };

  return (
    <>
      {children}
      {mounted && !unlocked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            background: "rgba(10,10,10,0.55)",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "40px 32px",
              maxWidth: "380px",
              width: "calc(100% - 40px)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "24px",
              }}
            >
              concept<span style={{ color: "var(--text-muted)" }}>//</span>fuel · early access
            </p>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "10px",
                color: "var(--text)",
              }}
            >
              Access code
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "28px",
                lineHeight: 1.65,
              }}
            >
              concept//fuel is in early access. Enter your code to unlock the planner.
            </p>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <input
                type="text"
                placeholder="ENTER CODE"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                style={{
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontSize: "15px",
                }}
                autoFocus
              />
              {error && (
                <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "-4px" }}>
                  Invalid code. Try again.
                </p>
              )}
              <button
                type="submit"
                style={{
                  padding: "12px",
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontWeight: 600,
                  fontSize: "14px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Unlock →
              </button>
            </form>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "24px",
                lineHeight: 1.7,
              }}
            >
              No code?{" "}
              <a
                href="https://instagram.com/conceptathletic"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-dim)", textDecoration: "none" }}
              >
                @conceptathletic
              </a>
              {" "}or{" "}
              <a href="/contact" style={{ color: "var(--accent-dim)", textDecoration: "none" }}>
                get in touch
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </>
  );
}
