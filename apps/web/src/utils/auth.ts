'use client';

/**
 * Secure client-side auth token management.
 *
 * Design decisions:
 * - Tokens stored in localStorage (not cookies) so they're inaccessible
 *   to server-rendered requests, reducing CSRF surface.
 * - Logout clears ALL known auth-related keys atomically.
 * - No API keys are ever stored client-side — only user JWTs.
 * - NEXT_PUBLIC_ env vars must never contain secrets (Vercel exposes them in bundles).
 */

const TOKEN_KEY    = 'lumio-token';
const USER_KEY     = 'lumio:user';
const TASK_KEY     = 'lumio:today-task';       // offline cache
const VISITS_KEY   = 'lumio:dashboard-visits'; // install prompt
const SNOOZE_KEY   = 'lumio:install-prompt-snoozed-until';
const INSTALLED_KEY = 'lumio:pwa-installed';

// ─── Token storage ────────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.error('[Auth] Failed to save token — localStorage unavailable');
  }
}

// ─── User cache ───────────────────────────────────────────────────────────────

export function getCachedUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: unknown): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore — non-critical cache
  }
}

// ─── Logout — clears ALL auth state ──────────────────────────────────────────

/**
 * Complete logout:
 * 1. Removes auth token and user cache
 * 2. Removes offline task cache (contains user-specific data)
 * 3. Preserves non-sensitive PWA preference keys (install snooze, visit count)
 * 4. Redirects to /login
 *
 * Call this from any logout button or when a 401 is received from the API.
 */
export function logout(redirectTo = '/login'): void {
  try {
    // Clear sensitive auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TASK_KEY); // task cache contains user data

    // Reset visit counter so install prompt logic resets for next user
    localStorage.removeItem(VISITS_KEY);
  } catch {
    // localStorage unavailable — proceed to redirect anyway
  }

  // Hard redirect clears all React state
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo;
  }
}

/**
 * Interceptor helper: call on any 401 response from the API.
 * Logs out and redirects without an additional user action.
 */
export function handleUnauthorized(): void {
  console.info('[Auth] Session expired — redirecting to login');
  logout();
}

// ─── API fetch wrapper — auto-attaches token, handles 401 ────────────────────

export async function authedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    handleUnauthorized();
  }

  return res;
}
