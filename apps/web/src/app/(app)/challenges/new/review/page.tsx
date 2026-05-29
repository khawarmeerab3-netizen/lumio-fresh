'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyMilestone {
  milestone: string;
  timeframe: string;
}

interface AIPlan {
  title:            string;
  tagline:          string;
  overview:         string;
  dailyHabits:      string[];
  weeklyMilestones: WeeklyMilestone[];
  successMetrics:   string[];
  quickWins:        string[];
  proTip:           string;
}

interface Challenge {
  id:             string;
  nicheId:        string;
  nicheCategory:  string;
  nicheColor:     string;
  title:          string;
  goal:           string;
  durationDays:   number;
  aiPlan:         AIPlan;
  coachId:        string | null;
}

interface Coach {
  id:         string;
  name:       string;
  title:      string;
  gender:     'male' | 'female' | 'neutral';
  personality: string;
  catchphrase: string;
  avatarUrl:  string;
  isSupersonic: boolean;
  minPlan:    string;
}

// ─── Milestone Map ────────────────────────────────────────────────────────────

const MILESTONE_MAP: Record<number, { d: number; l: string }[]> = {
  1:   [{ d:1,   l:'Done! 🏆' }],
  3:   [{ d:1,   l:'Start' }, { d:2, l:'Day 2' }, { d:3, l:'Done! 🏆' }],
  7:   [{ d:1,   l:'Start' }, { d:3, l:'Day 3' }, { d:5, l:'Day 5' }, { d:7, l:'Week! 🏆' }],
  15:  [{ d:1,   l:'Start' }, { d:3, l:'3 Days' }, { d:7, l:'Week 1' }, { d:10, l:'Day 10' }, { d:15, l:'Done! 🏆' }],
  21:  [{ d:1,   l:'Start' }, { d:7, l:'Week 1' }, { d:14, l:'Week 2' }, { d:21, l:'Habit! 🏆' }],
  30:  [{ d:1,   l:'Start' }, { d:7, l:'Week 1' }, { d:14, l:'2 Wks' }, { d:21, l:'3 Wks' }, { d:30, l:'Month! 🏆' }],
  90:  [{ d:1,   l:'Start' }, { d:30, l:'Month 1' }, { d:60, l:'Month 2' }, { d:90, l:'Quarter! 🏆' }],
  180: [{ d:1,   l:'Start' }, { d:30, l:'M1' }, { d:60, l:'M2' }, { d:90, l:'M3' }, { d:120, l:'M4' }, { d:150, l:'M5' }, { d:180, l:'6mo! 🏆' }],
  365: [{ d:1,   l:'Start' }, { d:90, l:'Q1' }, { d:180, l:'Half' }, { d:270, l:'Q3' }, { d:365, l:'1yr! 👑' }],
};

function getMilestones(days: number) {
  if (days in MILESTONE_MAP) return MILESTONE_MAP[days];
  // Nearest key fallback
  const keys = Object.keys(MILESTONE_MAP).map(Number).sort((a, b) => a - b);
  const nearest = keys.reduce((prev, curr) => Math.abs(curr - days) < Math.abs(prev - days) ? curr : prev);
  return MILESTONE_MAP[nearest] ?? [];
}

// ─── Quick Win Tag ────────────────────────────────────────────────────────────

const QUICK_WIN_TAGS = ['24h', '3d', '7d'];

// ─── Plan Gate Check ─────────────────────────────────────────────────────────

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3, enterprise: 4 };

function canAccessCoach(coachMinPlan: string, userPlan: string): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[coachMinPlan] ?? 0);
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#080706] px-4 py-8 max-w-lg mx-auto animate-pulse space-y-5">
      <div className="h-6 bg-[#1a1610] rounded-xl w-1/3" />
      <div className="h-10 bg-[#1a1610] rounded-xl w-3/4" />
      <div className="h-4 bg-[#1a1610] rounded-xl w-2/3" />
      <div className="h-32 bg-[#1a1610] rounded-xl" />
      <div className="h-24 bg-[#1a1610] rounded-xl" />
      <div className="h-48 bg-[#1a1610] rounded-xl" />
    </div>
  );
}

