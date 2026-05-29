'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuddyInvite {
  id:           string;
  fromUserId:   string;
  fromName:     string;
  fromAvatar:   string | null;
  challengeGoal: string;
  sentAt:       string;
}

interface DayCompletion {
  day:       number;
  completed: boolean;
}

interface ActiveBuddy {
  id:           string;
  buddyUserId:  string;
  buddyName:    string;
  buddyAvatar:  string | null;
  challengeGoal: string;
  durationDays: number;
  currentDay:   number;
  completedDays: number[];
  streak:       number;
  nicheColor:   string;
}

interface UserChallenge {
  id:    string;
  goal:  string;
  niche: string;
}

interface UserSearchResult {
  id:     string;
  name:   string;
  avatar: string | null;
  plan:   string;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_INVITES: BuddyInvite[] = [
  { id: 'inv1', fromUserId: 'u1', fromName: 'Marcus Williams', fromAvatar: null, challengeGoal: 'Build a 7-day workout streak', sentAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'inv2', fromUserId: 'u2', fromName: 'Priya Sharma',    fromAvatar: null, challengeGoal: 'Save $200 this month',         sentAt: new Date(Date.now() - 3600000 * 18).toISOString() },
];

const DEMO_BUDDIES: ActiveBuddy[] = [
  { id: 'b1', buddyUserId: 'u3', buddyName: 'Sarah Chen', buddyAvatar: null,
    challengeGoal: 'Morning Workout — 21 days', durationDays: 21, currentDay: 14,
    completedDays: [1,2,3,4,5,6,7,8,10,11,12,13,14], streak: 5, nicheColor: '#34d399' },
  { id: 'b2', buddyUserId: 'u4', buddyName: 'Omar Hassan', buddyAvatar: null,
    challengeGoal: 'Invest Smart — 30 days', durationDays: 30, currentDay: 9,
    completedDays: [1,2,3,5,6,8,9], streak: 2, nicheColor: '#fbbf24' },
];

const DEMO_CHALLENGES: UserChallenge[] = [
  { id: 'ch1', goal: 'Morning Workout Habit', niche: '💪 Fitness' },
  { id: 'ch2', goal: 'Save $500 This Month',  niche: '💰 Finance' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1)   return 'just now';
  if (diff < 60)  return `${diff}m ago`;
  const h = Math.round(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function progressPct(completed: number[], total: number): number {
  return Math.round((completed.length / total) * 100);
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, avatarUrl, size = 40, color = '#f59e0b' }: { name: string; avatarUrl: string | null; size?: number; color?: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatarUrl) return <img src={avatarUrl} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}25`, border: `1.5px solid ${color}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color, flexShrink: 0, userSelect: 'none' }}>
      {initials}
    </div>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 52 }: { pct: number; color: string; size?: number }) {
  const r   = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2a2418" strokeWidth={5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ strokeDasharray: circ }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
      </div>
    </div>
  );
}

// ─── Day Grid ─────────────────────────────────────────────────────────────────

function DayGrid({ durationDays, completedDays, color }: { durationDays: number; completedDays: number[]; color: string }) {
  const completed = new Set(completedDays);
  const cols      = Math.min(durationDays, 30);

  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {Array.from({ length: cols }, (_, i) => {
        const day = i + 1;
        const done = completed.has(day);
        return (
          <motion.div
            key={day}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.015 }}
            title={`Day ${day}${done ? ' ✓' : ''}`}
            style={{
              width: 18, height: 18, borderRadius: 4,
              backgroundColor: done ? color : '#1e1a14',
              border: `1px solid ${done ? color : '#2a2418'}`,
              opacity: done ? 1 : 0.5,
            }}
          />
        );
      })}
      {durationDays > 30 && (
        <span className="text-[10px] text-[#504830] self-end ml-1">+{durationDays - 30} more</span>
      )}
    </div>
  );
}

// ─── Invite Card ──────────────────────────────────────────────────────────────

