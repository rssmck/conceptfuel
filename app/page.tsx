import Link from "next/link";

const MODULES = [
  {
    slug: "fuel",
    href: "/plan",
    status: "live",
    label: "concept//fuel",
    tagline: "Race & session fuelling",
    desc:
      "Precision carbohydrate targets, timed gel schedules, hydration and sodium — calibrated to your sport, event and effort level. Evidence-informed. One decisive plan.",
    badge: "BETA",
    cta: "Open fuel planner",
  },
  {
    slug: "form",
    href: "/form",
    status: "live",
    label: "concept//form",
    tagline: "Gym session planner",
    desc:
      "Session structure, exercise selection, rep schemes, macros, mobility and recovery — matched to your training goal and style. Built for athletes who train intentionally.",
    badge: "BETA",
    cta: "Open form planner",
  },
  {
    slug: "run",
    href: null,
    status: "soon",
    label: "concept//run",
    tagline: "Running performance",
    desc:
      "Pace strategy, effort zones, block periodisation and race-day planning for runners from 5k to ultra. Coming to concept//athleticclub.",
  },
  {
    slug: "recover",
    href: null,
    status: "soon",
    label: "concept//recover",
    tagline: "Recovery protocols",
    desc:
      "Sleep, HRV, soreness management and deload planning. Know when to push and when to pull back. Evidence-based recovery for serious athletes.",
  },
  {
    slug: "lab",
    href: null,
    status: "soon",
    label: "concept//lab",
    tagline: "Performance analytics",
    desc:
      "Training load tracking, fatigue modelling and performance readiness. Data infrastructure for athletes who want to understand their adaptation.",
  },
];

const PHILOSOPHY = [
  {
    heading: "Evidence over culture.",
    body: "The fitness industry runs on aesthetics and authority. We run on research. Every output from concept//athleticclub is traceable to a mechanism.",
  },
  {
    heading: "Decisive, not generic.",
    body: "Ranges and maybes are useless in the moment. We give you a number to hit, a time to hit it, and the reason why. One plan. Commit to it.",
  },
  {
    heading: "Built for individual athletes.",
    body: "Not teams. Not beginners chasing weight loss. Athletes who train seriously, race seriously, and want tools that match that seriousness.",
  },
];

export default function ClubPage() {
  return (
    <div className="cf-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "64px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Concept Athletic
        </p>
        <h1
          style={{
            fontSize: "clamp(36px, 7vw, 72px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            marginBottom: "24px",
            color: "var(--text)",
          }}
        >
          concept
          <span style={{ color: "var(--text-muted)" }}>//</span>
          <br />
          club
        </h1>
        <p
          style={{
            fontSize: "clamp(15px, 2.5vw, 19px)",
            color: "var(--text-muted)",
            maxWidth: "520px",
            lineHeight: 1.55,
            marginBottom: "0",
          }}
        >
          Performance tools for individual athletes. Precision fuelling, training
          structure, recovery and analytics — built on evidence, not culture.
        </p>
      </section>

      {/* ── Modules ──────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "72px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          The platform
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden" }}>
          {MODULES.map((mod) => (
            <div
              key={mod.slug}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "24px",
                alignItems: "center",
                padding: "28px",
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                opacity: mod.status === "soon" ? 0.65 : 1,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <p style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                    {mod.label}
                  </p>
                  {mod.badge && (
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        color: "var(--accent)",
                        border: "1px solid var(--accent)",
                        padding: "1px 6px",
                        borderRadius: "20px",
                      }}
                    >
                      {mod.badge}
                    </span>
                  )}
                  {mod.status === "soon" && (
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
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  {mod.tagline}
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7, margin: 0, maxWidth: "560px" }}>
                  {mod.desc}
                </p>
              </div>
              {mod.href && mod.cta && (
                <Link
                  href={mod.href}
                  style={{
                    display: "inline-block",
                    padding: "10px 20px",
                    background: "var(--accent)",
                    color: "var(--bg)",
                    fontWeight: 600,
                    fontSize: "12px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.01em",
                  }}
                >
                  {mod.cta} →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "72px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Philosophy
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1px",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {PHILOSOPHY.map((p) => (
            <div
              key={p.heading}
              style={{
                padding: "28px 24px",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  marginBottom: "10px",
                  lineHeight: 1.3,
                }}
              >
                {p.heading}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── About Concept Athletic ───────────────────────────────────────── */}
      <section
        style={{
          padding: "40px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
          marginBottom: "0",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Concept Athletic
        </p>
        <p
          style={{
            fontSize: "clamp(16px, 3vw, 22px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            marginBottom: "12px",
            lineHeight: 1.2,
            maxWidth: "520px",
          }}
        >
          England Athletics licensed coaching.<br />
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>From first 5k to elite racing.</span>
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.75,
            marginBottom: "24px",
            maxWidth: "560px",
          }}
        >
          Sprinting, endurance, Hyrox, trail and mountain running, performance
          cycling. Coaches who compete at the level they coach. concept//athleticclub
          is the digital arm — tools built from the same evidence base.
        </p>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href="/about"
            style={{
              fontSize: "13px",
              color: "var(--accent-dim)",
              textDecoration: "none",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "2px",
            }}
          >
            Who we are →
          </Link>
          <a
            href="https://instagram.com/conceptathletic"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              textDecoration: "none",
            }}
          >
            @conceptathletic
          </a>
        </div>
      </section>

    </div>
  );
}
