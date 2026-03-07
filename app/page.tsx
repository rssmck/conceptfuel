import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const SAMPLE_SCHEDULE = [
  { minute: 0,  label: "Pre-start", suggestion: "~25g (1 gel at the start line)" },
  { minute: 20, label: "20 min",    suggestion: "~30g (gel + chews or drink mix)" },
  { minute: 40, label: "40 min",    suggestion: "~30g (gel + chews or drink mix)" },
  { minute: 60, label: "60 min",    suggestion: "~30g (gel + chews or drink mix)" },
  { minute: 80, label: "80 min",    suggestion: "~30g (gel + chews or drink mix)" },
];

export default function LandingPage() {
  return (
    <div className="cf-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Concept Athletic
          </p>
          <ThemeToggle />
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 64px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            marginBottom: "20px",
            color: "var(--text)",
          }}
        >
          concept
          <span style={{ color: "var(--text-muted)" }}>//</span>
          fuel
          <span
            style={{
              marginLeft: "12px",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
              padding: "3px 9px",
              borderRadius: "20px",
              verticalAlign: "middle",
            }}
          >
            BETA
          </span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "var(--text-muted)",
            marginBottom: "12px",
            maxWidth: "480px",
            lineHeight: 1.4,
          }}
        >
          Precision race and session fuelling. No guesswork.
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "0",
            maxWidth: "540px",
            lineHeight: 1.75,
          }}
        >
          Enter your profile and event details. Get a single decisive plan: carb
          target, timed gel schedule, hydration, sodium, caffeine, bicarb and
          Nomio protocol. Evidence-informed. No guesswork. Built for
          athletes who take their performance seriously.
        </p>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          marginBottom: "56px",
          padding: "40px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "6px",
              color: "var(--text)",
            }}
          >
            Build your plan in 2 minutes.
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            No account required. Free during BETA.
          </p>
        </div>
        <Link
          href="/plan"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "4px",
            textDecoration: "none",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          Get started →
        </Link>
      </section>

      {/* ── PB protocol ──────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          The missing ingredient
        </p>
        <p
          style={{
            fontSize: "clamp(20px, 4vw, 32px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            color: "var(--text)",
            marginBottom: "24px",
            maxWidth: "640px",
          }}
        >
          Fuel intelligently.<br />
          <span style={{ color: "var(--text-muted)" }}>The rest is training.</span>
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
          {[
            {
              label: "Most athletes leave time on the course.",
              desc: "Not from lack of fitness — from running out of available energy. Underfuelling in the final third is the most common and most preventable performance limiter.",
            },
            {
              label: "Carbohydrate is the limiting fuel.",
              desc: "At race intensity, fat oxidation alone cannot meet energy demand. The body's glycogen stores are finite. Precise in-race carbohydrate intake extends how long you can hold pace.",
            },
            {
              label: "Precision beats guesswork every time.",
              desc: "A decisive plan — your weight, your event, your products — outperforms generic advice. concept//fuel gives you one number to hit, timed to the minute.",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "24px",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.3,
                }}
              >
                {item.label}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.65 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built for ────────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "56px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          Built for
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            {
              sport: "Running",
              events: "5k · 10k · Half · Marathon · Ultra",
              icon: "→",
            },
            {
              sport: "Trail Running",
              events: "Off-road · Mountain · Fell · Ultra",
              icon: "↗",
            },
            {
              sport: "Cycling",
              events: "Road · MTB · Gravel · Indoor / Zwift",
              icon: "○",
            },
            {
              sport: "Hyrox",
              events: "Standard · Doubles · Relay",
              icon: "◈",
            },
          ].map((s) => (
            <div
              key={s.sport}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "20px",
                background: "var(--surface)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "10px",
                  letterSpacing: "0.05em",
                }}
              >
                {s.icon}
              </p>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "6px",
                  letterSpacing: "-0.01em",
                }}
              >
                {s.sport}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {s.events}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "80px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          What you get
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1px",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          {[
            { label: "Carb target", desc: "Single g/hr target. No ranges to guess from." },
            { label: "Gel schedule", desc: "Timed intake with minute-by-minute offsets" },
            { label: "Fluid + sodium", desc: "Condition and effort-adjusted ml/hr and mg/hr" },
            { label: "Caffeine", desc: "Weight-based mg range and timing guidance" },
            { label: "Bicarb protocol", desc: "Maurten or Flycarb dose, timing and cautions" },
            { label: "Nomio protocol", desc: "Broccoli sprout (sulforaphane) timing guidance" },
            { label: "Elevation adjustment", desc: "Trail and cycling targets boosted by climbing rate" },
            { label: "Practice notes", desc: "Safety and training trial reminders built in" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "20px",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: "6px",
                }}
              >
                {item.label}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sample output ─────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "80px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          Example output: marathon, race effort
        </p>

        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
              Fuel Plan
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Running · Race · 3:30 hr
            </span>
          </div>

          <div style={{ padding: "20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              {[
                { label: "Carb target", value: "90 g/hr" },
                { label: "Total carbs", value: "315 g" },
                { label: "Fluid target", value: "650 ml/hr" },
                { label: "Sodium target", value: "500 mg/hr" },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    padding: "14px",
                  }}
                >
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Intake schedule
              </p>
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {SAMPLE_SCHEDULE.map((item, i) => (
                  <div
                    key={item.minute}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "10px 14px",
                      borderBottom:
                        i < SAMPLE_SCHEDULE.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      background: i % 2 === 0 ? "var(--surface)" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        minWidth: "60px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      {item.label}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text)" }}>
                      {item.suggestion}
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
                ~30g every 20 min = 90g/hr. Schedule continues to ~200 min. Adjust to your products.
              </p>
            </div>

            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "14px",
                marginBottom: "12px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Caffeine
              </p>
              <p style={{ fontSize: "13px", color: "var(--text)" }}>
                <strong>140–210 mg</strong> · 30–60 min before start
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "12px 14px",
              }}
            >
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                ⚠ Practise this strategy in training before race day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Concept Athletic ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "40px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
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
          Part of Concept Athletic
        </p>
        <p
          style={{
            fontSize: "16px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            marginBottom: "10px",
          }}
        >
          A performance-focused, data-informed resource for individual athletes.
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.75,
            marginBottom: "20px",
            maxWidth: "560px",
          }}
        >
          England Athletics licensed coaching across sprinting, endurance, Hyrox,
          trail and mountain running, and performance cycling. Beginner to elite.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
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
          <span style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.55 }}>
            concept//coaches — coming soon
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)", opacity: 0.55 }}>
            concept//nourish — coming soon
          </span>
        </div>

        {/* concept//nourish teaser */}
        <div
          style={{
            marginTop: "20px",
            padding: "20px 24px",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            background: "var(--surface-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text)", margin: 0 }}>
              concept<span style={{ color: "var(--text-muted)" }}>//</span>nourish
            </p>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                padding: "1px 6px",
                borderRadius: "20px",
              }}
            >
              COMING SOON
            </span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
            Performance nutrition and recovery for athletes who train seriously.
            Protein targets, energy availability and body composition, framed
            around how you perform and feel. Data-informed. No gym-bro culture.
            Built for everyone.
          </p>
        </div>
      </section>

    </div>
  );
}
