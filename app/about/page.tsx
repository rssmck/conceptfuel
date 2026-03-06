export const metadata = {
  title: "About — Concept Athletic",
};

function Divider() {
  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        margin: "48px 0",
      }}
    />
  );
}

export default function AboutPage() {
  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "60px 20px" }}>

      {/* Header */}
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Who we are
      </p>
      <h1
        style={{
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: "20px",
          color: "var(--text)",
        }}
      >
        concept
        <span style={{ color: "var(--text-muted)" }}>//</span>
        athletic
      </h1>
      <p
        style={{
          fontSize: "16px",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          marginBottom: "8px",
          maxWidth: "520px",
        }}
      >
        A performance-focused, data-informed resource for individual athletes.
        From first race to elite competition.
      </p>

      <Divider />

      {/* What we do */}
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          What we do
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}
        >
          Concept Athletic builds tools and coaching frameworks that help
          athletes train and compete with intention. We believe precision matters
          — in training load, in race execution, and in the detail of how you
          fuel. concept//fuel is the first public product from this platform: a
          deterministic, evidence-informed fuelling planner that gives you a
          single decisive plan rather than a list of things to consider.
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
          }}
        >
          Everything we build is grounded in data, informed by current sports
          science, and tested by real athletes across multiple disciplines and
          levels.
        </p>
      </div>

      {/* Sports */}
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Disciplines
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
            { name: "Sprinting", detail: "Speed, power and track performance" },
            { name: "Endurance running", detail: "5k through marathon and beyond" },
            { name: "Hyrox", detail: "Racing and simulation-based preparation" },
            { name: "Trail, mountain and fell running", detail: "Off-road, elevation, technical terrain" },
            { name: "Performance cycling", detail: "Road, gravel, MTB and indoor training" },
            { name: "Endurance cycling", detail: "Long distance, sportive and ultra cycling" },
          ].map((d) => (
            <div
              key={d.name}
              style={{
                padding: "18px 20px",
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
                  marginBottom: "4px",
                }}
              >
                {d.name}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {d.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Credentials
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            "England Athletics licensed coach",
            "Working with athletes from beginner to elite level",
            "Evidence-informed methodology across training and nutrition",
            "Active in competition — not just theory",
          ].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: "var(--accent-dim)", flexShrink: 0 }}>·</span>
              {c}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Platform vision */}
      <div style={{ marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          The platform
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginBottom: "16px",
          }}
        >
          concept//fuel is the first release of a wider, holistic and data-informed
          platform for individual athletes. The goal is a single place that
          integrates fuelling, training structure, performance analytics and
          coaching — all built around you as an individual.
        </p>

        {/* Coach teaser */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "24px",
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              concept
              <span style={{ color: "var(--text-muted)" }}>//</span>
              coach
            </p>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                padding: "2px 7px",
                borderRadius: "20px",
              }}
            >
              COMING SOON
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            Structured training plans, load management and performance tracking.
            Built on the same data-informed principles as concept//fuel, and
            integrated with it. For athletes who want more than a plan — they
            want a system.
          </p>
        </div>
      </div>

      <Divider />

      {/* Footer nudge */}
      <div>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
          Ready to try concept//fuel?
        </p>
        <a
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
          }}
        >
          Build your fuel plan →
        </a>
      </div>

    </div>
  );
}
