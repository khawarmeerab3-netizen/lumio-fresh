'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank:        number;
  userId:      string;
  name:        string;
  avatarUrl:   string | null;
  plan:        string;
  pointsWeek:  number;
  pointsTotal: number;
  streak:      number;
  nicheId:     string;
  isCurrentUser: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NICHES = [
  { id: 'all',           icon: '🌍', label: 'All Niches' },
  { id: 'finance',       icon: '💰', label: 'Finance',       color: '#fbbf24' },
  { id: 'cooking',       icon: '🍳', label: 'Cooking',       color: '#fb923c' },
  { id: 'fitness',       icon: '💪', label: 'Fitness',       color: '#34d399' },
  { id: 'learning',      icon: '📚', label: 'Learning',      color: '#60a5fa' },
  { id: 'business',      icon: '💼', label: 'Business',      color: '#a78bfa' },
  { id: 'mental_health', icon: '🧠', label: 'Mental Health', color: '#f472b6' },
  { id: 'parenting',     icon: '👶', label: 'Parenting',     color: '#4ade80' },
  { id: 'creative',      icon: '🎨', label: 'Creative',      color: '#f87171' },
  { id: 'eco_life',      icon: '🌱', label: 'Eco Life',      color: '#86efac' },
  { id: 'productivity',  icon: '⚙️',  label: 'Productivity', color: '#fde047' },
  { id: 'spirituality',  icon: '🧘', label: 'Spirituality',  color: '#c4b5fd' },
  { id: 'relationships', icon: '🤝', label: 'Relationships', color: '#fdba74' },
];

const PLAN_BADGES: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',    color: '#a09060' },
  starter:    { label: 'Starter', color: '#60a5fa' },
  pro:        { label: 'Pro',     color: '#a78bfa' },
  elite:      { label: 'Elite',   color: '#f59e0b' },
  enterprise: { label: 'Ent',     color: '#34d399' },
};

const RANK_STYLES: Record<number, { bg: string; text: string; shadow: string }> = {
  1: { bg: '#f59e0b', text: '#000', shadow: 'rgba(245,158,11,0.5)' },
  2: { bg: '#9ca3af', text: '#000', shadow: 'rgba(156,163,175,0.5)' },
  3: { bg: '#b45309', text: '#fff', shadow: 'rgba(180,83,9,0.5)'   },
};

// Demo data generator
function buildDemoData(niche: string, period: 'week' | 'alltime'): LeaderboardEntry[] {
  const names = ['Sarah Chen','Marcus Williams','Priya Sharma','James O\'Brien','Aisha Patel',
    'Ethan Kowalski','Luna Rodriguez','Omar Hassan','Mei Lin','Alex Petrov',
    'Fatima Al-Rashid','David Nkosi','Isabella Costa','Ryo Tanaka','Chloe Dubois',
    'Arjun Mehta','Zara Ahmed','Liam O\'Sullivan','Yuki Yamamoto','Nadia Ivanova'];
  const niches = NICHES.filter((n) => n.id !== 'all').map((n) => n.id);
  const plans  = ['free','starter','starter','pro','pro','pro','elite','elite'];

  return names.map((name, i) => ({
    rank:        i + 1,
    userId:      `user_${i}`,
    name,
    avatarUrl:   null,
    plan:        plans[Math.floor(Math.random() * plans.length)] ?? 'free',
    pointsWeek:  period === 'week' ? Math.floor(Math.random() * 800 + 100) - i * 35 : 0,
    pointsTotal: Math.floor(Math.random() * 12000 + 500) - i * 400,
    streak:      Math.max(0, Math.floor(Math.random() * 60) - i * 2),
    nicheId:     niche === 'all' ? (niches[i % niches.length] ?? 'fitness') : niche,
    isCurrentUser: i === 7, // pretend user is rank 8
  })).sort((a, b) =>
    period === 'week' ? b.pointsWeek - a.pointsWeek : b.pointsTotal - a.pointsTotal
  ).map((e, i) => ({ ...e, rank: i + 1 }));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const colors   = ['#f59e0b','#34d399','#60a5fa','#a78bfa','#f87171','#fb923c','#4ade80','#f472b6'];
  const color    = colors[name.charCodeAt(0) % colors.length] ?? '#f59e0b';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, borderRadius: '50%', background: `${color}30`, border: `1.5px solid ${color}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700,
        color, flexShrink: 0, userSelect: 'none' }}
    >
      {initials}
    </div>
  );
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];
  if (style) {
    return (
      <div
        style={{ width: 32, height: 32, borderRadius: '50%', background: style.bg, color: style.text,
          boxShadow: `0 0 12px ${style.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, flexShrink: 0 }}
      >
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
      </div>
    );
  }
  return (
    <div style={{ width: 32, flexShrink: 0, textAlign: 'center', color: '#504830', fontWeight: 700, fontSize: 14 }}>
      {rank}
    </div>
  );
}

// ─── Leaderboard Row ──────────────────────────────────────────────────────────

