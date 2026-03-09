"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthModal() {
  const { authOpen, authMode, setAuthMode, closeAuth } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  if (!authOpen) return null;

  const reset = () => { setError(null); setSuccess(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) {
        setError(error.message);
      } else {
        // Also save name to localStorage to sync with SiteGate
        if (name.trim()) localStorage.setItem("cf_name", name.trim());
        setSuccess("Account created. You are now signed in.");
        setTimeout(closeAuth, 1400);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message);
      } else {
        closeAuth();
      }
    }

    setLoading(false);
  };

  // ── Styles (CSS-variable-aware, matches site aesthetic) ──────────────────────

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 500,
    background: "rgba(10,10,10,0.6)",
    backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const card: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "40px 32px",
    maxWidth: "400px", width: "calc(100% - 40px)",
  };
  const lbl: React.CSSProperties = {
    fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase",
    color: "var(--text-muted)", display: "block", marginBottom: "6px",
  };
  const inp: React.CSSProperties = { width: "100%", fontSize: "14px", marginBottom: "14px" };
  const btn: React.CSSProperties = {
    width: "100%", padding: "12px", fontSize: "14px", fontWeight: 600,
    background: "var(--accent)", color: "var(--bg)",
    border: "none", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit",
    opacity: loading ? 0.65 : 1,
  };
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
    background: active ? "var(--accent)" : "transparent",
    color: active ? "var(--bg)" : "var(--text-muted)",
    border: `1px solid ${active ? "transparent" : "var(--border)"}`,
    borderRadius: "4px", fontFamily: "inherit",
  });

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div style={card}>
        {/* Brand */}
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "20px" }}>
          concept<span style={{ color: "var(--text-muted)" }}>//</span>athleticclub · account
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "28px" }}>
          <button style={tabBtn(authMode === "signin")} onClick={() => { setAuthMode("signin"); reset(); }}>
            Sign in
          </button>
          <button style={tabBtn(authMode === "signup")} onClick={() => { setAuthMode("signup"); reset(); }}>
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {authMode === "signup" && (
            <div>
              <label style={lbl}>Name <span style={{ opacity: 0.5 }}>optional</span></label>
              <input
                type="text" placeholder="first name" value={name}
                onChange={(e) => setName(e.target.value)}
                style={inp} autoComplete="given-name"
              />
            </div>
          )}

          <div>
            <label style={lbl}>Email</label>
            <input
              type="email" placeholder="your@email.com" value={email} required
              onChange={(e) => setEmail(e.target.value)}
              style={inp} autoComplete="email" autoFocus
            />
          </div>

          <div>
            <label style={lbl}>Password {authMode === "signup" && <span style={{ opacity: 0.5 }}>min 6 characters</span>}</label>
            <input
              type="password" placeholder="••••••••" value={password} required minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inp, marginBottom: "20px" }} autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error   && <p style={{ fontSize: "12px", color: "var(--danger)", marginBottom: "14px" }}>{error}</p>}
          {success && <p style={{ fontSize: "12px", color: "var(--success, #44cc88)", marginBottom: "14px" }}>{success}</p>}

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "…" : authMode === "signup" ? "Create account →" : "Sign in →"}
          </button>
        </form>

        <button
          onClick={closeAuth}
          style={{
            display: "block", margin: "20px auto 0", background: "none", border: "none",
            fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}
