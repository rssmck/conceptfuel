import Link from "next/link";

const SAMPLE_SCHEDULE = [
  { minute: 20, label: "20 min", suggestion: "1 gel (~25g carbs)" },
  { minute: 40, label: "40 min", suggestion: "1 gel (~25g carbs)" },
  { minute: 60, label: "60 min", suggestion: "1 gel (~25g carbs)" },
  { minute: 80, label: "80 min", suggestion: "1 gel (~25g carbs)" },
  { minute: 100, label: "100 min", suggestion: "1 gel (~25g carbs)" },
];

export default function LandingPage() {
  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "60px 20px",
      }}
    >
      {/* Hero */}
      <section style={{ marginBottom: "80px" }}>
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
            maxWidth: "460px",
          }}
        >
          Precision race + session fuelling.
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "36px",
            maxWidth: "520px",
            lineHeight: 1.7,
          }}
        >
          Enter your profile and event details. Get a single decisive plan: carb
          target, gel schedule, hydration, sodium, caffeine, bicarb and Nomio protocol.
          No guesswork.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
            }}
          >
            Build your plan →
          </Link>
          <Link
            href="/pricing"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "transparent",
              color: "var(--text-muted)",
              fontWeight: 500,
              fontSize: "14px",
              borderRadius: "4px",
              textDecoration: "none",
              border: "1px solid var(--border)",
            }}
          >
            Pricing
          </Link>
        </div>
      </section>

      {/* What it covers */}
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
            { label: "Practice notes", desc: "Safety and training trial reminders" },
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

      {/* Sample output */}
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
          {/* Header */}
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
            {/* Key metrics */}
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

            {/* Schedule */}
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
                Assumes ~25g carbs per gel; adjust to your products.
              </p>
            </div>

            {/* Caffeine card */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "14px",
                marginBottom: "12px",
              }}
            >
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Caffeine
              </p>
              <p style={{ fontSize: "13px", color: "var(--text)" }}>
                <strong>140–210 mg</strong> · 30–60 min before start
              </p>
            </div>

            {/* Caveat */}
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

      {/* Sports covered */}
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
          Built for
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { sport: "Running", events: "5k · 10k · Half · Marathon" },
            { sport: "Hyrox", events: "Standard · Doubles · Relay" },
          ].map((s) => (
            <div
              key={s.sport}
              style={{
                flex: "1 1 200px",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "20px",
                background: "var(--surface)",
              }}
            >
              <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>
                {s.sport}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.events}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "60px 20px",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          background: "var(--surface)",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          Ready to fuel precisely?
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "28px", fontSize: "14px" }}>
          Takes 2 minutes. No account required.
        </p>
        <Link
          href="/plan"
          style={{
            display: "inline-block",
            padding: "14px 36px",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            fontSize: "15px",
            borderRadius: "4px",
            textDecoration: "none",
          }}
        >
          Build your plan →
        </Link>
      </section>
    </div>
  );
}
