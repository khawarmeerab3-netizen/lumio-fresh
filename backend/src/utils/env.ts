// backend/src/utils/env.ts
// ─── Typed access to all environment variables ───────────────────────────────
// ALL process.env access in backend MUST go through this file.
// This gives TypeScript strict-mode safety and surfaces missing vars at startup.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

// Validates all required vars on first import — startup crash if any are missing.
export const env = {
  // Server
  PORT:                        parseInt(optionalEnv('PORT', '3001'), 10),
  NODE_ENV:                    optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  IS_PROD:                     optionalEnv('NODE_ENV') === 'production',

  // Supabase
  SUPABASE_URL:                requireEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY:           requireEnv('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_KEY:        requireEnv('SUPABASE_SERVICE_KEY'),

  // Auth
  JWT_SECRET:                  requireEnv('JWT_SECRET'),

  // AI providers
  GROQ_API_KEY:                requireEnv('GROQ_API_KEY'),
  MISTRAL_API_KEY:             requireEnv('MISTRAL_API_KEY'),
  ANTHROPIC_API_KEY:           requireEnv('ANTHROPIC_API_KEY'),

  // Payments
  LEMONSQUEEZY_API_KEY:        requireEnv('LEMONSQUEEZY_API_KEY'),
  LEMONSQUEEZY_WEBHOOK_SECRET: requireEnv('LEMONSQUEEZY_WEBHOOK_SECRET'),
  LEMONSQUEEZY_STORE_ID:       requireEnv('LEMONSQUEEZY_STORE_ID'),

  // Push notifications
  ONESIGNAL_APP_ID:            requireEnv('ONESIGNAL_APP_ID'),
  ONESIGNAL_REST_API_KEY:      requireEnv('ONESIGNAL_REST_API_KEY'),

  // URLs
  FRONTEND_URL:                optionalEnv('FRONTEND_URL', 'http://localhost:3000'),

  // Monitoring
  SENTRY_DSN:                  optionalEnv('SENTRY_DSN'),   // optional in dev
} as const;

// Type for consumers that need the env shape
export type Env = typeof env;
