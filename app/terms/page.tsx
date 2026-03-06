export const metadata = {
  title: "Terms of Use — concept//fuel",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: "10px",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "60px 20px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Legal
      </p>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: "8px",
        }}
      >
        Terms of Use
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "40px" }}>
        Last updated: March 2026
      </p>

      <Section title="Acceptance">
        <p>
          By using concept//fuel, you agree to these Terms of Use. If you do not
          agree, do not use the service.
        </p>
      </Section>

      <Section title="Use of the service">
        <p>
          concept//fuel is provided for personal, non-commercial sports
          nutrition planning purposes. You may not use the platform to provide
          commercial dietetic or medical advice to third parties without our
          written permission. Plans are generated for informational purposes
          only — see our{" "}
          <a
            href="/disclaimer"
            style={{ color: "var(--accent-dim)", textDecoration: "none" }}
          >
            Disclaimer
          </a>
          .
        </p>
      </Section>

      <Section title="Intellectual property">
        <p>
          All content, algorithms, and design on concept//fuel are the
          intellectual property of Concept Athletic Ltd. You may copy generated
          plans for your own personal use. You may not reproduce, resell, or
          republish the platform&apos;s output at scale without permission.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The service is provided &quot;as is&quot; without warranty of any
          kind. We make no guarantee that plans are accurate, complete, or
          suitable for your purposes. Use is at your own risk.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Concept Athletic Ltd shall not
          be liable for any direct, indirect, incidental, or consequential
          damages arising from use of concept//fuel.
        </p>
      </Section>

      <Section title="Changes to these terms">
        <p>
          We may update these terms at any time. Continued use after changes
          constitutes acceptance.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of England and Wales.</p>
      </Section>

      <Section title="Contact">
        <p>
          Concept Athletic Ltd.{" "}
          <span style={{ color: "var(--accent-dim)" }}>hello@conceptathletic.com</span>
        </p>
      </Section>
    </div>
  );
}
