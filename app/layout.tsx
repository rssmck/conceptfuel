import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import SiteGate from "@/components/SiteGate";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "concept//fuel BETA - Precision race fuelling",
  description:
    "Deterministic race + session fuelling planner for running and Hyrox. Get a decisive carb target, timed intake schedule, hydration and sodium guidance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={`${geistMono.variable}`}>
        <SiteGate>
          <Nav />
          <main>{children}</main>
        </SiteGate>
        <footer
          style={{
            borderTop: "1px solid var(--border)",
            padding: "24px 20px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          <p>
            concept//fuel, part of{" "}
            <span style={{ color: "var(--accent-dim)" }}>Concept Athletic</span>
          </p>
          <p style={{ marginTop: "4px" }}>
            <a
              href="/disclaimer"
              style={{ color: "var(--text-muted)", textDecoration: "none", marginRight: "16px" }}
            >
              disclaimer
            </a>
            <a
              href="/privacy"
              style={{ color: "var(--text-muted)", textDecoration: "none", marginRight: "16px" }}
            >
              privacy
            </a>
            <a
              href="/terms"
              style={{ color: "var(--text-muted)", textDecoration: "none" }}
            >
              terms
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
