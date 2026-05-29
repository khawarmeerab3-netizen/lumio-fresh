'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PublicUser {
  id: string;
  name: string;
  avatar_url?: string;
  plan: string;
  streak_current: number;
  streak_longest: number;
  is_following: boolean;
  created_at: string;
}

interface PublicStats {
  challengesCompleted: number;
  currentStreak: number;
  totalPoints: number;
  badgesEarned: number;
}

interface PublicBadge {
  id: string;
  name: string;
  emoji: string;
  earned_at: string;
}

interface RecentPost {
  id: string;
  content: string;
  niche_id?: string;
  likes_count: number;
  created_at: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: '#64748b', starter: '#22c55e', pro: '#0ea5e9', elite: '#f59e0b', enterprise: '#a855f7',
};

const NICHE_EMOJIS: Record<string, string> = {
  fitness: '💪', finance: '💰', cooking: '🍳', spirituality: '🧘',
  learning: '📚', creativity: '🎨', productivity: '⚡', relationships: '❤️',
  parenting: '👨‍👩‍👧', health: '🌿', career: '🚀', mindset: '🧠',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const [user, setUser] = useState<PublicUser | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [badges, setBadges] = useState<PublicBadge[]>([]);
  const [posts, setPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('lumio_token')}`, 'Content-Type': 'application/json' });

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiUrl}/api/users/${userId}/public`, { headers: getHeaders() });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) return;
      const data = await res.json();

      setUser(data.user ?? data);
      setStats(data.stats ?? null);
      setBadges(data.badges ?? []);
      setPosts(data.recentPosts ?? []);
      setFollowing(data.user?.is_following ?? false);
    } catch (err) {
      console.error('Public profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    try {
      const method = wasFollowing ? 'DELETE' : 'POST';
      await fetch(`${apiUrl}/api/users/${userId}/follow`, { method, headers: getHeaders() });
    } catch {
      setFollowing(wasFollowing); // revert on error
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080706' }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="w-8 h-8 rounded-full bg-amber-500"
        />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#080706' }}>
        <span className="text-5xl">👤</span>
        <p className="text-white/50 text-sm">User not found</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl text-xs text-white/50 border border-white/10"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const planColor = PLAN_COLORS[user.plan] ?? PLAN_COLORS.free;
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-24">

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6"
        >
          ← Back
        </button>

        {/* ── Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black flex-shrink-0"
            style={{ background: '#1c1810', border: '2px solid rgba(245,158,11,0.25)' }}
          >
            {user.avatar_url
              ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <span style={{ color: '#f59e0b' }}>{initials}</span>}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white truncate">{user.name}</h1>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44` }}
            >
              {user.plan}
            </span>
          </div>

          <button
            onClick={handleFollowToggle}
            disabled={followLoading}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={
              following
                ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                : { background: '#f59e0b', color: '#000' }
            }
          >
            {followLoading ? '…' : following ? 'Following' : 'Follow'}
          </button>
        </motion.div>

        {/* ── Stats ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-4 gap-2 mb-8"
          >
            {[
              { label: 'Completed', value: stats.challengesCompleted, emoji: '🏆' },
              { label: 'Streak',    value: `${stats.currentStreak}d`,  emoji: '🔥' },
              { label: 'Points',    value: stats.totalPoints > 999 ? `${(stats.totalPoints/1000).toFixed(1)}k` : stats.totalPoints, emoji: '⭐' },
              { label: 'Badges',    value: stats.badgesEarned,          emoji: '🏅' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl p-3 flex flex-col gap-1 items-center text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="text-lg font-black text-white leading-none">{s.value}</span>
                <span className="text-[9px] text-white/30">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-8"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Earned Badges</h2>
            <div className="flex flex-wrap gap-2">
              {badges.map(b => (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
                  title={new Date(b.earned_at).toLocaleDateString()}
                >
                  <span className="text-base">{b.emoji}</span>
                  <span className="text-xs font-semibold text-amber-300">{b.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Recent Posts ── */}
        {posts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Recent Posts</h2>
            <div className="flex flex-col gap-3">
              {posts.map(p => (
                <div
                  key={p.id}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {p.niche_id && (
                    <span className="text-xs text-white/30 mb-2 block">
                      {NICHE_EMOJIS[p.niche_id] ?? '📌'} {p.niche_id}
                    </span>
                  )}
                  <p className="text-sm text-white/75 leading-relaxed">{p.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-white/25">❤️ {p.likes_count}</span>
                    <span className="text-xs text-white/20">· {timeAgo(p.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
