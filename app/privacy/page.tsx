export const metadata = {
  title: "Privacy Policy — concept//fuel",
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

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "40px" }}>
        Last updated: March 2026
      </p>

      <Section title="What data we collect">
        <p>
          concept//fuel is designed to be privacy-first. In Phase 1 (current),
          no user accounts or server-side data storage exist. All plan inputs
          and outputs are stored locally in your browser using{" "}
          <code
            style={{
              background: "var(--surface-2)",
              padding: "1px 5px",
              borderRadius: "3px",
              fontFamily: "inherit",
            }}
          >
            localStorage
          </code>{" "}
          only. This data never leaves your device.
        </p>
      </Section>

      <Section title="Cookies and local storage">
        <p>
          We use browser localStorage to persist your last profile and plan
          inputs so you can return to your previous state. No cookies are set by
          concept//fuel in Phase 1. If we add analytics or Pro features in
          future, this policy will be updated and you will be notified.
        </p>
      </Section>

      <Section title="Analytics">
        <p>
          We may use privacy-respecting, cookieless analytics (e.g. Vercel
          Analytics) to understand usage patterns. No personally identifiable
          information (PII) is collected. No data is sold to third parties.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>
          concept//fuel is hosted on Vercel. Vercel&apos;s infrastructure
          processes requests in accordance with their privacy policy. In future
          Pro tiers, Stripe will be used for payment processing — Stripe&apos;s
          privacy policy will apply to payment data.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Since no personal data is stored on our servers in Phase 1, there is
          nothing to delete or export. You can clear your browser localStorage
          at any time to remove locally stored plan data. For questions, contact
          us at the address below.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Concept Athletic Ltd. For privacy enquiries:{" "}
          <span style={{ color: "var(--accent-dim)" }}>hello@conceptathletic.com</span>
        </p>
      </Section>
    </div>
  );
}
