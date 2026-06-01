'use client';
// Lumio — apps/web/src/components/lumio/MoodCheckIn.tsx
// Daily mood gateway shown before Today's task loads.
// User picks their mood → adaptive task version is served.

import React, { useState } from 'react';
import type { DailyMoodState } from '@/shared/types/persona';
import { useMoodStore } from '@/stores/mood-store';

// ─── Mood option config ───────────────────────────────────────────────────────

interface MoodOption {
  value: DailyMoodState;
  emoji: string;
  label: string;
  sublabel: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    value:    'fired_up',
    emoji:    '⚡',
    label:    'Fired Up',
    sublabel: 'Let\'s go hard today',
    color:    '#f59e0b',
  },
  {
    value:    'okay',
    emoji:    '😊',
    label:    'Doing Okay',
    sublabel: 'Normal day, let\'s do this',
    color:    '#22c55e',
  },
  {
    value:    'tired',
    emoji:    '😴',
    label:    'Tired',
    sublabel: 'Low energy — keep it light',
    color:    '#60a5fa',
  },
  {
    value:    'rough_day',
    emoji:    '🌧️',
    label:    'Rough Day',
    sublabel: 'Need something gentle',
    color:    '#a855f7',
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface MoodCheckInProps {
  /** User's preferred name from persona (fallback to generic greeting) */
  preferredName?: string;
  /** Challenge ID this check-in is for */
  challengeId: string;
  /** API token to POST check-in */
  apiToken: string;
  /** Called when user submits their mood */
  onComplete: (mood: DailyMoodState) => void;
  /** Whether check-in was already done today (show summary instead) */
  alreadyCheckedIn?: DailyMoodState | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MoodCheckIn({
  preferredName,
  challengeId,
  apiToken,
  onComplete,
  alreadyCheckedIn,
}: MoodCheckInProps) {
  const { activeMood }                = useMoodStore();
  const [selected, setSelected]       = useState<DailyMoodState | null>(null);
  const [loading, setLoading]         = useState(false);
  const [hovered, setHovered]         = useState<DailyMoodState | null>(null);

  const greeting = preferredName ? `Hey ${preferredName}` : 'Hey';

  // If already checked in today, show brief summary + continue button
  if (alreadyCheckedIn) {
    const option = MOOD_OPTIONS.find((o) => o.value === alreadyCheckedIn);
    return (
      <div
        style={{
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>{option?.emoji}</div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            letterSpacing: '2px',
            color: 'var(--lumio-text3)',
          }}
        >
          TODAY'S MOOD
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: option?.color ?? activeMood.accent,
          }}
        >
          {option?.label}
        </div>
        <button
          onClick={() => onComplete(alreadyCheckedIn)}
          style={{
            marginTop: '0.5rem',
            padding: '0.8rem 2rem',
            background: activeMood.g,
            border: 'none',
            color: '#0a0905',
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
        >
          SEE TODAY'S TASK →
        </button>
      </div>
    );
  }

  async function handleSubmit() {
    if (!selected || loading) return;

    setLoading(true);
    try {
      await fetch('/api/persona/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          mood:        selected,
          challengeId: challengeId,
        }),
      });
    } catch {
      // Non-blocking — proceed even if save fails
    } finally {
      setLoading(false);
      onComplete(selected);
    }
  }

  return (
    <div
      style={{
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        animation: 'lumioFadeIn 0.25s ease',
      }}
    >
      {/* Greeting */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '3px',
            color: 'var(--lumio-text3)',
            marginBottom: '0.5rem',
          }}
        >
          DAILY CHECK-IN
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--lumio-text)',
            lineHeight: 1.2,
          }}
        >
          {greeting} — how are you feeling going into today?
        </h2>
      </div>

      {/* Mood options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MOOD_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          const isHovered  = hovered === option.value;

          return (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              onMouseEnter={() => setHovered(option.value)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '1rem',
                padding:         '0.9rem 1rem',
                background:      isSelected
                  ? `rgba(${hexToRgb(option.color)}, 0.12)`
                  : isHovered
                    ? 'var(--lumio-bg4)'
                    : 'var(--lumio-bg3)',
                border:          `1px solid ${isSelected ? option.color : 'var(--lumio-border2)'}`,
                cursor:          'pointer',
                textAlign:       'left',
                transition:      'all 0.15s ease',
                position:        'relative',
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div
                  style={{
                    position:   'absolute',
                    left:       0,
                    top:        0,
                    bottom:     0,
                    width:      3,
                    background: option.color,
                  }}
                />
              )}

              <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>
                {option.emoji}
              </span>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize:   '1rem',
                    fontWeight: 700,
                    color:      isSelected ? option.color : 'var(--lumio-text)',
                  }}
                >
                  {option.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize:   '0.6rem',
                    color:      'var(--lumio-text3)',
                    marginTop:  '0.1rem',
                  }}
                >
                  {option.sublabel}
                </div>
              </div>

              {isSelected && (
                <span
                  style={{
                    color:     option.color,
                    fontSize:  '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Adaptive task preview label */}
      {selected && (
        <div
          style={{
            fontFamily:  'var(--font-mono)',
            fontSize:    '0.62rem',
            color:       'var(--lumio-text3)',
            textAlign:   'center',
            animation:   'lumioFadeIn 0.2s ease',
          }}
        >
          {selected === 'fired_up' && '⚡ Full intensity challenge incoming'}
          {selected === 'okay'     && '✨ Standard challenge ready for you'}
          {selected === 'tired'    && '🌙 Lighter version prepared — you still got this'}
          {selected === 'rough_day'&& '💙 Recovery challenge — rest is progress too'}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        style={{
          padding:    '1rem',
          background: selected ? activeMood.g : 'var(--lumio-border2)',
          border:     'none',
          color:      selected ? '#0a0905' : 'var(--lumio-text3)',
          fontFamily: 'var(--font-display)',
          fontSize:   '1rem',
          fontWeight: 700,
          letterSpacing: '2px',
          cursor:     selected && !loading ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s ease',
        }}
      >
        {loading ? 'SAVING...' : selected ? 'SEE MY TASK →' : 'SELECT YOUR MOOD'}
      </button>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '245,158,11';
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`;
}
