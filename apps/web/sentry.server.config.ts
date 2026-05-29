// apps/web/sentry.server.config.ts
// Phase 28: Sentry Server-Side Configuration (Next.js)

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Use SENTRY_DSN (private, not exposed to browser)
  dsn: process.env.SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.APP_VERSION || '1.0.0',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Filter out noise
  beforeSend(event, hint) {
    // Don't send 4xx errors
    if (event.exception) {
      const error = hint.originalException;

      // Skip specific errors
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          return null;
        }
      }
    }

    return event;
  },

  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});

export { Sentry };
