import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Lumio | Start Free, Scale as You Grow',
  description:
    'Simple, transparent pricing. Lumio Free is forever free. Pro at $9/month. Elite at $19/month. Annual plans save 2 months. Compare features and see how we stack up against Strava, Habitica, and Duolingo.',
  keywords: [
    'lumio pricing',
    'habit app pricing',
    'AI coach pricing',
    'challenge app plans',
    'lumio pro',
    'lumio elite',
    'habit tracker cost',
  ],
  openGraph: {
    title: 'Lumio Pricing — Start Free, Scale as You Grow',
    description: 'Pro at $9/month. Elite at $19/month. Annual plans save 2 months. Compare against Strava, Habitica, and Duolingo.',
    url: 'https://lumio.app/pricing',
    siteName: 'Lumio',
    images: [{ url: 'https://lumio.app/og-pricing.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Pricing',
    description: 'Pro at $9/month. Elite at $19/month. Free forever.',
    images: ['https://lumio.app/og-pricing.png'],
  },
  alternates: { canonical: 'https://lumio.app/pricing' },
};

export { default } from './pricing-page';
