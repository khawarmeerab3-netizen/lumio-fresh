'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  'Analysing your goal...',
  'Understanding your timeline...',
  'Designing milestones...',
  'Crafting daily habits...',
  'Personalising your journey...',
  'Adding quick wins...',
  'Polishing the details...',
  'Almost ready...',
];

// ─── Ambient Orb ─────────────────────────────────────────────────────────────

function MoodOrb({
  size,
  color,
  x,
  y,
  delay,
}: {
  size:  number;
  color: string;
  x:     string;
  y:     string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{
        x:       [0, 30, -20, 10, 0],
        y:       [0, -20, 30, -10, 0],
        scale:   [1, 1.2, 0.9, 1.1, 1],
        opacity: [0.4, 0.7, 0.5, 0.8, 0.4],
      }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        left:     x,
        top:      y,
        width:    size,
        height:   size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}60, ${color}10)`,
        filter:   `blur(${size / 3}px)`,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Pulsing Rings ────────────────────────────────────────────────────────────

function PulsingRings({ color }: { color: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
          transition={{ duration: 2.4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position:     'absolute',
            width:        80,
            height:       80,
            borderRadius: '50%',
            border:       `2px solid ${color}`,
          }}
        />
      ))}
      {/* Core orb */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width:        80,
          height:       80,
          borderRadius: '50%',
          background:   `radial-gradient(circle, ${color}, ${color}80)`,
          boxShadow:    `0 0 40px ${color}80`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     32,
          position:     'relative',
          zIndex:       10,
        }}
      >
        ✨
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GeneratingPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const niche      = searchParams.get('niche')      ?? 'Fitness';
  const category   = searchParams.get('category')   ?? '';
  const color      = searchParams.get('color')       ?? '#f59e0b';
  const customGoal = searchParams.get('customGoal')  ?? '';
  const days       = searchParams.get('days')        ?? '21';

  const [stepIndex,  setStepIndex]  = useState(0);
  const [progress,   setProgress]   = useState(0);
  const [error,      setError]      = useState<string | null>(null);
  const called = useRef(false);

  // Rotate step text every 1.2s
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Animate progress bar (fake smooth progress while API runs)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 4 + 1;
      if (current >= 90) { clearInterval(interval); current = 90; }
      setProgress(Math.min(current, 90));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Call API on mount
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const createChallenge = async () => {
      try {
        const body = {
          nicheId:    niche,
          category,
          goal:       niche,
          customGoal: customGoal || undefined,
          duration:   Number(days),
          color,
        };

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:    JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json() as { error?: string };
          throw new Error(json.error ?? 'Failed to create challenge');
        }

        const json = await res.json() as { data: { id: string } };
        const challengeId = json.data.id;

        // Complete progress bar
        setProgress(100);
        await new Promise((r) => setTimeout(r, 600));

        router.push(`/challenges/new/review?id=${challengeId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setProgress(0);
      }
    };

    createChallenge();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#080706' }}
    >
      {/* Ambient orbs */}
      <MoodOrb size={400} color={color} x="-15%"  y="-10%" delay={0}   />
      <MoodOrb size={300} color="#a855f7"       x="60%"  y="60%" delay={1.5} />
      <MoodOrb size={250} color={color}         x="50%"  y="-20%" delay={3}   />
      <MoodOrb size={200} color="#0ea5e9"        x="-5%"  y="70%"  delay={4.5} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-sm w-full text-center">
        {/* Pulsing rings */}
        <PulsingRings color={color} />

        {/* Step text */}
        <div className="h-8">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-lg font-semibold text-[#fdfaf3] font-[Syne]"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </div>

        {/* Niche + duration context */}
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
          >
            {niche}
          </span>
          <span className="text-[#a09060] text-sm">·</span>
          <span className="text-sm text-[#a09060]">{days} days</span>
        </div>

        {/* Progress bar */}
        {!error && (
          <div className="w-full">
            <div className="h-1.5 bg-[#1a1610] rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
              />
            </div>
            <p className="text-xs text-[#504830] mt-2">
              {progress < 90 ? 'Crafting your personalised AI plan...' : 'Finalising...'}
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-center"
          >
            <p className="text-red-400 font-semibold mb-1">Something went wrong</p>
            <p className="text-red-400/70 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="text-sm text-[#f59e0b] hover:underline"
            >
              ← Go back and try again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
