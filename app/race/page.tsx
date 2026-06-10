import type { Metadata } from "next";
import RaceWizard from "@/components/RaceWizard";

export const metadata: Metadata = {
  title: "concept//race — Your personalised race plan",
  description:
    "A race plan built from your numbers, not a template. Split tables for two goals, race week, race morning timeline, fuelling and tactical protocols. From 5K to marathon. Not written by AI.",
  alternates: { canonical: "https://conceptathletic.co.uk/race" },
  openGraph: {
    title: "concept//race — Your personalised race plan",
    description:
      "A race plan built from your numbers, not a template. From 5K to marathon. Instant. Not written by AI.",
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
        <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", color: "var(--text-muted)", maxWidth: "540px", lineHeight: 1.6, marginBottom: "20px" }}>
          Not a template with your name swapped in. Answer a few honest questions and get split tables for two goals, your race week, a race morning timeline, fuelling, and protocols for whatever tends to go wrong. From 5K to marathon.
        </p>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>Instant download</span>
          <span>·</span>
          <span>Built on a coach&apos;s methodology</span>
          <span>·</span>
          <span>Not written by AI</span>
        </div>
      </section>

      {/* Wizard */}
      <section style={{ borderTop: "1px solid var(--border)", paddingTop: "40px" }}>
        <RaceWizard />
      </section>
    </div>
  );
}
