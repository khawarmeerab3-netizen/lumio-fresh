'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ──────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'elite' | 'enterprise';
  points: number;
  streak_current: number;
  is_admin: boolean;
  onboarding_completed: boolean;
  selected_mood: string;
}

interface Challenge {
  id: string;
  niche_id: string;
  niche_color: string;
  title: string;
  goal: string;
  duration_days: number;
  current_day: number;
  completed_days: number[];
  streak: number;
  last_completed_date: string | null;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
}

interface QuickStats {
  totalPoints: number;
  currentStreak: number;
  badgesEarned: number;
  daysCompleted: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NICHE_ICONS: Record<string, string> = {
  fitness: '💪', finance: '💰', cooking: '🍳', spirituality: '🧘',
  learning: '📚', creativity: '🎨', productivity: '⚡', relationships: '❤️',
  parenting: '👨‍👩‍👧', health: '🌿', career: '🚀', mindset: '🧠',
  default: '⭐',
};

const MOOD_ACCENTS: Record<string, { accent: string; soft: string; border: string }> = {
  gold:   { accent: '#f59e0b', soft: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.18)' },
  fire:   { accent: '#f97316', soft: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.18)' },
  ocean:  { accent: '#0ea5e9', soft: 'rgba(14,165,233,0.10)', border: 'rgba(14,165,233,0.18)' },
  forest: { accent: '#22c55e', soft: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.18)'  },
  violet: { accent: '#a855f7', soft: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.18)' },
  rose:   { accent: '#f43f8e', soft: 'rgba(244,63,142,0.10)', border: 'rgba(244,63,142,0.18)' },
  slate:  { accent: '#64748b', soft: 'rgba(100,116,139,0.10)',border: 'rgba(100,116,139,0.18)'},
  aurora: { accent: '#06b6d4', soft: 'rgba(6,182,212,0.10)',  border: 'rgba(6,182,212,0.18)'  },
};

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({
  progress,
  size = 50,
  stroke = 4,
  color,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  const cx = size / 2;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ─── Streak Badge ─────────────────────────────────────────────────────────────

function StreakBadge({ streak, accent }: { streak: number; accent: string }) {
  if (streak < 1) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `rgba(249,115,22,0.18)`, color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)' }}
    >
      🔥 {streak}
    </span>
  );
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({ challenge, accent, onNav }: { challenge: Challenge; accent: string; onNav: () => void }) {
  const progress = Math.round((challenge.completed_days.length / challenge.duration_days) * 100);
  const icon = NICHE_ICONS[challenge.niche_id] ?? NICHE_ICONS.default;
  const lastDate = challenge.last_completed_date
    ? new Date(challenge.last_completed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onNav}
      className="cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Niche icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${challenge.niche_color}22`, border: `1px solid ${challenge.niche_color}40` }}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate leading-tight">{challenge.title}</p>
        <p className="text-xs text-white/40 truncate mt-0.5">{challenge.goal}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-white/50">
            Day {challenge.current_day}/{challenge.duration_days}
          </span>
          <StreakBadge streak={challenge.streak} accent={accent} />
          {lastDate && (
            <span className="text-xs text-white/30">· {lastDate}</span>
          )}
        </div>
      </div>

      {/* Progress ring */}
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 50, height: 50 }}>
        <ProgressRing progress={progress} size={50} stroke={4} color={challenge.niche_color || accent} />
        <span className="absolute text-[10px] font-bold text-white/70">{progress}%</span>
      </div>
    </motion.div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, emoji, accent }: { label: string; value: number | string; emoji: string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col gap-1 flex-1 min-w-0"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span className="text-lg">{emoji}</span>
      <span className="text-xl font-bold text-white leading-none">{value}</span>
      <span className="text-[10px] text-white/40 leading-tight">{label}</span>
    </div>
  );
}

// ─── Greeting ────────────────────────────────────────────────────────────────

