import type { MetadataRoute } from "next";

const BASE = "https://conceptclub.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/plan`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/form`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/pricing`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE}/contact`,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/disclaimer`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
