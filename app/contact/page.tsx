import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Concept Athletic",
  description: "Get in touch with Concept Athletic. Questions, feedback or access code requests.",
  alternates: { canonical: "https://conceptclub.co.uk/contact" },
};

import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 20px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Get in touch
      </p>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: "12px",
        }}
      >
        Contact us
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          lineHeight: 1.75,
          marginBottom: "40px",
          maxWidth: "480px",
        }}
      >
        Questions about concept//fuel, feedback on your experience, or
        interested in working with Concept Athletic? We read every message.
      </p>

      <ContactForm />

      <div
        style={{
          marginTop: "40px",
          paddingTop: "32px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Also useful
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            { href: "/about", label: "Who we are" },
            { href: "/disclaimer", label: "Disclaimer" },
            { href: "/plan", label: "Build a fuel plan" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: "13px",
                color: "var(--accent-dim)",
                textDecoration: "none",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "2px",
                width: "fit-content",
              }}
            >
              {l.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
