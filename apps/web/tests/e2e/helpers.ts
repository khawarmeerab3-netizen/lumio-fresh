// apps/web/tests/e2e/helpers.ts
// Shared utilities, page-object helpers, and auth fixtures for all E2E tests.
import { type Page, expect } from '@playwright/test';

// ─── Test credentials (local/CI seeded user) ─────────────────────────────────

export const TEST_USER = {
  email:    process.env.E2E_USER_EMAIL    ?? 'e2e@lumio.app',
  password: process.env.E2E_USER_PASSWORD ?? 'LumioTest123!',
  name:     process.env.E2E_USER_NAME     ?? 'E2E Tester',
};

// Fresh user for registration tests — includes timestamp to avoid conflicts
export function freshUser() {
  const ts = Date.now();
  return {
    name:     `Test User ${ts}`,
    email:    `test_${ts}@lumio-e2e.app`,
    password: 'LumioE2E2025!',
  };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Log in via the UI login form.
 * Waits for redirect to /app (or /app/onboarding for new users).
 */
export async function loginViaUI(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10_000 });
}

/**
 * Log in via API (session cookie) — faster for tests that don't need to test auth itself.
 */
export async function loginViaAPI(page: Page, email = TEST_USER.email, password = TEST_USER.password) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  const response = await page.request.post(`${apiBase}/api/auth/login`, {
    data: { email, password },
  });
  // If API auth fails, fall back to UI login
  if (!response.ok()) {
    await loginViaUI(page, email, password);
  }
}

// ─── Wait helpers ─────────────────────────────────────────────────────────────

/** Wait for an element to be visible with a custom timeout. */
export async function waitForVisible(page: Page, selector: string, timeout = 8000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/** Wait for a URL pattern. */
export async function waitForURL(page: Page, pattern: string | RegExp, timeout = 10_000) {
  await page.waitForURL(pattern, { timeout });
}

// ─── Network helpers ──────────────────────────────────────────────────────────

/** Wait for a specific API call to complete and return its response. */
export async function waitForAPICall(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (resp) => {
      const url = resp.url();
      return typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
    },
    { timeout: 15_000 }
  );
}

// ─── Assertion helpers ────────────────────────────────────────────────────────

/** Assert element has a specific CSS custom property value. */
export async function expectCSSVar(page: Page, varName: string, expectedValue: string) {
  const actual = await page.evaluate((v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim(),
    varName
  );
  expect(actual).toBe(expectedValue);
}

/** Assert element contains text (case-insensitive). */
export async function expectText(page: Page, selector: string, text: string) {
  const el = page.locator(selector).first();
  await expect(el).toContainText(text, { ignoreCase: true });
}
