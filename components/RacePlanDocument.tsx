"use client";

import Link from "next/link";
import { type RacePlan } from "@/lib/raceEngine";

// ─── PACING CURVE (SVG, generated from the splits) ────────────────────────────
// A real visualisation of the plan's pacing shape. Faster = higher on the curve.

function PacingCurve({ plan }: { plan: RacePlan }) {
  const rows = plan.splits.filter((r) => r.marker !== "Finish");
  if (rows.length < 3) return null;

  // Parse MM:SS splits back to seconds for the full-unit rows only.
  const toSec = (s: string) => {
    const p = s.split(":").map(Number);
    return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
  };
  const aSecs = rows.map((r) => toSec(r.a_split));
  const bSecs = rows.map((r) => toSec(r.b_split));
  const all = [...aSecs, ...bSecs];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.25 || 4;
  const lo = min - pad;
  const hi = max + pad;

  const W = 700;
  const H = 220;
  const ML = 16;
  const MR = 16;
  const MT = 20;
  const MB = 28;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  // Faster splits sit higher, so invert.
  const x = (i: number) => ML + (i / (rows.length - 1)) * plotW;
  const y = (sec: number) => MT + ((sec - lo) / (hi - lo)) * plotH;

  const path = (secs: number[]) =>
    secs.map((s, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(" ");

  // Decision point index
  const decisionIdx = plan.splits.findIndex((r) => r.note?.startsWith("Decision"));

  return (
    <div style={{ overflowX: "auto", margin: "0 -4px" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", minWidth: "480px" }} role="img" aria-label="Pacing shape across the race">
        {/* baseline grid */}
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1={ML} x2={W - MR} y1={MT + t * plotH} y2={MT + t * plotH} stroke="var(--border)" strokeWidth="1" strokeDasharray={t === 0 || t === 1 ? "0" : "3 4"} />
        ))}
        {/* decision point marker */}
        {decisionIdx > 0 && decisionIdx < rows.length && (
          <g>
            <line x1={x(decisionIdx)} x2={x(decisionIdx)} y1={MT} y2={MT + plotH} stroke="var(--accent-dim)" strokeWidth="1" strokeDasharray="2 3" />
            <text x={x(decisionIdx)} y={MT - 6} fill="var(--text-muted)" fontSize="10" textAnchor="middle" fontFamily="inherit">decision</text>
          </g>
        )}
        {/* B goal line */}
        <path d={path(bSecs)} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
        {/* A goal line */}
        <path d={path(aSecs)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* A goal dots */}
        {aSecs.map((s, i) => (
          <circle key={i} cx={x(i)} cy={y(s)} r="2.5" fill="var(--accent)" />
        ))}
        {/* labels */}
        <text x={ML} y={H - 8} fill="var(--text-muted)" fontSize="10" fontFamily="inherit">start</text>
        <text x={W - MR} y={H - 8} fill="var(--text-muted)" fontSize="10" textAnchor="end" fontFamily="inherit">finish</text>
        <text x={ML} y={MT - 6} fill="var(--text-muted)" fontSize="10" fontFamily="inherit">faster</text>
      </svg>
      <div style={{ display: "flex", gap: "20px", marginTop: "4px", paddingLeft: "16px" }}>
        <span style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "16px", height: "2.5px", background: "var(--accent)", display: "inline-block" }} /> A goal
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "16px", height: "0", borderTop: "1.5px dashed var(--text-muted)", display: "inline-block" }} /> B goal
        </span>
      </div>
    </div>
  );
}

// ─── SECTION SHELL ────────────────────────────────────────────────────────────

function Section({
  index, kicker, title, children,
}: {
  index: string; kicker: string; title: string; children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "56px" }} className="cr-section">
      <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "18px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{index}</span>
        <div>
          <p style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 4px 0" }}>{kicker}</p>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0, color: "var(--text)" }}>{title}</h2>
        </div>
      </div>
      <div style={{ paddingLeft: "0" }}>{children}</div>
    </section>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "14px", lineHeight: 1.75, color: "var(--text)", marginBottom: "14px", maxWidth: "62ch" }}>{children}</p>;
}

