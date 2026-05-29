// ─── apps/web/src/app/sitemap.ts ─────────────────────────────────────────────
// Next.js App Router sitemap generator.
// Outputs /sitemap.xml automatically — no plugin needed.
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://lumio.app';

// ── Priority guide ────────────────────────────────────────────────────────────
// 1.0  = homepage
// 0.9  = primary conversion pages (pricing, features)
// 0.8  = secondary marketing pages
// 0.6  = blog / resources
// 0.4  = legal / low-signal pages

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // ── Homepage ──────────────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // ── Primary conversion pages ──────────────────────────────────────────
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // ── Feature sub-pages ─────────────────────────────────────────────────
    {
      url: `${BASE_URL}/features/ai-coach`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/features/challenges`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/features/memory-pack`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/features/community`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── Auth pages ────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.7,
    },

    // ── Niche landing pages (12 niches from AGENT.md) ─────────────────────
    ...[
      'finance',
      'health-fitness',
      'mental-health',
      'relationships',
      'career-business',
      'productivity',
      'learning-education',
      'creativity',
      'spirituality',
      'lifestyle',
      'social-skills',
      'parenting',
    ].map(niche => ({
      url: `${BASE_URL}/challenges/${niche}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    // ── Legal ─────────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
