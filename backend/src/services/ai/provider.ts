import crypto from 'crypto';

// ─── Provider Configuration ──────────────────────────────────────────────────

interface ProviderConfig {
  name: string;
  url: string;
  model: string;
  key: string | undefined;
  timeoutMs: number;
}

const AI_PROVIDERS: ProviderConfig[] = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    key: process.env.GROQ_API_KEY,
    timeoutMs: 8000,
  },
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    key: process.env.MISTRAL_API_KEY,
    timeoutMs: 12000,
  },
  {
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    key: process.env.ANTHROPIC_API_KEY,
    timeoutMs: 20000,
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AICallOptions {
  json?: boolean;
  language?: string;
  temperature?: number;
}

interface CacheEntry {
  result: string | Record<string, unknown>;
  expiresAt: number;
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCacheKey(prompt: string, systemPrompt: string, json: boolean): string {
  return crypto
    .createHash('sha256')
    .update(`${prompt}||${systemPrompt}||${json}`)
    .digest('hex');
}

function getCached(key: string): (string | Record<string, unknown>) | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

function setCache(key: string, result: string | Record<string, unknown>): void {
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── JSON Parsing Helper ──────────────────────────────────────────────────────

function safeParseJson(text: string): Record<string, unknown> | null {
  // First attempt: direct parse
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Second attempt: strip markdown code fences
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    try {
      return JSON.parse(stripped) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

// ─── Provider Fetch Helpers ───────────────────────────────────────────────────

async function fetchOpenAICompat(
  provider: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  json: boolean,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), provider.timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model: provider.model,
      temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    };

    if (json) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key ?? ''}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`${provider.name} HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error(`${provider.name} returned empty content`);
    return content.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchAnthropic(
  provider: ProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), provider.timeoutMs);

  try {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.key ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 2048,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`anthropic HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text: string }>;
    };

    const text = data.content?.find((b) => b.type === 'text')?.text;
    if (!text) throw new Error('anthropic returned empty content');
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Main callAI Function ─────────────────────────────────────────────────────

/**
 * Core AI caller with Groq → Mistral → Anthropic failover.
 * All errors are caught internally; the caller receives the result or a thrown
 * `aiError` if all providers fail.
 *
 * Provider names are NEVER exposed to users — always brand as "Lumio AI".
 */
export async function callAI(
  prompt: string,
  systemPrompt: string,
  options: AICallOptions = {},
): Promise<string | Record<string, unknown>> {
  const { json = false, temperature = 0.7 } = options;

  // ── Cache check ──────────────────────────────────────────────────────────
  const cacheKey = getCacheKey(prompt, systemPrompt, json);
  const cached = getCached(cacheKey);
  if (cached !== null) {
    console.log('[LumioAI] cache hit');
    return cached;
  }

  // ── Try each provider in order ───────────────────────────────────────────
  for (const provider of AI_PROVIDERS) {
    try {
      console.log(`[LumioAI] trying provider: ${provider.name}`);

      let rawText: string;

      if (provider.name === 'anthropic') {
        rawText = await fetchAnthropic(provider, systemPrompt, prompt, temperature);
      } else {
        rawText = await fetchOpenAICompat(provider, systemPrompt, prompt, temperature, json);
      }

      // ── Parse JSON if requested ────────────────────────────────────────
      let result: string | Record<string, unknown>;
      if (json) {
        const parsed = safeParseJson(rawText);
        if (!parsed) throw new Error(`${provider.name} returned invalid JSON`);
        result = parsed;
      } else {
        result = rawText;
      }

      console.log(`[LumioAI] success via provider: ${provider.name}`);
      setCache(cacheKey, result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // AbortError means timeout — log and continue to next provider
      console.warn(`[LumioAI] provider ${provider.name} failed: ${message}`);
    }
  }

  // ── All providers failed ─────────────────────────────────────────────────
  console.error('[LumioAI] all providers failed');
  throw aiError('AI service temporarily unavailable');
}

// ─── Error Helper ─────────────────────────────────────────────────────────────

export function aiError(message: string): Error {
  const err = new Error(message);
  err.name = 'AIError';
  return err;
}
