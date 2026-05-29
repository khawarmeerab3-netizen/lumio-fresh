// apps/web/src/app/layout.tsx
// Phase 28: Frontend Setup with Error Boundary

import type { Metadata } from 'next';
import { Providers } from './providers';
import ErrorBoundary from '@/components/lumio/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lumio - Illuminate Your Growth',
  description: 'Build habits, achieve goals, transform your life',
};

/**
 * Root Layout Component
 * Wraps entire app with:
 * - Error Boundary (catches React errors)
 * - Providers (Redux, theme, etc.)
 * - Sentry integration (automatic via @sentry/nextjs)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Sentry script will be injected here by @sentry/nextjs */}
      </head>
      <body>
        {/* Error Boundary catches React component errors */}
        <ErrorBoundary>
          {/* Providers handle Redux, theme, etc. */}
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
