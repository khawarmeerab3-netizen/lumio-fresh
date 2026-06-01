'use client';
// Lumio — apps/web/src/components/lumio/PersonaChat.tsx
// Conversational persona builder used in onboarding and daily question moments.
// Phase 1-3 on Day 0. Phase 4-7 woven into daily check-ins over first week.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DailyMoodState } from '@/shared/types/persona';
import { useMoodStore } from '@/stores/mood-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface PersonaChatProps {
  /** API auth token */
  apiToken: string;
  /** Current persona phase to work through (1–7) */
  startingPhase?: number;
  /** Called when phase 3 complete (Day 0 onboarding done — can start app) */
  onOnboardingComplete?: () => void;
  /** Called when ALL 7 phases complete */
  onFullPersonaComplete?: () => void;
  /** User's current preferred name (if we already know it) */
  preferredName?: string;
  /** Compact mode — for daily question weave-in (not full page) */
  compact?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PersonaChat({
  apiToken,
  startingPhase = 1,
  onOnboardingComplete,
  onFullPersonaComplete,
  preferredName,
  compact = false,
}: PersonaChatProps) {
  const { activeMood }                = useMoodStore();
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [currentPhase, setCurrentPhase] = useState(startingPhase);
  const [initialized, setInitialized]   = useState(false);
  const messagesEndRef                  = useRef<HTMLDivElement>(null);
  const inputRef                        = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing conversation on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    loadConversation();
  }, []);

  async function loadConversation() {
    try {
      const res = await fetch('/api/persona/conversation', {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const json = await res.json();
      if (json.data?.messages?.length) {
        setMessages(json.data.messages);
        setCurrentPhase(json.data.currentPhase ?? startingPhase);
      } else {
        // Fresh start — send the opening message
        await sendToAPI('__START__');
      }
    } catch {
      await sendToAPI('__START__');
    }
  }

  const sendToAPI = useCallback(
    async (message: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/persona/message', {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            message: message === '__START__' ? 'Hello' : message,
          }),
        });
        const json = await res.json();

        if (json.data?.reply) {
          const assistantMsg: Message = {
            role:      'assistant',
            content:   json.data.reply,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }

        if (json.data?.phaseComplete) {
          const newPhase = currentPhase + 1;
          setCurrentPhase(newPhase);

          // Phase 3 complete = core onboarding done
          if (currentPhase === 3) {
            setTimeout(() => onOnboardingComplete?.(), 800);
          }
          // Phase 7 complete = full persona done
          if (currentPhase === 7) {
            setTimeout(() => onFullPersonaComplete?.(), 800);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role:      'assistant',
            content:   'I had a brief hiccup — please try again!',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [apiToken, currentPhase, onOnboardingComplete, onFullPersonaComplete]
  );

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      role:      'user',
      content:   text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    await sendToAPI(text);
  }

  const phaseLabel = currentPhase <= 3
    ? `Getting to know you (${currentPhase}/3)`
    : `Learning more about you (${currentPhase}/7)`;

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        compact ? '400px' : '100%',
        background:    'var(--lumio-bg)',
      }}
    >
      {/* Header — only show in full mode */}
      {!compact && (
        <div
          style={{
            padding:      '1rem 1.2rem 0.8rem',
            borderBottom: '1px solid var(--lumio-border)',
            background:   'var(--lumio-bg2)',
          }}
        >
          <div
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '0.7rem',
            }}
          >
            <div
              style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                background:     'var(--lumio-bg4)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '1.3rem',
              }}
            >
              ☀️
            </div>
            <div>
              <div
                style={{
                  fontFamily:  'var(--font-display)',
                  fontSize:    '1rem',
                  fontWeight:  700,
                  color:       'var(--lumio-text)',
                  letterSpacing: '1px',
                }}
              >
                Lumio Coach
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '0.55rem',
                  color:      '#22c55e',
                  letterSpacing: '1px',
                }}
              >
                ● {phaseLabel}
              </div>
            </div>
          </div>

          {/* Phase progress bar */}
          <div
            style={{
              marginTop:  '0.7rem',
              height:     2,
              background: 'var(--lumio-border2)',
              overflow:   'hidden',
            }}
          >
            <div
              style={{
                height:     '100%',
                background: activeMood.g,
                width:      `${Math.min((currentPhase / 3) * 100, 100)}%`,
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex:      1,
          overflowY: 'auto',
          padding:   '1rem',
          display:   'flex',
          flexDirection: 'column',
          gap:       '0.7rem',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display:       'flex',
              alignItems:    'flex-end',
              gap:           '0.5rem',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation:     'lumioFadeIn 0.2s ease',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width:          30,
                height:         30,
                borderRadius:   '50%',
                background:     'var(--lumio-bg4)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '0.9rem',
                flexShrink:     0,
              }}
            >
              {msg.role === 'user' ? '🙋' : '☀️'}
            </div>

            {/* Bubble */}
            <div
              style={{
                padding:    '0.75rem 0.95rem',
                maxWidth:   '80%',
                fontSize:   '0.92rem',
                lineHeight: 1.55,
                background: msg.role === 'user' ? activeMood.g : 'var(--lumio-bg3)',
                border:     msg.role === 'user' ? 'none' : '1px solid var(--lumio-border2)',
                color:      msg.role === 'user' ? '#0a0905' : 'var(--lumio-text)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div
            style={{
              display:    'flex',
              alignItems: 'flex-end',
              gap:        '0.5rem',
            }}
          >
            <div
              style={{
                width:          30,
                height:         30,
                borderRadius:   '50%',
                background:     'var(--lumio-bg4)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '0.9rem',
              }}
            >
              ☀️
            </div>
            <div
              style={{
                padding:    '0.8rem',
                background: 'var(--lumio-bg3)',
                border:     '1px solid var(--lumio-border2)',
                display:    'flex',
                gap:        4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width:        7,
                    height:       7,
                    borderRadius: '50%',
                    background:   'var(--lumio-text3)',
                    display:      'block',
                    animation:    `lumioPulse 1.2s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display:    'flex',
          borderTop:  '1px solid var(--lumio-border)',
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
          placeholder="Type your answer..."
          disabled={loading}
          style={{
            flex:        1,
            background:  'var(--lumio-bg3)',
            border:      'none',
            borderRight: '1px solid var(--lumio-border)',
            color:       'var(--lumio-text)',
            fontFamily:  'var(--font-body)',
            fontSize:    '1rem',
            padding:     '0.85rem 1rem',
            outline:     'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background:  activeMood.accent,
            border:      'none',
            color:       '#0a0905',
            padding:     '0 1.3rem',
            fontSize:    '1.2rem',
            fontWeight:  'bold',
            cursor:      loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity:     loading || !input.trim() ? 0.5 : 1,
            flexShrink:  0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
