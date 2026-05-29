'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'coach';
  content: string;
  id: string;
}

const QUICK_CHIPS = [
  'How am I doing?',
  "I'm struggling today",
  'Give me a tip',
  'What to focus on?',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--color-text3)' }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

export default function CoachPage() {
  const params = useParams<{ id: string }>();
  const challengeId = params.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [coachName, setCoachName] = useState('Lumio Coach');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || limitReached) return;

    const userMsg: Message = { role: 'user', content, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}/coach/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: content,
            history: messages.slice(-6).map((m) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })),
          }),
        }
      );
      const json = await res.json();

      if (res.status === 429 || json.error?.includes('limit')) {
        setLimitReached(true);
        return;
      }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed');

      const coachMsg: Message = {
        role: 'coach',
        content: json.data.reply ?? json.data,
        id: (Date.now() + 1).toString(),
      };
      if (json.data.coachName) setCoachName(json.data.coachName);
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      const errorMsg: Message = {
        role: 'coach',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        id: (Date.now() + 1).toString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] max-w-lg mx-auto">
      {/* Coach header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg2)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
          style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border2)' }}
        >
          🤖
        </div>
        <div className="flex flex-col">
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--color-text)', fontFamily: 'Syne, sans-serif' }}
          >
            {coachName}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text3)' }}>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }}
            />
            Online 24/7
          </span>
        </div>
      </div>

      {/* Plan limit banner */}
      <AnimatePresence>
        {limitReached && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 px-4 py-3 text-sm text-center font-medium"
            style={{
              background: 'var(--color-soft)',
              color: 'var(--color-accent)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            You&apos;ve reached your daily AI limit.{' '}
            <a href="/settings/plan" className="underline font-bold">
              Upgrade to continue chatting
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-10">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--color-text3)' }}>
              Ask your coach anything about your challenge
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i === messages.length - 1 ? 0 : 0 }}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mb-0.5"
              style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border)' }}
            >
              {msg.role === 'user' ? '🧑' : '🤖'}
            </div>

            {/* Bubble */}
            <div
              className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? {
                      background: 'var(--color-g)',
                      color: '#fff',
                      borderBottomRightRadius: '4px',
                    }
                  : {
                      background: 'var(--color-bg3)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderBottomLeftRadius: '4px',
                    }
              }
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border)' }}
              >
                🤖
              </div>
              <div
                className="rounded-2xl"
                style={{
                  background: 'var(--color-bg3)',
                  border: '1px solid var(--color-border)',
                  borderBottomLeftRadius: '4px',
                }}
              >
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Quick chips */}
      <div
        className="px-4 py-2 shrink-0 overflow-x-auto flex gap-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => sendMessage(chip)}
            disabled={loading || limitReached}
            className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95 shrink-0 disabled:opacity-40"
            style={{
              borderColor: 'var(--color-border2)',
              color: 'var(--color-text2)',
              background: 'var(--color-bg3)',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className="px-4 py-3 shrink-0 flex items-center gap-2 border-t"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg2)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading || limitReached}
          placeholder="Ask your coach..."
          className="flex-1 bg-transparent outline-none rounded-xl px-3 py-2.5 text-sm border transition-all disabled:opacity-40"
          style={{
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--color-accent)';
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)';
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading || limitReached}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-80 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          style={{ background: 'var(--color-g)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