function InviteCard({ invite, onAccept, onDecline }: { invite: BuddyInvite; onAccept: () => void; onDecline: () => void }) {
  const [acting, setActing] = useState<'accept' | 'decline' | null>(null);

  const handle = async (action: 'accept' | 'decline') => {
    setActing(action);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buddies/${invite.id}/${action}`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* ignore */ }
    if (action === 'accept') onAccept();
    else onDecline();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="p-4 rounded-xl border-2 border-[#2a2418] bg-[#100e0a]"
    >
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={invite.fromName} avatarUrl={invite.fromAvatar} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#fdfaf3] font-[Syne]">{invite.fromName}</p>
          <p className="text-[#a09060] text-xs mt-0.5">wants to be your accountability buddy</p>
          <p className="text-[#fdfaf3] text-sm mt-1 italic">"{invite.challengeGoal}"</p>
        </div>
        <span className="text-[10px] text-[#504830] flex-shrink-0">{timeAgo(invite.sentAt)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handle('accept')}
          disabled={!!acting}
          className="flex-1 py-2 rounded-lg bg-[rgba(52,211,153,0.15)] text-[#34d399] text-sm font-semibold border border-[rgba(52,211,153,0.3)] hover:bg-[rgba(52,211,153,0.25)] transition-colors disabled:opacity-50"
        >
          {acting === 'accept' ? '...' : '✓ Accept'}
        </button>
        <button
          onClick={() => handle('decline')}
          disabled={!!acting}
          className="flex-1 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] text-sm font-semibold border border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.2)] transition-colors disabled:opacity-50"
        >
          {acting === 'decline' ? '...' : '✕ Decline'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Buddy Card ───────────────────────────────────────────────────────────────

function BuddyCard({ buddy }: { buddy: ActiveBuddy }) {
  const [expanded, setExpanded] = useState(false);
  const pct = progressPct(buddy.completedDays, buddy.durationDays);

  return (
    <motion.div layout className="rounded-xl border-2 border-[#2a2418] bg-[#100e0a] overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar name={buddy.buddyName} avatarUrl={buddy.buddyAvatar} size={44} color={buddy.nicheColor} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#fdfaf3] font-[Syne]">{buddy.buddyName}</p>
          <p className="text-[#a09060] text-xs mt-0.5 truncate">{buddy.challengeGoal}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[#504830]">🔥 {buddy.streak}d streak</span>
            <span className="text-xs text-[#504830]">Day {buddy.currentDay}/{buddy.durationDays}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ProgressRing pct={pct} color={buddy.nicheColor} />
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] text-[#a09060] hover:text-[#fdfaf3] transition-colors underline underline-offset-2"
          >
            {expanded ? 'Hide' : 'View Progress'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#1e1a14]"
          >
            <div className="px-4 pb-4 pt-3">
              <p className="text-[#a09060] text-xs font-semibold uppercase tracking-wider mb-2">Day Completion Grid</p>
              <DayGrid durationDays={buddy.durationDays} completedDays={buddy.completedDays} color={buddy.nicheColor} />
              <p className="text-xs text-[#504830] mt-2">
                {buddy.completedDays.length} of {buddy.durationDays} days completed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ challenges, onClose }: { challenges: UserChallenge[]; onClose: () => void }) {
  const [search,     setSearch]     = useState('');
  const [results,    setResults]    = useState<UserSearchResult[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState<UserSearchResult | null>(null);
  const [challenge,  setChallenge]  = useState(challenges[0]?.id ?? '');
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${encodeURIComponent(q)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const json = await res.json() as { data: UserSearchResult[] };
        setResults(json.data);
      } else {
        // Demo results
        setResults([
          { id: 'r1', name: 'Alex Rivera',  avatar: null, plan: 'pro'   },
          { id: 'r2', name: 'Luna Rodriguez', avatar: null, plan: 'starter' },
        ].filter((r) => r.name.toLowerCase().includes(q.toLowerCase())));
      }
    } catch {
      setResults([{ id: 'r1', name: 'Alex Rivera', avatar: null, plan: 'pro' }]);
    } finally {
      setSearching(false);
    }
  };

  const sendInvite = async () => {
    if (!selected || !challenge) return;
    setSending(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buddies/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ toUserId: selected.id, challengeId: challenge }),
      });
    } catch { /* ignore */ }
    setSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        className="w-full max-w-lg bg-[#100e0a] border-2 border-[#2a2418] rounded-2xl p-5"
      >
        {sent ? (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
              <span className="text-5xl">🤝</span>
            </motion.div>
            <p className="text-[#fdfaf3] font-bold font-[Syne] text-xl mt-3">Invite Sent!</p>
            <p className="text-[#a09060] text-sm mt-1 mb-4">
              {selected?.name} will receive your buddy request.
            </p>
            <button onClick={onClose} className="px-6 py-2 rounded-xl bg-[#f59e0b] text-black font-bold text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#fdfaf3] font-[Syne]">Invite a Buddy</h2>
              <button onClick={onClose} className="text-[#504830] hover:text-[#a09060] text-xl leading-none">✕</button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#504830]">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); doSearch(e.target.value); }}
                placeholder="Search by name or email..."
                className="w-full bg-[#0c0a08] border-2 border-[#2a2418] rounded-xl pl-9 pr-4 py-3 text-[#fdfaf3] placeholder-[#504830] focus:outline-none focus:border-[#f59e0b] transition-colors text-sm"
              />
            </div>

            {/* Results */}
            {searching && <p className="text-[#a09060] text-sm text-center py-2">Searching...</p>}
            {results.length > 0 && (
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelected(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${selected?.id === user.id ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.08)]' : 'border-[#2a2418] hover:border-[#362e1e]'}`}
                  >
                    <Avatar name={user.name} avatarUrl={user.avatar} size={34} />
                    <span className="text-[#fdfaf3] font-semibold text-sm">{user.name}</span>
                    {selected?.id === user.id && <span className="ml-auto text-[#f59e0b] text-sm">✓</span>}
                  </button>
                ))}
              </div>
            )}

            {/* Challenge selector */}
            {selected && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-2">Link to which challenge?</p>
                <div className="space-y-2">
                  {challenges.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setChallenge(ch.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                        ${challenge === ch.id ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.08)]' : 'border-[#2a2418] hover:border-[#362e1e]'}`}
                    >
                      <span className="text-sm">{ch.niche}</span>
                      <span className="text-[#fdfaf3] text-sm truncate">{ch.goal}</span>
                      {challenge === ch.id && <span className="ml-auto text-[#f59e0b] flex-shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.button
              onClick={sendInvite}
              disabled={!selected || !challenge || sending}
              whileHover={selected && challenge ? { scale: 1.02 } : {}}
              whileTap={selected && challenge ? { scale: 0.98 } : {}}
              className={`w-full py-3.5 rounded-xl font-bold font-[Syne] transition-all
                ${selected && challenge ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black shadow-lg shadow-[rgba(245,158,11,0.25)]' : 'bg-[#1a1610] text-[#504830] cursor-not-allowed'}`}
            >
              {sending ? 'Sending...' : 'Send Buddy Invite 🤝'}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BuddiesPage() {
  const [invites,    setInvites]    = useState<BuddyInvite[]>([]);
  const [buddies,    setBuddies]    = useState<ActiveBuddy[]>([]);
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [invRes, budRes, chalRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buddies/invites`,   { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/buddies`,           { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/active`, { credentials: 'include' }),
        ]);
        if (invRes.ok)  { const j = await invRes.json()  as { data: BuddyInvite[] };    setInvites(j.data); }
        else              setInvites(DEMO_INVITES);
        if (budRes.ok)  { const j = await budRes.json()  as { data: ActiveBuddy[] };    setBuddies(j.data); }
        else              setBuddies(DEMO_BUDDIES);
        if (chalRes.ok) { const j = await chalRes.json() as { data: UserChallenge[] };  setChallenges(j.data); }
        else              setChallenges(DEMO_CHALLENGES);
      } catch {
        setInvites(DEMO_INVITES);
        setBuddies(DEMO_BUDDIES);
        setChallenges(DEMO_CHALLENGES);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const acceptInvite  = (id: string) => setInvites((prev) => prev.filter((i) => i.id !== id));
  const declineInvite = (id: string) => setInvites((prev) => prev.filter((i) => i.id !== id));

  return (
    <>
      <div className="min-h-screen bg-[#080706] flex flex-col">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne]">Buddies</h1>
            <motion.button
              onClick={() => setShowInvite(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold text-sm font-[Syne] shadow-md shadow-[rgba(245,158,11,0.25)]"
            >
              🤝 Invite Buddy
            </motion.button>
          </div>
          <p className="text-[#a09060] text-sm">Accountability partners keep you 2× more consistent.</p>
        </div>

        <div className="flex-1 px-4 max-w-lg mx-auto w-full pb-10 space-y-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#100e0a] animate-pulse border border-[#1e1a14]" />
              ))}
            </div>
          ) : (
            <>
              {/* Pending Invitations */}
              <AnimatePresence>
                {invites.length > 0 && (
                  <motion.section layout>
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold">Pending Invitations</p>
                      <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-black text-[10px] font-bold flex items-center justify-center">
                        {invites.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {invites.map((inv) => (
                          <InviteCard
                            key={inv.id}
                            invite={inv}
                            onAccept={() => acceptInvite(inv.id)}
                            onDecline={() => declineInvite(inv.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* Active Buddies */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold">Active Buddies</p>
                  <span className="text-xs text-[#504830]">{buddies.length}</span>
                </div>

                {buddies.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#2a2418] rounded-xl">
                    <p className="text-4xl mb-3">🤝</p>
                    <p className="text-[#a09060] font-semibold">No active buddies yet</p>
                    <p className="text-[#504830] text-sm mt-1">Invite a friend to keep each other accountable.</p>
                    <button
                      onClick={() => setShowInvite(true)}
                      className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.25)] transition-colors"
                    >
                      Invite Someone →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buddies.map((buddy) => (
                      <BuddyCard key={buddy.id} buddy={buddy} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showInvite && (
          <InviteModal challenges={challenges} onClose={() => setShowInvite(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
