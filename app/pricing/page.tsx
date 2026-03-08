import Link from "next/link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — concept//athleticclub",
  description: "Early access to concept//athleticclub is free. See what's included and what's coming.",
  alternates: { canonical: "https://conceptclub.co.uk/pricing" },
};

// TODO: Implement Stripe when ready. Currently stub only.
// TODO: Add Pro tier features: plan history, custom gel data, Hyrox splits

export default function PricingPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "60px 20px" }}>
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Pricing
      </p>
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: "12px",
        }}
      >
        Simple pricing.
      </h1>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          marginBottom: "48px",
          maxWidth: "480px",
        }}
      >
        Start free. Upgrade for advanced features coming in Phase 2.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Free tier */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "28px",
            background: "var(--surface)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Free
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}
          >
            £0
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "24px",
            }}
          >
            Forever free
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "28px",
            }}
          >
            {[
              "Full fuel plan generator",
              "Carb target + schedule",
              "Fluid + sodium guidance",
              "Caffeine guidance",
              "Bicarb protocol (Maurten / Flycarb)",
              "Copy plan to clipboard",
              "Running + Hyrox",
            ].map((f) => (
              <li
                key={f}
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "var(--success)", flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/plan"
            style={{
              display: "block",
              padding: "12px",
              textAlign: "center",
              background: "var(--surface-2)",
              color: "var(--text)",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "4px",
              textDecoration: "none",
              border: "1px solid var(--border)",
            }}
          >
            Get started →
          </Link>
        </div>

        {/* Pro tier */}
        <div
          style={{
            border: "1px solid var(--accent)",
            borderRadius: "6px",
            padding: "28px",
            background: "var(--surface)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "var(--accent)",
              color: "var(--bg)",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "3px 8px",
              borderRadius: "20px",
              textTransform: "uppercase",
            }}
          >
            Coming soon
          </div>

          <p
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Pro
          </p>
          <p
            style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}
          >
            £6.99
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "24px",
            }}
          >
            per month
          </p>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "28px",
            }}
          >
            {[
              "Everything in Free",
              "Plan history (unlimited saves)",
              "Custom gel / product data",
              "Multi-sport event planning",
              "Hyrox station splits",
              "PDF export",
              "Priority support",
            ].map((f) => (
              <li
                key={f}
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ color: "var(--accent-dim)", flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* TODO: Replace with Stripe Checkout button */}
          <button
            disabled
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              textAlign: "center",
              background: "rgba(255,255,255,0.1)",
              color: "var(--text-muted)",
              fontWeight: 600,
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              cursor: "not-allowed",
            }}
          >
            Coming soon
          </button>
          {/* TODO: implement Stripe
            import Stripe from 'stripe'
            // Create checkout session at /api/checkout/route.ts
            // price_id: process.env.STRIPE_PRO_PRICE_ID
          */}
        </div>
      </div>

      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "32px",
          textAlign: "center",
        }}
      >
        Prices shown in GBP. All core features free during Phase 1.
      </p>
    </div>
  );
}