function LeaderboardRow({ entry, period, index }: { entry: LeaderboardEntry; period: 'week' | 'alltime'; index: number }) {
  const planBadge = PLAN_BADGES[entry.plan] ?? PLAN_BADGES.free;
  const points    = period === 'week' ? entry.pointsWeek : entry.pointsTotal;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all"
      style={entry.isCurrentUser
        ? { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.08)', boxShadow: '0 0 16px rgba(245,158,11,0.12)' }
        : { borderColor: '#2a2418', background: '#100e0a' }
      }
    >
      <RankBadge rank={entry.rank} />
      <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size={38} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold font-[Syne] truncate ${entry.isCurrentUser ? 'text-[#f59e0b]' : 'text-[#fdfaf3]'}`}>
            {entry.name}
            {entry.isCurrentUser && <span className="ml-1 text-xs">(you)</span>}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
            style={{ backgroundColor: `${planBadge.color}20`, color: planBadge.color }}
          >
            {planBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-[#504830]">🔥 {entry.streak}d streak</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-bold text-[#fdfaf3] font-[Syne]">{points.toLocaleString()}</p>
        <p className="text-[10px] text-[#504830]">pts {period === 'week' ? 'this week' : 'total'}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [period,  setPeriod]  = useState<'week' | 'alltime'>('week');
  const [niche,   setNiche]   = useState('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const activeNiche = NICHES.find((n) => n.id === niche);

  const fetchLeaderboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ period, ...(niche !== 'all' && { niche }) });
      const res    = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?${params.toString()}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed');
      const json = await res.json() as { data: LeaderboardEntry[] };
      setEntries(json.data);
    } catch {
      setEntries(buildDemoData(niche, period));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastRefreshed(new Date());
    }
  }, [period, niche]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // Find current user even if outside top 20
  const currentUser = entries.find((e) => e.isCurrentUser);
  const top20       = entries.slice(0, 20);
  const showCurrent = currentUser && !top20.find((e) => e.isCurrentUser);

  const timeAgo = Math.round((Date.now() - lastRefreshed.getTime()) / 60000);

  return (
    <div className="min-h-screen bg-[#080706] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne]">Leaderboard</h1>
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-[#a09060] hover:text-[#fdfaf3] transition-colors px-3 py-1.5 rounded-lg border border-[#2a2418] hover:border-[#362e1e]"
          >
            <motion.span animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              ↻
            </motion.span>
            {refreshing ? 'Refreshing...' : timeAgo === 0 ? 'Just now' : `${timeAgo}m ago`}
          </button>
        </div>
        <p className="text-[#a09060] text-sm mb-5">Who&apos;s crushing their goals this week?</p>

        {/* Period toggle */}
        <div className="flex gap-2 mb-5 p-1 bg-[#100e0a] rounded-xl border border-[#2a2418]">
          {(['week', 'alltime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 font-[Syne]
                ${period === p ? 'bg-[#f59e0b] text-black shadow-sm' : 'text-[#a09060] hover:text-[#fdfaf3]'}`}
            >
              {p === 'week' ? '📅 This Week' : '👑 All Time'}
            </button>
          ))}
        </div>

        {/* Niche filter — horizontal scroll */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {NICHES.map((n) => {
              const isActive = niche === n.id;
              const col      = 'color' in n ? n.color : '#f59e0b';
              return (
                <button
                  key={n.id}
                  onClick={() => setNiche(n.id)}
                  style={isActive ? { borderColor: col, backgroundColor: `${col}20`, color: col } : {}}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all duration-200 flex-shrink-0
                    ${isActive ? '' : 'border-[#2a2418] text-[#a09060] bg-[#100e0a] hover:border-[#362e1e] hover:text-[#fdfaf3]'}`}
                >
                  <span>{n.icon}</span>
                  <span>{n.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 max-w-lg mx-auto w-full pb-10 space-y-2">
        {/* Context label */}
        <div className="flex items-center gap-2 mb-1">
          {activeNiche && 'color' in activeNiche && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: `${activeNiche.color}20`, color: activeNiche.color }}
            >
              {activeNiche.icon} {activeNiche.label}
            </span>
          )}
          <span className="text-xs text-[#504830]">Top 20 performers</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[#100e0a] animate-pulse border border-[#1e1a14]" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={`${period}-${niche}`} className="space-y-2">
              {top20.map((entry, i) => (
                <LeaderboardRow key={entry.userId} entry={entry} period={period} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Current user if outside top 20 */}
        {!loading && showCurrent && currentUser && (
          <div>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-[#2a2418]" />
              <span className="text-xs text-[#504830]">your ranking</span>
              <div className="flex-1 h-px bg-[#2a2418]" />
            </div>
            <LeaderboardRow entry={currentUser} period={period} index={0} />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-16 text-[#504830]">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-semibold text-[#a09060]">No rankings yet</p>
            <p className="text-sm mt-1">Complete daily tasks to earn points and climb the board!</p>
          </div>
        )}
      </div>
    </div>
  );
}
