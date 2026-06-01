// backend/src/utils/env.ts
// ─── Typed access to all environment variables ───────────────────────────────
// ALL process.env access in backend MUST go through this file.
// This gives TypeScript strict-mode safety and surfaces missing vars at startup.

import dotenv from 'dotenv';

dotenv.config();

// Support numbered key variants in local .env files
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1;
process.env.MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY_1;
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY_1;

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

  // AI providers (supports GROQ_API_KEY_1 style keys from .env)
  GROQ_API_KEY:                optionalEnv('GROQ_API_KEY', optionalEnv('GROQ_API_KEY_1')),
  MISTRAL_API_KEY:             optionalEnv('MISTRAL_API_KEY', optionalEnv('MISTRAL_API_KEY_1')),
  ANTHROPIC_API_KEY:           optionalEnv('ANTHROPIC_API_KEY', optionalEnv('ANTHROPIC_API_KEY_1')),

  // Payments (optional in local dev)
  LEMONSQUEEZY_API_KEY:        optionalEnv('LEMONSQUEEZY_API_KEY', 'dev'),
  LEMONSQUEEZY_WEBHOOK_SECRET: optionalEnv('LEMONSQUEEZY_WEBHOOK_SECRET', 'dev'),
  LEMONSQUEEZY_STORE_ID:       optionalEnv('LEMONSQUEEZY_STORE_ID', 'dev'),

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
