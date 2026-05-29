// ─── apps/web/tailwind.config.ts ─────────────────────────────────────────────
// Tailwind configuration for the Lumio web app.
// Phase 26: adds `animate-shimmer` keyframe used by Skeleton.tsx

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Lumio design system colours ─────────────────────────────────────
      colors: {
        // Mood palette — referenced as `lumio-gold`, `lumio-blue`, etc.
        'lumio-gold':   '#F5C842',
        'lumio-blue':   '#4A90E2',
        'lumio-green':  '#4CAF50',
        'lumio-purple': '#8B5CF6',
        'lumio-red':    '#EF4444',
        'lumio-orange': '#F97316',
        'lumio-teal':   '#14B8A6',
        'lumio-pink':   '#EC4899',
      },
      // ── Fonts ─────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      // ── Keyframes ─────────────────────────────────────────────────────
      keyframes: {
        // Shimmer sweep: left → right across the skeleton element
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        // Gentle fade-in for page transitions
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Streak flame flicker
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.7' },
        },
      },
      animation: {
        shimmer:  'shimmer 1.6s infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        flicker:  'flicker 1.2s ease-in-out infinite',
      },
      // ── Border radius ─────────────────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      // ── Box shadow ────────────────────────────────────────────────────
      boxShadow: {
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.35)',
        'glow-gold':   '0 0 24px rgba(245, 200, 66, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
