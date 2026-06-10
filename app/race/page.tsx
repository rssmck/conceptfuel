import type { Metadata } from "next";
import RaceWizard from "@/components/RaceWizard";

export const metadata: Metadata = {
  title: "concept//race — Personalised race plan",
  description:
    "Split tables for two goals, race week, a morning timeline, fuelling, and protocols for what tends to go wrong. 5K to marathon. £10.",
  alternates: { canonical: "https://conceptathletic.co.uk/race" },
  openGraph: {
    title: "concept//race — Personalised race plan",
    description:
      "Split tables for two goals, race week, a morning timeline, fuelling, and protocols for what tends to go wrong. 5K to marathon. £10.",
    url: "https://conceptathletic.co.uk/race",
  },
};

export default function RacePage() {
  return (
    <div className="cf-page">
      {/* Hero */}
      <section style={{ marginBottom: "48px" }}>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "20px" }}>
          concept//race
        </p>
        <h1 style={{ fontSize: "clamp(34px, 7vw, 64px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "20px", color: "var(--text)" }}>
          A race plan
          <br />
          <span style={{ color: "var(--text-muted)" }}>built for you.</span>
        </h1>
        <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "var(--text-muted)", maxWidth: "480px", lineHeight: 1.6, marginBottom: "20px" }}>
          Split tables for two goals. Race week, day by day. A morning timeline from wake-up to the gun. Fuelling for your distance and pace. Protocols for what tends to go wrong.
        </p>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
          5K to marathon &nbsp;·&nbsp; £10
        </p>
      </section>

      {/* Wizard */}
      <section style={{ borderTop: "1px solid var(--border)", paddingTop: "40px" }}>
        <RaceWizard />
      </section>
    </div>
  );
}
