'use client';

/**
 * Sanitize HTML from user-generated content before rendering.
 * Uses DOMPurify to prevent XSS via dangerouslySetInnerHTML.
 *
 * Usage:
 *   import { sanitizeHTML, sanitizeText } from '@/utils/sanitize';
 *
 *   // For rendered HTML (community posts, rich text):
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content) }} />
 *
 *   // For plain text display (no HTML allowed at all):
 *   <p>{sanitizeText(user.name)}</p>
 */

// DOMPurify is browser-only — this file is 'use client' so it's safe.
// Install: pnpm add dompurify @types/dompurify
let DOMPurify: typeof import('dompurify') | null = null;

async function getDOMPurify(): Promise<typeof import('dompurify')> {
  if (DOMPurify) return DOMPurify;
  DOMPurify = (await import('dompurify')).default as unknown as typeof import('dompurify');
  return DOMPurify;
}

/**
 * Sanitize HTML content for safe rendering.
 * Allows basic formatting tags but strips scripts, iframes, event handlers.
 *
 * SYNC version — safe to call after the module has been loaded once.
 * Use sanitizeHTMLAsync on first call.
 */
export function sanitizeHTML(dirty: string): string {
  if (typeof window === 'undefined') {
    // SSR: strip all tags server-side as a safe fallback
    return dirty.replace(/<[^>]*>/g, '').trim();
  }
  // DOMPurify is synchronous after the dynamic import resolves
  if (!DOMPurify) {
    // Fallback if called before async load: strip all tags
    return dirty.replace(/<[^>]*>/g, '').trim();
  }
  return (DOMPurify as unknown as { sanitize: (s: string, opts?: object) => string }).sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
    // Force external links to be safe
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}

/**
 * Async version — use this for the first render to ensure DOMPurify is loaded.
 */
export async function sanitizeHTMLAsync(dirty: string): Promise<string> {
  const purify = await getDOMPurify();
  return (purify as unknown as { sanitize: (s: string, opts?: object) => string }).sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}

/**
 * Strip ALL HTML and return plain text.
 * Use for names, titles, labels — anywhere HTML must never appear.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')   // strip tags
    .replace(/&[a-z]+;/gi, '') // strip HTML entities
    .trim()
    .slice(0, 1000);           // reasonable max for display strings
}

/**
 * Hook: returns a sanitized version of HTML content.
 * Handles the async DOMPurify load gracefully.
 *
 * Usage:
 *   const safeHTML = useSanitizedHTML(post.content);
 *   <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
 */
import { useState, useEffect } from 'react';

export function useSanitizedHTML(dirty: string): string {
  const [clean, setClean] = useState<string>(() =>
    // Synchronous fallback on first render: strip all tags
    dirty.replace(/<[^>]*>/g, '').trim()
  );

  useEffect(() => {
    let cancelled = false;
    sanitizeHTMLAsync(dirty).then((result) => {
      if (!cancelled) setClean(result);
    });
    return () => { cancelled = true; };
  }, [dirty]);

  return clean;
}
