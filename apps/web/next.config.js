/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.railway.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_ONESIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
  },

  // Needed for FFmpeg.wasm (SharedArrayBuffer)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['lumio.app', '*.vercel.app'],
    },
  },
};

module.exports = nextConfig;