const VERDICT_LABEL: Record<RacePlan["feasibility"]["verdict"], string> = {
  on_target: "On target",
  stretch: "A genuine stretch",
  ambitious: "Ambitious",
  conservative: "Inside your range",
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function RacePlanDocument({ plan }: { plan: RacePlan }) {
  const { meta } = plan;
  const raceDate = new Date(meta.race_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="cr-doc" style={{ maxWidth: "760px", margin: "0 auto" }}>
      {/* ── COVER ── */}
      <header style={{ borderBottom: "1px solid var(--border)", paddingBottom: "32px", marginBottom: "48px" }}>
        <p style={{ fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "24px" }}>
          concept<span style={{ opacity: 0.5 }}>//</span>race · race plan
        </p>
        <h1 style={{ fontSize: "clamp(30px, 7vw, 52px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.02, margin: "0 0 20px 0", color: "var(--text)" }}>
          {meta.first_name}
          <br />
          <span style={{ color: "var(--text-muted)" }}>{meta.race_name}</span>
        </h1>
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
          <span>{raceDate}</span>
          <span>A goal <strong style={{ color: "var(--text)" }}>{meta.goal_a}</strong></span>
          <span>B goal <strong style={{ color: "var(--text)" }}>{meta.goal_b}</strong></span>
          <span>{meta.distance_label}</span>
        </div>
      </header>

      {/* ── OVERVIEW ── */}
      <Section index="01" kicker="Where you stand" title={VERDICT_LABEL[plan.feasibility.verdict]}>
        {plan.overview.map((p, i) => <Para key={i}>{p}</Para>)}
      </Section>

      {/* ── PACING SHAPE ── */}
      <Section index="02" kicker="The shape of the race" title="How this plan is paced">
        <Para>
          This is the pacing shape your splits follow. Conservative early, controlled through the middle, and a press only where you have earned it. The job in the first stretch is restraint. The reward comes later.
        </Para>
        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "18px 16px 12px", background: "var(--surface)", marginTop: "8px" }}>
          <PacingCurve plan={plan} />
        </div>
      </Section>

      {/* ── SPLITS ── */}
      <Section index="03" kicker="Your numbers" title={`Split table · per ${plan.split_unit === "mi" ? "mile" : "kilometre"}`}>
        <Para>
          Two columns, two goals. Race the B splits from the gun. At the decision point, if you are on those splits and feeling strong, move across to A. Not before.
        </Para>
        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "440px" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                <th style={thStyle}>{plan.split_unit === "mi" ? "Mile" : "Km"}</th>
                <th style={thStyle}>A split</th>
                <th style={thStyle}>A elapsed</th>
                <th style={thStyle}>B split</th>
                <th style={thStyle}>B elapsed</th>
              </tr>
            </thead>
            <tbody>
              {plan.splits.map((r, i) => {
                const isDecision = r.note?.startsWith("Decision");
                const isFinish = r.marker === "Finish";
                return (
                  <tr key={i} style={{
                    borderTop: "1px solid var(--border)",
                    background: isFinish ? "var(--surface-2)" : isDecision ? "color-mix(in srgb, var(--accent) 7%, transparent)" : "transparent",
                  }}>
                    <td style={{ ...tdStyle, fontWeight: isFinish ? 700 : 400 }}>{r.marker}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{r.a_split}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{r.a_cumulative}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums" }}>{r.b_split}</td>
                    <td style={{ ...tdStyle, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>{r.b_cumulative}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Notes under the table */}
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {plan.splits.filter((r) => r.note).map((r, i) => (
            <p key={i} style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text)" }}>{r.marker === "Finish" ? "Finish" : `${plan.split_unit === "mi" ? "Mile" : "Km"} ${r.marker}`}:</strong> {r.note}
            </p>
          ))}
        </div>
      </Section>

      {/* ── RACE WEEK ── */}
      <Section index="04" kicker="The final seven days" title="Race week">
        <Para>The work is done. This week is about arriving fresh and removing every decision from race morning.</Para>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
          {plan.race_week.map((d, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "16px", padding: "16px 18px", background: d.days_to_race === 0 ? "var(--surface-2)" : "var(--surface)" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>{d.day_label}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{d.days_to_race === 0 ? "race day" : `${d.days_to_race} to go`}</p>
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px 0", lineHeight: 1.5 }}>{d.run}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px 0", lineHeight: 1.6 }}>{d.detail}</p>
                <p style={{ fontSize: "12px", color: "var(--accent-dim)", margin: 0, lineHeight: 1.6 }}>{d.life}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── RACE DAY ── */}
      <Section index="05" kicker="From wake-up to the gun" title="Race morning">
        <Para>Follow this in order and the morning runs itself. No improvising on the day that matters most.</Para>
        <div style={{ position: "relative", paddingLeft: "20px" }}>
          <div style={{ position: "absolute", left: "4px", top: "8px", bottom: "8px", width: "1px", background: "var(--border)" }} />
          {plan.race_day.map((t, i) => (
            <div key={i} style={{ position: "relative", marginBottom: "20px" }}>
              <div style={{ position: "absolute", left: "-20px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", background: i === plan.race_day.length - 1 ? "var(--accent)" : "var(--surface)", border: "1px solid var(--accent)" }} />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 2px 0", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{t.clock}</p>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 3px 0" }}>{t.action}</p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, lineHeight: 1.65, maxWidth: "58ch" }}>{t.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FUELLING ── */}
      <Section index="06" kicker="What to take and when" title={`Fuelling · ${plan.fuelling.headline}`}>
        {plan.fuelling.points.map((p, i) => <Para key={i}>{p}</Para>)}
        {plan.fuelling.fuel_tool_cta && (
          <div style={{ marginTop: "16px", padding: "18px 20px", border: "1px solid var(--accent)", borderRadius: "8px", background: "color-mix(in srgb, var(--accent) 5%, transparent)" }}>
            <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 10px 0", lineHeight: 1.65 }}>
              Want this to the gram, timed to your exact gels and goal time? The fuel planner builds your precise schedule in three minutes. It is free.
            </p>
            <Link href="/plan" style={ctaLinkStyle}>Open the fuel planner →</Link>
          </div>
        )}
      </Section>

      {/* ── PROTOCOLS ── */}
      {plan.protocols.length > 0 && (
        <Section index="07" kicker="What will go wrong, and what to do" title="Your protocols">
          <Para>You told us what tends to come undone. Here is each one, why it happens, and the decisions to make now so it does not happen on the day.</Para>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {plan.protocols.map((pr, i) => (
              <div key={i} style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "20px", background: "var(--surface)" }}>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0", letterSpacing: "-0.01em" }}>{pr.title}</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 14px 0", lineHeight: 1.65, fontStyle: "italic" }}>{pr.read}</p>
                <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pr.protocol.map((step, j) => (
                    <li key={j} style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.65 }}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── COACH NOTE ── */}
      <Section index={plan.protocols.length > 0 ? "08" : "07"} kicker="One last thing" title="From the coach">
        <div style={{ borderLeft: "2px solid var(--accent)", paddingLeft: "20px" }}>
          {plan.coach_note.map((line, i) => {
            const isSignoff = i === plan.coach_note.length - 1;
            return (
              <p key={i} style={{
                fontSize: isSignoff ? "13px" : "14px",
                lineHeight: 1.75,
                color: isSignoff ? "var(--text-muted)" : "var(--text)",
                marginBottom: "14px",
                fontWeight: isSignoff ? 700 : 400,
                letterSpacing: isSignoff ? "0.04em" : "normal",
                maxWidth: "62ch",
              }}>
                {line}
              </p>
            );
          })}
        </div>
      </Section>

      {/* ── FOOTER ACTIONS (screen only) ── */}
      <div className="cr-actions" style={{ borderTop: "1px solid var(--border)", paddingTop: "28px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => window.print()} style={{ ...ctaLinkStyle, cursor: "pointer", border: "1px solid var(--accent)", background: "var(--accent)", color: "var(--bg)", padding: "12px 22px", borderRadius: "6px", fontFamily: "inherit", fontSize: "13px", fontWeight: 700 }}>
          Save as PDF
        </button>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, maxWidth: "40ch", lineHeight: 1.6 }}>
          This plan stays at this link. Bookmark it, or save a PDF to keep on your phone for race morning.
        </p>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "12px 14px", fontSize: "11px",
  textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: "11px 14px", color: "var(--text)" };
const ctaLinkStyle: React.CSSProperties = {
  display: "inline-block", fontSize: "13px", color: "var(--accent-dim)",
  textDecoration: "none", fontWeight: 600,
};
