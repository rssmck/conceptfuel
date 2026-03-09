import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle, ARTICLES } from "@/lib/methodArticles";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — concept//method`,
    description: article.subtitle,
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  fuel: "fuelling",
  form: "training",
  both: "all",
};

export default async function MethodArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="cf-page">
      {/* Breadcrumb */}
      <div style={{ marginBottom: "40px" }}>
        <Link
          href="/method"
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}
        >
          concept//method
        </Link>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 8px" }}>/</span>
        <span
          style={{
            fontSize: "12px",
            color: "var(--accent-dim)",
            letterSpacing: "0.06em",
          }}
        >
          concept//{CATEGORY_LABEL[article.category]}
        </span>
      </div>

      {/* Article header */}
      <div style={{ maxWidth: "660px", marginBottom: "52px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "10px",
              color: "var(--accent-dim)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            concept//{CATEGORY_LABEL[article.category]}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            {article.readMin} min read
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(24px, 5vw, 42px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--text)",
            marginBottom: "14px",
          }}
        >
          {article.title}
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "var(--text-muted)",
            lineHeight: 1.65,
            margin: "0 0 24px",
            fontStyle: "italic",
          }}
        >
          {article.subtitle}
        </p>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "20px",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              color: "var(--text)",
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            {article.intro}
          </p>
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: "660px", display: "flex", flexDirection: "column", gap: "0" }}>
        {article.sections.map((section, i) => {
          if (section.type === "heading") {
            return (
              <h2
                key={i}
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--text)",
                  letterSpacing: "-0.02em",
                  marginTop: "44px",
                  marginBottom: "14px",
                  lineHeight: 1.3,
                }}
              >
                {section.text}
              </h2>
            );
          }

          if (section.type === "para") {
            return (
              <p
                key={i}
                style={{
                  fontSize: "15px",
                  color: "var(--text)",
                  lineHeight: 1.75,
                  marginBottom: "18px",
                }}
              >
                {section.text}
              </p>
            );
          }

          if (section.type === "list" && section.items) {
            return (
              <ul
                key={i}
                style={{
                  margin: "0 0 18px 0",
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      gap: "12px",
                      fontSize: "15px",
                      color: "var(--text)",
                      lineHeight: 1.65,
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent-dim)",
                        fontWeight: 700,
                        flexShrink: 0,
                        paddingTop: "2px",
                      }}
                    >
                      //
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (section.type === "callout") {
            return (
              <div
                key={i}
                style={{
                  margin: "32px 0",
                  padding: "20px 24px",
                  borderLeft: "3px solid var(--accent)",
                  background: "var(--surface)",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--text)",
                    lineHeight: 1.7,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  {section.text}
                </p>
              </div>
            );
          }

          if (section.type === "cite") {
            return (
              <p
                key={i}
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  marginTop: "32px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border)",
                  fontStyle: "italic",
                }}
              >
                {section.text}
              </p>
            );
          }

          return null;
        })}
      </div>

      {/* CTA */}
      {article.ctaLabel && article.ctaHref && (
        <div
          style={{
            marginTop: "60px",
            paddingTop: "36px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Put it into practice
            </p>
            <p style={{ fontSize: "14px", color: "var(--text)", margin: 0 }}>
              Apply this to your own training.
            </p>
          </div>
          <Link
            href={article.ctaHref}
            style={{
              padding: "12px 24px",
              background: "var(--accent)",
              color: "var(--bg)",
              fontWeight: 700,
              fontSize: "14px",
              borderRadius: "4px",
              textDecoration: "none",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {article.ctaLabel} →
          </Link>
        </div>
      )}

      {/* Back link */}
      <div style={{ marginTop: "48px" }}>
        <Link
          href="/method"
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          Back to concept//method
        </Link>
      </div>
    </div>
  );
}
