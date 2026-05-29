'use client';

import { useState } from 'react';
import { useLangStore } from '@/stores/lang';
import { SUPPORTED_LANGUAGES, type LangCode } from '@/lib/i18n';

interface LanguageSelectorProps {
  /** true = full onboarding card layout; false = compact settings row */
  variant?: 'onboarding' | 'settings';
  /** Whether to PATCH /api/auth/me on change (true for logged-in settings) */
  saveToProfile?: boolean;
  onSelect?: (code: LangCode) => void;
}

export default function LanguageSelector({
  variant = 'settings',
  saveToProfile = false,
  onSelect,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLangStore();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (code: LangCode) => {
    if (code === language) return;
    setSaving(true);
    await setLanguage(code, saveToProfile);
    setSaving(false);
    onSelect?.(code);
  };

  // ── Onboarding layout — full grid of flag cards ───────────────────────────
  if (variant === 'onboarding') {
    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.625rem',
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as LangCode)}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.75rem 1rem',
                  background: active ? 'var(--soft)' : 'var(--bg3)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  cursor: saving ? 'wait' : 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  textAlign: 'start',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: active ? 'var(--accent)' : 'var(--text)',
                    }}
                  >
                    {lang.nativeName}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: 'var(--text2)',
                      marginTop: '1px',
                    }}
                  >
                    {lang.name}
                  </span>
                </span>
                {active && (
                  <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>✓</span>
                )}
                {/* RTL hint badge */}
                {lang.rtl && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      padding: '0.1rem 0.3rem',
                      background: 'var(--soft)',
                      borderRadius: '4px',
                      color: 'var(--text2)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    RTL
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Settings layout — single select dropdown ──────────────────────────────
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language)!;

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={language}
        onChange={(e) => handleSelect(e.target.value as LangCode)}
        disabled={saving}
        style={{
          width: '100%',
          padding: '0.625rem 2.5rem 0.625rem 0.875rem',
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--text)',
          fontSize: '0.9375rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',
        }}
        aria-label="Language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
      {/* Chevron */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text2)',
          pointerEvents: 'none',
          fontSize: '0.75rem',
        }}
      >
        ▼
      </span>
    </div>
  );
}
