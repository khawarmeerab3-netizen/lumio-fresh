import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lumio — Illuminate Your Growth | World-Class AI Challenge Platform',
  description:
    'Lumio is the world\'s most advanced AI-powered life challenge platform. 100+ niches, AI coach that knows you personally, 8 mood themes, streaks, milestones, and niche-filtered community. Finance, fitness, creativity, and more. Start free.',
  keywords: [
    'AI challenge platform',
    'habit tracker app',
    'AI life coach',
    'personal growth app',
    'challenge app',
    'fitness challenge',
    'finance challenge',
    'mood themes app',
    'daily task AI',
    'goal setting app',
    'streak tracker',
    'lumio app',
    'lumio challenge',
    'life transformation app',
  ],
  openGraph: {
    title: 'Lumio — Illuminate Your Growth',
    description:
      'The world\'s most advanced AI challenge platform. 100+ niches. AI coach that knows you. 8 mood themes. From finance to fitness.',
    url: 'https://lumio.app',
    siteName: 'Lumio',
    images: [
      {
        url: 'https://lumio.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Lumio — Illuminate Your Growth',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio — Illuminate Your Growth',
    description: '100+ niches. AI coach. 8 mood themes. Transform your life one challenge at a time.',
    images: ['https://lumio.app/og-image.png'],
    creator: '@lumioapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://lumio.app',
  },
};

export { default } from './page';
