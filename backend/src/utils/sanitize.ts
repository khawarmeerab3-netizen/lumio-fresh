/**
 * Sanitize a string that will be sent to an AI model or stored in the DB.
 *
 * - Strips all HTML tags (prevents prompt injection via markup)
 * - Trims surrounding whitespace
 * - Enforces a maximum character length (default 500)
 *
 * Usage:
 *   const safeGoal = sanitizeAIInput(req.body.goal);
 *   const safeMsg  = sanitizeAIInput(req.body.message, 1000);
 */
export function sanitizeAIInput(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')   // strip HTML/XML tags
    .replace(/&[a-z]+;/gi, '') // strip common HTML entities (&lt; &gt; &amp; etc.)
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a short label / name field (e.g. challenge title, user name).
 * Shorter max length, same tag-stripping.
 */
export function sanitizeLabel(input: unknown, maxLength = 100): string {
  return sanitizeAIInput(input, maxLength);
}

/**
 * Sanitize a note / justification field.
 * Medium length, same tag-stripping.
 */
export function sanitizeNote(input: unknown): string {
  return sanitizeAIInput(input, 500);
}

/**
 * Sanitize a free-form message (e.g. coach chat message).
 * Larger budget, same tag-stripping.
 */
export function sanitizeMessage(input: unknown): string {
  return sanitizeAIInput(input, 1000);
}
