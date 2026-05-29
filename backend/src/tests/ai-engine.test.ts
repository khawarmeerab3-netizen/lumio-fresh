// backend/src/tests/ai-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  generateAIResponse,
  sanitizeInput,
  FALLBACK_RESPONSES,
  type AIEngineOptions,
} from '../lib/ai-engine.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPTS: AIEngineOptions = { maxTokens: 100, temperature: 0.5 };

const okProvider   = vi.fn().mockResolvedValue('Hello from provider');
const failProvider = vi.fn().mockRejectedValue(new Error('Provider unavailable'));

// ─── Input Sanitization ───────────────────────────────────────────────────────

describe('sanitizeInput', () => {
  it('strips HTML tags', () => {
    expect(sanitizeInput('<b>bold</b> text')).toBe('bold text');
  });

  it('strips nested and self-closing HTML tags', () => {
    expect(sanitizeInput('<script>alert(1)</script><br/>hello')).toBe('alert(1)hello');
  });

  it('strips HTML entities', () => {
    const result = sanitizeInput('hello &amp; world &lt;test&gt;');
    expect(result).not.toContain('&amp;');
    expect(result).not.toContain('&lt;');
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  it('truncates input to 500 characters', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeInput(long)).toHaveLength(500);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('handles input that is exactly 500 characters', () => {
    const exact = 'x'.repeat(500);
    expect(sanitizeInput(exact)).toHaveLength(500);
  });

  it('strips tags and then truncates (tag removal reduces length first)', () => {
    // 20 chars of tags + 490 chars of content — after stripping tags, should be ≤500
    const tagged = '<b>'.repeat(10) + 'a'.repeat(490) + '</b>'.repeat(10);
    const result = sanitizeInput(tagged);
    expect(result.length).toBeLessThanOrEqual(500);
    expect(result).not.toMatch(/<\/?b>/);
  });
});

// ─── Fallback Chain ───────────────────────────────────────────────────────────

describe('generateAIResponse — provider fallback chain', () => {
  it('returns Groq response when Groq succeeds', async () => {
    const groq = vi.fn().mockResolvedValue('Groq answer');

    const result = await generateAIResponse('test', OPTS, { groq });

    expect(result.provider).toBe('groq');
    expect(result.text).toBe('Groq answer');
    expect(groq).toHaveBeenCalledOnce();
  });

  it('calls Mistral when Groq fails', async () => {
    const groq    = vi.fn().mockRejectedValue(new Error('Groq down'));
    const mistral = vi.fn().mockResolvedValue('Mistral answer');

    const result = await generateAIResponse('test', OPTS, { groq, mistral });

    expect(groq).toHaveBeenCalledOnce();
    expect(mistral).toHaveBeenCalledOnce();
    expect(result.provider).toBe('mistral');
    expect(result.text).toBe('Mistral answer');
  });

  it('calls Anthropic when both Groq and Mistral fail', async () => {
    const groq      = vi.fn().mockRejectedValue(new Error('Groq down'));
    const mistral   = vi.fn().mockRejectedValue(new Error('Mistral down'));
    const anthropic = vi.fn().mockResolvedValue('Anthropic answer');

    const result = await generateAIResponse('test', OPTS, { groq, mistral, anthropic });

    expect(groq).toHaveBeenCalledOnce();
    expect(mistral).toHaveBeenCalledOnce();
    expect(anthropic).toHaveBeenCalledOnce();
    expect(result.provider).toBe('anthropic');
    expect(result.text).toBe('Anthropic answer');
  });

  it('does NOT call Mistral when Groq succeeds', async () => {
    const groq    = vi.fn().mockResolvedValue('Groq answer');
    const mistral = vi.fn().mockResolvedValue('Mistral answer');

    await generateAIResponse('test', OPTS, { groq, mistral });

    expect(groq).toHaveBeenCalledOnce();
    expect(mistral).not.toHaveBeenCalled();
  });

  it('does NOT call Anthropic when Groq succeeds', async () => {
    const groq      = vi.fn().mockResolvedValue('Groq answer');
    const anthropic = vi.fn().mockResolvedValue('Anthropic answer');

    await generateAIResponse('test', OPTS, { groq, anthropic });

    expect(anthropic).not.toHaveBeenCalled();
  });

  it('does NOT call Anthropic when Groq fails but Mistral succeeds', async () => {
    const groq      = vi.fn().mockRejectedValue(new Error('Groq down'));
    const mistral   = vi.fn().mockResolvedValue('Mistral answer');
    const anthropic = vi.fn().mockResolvedValue('Anthropic answer');

    await generateAIResponse('test', OPTS, { groq, mistral, anthropic });

    expect(anthropic).not.toHaveBeenCalled();
  });
});

// ─── All Providers Fail ───────────────────────────────────────────────────────

describe('generateAIResponse — all providers fail', () => {
  it('returns fallback provider when all three fail', async () => {
    const groq      = vi.fn().mockRejectedValue(new Error('Groq down'));
    const mistral   = vi.fn().mockRejectedValue(new Error('Mistral down'));
    const anthropic = vi.fn().mockRejectedValue(new Error('Anthropic down'));

    const result = await generateAIResponse('test', OPTS, { groq, mistral, anthropic });

    expect(result.provider).toBe('fallback');
    expect(result.model).toBe('static');
  });

  it('returns non-empty fallback text when all providers fail', async () => {
    const fail = vi.fn().mockRejectedValue(new Error('Down'));

    const result = await generateAIResponse('test', OPTS, {
      groq:      fail,
      mistral:   fail,
      anthropic: fail,
    });

    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(10);
  });

  it('fallback text is one of the known fallback responses', async () => {
    const fail = vi.fn().mockRejectedValue(new Error('Down'));

    const result = await generateAIResponse('test', OPTS, {
      groq:      fail,
      mistral:   fail,
      anthropic: fail,
    });

    expect(FALLBACK_RESPONSES).toContain(result.text);
  });

  it('never throws even when all providers crash hard', async () => {
    const boom = vi.fn().mockRejectedValue(new TypeError('Cannot read properties of undefined'));

    await expect(
      generateAIResponse('test', OPTS, { groq: boom, mistral: boom, anthropic: boom })
    ).resolves.not.toThrow();
  });
});

// ─── Input Sanitization Integration ──────────────────────────────────────────

describe('generateAIResponse — input sanitization', () => {
  it('sanitizes HTML before passing to provider', async () => {
    const groq = vi.fn().mockResolvedValue('ok');

    await generateAIResponse('<script>evil()</script>hello world', OPTS, { groq });

    const calledWith: string = groq.mock.calls[0]?.[0] ?? '';
    expect(calledWith).not.toContain('<script>');
    expect(calledWith).toContain('hello world');
  });

  it('truncates long prompts to 500 chars before passing to provider', async () => {
    const groq = vi.fn().mockResolvedValue('ok');
    const longInput = 'a'.repeat(1000);

    await generateAIResponse(longInput, OPTS, { groq });

    const calledWith: string = groq.mock.calls[0]?.[0] ?? '';
    expect(calledWith.length).toBeLessThanOrEqual(500);
  });

  it('passes sanitized prompt, not raw input, to each fallback provider', async () => {
    const groq    = vi.fn().mockRejectedValue(new Error('down'));
    const mistral = vi.fn().mockResolvedValue('ok');

    await generateAIResponse('<b>html</b> input that is <em>tagged</em>', OPTS, { groq, mistral });

    const mistralPrompt: string = mistral.mock.calls[0]?.[0] ?? '';
    expect(mistralPrompt).not.toMatch(/<\/?[bem]>/);
  });
});
