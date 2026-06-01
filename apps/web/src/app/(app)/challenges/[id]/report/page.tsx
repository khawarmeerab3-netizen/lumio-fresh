'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingPulse from '@/components/lumio/LoadingPulse';
import { Ring } from '@/components/lumio/Ring';

interface DailyReport {
  greeting: string;
  scoreOutOf10: number;
  progressInsight: string;
  motivationalMessage: string;
  tomorrowPreview: string;
  emoji: string;
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const challengeId = params.id;

  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(false);
    setReport(null);
    setAnimatedScore(0);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed');
      setReport(json.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  // Fetch on first mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Animate score ring when report loads
  useEffect(() => {
    if (!report) return;
    const timer = setTimeout(() => {
      setAnimatedScore(report.scoreOutOf10);
    }, 300);
    return () => clearTimeout(timer);
  }, [report]);

  const today = new Date();
  const dateHeader = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <LoadingPulse />
        <p
          className="text-sm animate-pulse"
          style={{ color: 'var(--color-text2)' }}
        >
          Generating your report…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <span className="text-4xl">⚠️</span>
        <p
          className="text-base text-center"
          style={{ color: 'var(--color-text2)' }}
        >
          Could not generate report. Please try again.
        </p>
        <button
          onClick={fetchReport}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 active:scale-95"
          style={{
            borderColor: 'var(--color-accent)',
            color: 'var(--color-accent)',
            background: 'transparent',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  const scorePercent = Math.round((animatedScore / 10) * 100);

  return (
    <div className="flex flex-col gap-5 px-4 py-5 pb-28 max-w-lg mx-auto">
      {/* Date header */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: 'var(--color-text3)' }}
      >
        {dateHeader}
      </motion.p>

      {/* Greeting card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl p-5 flex flex-col items-center gap-2 text-center"
        style={{ background: 'var(--color-bg3)', border: '1px solid var(--color-border)' }}
      >
        <span className="text-5xl leading-none">{report.emoji}</span>
        <p
          className="text-base italic leading-snug"
          style={{ color: 'var(--color-text2)', fontFamily: 'Lora, serif' }}
        >
          {report.greeting}
        </p>
      </motion.div>

      {/* Score ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-2 py-4"
      >
        <div className="relative flex items-center justify-center">
          <Ring
            done={animatedScore}
            total={10}
            size={110}
            strokeWidth={7}
            accent="var(--color-accent)"
            bg="var(--color-border2)"
            textColor="var(--color-accent)"
          />
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ pointerEvents: 'none' }}
          >
            <span
              className="text-3xl font-bold leading-none"
              style={{ color: 'var(--color-accent)', fontFamily: 'Syne, sans-serif' }}
            >
              {animatedScore}
            </span>
            <span
              className="text-xs leading-none mt-0.5"
              style={{ color: 'var(--color-text3)' }}
            >
              /10
            </span>
          </div>
        </div>
      </motion.div>

      {/* Info cards */}
      {[
        {
          label: 'PROGRESS INSIGHT',
          content: report.progressInsight,
          accent: false,
          italic: false,
          delay: 0.18,
        },
        {
          label: 'YOUR COACH SAYS',
          content: report.motivationalMessage,
          accent: true,
          italic: true,
          delay: 0.24,
        },
        {
          label: "TOMORROW'S PREVIEW",
          content: report.tomorrowPreview,
          accent: false,
          italic: false,
          delay: 0.30,
        },
      ].map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay }}
          className="rounded-2xl p-4"
          style={{
            background: 'var(--color-bg3)',
            border: '1px solid var(--color-border)',
            ...(card.accent
              ? {
                  borderLeft: '3px solid var(--color-accent)',
                  paddingLeft: '16px',
                }
              : {}),
          }}
        >
          <p
            className="text-[10px] font-bold tracking-widest uppercase mb-2"
            style={{ color: 'var(--color-text3)' }}
          >
            {card.label}
          </p>
          <p
            className={`text-sm leading-relaxed ${card.italic ? 'italic' : ''}`}
            style={{
              color: 'var(--color-text2)',
              fontFamily: card.italic ? 'Lora, serif' : 'inherit',
            }}
          >
            {card.content}
          </p>
        </motion.div>
      ))}

      {/* Refresh button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.38 }}
        onClick={fetchReport}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold border transition-all hover:opacity-80 active:scale-95"
        style={{
          borderColor: 'var(--color-border2)',
          color: 'var(--color-text2)',
          background: 'transparent',
        }}
      >
        <span>🔄</span> Refresh Report
      </motion.button>
    </div>
  );
}
