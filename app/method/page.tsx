import Link from "next/link";
import { ARTICLES } from "@/lib/methodArticles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "concept//method — Training and fuelling science",
  description:
    "The research behind concept//fuel and concept//form. Carbohydrate metabolism, gut training, macros, recovery, and the logic behind every number.",
};

const CATEGORY_LABEL: Record<string, string> = {
  fuel: "fuelling",
  form: "training",
  both: "all",
};

export default function MethodIndexPage() {
  return (
    <div className="cf-page">
      <div style={{ marginBottom: "48px", maxWidth: "600px" }}>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          concept<span style={{ color: "var(--text-muted)" }}>//</span>method
        </p>
        <h1
          style={{
            fontSize: "clamp(26px, 5vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "14px",
          }}
        >
          The science behind the tools.
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-muted)", lineHeight: 1.7, margin: 0 }}>
          Transparent write-ups on how concept//fuel and concept//form work, and the research
          they are built on. No paywall. No watered-down summaries.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {ARTICLES.map((article, i) => (
          <Link
            key={article.slug}
            href={`/method/${article.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "20px",
                alignItems: "start",
                padding: "24px 0",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--accent-dim)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    concept//{CATEGORY_LABEL[article.category]}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {article.readMin} min read
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: "6px",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.25,
                  }}
                >
                  {article.title}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {article.subtitle}
                </p>
              </div>
              <span
                style={{
                  fontSize: "18px",
                  color: "var(--text-muted)",
                  paddingTop: "22px",
                  flexShrink: 0,
                }}
              >
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: "60px",
          paddingTop: "32px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/plan"
          style={{
            fontSize: "13px",
            color: "var(--accent)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          concept//fuel →
        </Link>
        <Link
          href="/form"
          style={{
            fontSize: "13px",
            color: "var(--accent)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          concept//form →
        </Link>
      </div>
    </div>
  );
}
