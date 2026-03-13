import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "concept//athleticclub — Performance tools for individual athletes",
  description:
    "Precision fuelling plans, gym session planning and performance analytics for serious athletes. Evidence-informed tools for runners, cyclists and strength athletes.",
  openGraph: {
    title: "concept//athleticclub — Performance tools for individual athletes",
    description:
      "Precision fuelling plans, gym session planning and performance analytics for serious athletes. Evidence-informed tools for runners, cyclists and strength athletes.",
    url: "https://conceptclub.co.uk",
  },
  alternates: {
    canonical: "https://conceptclub.co.uk",
  },
};

const MODULES = [
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
    slug: "method",
    href: "/method",
    status: "live",
    label: "concept//method",
    tagline: "The science behind the tools",
    desc:
      "Transparent write-ups on how concept//fuel and concept//form work, and the research they are built on. No paywall. No watered-down summaries.",
    cta: "Read the method",
  },
  {
    slug: "run",
    href: null,
    status: "soon",
    label: "concept//run",
    tagline: "Running performance",
    desc:
      "Pace strategy, effort zones, block periodisation and race-day planning. Coming to concept//athleticclub.",
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
    heading: "Calm, deliberate, intentional.",
    body: "Not reactive. Not ego-driven. Training as an informed practice. We build tools for athletes who think carefully about what they do and why.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://conceptclub.co.uk/#website",
      "url": "https://conceptclub.co.uk",
      "name": "concept//athleticclub",
      "description": "Performance tools for individual athletes",
      "publisher": {
        "@type": "Organization",
        "name": "Concept Athletic",
        "url": "https://conceptclub.co.uk",
        "sameAs": ["https://www.instagram.com/conceptathletic/"],
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://conceptclub.co.uk/plan#app",
      "name": "concept//fuel — Race & session fuel planner",
      "url": "https://conceptclub.co.uk/plan",
      "applicationCategory": "SportsApplication",
      "description": "Personalised carbohydrate, hydration and sodium plans for races and training sessions. Gel schedules and caffeine guidance for runners, cyclists and Hyrox athletes.",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://conceptclub.co.uk/form#app",
      "name": "concept//form — Gym session planner",
      "url": "https://conceptclub.co.uk/form",
      "applicationCategory": "SportsApplication",
      "description": "Personalised gym session plans including primary lifts, mobility, macros and recovery — tailored to your training goal and style.",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "GBP" },
    },
  ],
};

export default function ClubPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="cf-page">

      {/* ── Hero image ──────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(260px, 40vw, 480px)",
          borderRadius: "6px",
          overflow: "hidden",
          marginBottom: "56px",
          background: "#111",
        }}
      >
        {/* Replace /hero.jpg with your image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero.jpg"
          alt="Athletes running"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
            filter: "grayscale(30%) contrast(1.1) brightness(0.75) sepia(15%)",
            display: "block",
          }}
        />
        {/* Grain overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.18,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: "50%",
            background: "linear-gradient(to bottom, transparent, var(--bg))",
            pointerEvents: "none",
          }}
        />
        {/* Overlay text */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "32px",
            right: "32px",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            concept//athleticclub · early access
          </p>
          <p
            style={{
              fontSize: "clamp(18px, 3vw, 28px)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            Performance tools for serious athletes.
          </p>
        </div>
      </section>

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
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Whatever your pursuit.</span>
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
          Sprinting, endurance, Hyrox, trail and mountain running. Developed by coaches who compete at the level they coach. concept//athleticclub is built from the same evidence base.
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
    </>
  );
}
