"use client";
import { useState, useEffect } from "react";

type GateStep = "code" | "register" | "theme";

const VALID_CODES = [
  "FIRST", "LEEDS", "BFR", "LYTHAM", "BLACKPOOL", "WESHAM", "LEEDSCITY", "GRYPHONS",
];

const THEMES = [
  { key: "light", label: "Light",  bg: "#f5f2ed", surface: "#ede9e3", accent: "#1a1714", text: "#1a1714", muted: "#7a7570" },
  { key: "sage",  label: "Sage",   bg: "#edf0eb", surface: "#e3e7de", accent: "#2b4a1c", text: "#1c2418", muted: "#627060" },
  { key: "mocha", label: "Mocha",  bg: "#f2ede6", surface: "#e8e0d5", accent: "#5c3c1e", text: "#2c1f14", muted: "#7d6858" },
  { key: "dark",  label: "Dark",   bg: "#0a0a0a", surface: "#111111", accent: "#ffffff", text: "#f0f0f0", muted: "#888888" },
];

function applyTheme(theme: string) {
  if (theme === "dark") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

async function submitMemberSignup(email: string, accessCode: string) {
  try {
    await fetch("/netlify-forms.html", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "form-name": "member_signup",
        email,
        access_code: accessCode,
      }).toString(),
    });
  } catch {
    // Best-effort
  }
}

export default function SiteGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked]   = useState(false);
  const [mounted,  setMounted]    = useState(false);
  const [step,     setStep]       = useState<GateStep>("code");

  // Code step
  const [code,  setCode]  = useState("");
  const [error, setError] = useState(false);

  // Register step
  const [email,      setEmail]      = useState("");
  const [emailError, setEmailError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Theme step
  const [selectedTheme, setSelectedTheme] = useState("dark");

  useEffect(() => {
    setMounted(true);
    const hasAccess = localStorage.getItem("cf_access") === "true";
    const hasEmail  = localStorage.getItem("cf_email_done") === "true";
    const hasTheme  = localStorage.getItem("cf_theme_chosen") === "true";

    if (hasAccess && hasEmail && hasTheme) {
      setUnlocked(true);
    } else if (hasAccess && hasEmail && !hasTheme) {
      setStep("theme");
    } else if (hasAccess && !hasEmail) {
      setStep("register");
    }

    // Pre-select saved theme (or match current page theme)
    const saved = localStorage.getItem("cf_theme");
    const attr  = document.documentElement.getAttribute("data-theme");
    setSelectedTheme(saved ?? attr ?? "light");
  }, []);

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    localStorage.setItem("cf_theme", theme);
  };

  const handleThemeContinue = () => {
    localStorage.setItem("cf_theme_chosen", "true");
    setUnlocked(true);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = code.trim().toUpperCase();
    if (VALID_CODES.includes(entered)) {
      localStorage.setItem("cf_access", "true");
      localStorage.setItem("cf_access_code", entered);
      setStep("register");
    } else {
      setError(true);
      setCode("");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError(true);
      return;
    }
    setSubmitting(true);
    const accessCode = localStorage.getItem("cf_access_code") ?? "unknown";
    await submitMemberSignup(trimmed, accessCode);
    localStorage.setItem("cf_member_email", trimmed);
    localStorage.setItem("cf_email_done", "true");
    setStep("theme");
  };

  const handleSkipRegister = () => {
    localStorage.setItem("cf_email_done", "true");
    setStep("theme");
  };

  // ── Shared styles ────────────────────────────────────────────────────────────

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: "rgba(10,10,10,0.55)",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "40px 32px",
    maxWidth: "420px",
    width: "calc(100% - 40px)",
    textAlign: "center",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "24px",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    marginBottom: "10px",
    color: "var(--text)",
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text-muted)",
    marginBottom: "28px",
    lineHeight: 1.65,
  };

  const btnStyle: React.CSSProperties = {
    padding: "12px",
    background: "var(--accent)",
    color: "var(--bg)",
    fontWeight: 600,
    fontSize: "14px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
  };

  return (
    <>
      {children}
      {mounted && !unlocked && (
        <div style={overlayStyle}>
          <div style={cardStyle}>

            {/* ── Code step ─────────────────────────────────────────────── */}
            {step === "code" && (
              <>
                <p style={labelStyle}>
                  concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · early access
                </p>
                <h2 style={headingStyle}>Access code</h2>
                <p style={bodyStyle}>
                  concept//athleticclub is in early access. Enter your code to continue.
                </p>
                <form
                  onSubmit={handleCodeSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(false); }}
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
                  <button type="submit" style={btnStyle}>
                    Continue →
                  </button>
                </form>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "24px", lineHeight: 1.7 }}>
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
              </>
            )}

            {/* ── Register step ─────────────────────────────────────────── */}
            {step === "register" && (
              <>
                <p style={labelStyle}>
                  concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · membership
                </p>
                <h2 style={headingStyle}>Register your access</h2>
                <p style={bodyStyle}>
                  Complete your membership by registering your email. We&apos;ll keep
                  you updated as the platform grows.
                </p>
                <form
                  onSubmit={handleRegisterSubmit}
                  style={{ display: "flex", flexDirection: "column", gap: "12px" }}
                >
                  <input
                    type="email"
                    placeholder="email address"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                    style={{ fontSize: "14px" }}
                    autoFocus
                    required
                  />
                  {emailError && (
                    <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "-4px" }}>
                      Please enter a valid email address.
                    </p>
                  )}
                  <button type="submit" style={{ ...btnStyle, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                    {submitting ? "Registering…" : "Complete registration →"}
                  </button>
                </form>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    marginTop: "24px",
                    opacity: 0.45,
                    lineHeight: 1.6,
                  }}
                >
                  Already registered?{" "}
                  <button
                    onClick={handleSkipRegister}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "10px",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      fontFamily: "inherit",
                    }}
                  >
                    continue
                  </button>
                </p>
              </>
            )}

            {/* ── Theme step ────────────────────────────────────────────── */}
            {step === "theme" && (
              <>
                <p style={labelStyle}>
                  concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · environment
                </p>
                <h2 style={headingStyle}>Choose your palette</h2>
                <p style={bodyStyle}>
                  Select how you&apos;d like the platform to look. You can change this anytime.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "24px",
                    textAlign: "left",
                  }}
                >
                  {THEMES.map((theme) => {
                    const isSelected = selectedTheme === theme.key;
                    return (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => handleThemeSelect(theme.key)}
                        style={{
                          background: theme.bg,
                          border: `2px solid ${isSelected ? theme.accent : "transparent"}`,
                          borderRadius: "6px",
                          padding: "14px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          outline: "none",
                          transition: "border-color 0.15s",
                          fontFamily: "inherit",
                          boxShadow: isSelected ? `0 0 0 1px ${theme.accent}` : "none",
                        }}
                      >
                        {/* Colour swatches */}
                        <div style={{ display: "flex", gap: "5px" }}>
                          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme.accent }} />
                          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme.muted }} />
                          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme.surface }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: 700, color: theme.text, margin: 0, letterSpacing: "-0.01em" }}>
                            {theme.label}
                          </p>
                          {isSelected && (
                            <p style={{ fontSize: "10px", color: theme.muted, margin: "2px 0 0", letterSpacing: "0.05em" }}>
                              selected ✓
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button type="button" style={btnStyle} onClick={handleThemeContinue}>
                  Enter the club →
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
