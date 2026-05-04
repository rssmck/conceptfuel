"use client";
import Link from "next/link";

export default function CoachPage() {
  return (
    <div className="cf-page-narrow">
      <div style={{ marginBottom: "40px" }}>
        <p style={{
          fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: "6px",
        }}>
          concept//coach
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Coach
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          Athlete management, competition calendar, session planning and performance tracking. Coming soon.
        </p>
      </div>

      {/* Available now */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{
          fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: "12px",
        }}>
          Available now
        </p>
        <Link
          href="/coach/session"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 18px", border: "1px solid var(--border)", borderRadius: "8px",
            background: "var(--surface)", textDecoration: "none", transition: "border-color 0.15s",
          }}
        >
          <div>
            <p style={{ margin: "0 0 3px", fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
              Session planner
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
              Generate a full athletics session with warm-up, drills, cues and footwear guidance
            </p>
          </div>
          <span style={{ color: "var(--text-muted)", fontSize: "16px", marginLeft: "12px" }}>→</span>
        </Link>
      </div>

      {/* Coming soon */}
      <div>
        <p style={{
          fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: "12px",
        }}>
          Coming soon
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { label: "Athlete profiles", desc: "Performance history, PBs, season phases and competition calendar" },
            { label: "Competition management", desc: "Plan and track races by priority across your full cohort" },
            { label: "Session logging", desc: "Save sessions with highlighted cues and athlete feedback" },
            { label: "Mood and readiness", desc: "Daily athlete check-in with readiness score and mood log" },
            { label: "Psychological prep", desc: "Visualisation scripts and pre-competition routines" },
            { label: "Results and PBs", desc: "Manual entry and Power of 10 CSV import" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "8px",
                background: "var(--surface)", opacity: 0.6,
              }}
            >
              <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
