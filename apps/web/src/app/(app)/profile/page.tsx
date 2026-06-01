'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  plan: string;
  points: number;
  total_points_earned: number;
  streak_current: number;
  streak_longest: number;
  selected_mood: string;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned_at?: string;
  earned: boolean;
}

interface CompletedChallenge {
  id: string;
  title: string;
  niche_id: string;
  niche_color: string;
  duration_days: number;
  completed_at: string;
}

interface ProfileStats {
  totalDaysCompleted: number;
  longestStreak: number;
  totalPoints: number;
  badgesEarned: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NICHE_ICONS: Record<string, string> = {
  fitness: '💪', finance: '💰', cooking: '🍳', spirituality: '🧘',
  learning: '📚', creativity: '🎨', productivity: '⚡', relationships: '❤️',
  parenting: '👨‍👩‍👧', health: '🌿', career: '🚀', mindset: '🧠', default: '⭐',
};

const PLAN_COLORS: Record<string, { color: string; label: string }> = {
  free:       { color: '#64748b', label: 'Free' },
  starter:    { color: '#22c55e', label: 'Starter' },
  pro:        { color: '#0ea5e9', label: 'Pro' },
  elite:      { color: '#f59e0b', label: 'Elite' },
  enterprise: { color: '#a855f7', label: 'Enterprise' },
};

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
  user,
  onClose,
  onSave,
}: {
  user: UserProfile;
  onClose: () => void;
  onSave: (name: string, avatarFile?: File) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [avatarFile, setAvatarFile] = useState<File | undefined>();
  const [preview, setPreview] = useState(user.avatar_url);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const submit = async () => {
    setSaving(true);
    try { await onSave(name, avatarFile); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: '#131110', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <h3 className="text-base font-bold text-white mb-5">Edit Profile</h3>

        {/* Avatar picker */}
        <div className="flex flex-col items-center mb-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden group"
          >
            {preview
              ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#2a2418' }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold">
              Change
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-white/30 mt-2">Tap to change avatar</p>
        </div>

        {/* Name */}
        <div className="mb-5">
          <label className="block text-xs text-white/40 mb-1.5">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-amber-500/50"
            maxLength={40}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-white/50 border border-white/10">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: '#f59e0b', color: '#000' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Badge Grid ───────────────────────────────────────────────────────────────

function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {badges.map(b => (
        <motion.div
          key={b.id}
          whileHover={{ scale: 1.08 }}
          className="flex flex-col items-center gap-1 p-2 rounded-xl cursor-default"
          style={{
            background: b.earned ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${b.earned ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}`,
            filter: b.earned ? 'none' : 'grayscale(1)',
            opacity: b.earned ? 1 : 0.4,
          }}
          title={`${b.name} — ${b.description}`}
        >
          <span className="text-xl">{b.emoji}</span>
          <span className="text-[9px] text-white/50 text-center leading-tight truncate w-full text-center">{b.name}</span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Flame Animation ─────────────────────────────────────────────────────────

function FlameStreak({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.08, 1], rotate: [-2, 2, -2] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="text-5xl leading-none"
      >
        {streak > 0 ? '🔥' : '💤'}
      </motion.div>
      <span className="text-3xl font-black text-white tabular-nums">{streak}</span>
      <span className="text-xs text-white/40">day streak</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completed, setCompleted] = useState<CompletedChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('lumio-token')}`, 'Content-Type': 'application/json' });

  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('lumio-token');
      if (!token) { router.push('/login'); return; }

      const [meRes, badgesRes, completedRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/me`, { headers: getHeaders() }),
        fetch(`${apiUrl}/api/badges/me`, { headers: getHeaders() }),
        fetch(`${apiUrl}/api/challenges?status=completed`, { headers: getHeaders() }),
        fetch(`${apiUrl}/api/analytics/me/quick`, { headers: getHeaders() }),
      ]);

      const [me, badgeData, completedData, statsData] = await Promise.all([
        meRes.json(), badgesRes.json(), completedRes.json(), statsRes.json(),
      ]);

      setProfile(me.user ?? me);
      setBadges(badgeData.badges ?? []);
      setCompleted(completedData.challenges ?? []);
      setStats(statsData.stats ?? statsData);
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (name: string, avatarFile?: File) => {
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (avatarFile) fd.append('avatar', avatarFile);

      const res = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('lumio-token')}` },
        body: fd,
      });
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.user ?? data);
    } catch (err) {
      console.error('Save profile error:', err);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080706' }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          className="text-2xl"
        >⬡</motion.div>
      </div>
    );
  }

  const planConfig = PLAN_COLORS[profile.plan] ?? PLAN_COLORS.free;
  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-8 pb-24">

        {/* ── Profile Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-black"
              style={{ background: '#1c1810', border: '2px solid rgba(245,158,11,0.3)' }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span style={{ color: '#f59e0b' }}>{initials}</span>}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white truncate">{profile.name}</h1>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
              style={{ background: `${planConfig.color}22`, color: planConfig.color, border: `1px solid ${planConfig.color}44` }}
            >
              {planConfig.label}
            </span>
            <p className="text-xs text-white/30 mt-1">
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Edit
          </button>
        </motion.div>

        {/* ── Streak ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <FlameStreak streak={profile.streak_current} />
        </motion.div>

        {/* ── Stats Grid ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-8"
          >
            {[
              { label: 'Days Completed', value: stats.totalDaysCompleted, emoji: '✅' },
              { label: 'Longest Streak', value: stats.longestStreak + 'd', emoji: '🔥' },
              { label: 'Total Points', value: stats.totalPoints.toLocaleString(), emoji: '⭐' },
              { label: 'Badges Earned', value: stats.badgesEarned, emoji: '🏅' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-2xl p-4 flex flex-col gap-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-2xl font-black text-white leading-none">{s.value}</span>
                <span className="text-xs text-white/35">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Badge Collection</h2>
            <BadgeGrid badges={badges} />
          </motion.div>
        )}

        {/* ── Completed Challenges ── */}
        {completed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Completed Challenges</h2>
            <div className="flex flex-col gap-2">
              {completed.map(c => (
                <div
                  key={c.id}
                  className="rounded-xl p-3 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: `${c.niche_color}22`, border: `1px solid ${c.niche_color}40` }}
                  >
                    {NICHE_ICONS[c.niche_id] ?? NICHE_ICONS.default}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-xs text-white/30">{c.duration_days} days</p>
                  </div>
                  <p className="text-xs text-white/25 flex-shrink-0">
                    {new Date(c.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {editOpen && (
          <EditProfileModal user={profile} onClose={() => setEditOpen(false)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