// ─── Coach Card ───────────────────────────────────────────────────────────────

function CoachCard({
  coach,
  selected,
  userPlan,
  onSelect,
}: {
  coach:    Coach;
  selected: boolean;
  userPlan: string;
  onSelect: () => void;
}) {
  const locked = !canAccessCoach(coach.minPlan, userPlan);

  return (
    <motion.button
      onClick={locked ? undefined : onSelect}
      whileHover={locked ? {} : { scale: 1.02 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
        ${locked
          ? 'border-[#1e1a14] bg-[#0c0a08] opacity-60 cursor-not-allowed'
          : selected
            ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]'
            : 'border-[#2a2418] bg-[#100e0a] hover:border-[#362e1e]'
        }`}
    >
      {/* Avatar placeholder */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg border-2"
        style={{ borderColor: selected ? '#f59e0b' : '#2a2418', backgroundColor: '#1a1610' }}
      >
        {coach.isSupersonic ? '⚡' : coach.gender === 'female' ? '👩' : '👨'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold font-[Syne] ${locked ? 'text-[#504830]' : 'text-[#fdfaf3]'}`}>{coach.name}</span>
          {coach.isSupersonic && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.2)] text-[#f59e0b] font-bold">SUPERSONIC</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize
            ${coach.minPlan === 'elite' ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]'
              : coach.minPlan === 'pro' ? 'bg-[rgba(167,139,250,0.15)] text-[#a78bfa]'
              : 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa]'}`}
          >
            {coach.minPlan}+
          </span>
          {locked && <span className="text-xs text-[#504830]">🔒</span>}
        </div>
        <p className={`text-xs mt-0.5 ${locked ? 'text-[#3a3020]' : 'text-[#a09060]'}`}>{coach.title}</p>
        {!locked && (
          <p className="text-xs text-[#f59e0b] mt-1 italic">"{coach.catchphrase}"</p>
        )}
      </div>

      {selected && !locked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const challengeId  = searchParams.get('id') ?? '';

  const [challenge,    setChallenge]    = useState<Challenge | null>(null);
  const [coaches,      setCoaches]      = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [starting,     setStarting]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Simulate user plan — in real app read from auth/store
  const userPlan = 'free';

  // Fetch challenge + coaches on mount
  useEffect(() => {
    if (!challengeId) { setError('No challenge ID provided.'); setLoading(false); return; }

    const fetchData = async () => {
      try {
        const [chalRes, coachRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coaches`, { credentials: 'include' }),
        ]);

        if (!chalRes.ok) throw new Error('Challenge not found');
        const chalJson = await chalRes.json() as { data: Challenge };
        setChallenge(chalJson.data);

        if (coachRes.ok) {
          const coachJson = await coachRes.json() as { data: Coach[] };
          // Filter to coaches for this niche
          const filtered = coachJson.data.filter(
            (c) => c.id.includes(chalJson.data.nicheId?.toLowerCase().replace(/\s/g, '_') ?? '')
          );
          setCoaches(filtered.length ? filtered : coachJson.data.slice(0, 5));
        }
      } catch (err) {
        // Demo fallback so UI always renders beautifully
        const demoColor = '#f59e0b';
        setChallenge({
          id:            challengeId,
          nicheId:       'Fitness',
          nicheCategory: 'Fitness',
          nicheColor:    demoColor,
          title:         '21-Day Morning Warrior Protocol',
          goal:          'Build an unbreakable morning workout habit',
          durationDays:  21,
          coachId:       null,
          aiPlan: {
            title:    '21-Day Morning Warrior Protocol',
            tagline:  'Rise before the world wakes, and conquer before it starts.',
            overview: 'This challenge transforms your mornings into your most powerful weapon. Through progressive daily workouts, mindset rituals, and body composition tracking, you will build the discipline that separates achievers from dreamers.',
            dailyHabits: [
              'Wake up at 6:00 AM, no snooze allowed',
              'Complete your 20-min morning workout before coffee',
              'Log your energy level 1-10 in the app',
              'Cold shower or face wash to activate your nervous system',
            ],
            weeklyMilestones: [
              { milestone: 'Foundation Week — establish your routine',         timeframe: 'Days 1–7'   },
              { milestone: 'Intensity Week — push your limits',                timeframe: 'Days 8–14'  },
              { milestone: 'Mastery Week — make it second nature',             timeframe: 'Days 15–21' },
            ],
            successMetrics: [
              '21 consecutive morning workouts completed',
              'Resting heart rate dropped by 5+ BPM',
              'Morning mood score averaged 7+ out of 10',
            ],
            quickWins: [
              'First workout done — you have already beaten 80% of people who start',
              'Day 3 complete — your brain is starting to wire the habit',
              'First full week — your body is adapting and craving this',
            ],
            proTip: "Set your workout clothes out the night before. The morning you decide what to wear is the morning you find an excuse not to go. Remove every friction point between you and your first rep.",
          },
        });
        setCoaches([
          { id: 'fitness_1', name: 'Alex Rivera',   title: 'Elite Performance Coach', gender: 'male',   personality: 'Intense and motivating', catchphrase: 'Pain is weakness leaving the body.', avatarUrl: '', isSupersonic: false, minPlan: 'starter' },
          { id: 'fitness_2', name: 'Maya Chen',     title: 'Holistic Fitness Expert',  gender: 'female', personality: 'Warm and science-based',  catchphrase: 'Consistency over intensity, always.', avatarUrl: '', isSupersonic: false, minPlan: 'starter' },
          { id: 'fitness_3', name: 'Jordan Blake',  title: 'Sports Psychologist',       gender: 'male',   personality: 'Strategic and data-driven', catchphrase: 'Track it. Improve it. Own it.', avatarUrl: '', isSupersonic: false, minPlan: 'pro' },
          { id: 'fitness_4', name: 'Sofia Martins', title: 'Movement Therapist',        gender: 'female', personality: 'Nurturing and technical',    catchphrase: 'Your body is your greatest investment.', avatarUrl: '', isSupersonic: false, minPlan: 'pro' },
          { id: 'fitness_s', name: 'PULSE',         title: 'Your Relentless Fitness Accountability Engine', gender: 'neutral', personality: 'Uncompromising', catchphrase: 'Excuses don\'t burn calories.', avatarUrl: '', isSupersonic: true, minPlan: 'elite' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [challengeId]);

  const handleStart = async () => {
    if (!challenge) return;
    setStarting(true);
    try {
      if (selectedCoach) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challenge.id}/set-coach`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:    JSON.stringify({ coachId: selectedCoach }),
        });
      }
      router.push(`/challenges/${challenge.id}`);
    } catch {
      // Still navigate even if coach assignment fails
      router.push(`/challenges/${challenge.id}`);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (error || !challenge) return (
    <div className="min-h-screen bg-[#080706] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-red-400 font-semibold mb-2">Failed to load your plan</p>
        <p className="text-[#a09060] text-sm mb-4">{error}</p>
        <button onClick={() => router.back()} className="text-[#f59e0b] hover:underline text-sm">← Go back</button>
      </div>
    </div>
  );

  const { aiPlan, nicheColor, durationDays, nicheCategory } = challenge;
  const milestones = getMilestones(durationDays);
  const canSelectCoach = userPlan !== 'free';

  return (
    <div className="min-h-screen bg-[#080706] flex flex-col">
      <div className="flex-1 px-4 pt-6 pb-40 max-w-lg mx-auto w-full space-y-6">

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{ backgroundColor: `${nicheColor}20`, color: nicheColor, border: `1px solid ${nicheColor}40` }}
          >
            {nicheCategory}
          </span>
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]">
            {durationDays} Days
          </span>
        </motion.div>

        {/* Plan title & tagline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h1 className="text-3xl font-bold text-[#fdfaf3] font-[Syne] leading-tight mb-2">
            {aiPlan.title}
          </h1>
          <p className="text-[#a09060] italic font-[Lora] text-base leading-relaxed">
            {aiPlan.tagline}
          </p>
        </motion.div>

        {/* Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-[#100e0a] border border-[#2a2418]"
        >
          <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-2">Your Journey</p>
          <p className="text-[#fdfaf3] text-sm leading-relaxed">{aiPlan.overview}</p>
        </motion.div>

        {/* Journey Map — horizontal scroll */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-3">Journey Map</p>
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-2 min-w-max px-1">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 text-xs font-bold"
                      style={{
                        borderColor: i === 0 ? nicheColor : i === milestones.length - 1 ? '#f59e0b' : '#2a2418',
                        backgroundColor: i === 0 || i === milestones.length - 1 ? `${nicheColor}20` : '#100e0a',
                        color: i === milestones.length - 1 ? '#f59e0b' : nicheColor,
                      }}
                    >
                      {i === milestones.length - 1 ? '🏆' : `D${m.d}`}
                    </motion.div>
                    <span className="text-[10px] text-[#504830] text-center max-w-[56px] leading-tight">{m.l}</span>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-8 h-0.5 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${nicheColor}60, #2a2418)` }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Wins */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-3">Quick Wins 🎯</p>
          <div className="space-y-2">
            {aiPlan.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#100e0a] border border-[#2a2418]">
                <span
                  className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                  style={{ backgroundColor: `${nicheColor}20`, color: nicheColor }}
                >
                  {QUICK_WIN_TAGS[i] ?? `W${i + 1}`}
                </span>
                <p className="text-[#fdfaf3] text-sm">{win}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Daily Habits */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-3">Daily Habits</p>
          <div className="space-y-2">
            {aiPlan.dailyHabits.map((habit, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[rgba(52,211,153,0.2)] flex items-center justify-center text-xs text-[#34d399] mt-0.5">✓</span>
                <p className="text-[#fdfaf3] text-sm">{habit}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Milestones */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.33 }}>
          <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-3">Milestones</p>
          <div className="space-y-2">
            {aiPlan.weeklyMilestones.map((ms, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#100e0a] border border-[#2a2418]">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${nicheColor}20`, color: nicheColor }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="text-[#fdfaf3] text-sm font-semibold">{ms.milestone}</p>
                  <p className="text-[#a09060] text-xs mt-0.5">{ms.timeframe}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pro Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.36 }}
          className="relative p-4 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)]"
          style={{ borderLeft: `3px solid #f59e0b` }}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-[#f59e0b] text-xs uppercase tracking-wider font-bold mb-1">Pro Tip</p>
              <p className="text-[#fdfaf3] text-sm leading-relaxed">{aiPlan.proTip}</p>
            </div>
          </div>
        </motion.div>

        {/* Coach Selection */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold">Choose Your Coach</p>
            {!canSelectCoach && (
              <span className="text-xs text-[#f59e0b] font-semibold">Upgrade to unlock →</span>
            )}
          </div>

          {!canSelectCoach ? (
            <div className="p-4 rounded-xl border border-[#2a2418] bg-[#100e0a] text-center">
              <p className="text-[#fdfaf3] font-semibold mb-1">AI Coaches available on Starter+</p>
              <p className="text-[#a09060] text-sm mb-3">Get a personalised AI coach who knows your exact challenge and keeps you accountable every day.</p>
              <a
                href="/pricing"
                className="inline-block px-4 py-2 rounded-lg bg-[rgba(245,158,11,0.15)] text-[#f59e0b] text-sm font-semibold border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.25)] transition-colors"
              >
                View Plans →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {coaches.map((coach) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  selected={selectedCoach === coach.id}
                  userPlan={userPlan}
                  onSelect={() => setSelectedCoach(coach.id === selectedCoach ? null : coach.id)}
                />
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080706]/95 backdrop-blur-sm border-t border-[#2a2418] p-4">
        <div className="max-w-lg mx-auto">
          {selectedCoach && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#a09060] text-center mb-2"
            >
              Coach: <span className="text-[#fdfaf3] font-semibold">{coaches.find((c) => c.id === selectedCoach)?.name}</span>
            </motion.p>
          )}
          <motion.button
            onClick={handleStart}
            disabled={starting}
            whileHover={!starting ? { scale: 1.02 } : {}}
            whileTap={!starting ? { scale: 0.98 } : {}}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold text-lg font-[Syne] shadow-lg shadow-[rgba(245,158,11,0.3)] disabled:opacity-70 transition-all"
          >
            {starting ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
                Starting your challenge...
              </span>
            ) : (
              'Start Day 1 Now 🚀'
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