function getGreeting(name: string): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 5)  return { text: `Still up, ${name}?`, emoji: '🌙' };
  if (h < 12) return { text: `Good morning, ${name}`, emoji: '🌅' };
  if (h < 17) return { text: `Good afternoon, ${name}`, emoji: '☀️' };
  if (h < 21) return { text: `Good evening, ${name}`, emoji: '🌆' };
  return { text: `Good night, ${name}`, emoji: '🌙' };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('lumio_token');
      if (!token) { router.push('/login'); return; }

      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const [meRes, challengesRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/me`, { headers }),
        fetch(`${apiUrl}/api/challenges?status=active`, { headers }),
        fetch(`${apiUrl}/api/analytics/me/quick`, { headers }),
      ]);

      if (!meRes.ok) { router.push('/login'); return; }

      const [me, challengeData, statsData] = await Promise.all([
        meRes.json(), challengesRes.json(), statsRes.json(),
      ]);

      setUser(me.user ?? me);
      setChallenges(challengeData.challenges ?? []);
      setStats(statsData.stats ?? statsData ?? null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const moodKey = user?.selected_mood ?? 'gold';
  const mood = MOOD_ACCENTS[moodKey] ?? MOOD_ACCENTS.gold;
  const greeting = user ? getGreeting(user.name.split(' ')[0]) : { text: 'Welcome back', emoji: '👋' };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080706' }}>
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-10 h-10 rounded-full"
            style={{ background: mood.accent }}
          />
          <p className="text-white/40 text-sm">Loading your world…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-24">

        {/* ── Onboarding CTA ── */}
        <AnimatePresence>
          {user && !user.onboarding_completed && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-5 rounded-2xl p-4 flex items-center justify-between gap-3"
              style={{ background: `linear-gradient(135deg, ${mood.accent}22, ${mood.accent}10)`, border: `1px solid ${mood.border}` }}
            >
              <div>
                <p className="text-sm font-bold text-white">Complete your setup ✨</p>
                <p className="text-xs text-white/50 mt-0.5">Take the 5-question quiz to get your personalized challenge recommendation</p>
              </div>
              <Link
                href="/onboarding"
                className="text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0"
                style={{ background: mood.accent, color: '#000' }}
              >
                Start →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <p className="text-2xl font-bold text-white leading-tight">
            {greeting.emoji} {greeting.text}
          </p>
          {user && (
            <p className="text-sm text-white/40 mt-1">
              {challenges.length > 0
                ? `You have ${challenges.length} active challenge${challenges.length > 1 ? 's' : ''}`
                : 'Ready to start something great?'}
            </p>
          )}
        </motion.div>

        {/* ── Quick Stats ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6"
          >
            <StatCard label="Points" value={stats.totalPoints.toLocaleString()} emoji="⭐" accent={mood.accent} />
            <StatCard label="Streak" value={stats.currentStreak} emoji="🔥" accent={mood.accent} />
            <StatCard label="Badges" value={stats.badgesEarned} emoji="🏅" accent={mood.accent} />
            <StatCard label="Days Done" value={stats.daysCompleted} emoji="✅" accent={mood.accent} />
          </motion.div>
        )}

        {/* ── Active Challenges ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Active Challenges</h2>
            <Link href="/challenges" className="text-xs font-semibold" style={{ color: mood.accent }}>
              Browse all →
            </Link>
          </div>

          {challenges.length === 0 ? (
            <div
              className="rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <span className="text-4xl">🌱</span>
              <p className="text-sm font-semibold text-white/70">No active challenges yet</p>
              <p className="text-xs text-white/30">Pick a niche, set a goal, and let Lumio AI build your plan</p>
              <Link
                href="/challenges/new"
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: mood.accent, color: '#000' }}
              >
                Start Your First Challenge →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {challenges.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <ChallengeCard
                    challenge={c}
                    accent={mood.accent}
                    onNav={() => router.push(`/challenge/${c.id}/today`)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Start New Challenge ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4"
        >
          <Link
            href="/challenges/new"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all"
            style={{
              background: `linear-gradient(135deg, ${mood.accent}, ${mood.accent}cc)`,
              color: '#000',
              boxShadow: `0 0 24px ${mood.accent}40`,
            }}
          >
            <span>✦</span> Start New Challenge
          </Link>
        </motion.div>

        {/* ── Admin Button ── */}
        {user?.is_admin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/admin/overview"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              🛡 Admin Dashboard →
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}
