"use client";
import { useState } from "react";
import FormWizard from "./FormWizard";

export default function FormEntry() {
  const [mode, setMode] = useState<"choose" | "session">("choose");

  if (mode === "session") return <FormWizard />;

  return (
    <div className="cf-page">
      <div style={{ marginBottom: "48px", maxWidth: "560px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          concept<span style={{ color: "var(--text-muted)" }}>//</span>form
        </p>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "14px",
          }}
        >
          Gym session planner.
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
          Build a single session or start a structured training block. You can always use the session planner standalone on any day.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Build a session */}
        <button
          type="button"
          onClick={() => setMode("session")}
          style={{
            padding: "32px 28px",
            background: "var(--surface)",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover, var(--bg))")}
          onMouseLeave={e => (e.currentTarget.style.background = "var(--surface)")}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--accent-dim)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
              fontWeight: 600,
            }}
          >
            Ad hoc
          </p>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Build a session
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.65 }}>
            Generate a single gym session now. Choose your goal, training style, muscle focus and duration. Use this any time for a standalone session.
          </p>
          <span
            style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "var(--accent)",
              fontWeight: 600,
            }}
          >
            Start planning →
          </span>
        </button>

        {/* Build a plan — coming soon */}
        <div
          style={{
            padding: "32px 28px",
            background: "var(--surface)",
            borderLeft: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            opacity: 0.55,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: 0,
                fontWeight: 600,
              }}
            >
              Structured block
            </p>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                padding: "1px 6px",
                borderRadius: "20px",
              }}
            >
              COMING SOON
            </span>
          </div>
          <p
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Build a plan
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.65 }}>
            Set your goal, days per week, and block length. Get a full 4, 6 or 8 week programme with progressive weekly sessions saved to your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
