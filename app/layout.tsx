import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import SiteGate from "@/components/SiteGate";
import SwRegistrar from "@/components/SwRegistrar";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://conceptclub.co.uk"),
  title: {
    default: "concept//athleticclub — Performance tools for individual athletes",
    template: "%s — concept//athleticclub",
  },
  description:
    "Precision fuelling plans, gym session planning and performance analytics for serious athletes. Evidence-informed tools for runners, cyclists and strength athletes. No guesswork.",
  keywords: [
    "sports nutrition",
    "running fuel plan",
    "carbohydrate calculator",
    "endurance fuelling",
    "marathon nutrition",
    "gel schedule",
    "athlete nutrition",
    "gym session planner",
    "strength training plan",
    "cycling nutrition",
    "race day fuelling",
    "concept athletic",
  ],
  authors: [{ name: "Concept Athletic" }],
  creator: "Concept Athletic",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: "concept//athleticclub",
    title: "concept//athleticclub — Performance tools for individual athletes",
    description:
      "Precision fuelling plans, gym session planning and performance analytics for serious athletes. Evidence-informed. No guesswork.",
    url: "https://conceptclub.co.uk",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "concept//athleticclub",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "concept//athleticclub — Performance tools for individual athletes",
    description:
      "Precision fuelling plans, gym session planning and performance analytics for serious athletes.",
    images: ["/icons/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme colour for browser chrome */}
        <meta name="theme-color" content="#0a0a0a" />

        {/* iOS web app meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Concept" />

        {/* iOS touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        {/* Viewport — prevent iOS auto-zoom on input focus */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className={`${geistMono.variable}`}>
        <SwRegistrar />
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
            concept//athleticclub · part of{" "}
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
