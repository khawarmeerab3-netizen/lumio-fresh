'use client';

/**
 * apps/web/src/components/lumio/NicheHeader.tsx
 *
 * Full-bleed challenge screen header styled with the niche's visual theme.
 * Used at the top of /challenge/[id]/today and /challenge/[id]/journey.
 */

import { motion } from 'framer-motion';
import { getNicheTheme, nicheGlowStyle } from '@/lib/niche-theme';

// ─── Progress Ring ────────────────────────────────────────────────────────────

function NicheProgressRing({
  progress,
  nicheId,
  currentDay,
  totalDays,
  size = 88,
}: {
  progress: number;
  nicheId: string;
  currentDay: number;
  totalDays: number;
  size?: number;
}) {
  const theme = getNicheTheme(nicheId);
  const stroke = 6;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  const cx = size / 2;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, filter: `drop-shadow(${nicheGlowStyle(nicheId, 'md')})` }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={theme.primaryColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-xl font-black text-white">{currentDay}</span>
        <span className="text-[9px] text-white/40">of {totalDays}</span>
      </div>
    </div>
  );
}

// ─── Niche Badge ──────────────────────────────────────────────────────────────

export function NicheBadge({ nicheId, size = 'md' }: { nicheId: string; size?: 'sm' | 'md' | 'lg' }) {
  const theme = getNicheTheme(nicheId);
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizes[size]}`}
      style={{
        background: theme.bgTint,
        color: theme.primaryColor,
        border: `1px solid ${theme.borderColor}`,
        boxShadow: `0 0 8px ${theme.glowColor}`,
      }}
    >
      <span>{theme.icon}</span>
      <span>{theme.label}</span>
    </span>
  );
}

// ─── NicheHeader ──────────────────────────────────────────────────────────────

interface NicheHeaderProps {
  nicheId: string;
  challengeTitle: string;
  currentDay: number;
  totalDays: number;
  streakCount: number;
  /** Optional: show onboarding step or status label */
  statusLabel?: string;
}

export function NicheHeader({
  nicheId,
  challengeTitle,
  currentDay,
  totalDays,
  streakCount,
  statusLabel,
}: NicheHeaderProps) {
  const theme = getNicheTheme(nicheId);
  const progress = Math.round((currentDay / totalDays) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full overflow-hidden rounded-b-3xl"
      style={{
        background: `linear-gradient(160deg, #0c0b09 0%, ${theme.bgTint.replace('0.07', '0.30')} 55%, #0c0b09 100%)`,
        borderBottom: `1px solid ${theme.borderColor}`,
        boxShadow: `0 8px 32px ${theme.glowColor}`,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Grid-dot overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${theme.glowColor}, transparent)` }}
      />

      <div className="relative z-10 px-5 pt-4 pb-6">
        {/* Niche badge + status */}
        <div className="flex items-center justify-between mb-4">
          <NicheBadge nicheId={nicheId} size="sm" />
          {statusLabel && (
            <span className="text-[10px] text-white/35 font-medium">{statusLabel}</span>
          )}
        </div>

        {/* Main content row */}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-black leading-tight text-white mb-2 line-clamp-2"
            >
              {challengeTitle}
            </h1>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-white/40">Progress</span>
                <span className="text-[10px] font-bold" style={{ color: theme.primaryColor }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: theme.gradientCss.includes('linear') ? theme.primaryColor : theme.primaryColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>

            {/* Streak */}
            {streakCount > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(249,115,22,0.18)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}
              >
                🔥 {streakCount} day streak
              </motion.span>
            )}
          </div>

          {/* Progress ring */}
          <NicheProgressRing
            progress={progress}
            nicheId={nicheId}
            currentDay={currentDay}
            totalDays={totalDays}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Milestone Node ───────────────────────────────────────────────────────────

interface MilestoneNodeProps {
  day: number;
  label: string;
  emoji: string;
  reached: boolean;
  active: boolean;
  nicheId: string;
}

export function MilestoneNode({ day, label, emoji, reached, active, nicheId }: MilestoneNodeProps) {
  const theme = getNicheTheme(nicheId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-1.5 relative"
    >
      {/* Node circle */}
      <motion.div
        animate={active ? { boxShadow: [`0 0 0 0 ${theme.glowColor}`, `0 0 0 10px transparent`] } : {}}
        transition={{ repeat: Infinity, duration: 1.6 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
        style={{
          background: reached
            ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
            : 'rgba(255,255,255,0.06)',
          border: `2px solid ${reached ? theme.primaryColor : 'rgba(255,255,255,0.1)'}`,
          boxShadow: reached ? `0 0 14px ${theme.glowColor}` : 'none',
          color: reached ? '#000' : 'rgba(255,255,255,0.3)',
        }}
      >
        {reached ? emoji : day}
      </motion.div>

      {/* Label */}
      <span
        className="text-[9px] font-semibold text-center max-w-[60px] leading-tight"
        style={{ color: reached ? theme.primaryColor : 'rgba(255,255,255,0.25)' }}
      >
        {label}
      </span>
    </motion.div>
  );
}
