// apps/web/sentry.client.config.ts
// Phase 28: Sentry Client-Side Configuration

import * as Sentry from '@sentry/nextjs';
import { replayIntegration } from '@sentry/nextjs';

Sentry.init({
  // Sentry project DSN (must be public, safe to expose)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking (optional, set in CI/CD)
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Performance Monitoring
  integrations: [
    replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    })
  ],

  // Sampling rates (lower in production to reduce costs)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay sampling
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Filter out noise
  beforeSend(event, hint) {
    // Don't send 4xx errors (client errors)
    if (event.exception) {
      const error = hint.originalException;

      // Skip network errors (handled gracefully by app)
      if (error instanceof TypeError) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('Network')
        ) {
          return null;
        }
      }

      // Skip specific error messages
      if (
        error instanceof Error &&
        error.message.includes('AbortError')
      ) {
        return null;
      }
    }

    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'chrome-extension://',
    'moz-extension://',
    // Network errors (usually handled)
    'NetworkError',
    'TimeoutError',
  ],

  // Attach stack trace
  attachStacktrace: true,

  // Debug mode (disable in production)
  debug: process.env.NODE_ENV === 'development',
});

export { Sentry };
