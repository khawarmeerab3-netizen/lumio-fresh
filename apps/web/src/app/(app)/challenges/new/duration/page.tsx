'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Duration {
  label:   string;
  days:    number;
  free:    boolean;
  emoji:   string;
  desc:    string;
  popular?: boolean;
  best?:   boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATIONS: Duration[] = [
  { label: '1 Day',    days: 1,   free: true,  emoji: '⚡', desc: 'Quick win — perfect for testing the waters' },
  { label: '3 Days',   days: 3,   free: true,  emoji: '🔥', desc: 'Mini sprint — build early momentum' },
  { label: '7 Days',   days: 7,   free: true,  emoji: '✨', desc: 'One week — feel the difference' },
  { label: '15 Days',  days: 15,  free: false, emoji: '🌙', desc: 'Half month — establish real patterns' },
  { label: '21 Days',  days: 21,  free: false, emoji: '💎', desc: 'Habit former — science-backed sweet spot', popular: true },
  { label: '30 Days',  days: 30,  free: false, emoji: '🏆', desc: 'Full month — deep transformation begins' },
  { label: '90 Days',  days: 90,  free: false, emoji: '🚀', desc: 'Life quarter — become a different person', best: true },
  { label: '6 Months', days: 180, free: false, emoji: '🌟', desc: 'Deep change — mastery-level commitment' },
  { label: '1 Year',   days: 365, free: false, emoji: '👑', desc: 'Life changer — you will never look back' },
];

// ─── Duration Row ─────────────────────────────────────────────────────────────

function DurationRow({
  duration,
  selected,
  userPlan,
  onClick,
}: {
  duration: Duration;
  selected: boolean;
  userPlan: string;
  onClick: () => void;
}) {
  const isLocked = !duration.free && userPlan === 'free';

  return (
    <motion.button
      onClick={isLocked ? undefined : onClick}
      whileHover={isLocked ? {} : { scale: 1.01 }}
      whileTap={isLocked ? {} : { scale: 0.99 }}
      className={`relative w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
        ${isLocked
          ? 'border-[#1e1a14] bg-[#0c0a08] opacity-60 cursor-not-allowed'
          : selected
            ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
            : 'border-[#2a2418] bg-[#100e0a] hover:border-[#362e1e]'
        }`}
    >
      {/* Emoji */}
      <span className="text-2xl flex-shrink-0 w-8 text-center">{duration.emoji}</span>

      {/* Label & desc */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold font-[Syne] ${isLocked ? 'text-[#504830]' : 'text-[#fdfaf3]'}`}>
            {duration.label}
          </span>
          {duration.popular && !isLocked && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.2)] text-[#f59e0b] font-semibold">
              Popular
            </span>
          )}
          {duration.best && !isLocked && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.2)] text-[#34d399] font-semibold">
              Best Results
            </span>
          )}
        </div>
        <p className={`text-sm mt-0.5 ${isLocked ? 'text-[#3a3020]' : 'text-[#a09060]'}`}>{duration.desc}</p>
      </div>

      {/* Right side */}
      {isLocked ? (
        <Link
          href="/pricing"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[#f59e0b] hover:text-[#fbbf24] font-semibold border border-[#2a2418] rounded-lg px-3 py-1.5 hover:border-[#f59e0b] transition-colors"
        >
          🔒 Upgrade
        </Link>
      ) : selected ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f59e0b] flex items-center justify-center"
        >
          <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      ) : null}
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DurationPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const niche      = searchParams.get('niche')      ?? '';
  const category   = searchParams.get('category')   ?? '';
  const color      = searchParams.get('color')       ?? '#f59e0b';
  const customGoal = searchParams.get('customGoal')  ?? '';
  const preDay     = searchParams.get('days');

  // Simulate user plan — in real app read from auth/store
  const userPlan = 'free';

  const getInitialDays = () => {
    if (!preDay) return null;
    const d = Number(preDay);
    const found = DURATIONS.find((du) => du.days === d);
    if (!found) return null;
    if (!found.free && userPlan === 'free') return null;
    return d;
  };

  const [selectedDays, setSelectedDays] = useState<number | null>(getInitialDays);

  const selectedDuration = DURATIONS.find((d) => d.days === selectedDays);

  const handleGenerate = () => {
    if (!selectedDays) return;
    const params = new URLSearchParams({
      niche,
      category,
      color,
      customGoal,
      days: String(selectedDays),
    });
    router.push(`/challenges/new/generating?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#080706] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#a09060] hover:text-[#fdfaf3] mb-4 transition-colors text-sm">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">Choose Your Duration</h1>
        <p className="text-[#a09060] text-sm mb-5">Longer challenges produce deeper transformation.</p>

        {/* Selected niche/goal tag */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
          >
            {niche}
          </span>
          {customGoal && (
            <span className="text-xs text-[#a09060] italic truncate max-w-xs">"{customGoal}"</span>
          )}
        </div>

        {/* Free plan note */}
        {userPlan === 'free' && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] mb-5">
            <span className="text-lg flex-shrink-0">💡</span>
            <div>
              <p className="text-[#fdfaf3] text-sm font-semibold">Free plan includes 1, 3 &amp; 7 day challenges</p>
              <p className="text-[#a09060] text-xs mt-0.5">
                Upgrade to unlock 15-day to 1-year durations.{' '}
                <Link href="/pricing" className="text-[#f59e0b] hover:underline">See plans →</Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Duration list */}
      <div className="flex-1 overflow-y-auto px-4 max-w-lg mx-auto w-full space-y-2 pb-40">
        {DURATIONS.map((d) => (
          <DurationRow
            key={d.days}
            duration={d}
            selected={selectedDays === d.days}
            userPlan={userPlan}
            onClick={() => setSelectedDays(d.days)}
          />
        ))}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080706]/95 backdrop-blur-sm border-t border-[#2a2418] p-4">
        <div className="max-w-lg mx-auto">
          {selectedDuration && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="text-sm text-[#a09060]">Duration:</span>
              <span className="text-sm font-bold text-[#fdfaf3]">
                {selectedDuration.emoji} {selectedDuration.label}
              </span>
              {selectedDuration.popular && <span className="text-xs text-[#f59e0b]">· Popular choice</span>}
            </motion.div>
          )}
          <motion.button
            onClick={handleGenerate}
            disabled={!selectedDays}
            whileHover={selectedDays ? { scale: 1.02 } : {}}
            whileTap={selectedDays ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-lg font-[Syne] transition-all duration-200
              ${selectedDays
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black shadow-lg shadow-[rgba(245,158,11,0.25)]'
                : 'bg-[#1a1610] text-[#504830] cursor-not-allowed'
              }`}
          >
            Generate My Plan ✨
          </motion.button>
        </div>
      </div>
    </div>
  );
}
