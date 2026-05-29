// Lumio — backend/src/utils/supabase.ts — Supabase client (public + admin)

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL     = process.env.SUPABASE_URL as string;
const SUPABASE_ANON    = process.env.SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_KEY as string;

// ─── Public client (respects RLS — for user-scoped queries) ──────────────────

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// ─── Admin client (bypasses RLS — server-side only, never expose to client) ──

export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// ─── Health check ─────────────────────────────────────────────────────────────

export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
