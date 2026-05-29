'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizAnswers {
  lifeArea: string;
  goal: string;
  timeAvailable: string;
  experience: string;
  motivationStyle: string;
}

interface NicheRecommendation {
  niche: string;
  reason: string;
}

interface OnboardingRecommendation {
  topNiches: NicheRecommendation[];
  recommendedDuration: { days: number; label: string; reason: string };
  bestCoachType: string;
  whyThisMatters: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LIFE_AREAS = [
  { id: 'finance',       emoji: '💰', label: 'Finance',       desc: 'Money, savings & wealth' },
  { id: 'fitness',       emoji: '💪', label: 'Fitness',       desc: 'Health & physical goals' },
  { id: 'mind',          emoji: '🧠', label: 'Mind',          desc: 'Mental health & clarity' },
  { id: 'career',        emoji: '💼', label: 'Career',        desc: 'Work & professional growth' },
  { id: 'relationships', emoji: '🤝', label: 'Relationships', desc: 'Connection & social skills' },
  { id: 'creative',      emoji: '🎨', label: 'Creative',      desc: 'Art, music & creativity' },
];

const TIME_OPTIONS = [
  { id: '5min',   label: '5 min',  desc: 'Quick daily wins' },
  { id: '10min',  label: '10 min', desc: 'Light commitment' },
  { id: '20min',  label: '20 min', desc: 'Focused sessions' },
  { id: '30min',  label: '30 min', desc: 'Solid commitment' },
  { id: '1hour+', label: '1 hour+', desc: 'Deep transformation' },
];

const EXPERIENCE_OPTIONS = [
  { id: 'beginner',     label: 'Beginner',     emoji: '🌱', desc: "I'm just starting out" },
  { id: 'intermediate', label: 'Intermediate', emoji: '🌿', desc: 'I have some experience' },
  { id: 'advanced',     label: 'Advanced',     emoji: '🏆', desc: "I'm ready for a real challenge" },
];

const MOTIVATION_OPTIONS = [
  { id: 'tracking',    emoji: '📊', label: 'Progress tracking', desc: 'I love seeing data & metrics' },
  { id: 'competition', emoji: '🥊', label: 'Competition',       desc: 'I thrive competing with others' },
  { id: 'coach',       emoji: '🎯', label: 'Coach support',     desc: 'I need guidance & accountability' },
  { id: 'community',   emoji: '🌍', label: 'Community',         desc: 'Strength in numbers' },
];

const TOTAL_STEPS = 5;

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <motion.div
            animate={{
              width: i + 1 === current ? 28 : 10,
              backgroundColor: i + 1 < current ? '#f59e0b' : i + 1 === current ? '#f59e0b' : '#2a2418',
            }}
            transition={{ duration: 0.3 }}
            className="h-2.5 rounded-full"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Life Area Card ───────────────────────────────────────────────────────────

function LifeAreaCard({
  area,
  selected,
  onSelect,
}: {
  area: (typeof LIFE_AREAS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left
        ${selected
          ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.12)] shadow-[0_0_20px_rgba(245,158,11,0.2)]'
          : 'border-[#2a2418] bg-[#100e0a] hover:border-[#362e1e]'
        }`}
    >
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
      <span className="text-4xl">{area.emoji}</span>
      <div>
        <p className="font-semibold text-[#fdfaf3] text-center font-[Syne]">{area.label}</p>
        <p className="text-xs text-[#a09060] text-center mt-0.5">{area.desc}</p>
      </div>
    </motion.button>
  );
}

// ─── Option Button ────────────────────────────────────────────────────────────

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${selected
          ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]'
          : 'border-[#2a2418] bg-[#100e0a] hover:border-[#362e1e]'
        }`}
    >
      {children}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

function RecommendationView({
  rec,
  onStart,
}: {
  rec: OnboardingRecommendation;
  onStart: (niche: string, days: number) => void;
}) {
  const [selectedNiche, setSelectedNiche] = useState(rec.topNiches[0]?.niche ?? '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <p className="text-[#f59e0b] text-sm font-semibold uppercase tracking-widest mb-2">Your Personalised Plan</p>
        <h2 className="text-2xl font-bold text-[#fdfaf3] font-[Syne]">Lumio AI recommends...</h2>
        <p className="text-[#a09060] text-sm mt-2 max-w-sm mx-auto">{rec.whyThisMatters}</p>
      </div>

      {/* Top 3 Niches */}
      <div className="space-y-3">
        <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold">Top Challenges For You</p>
        {rec.topNiches.map((item, i) => (
          <motion.button
            key={item.niche}
            onClick={() => setSelectedNiche(item.niche)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left
              ${selectedNiche === item.niche
                ? 'border-[#f59e0b] bg-[rgba(245,158,11,0.1)]'
                : 'border-[#2a2418] bg-[#100e0a] hover:border-[#362e1e]'
              }`}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#f59e0b] flex items-center justify-center text-xs font-bold text-black">
              {i + 1}
            </div>
            <div>
              <p className="text-[#fdfaf3] font-semibold font-[Syne]">{item.niche}</p>
              <p className="text-[#a09060] text-sm mt-0.5">{item.reason}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recommended Duration */}
      <div className="p-4 rounded-xl border border-[#2a2418] bg-[#100e0a]">
        <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-2">Recommended Duration</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏱️</span>
          <div>
            <p className="text-[#fdfaf3] font-bold font-[Syne]">{rec.recommendedDuration.label}</p>
            <p className="text-[#a09060] text-sm">{rec.recommendedDuration.reason}</p>
          </div>
        </div>
      </div>

      {/* Coach Type */}
      <div className="p-4 rounded-xl border border-[#2a2418] bg-[#100e0a]">
        <p className="text-[#a09060] text-xs uppercase tracking-wider font-semibold mb-1">Best Coach Style For You</p>
        <p className="text-[#fdfaf3]">{rec.bestCoachType}</p>
      </div>

      <motion.button
        onClick={() => onStart(selectedNiche, rec.recommendedDuration.days)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black font-bold text-lg font-[Syne] shadow-lg shadow-[rgba(245,158,11,0.3)]"
      >
        Start My Recommended Challenge ✨
      </motion.button>
    </motion.div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
    >
      {/* Pulsing orbs */}
      <div className="relative w-24 h-24">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-[#f59e0b]"
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">✨</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[#fdfaf3] text-xl font-semibold font-[Syne]">Your AI coach is analysing your answers...</p>
        <p className="text-[#a09060] text-sm mt-2">Crafting your personalised path to growth</p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-[#f59e0b]"
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<OnboardingRecommendation | null>(null);

  const GOAL_MAX = 200;

  const canContinue = () => {
    switch (step) {
      case 1: return !!answers.lifeArea;
      case 2: return goalText.trim().length >= 10;
      case 3: return !!answers.timeAvailable;
      case 4: return !!answers.experience;
      case 5: return !!answers.motivationStyle;
      default: return false;
    }
  };

  const handleContinue = async () => {
    if (step < TOTAL_STEPS) {
      if (step === 2) setAnswers((a) => ({ ...a, goal: goalText.trim() }));
      setStep((s) => s + 1);
      return;
    }

    // Final step — submit
    const finalAnswers: QuizAnswers = {
      lifeArea:        answers.lifeArea ?? '',
      goal:            goalText.trim(),
      timeAvailable:   answers.timeAvailable ?? '',
      experience:      answers.experience ?? '',
      motivationStyle: answers.motivationStyle ?? '',
    };

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalAnswers),
      });

      if (res.ok) {
        const json = await res.json() as { data: OnboardingRecommendation };
        setRecommendation(json.data);
      } else {
        // Fallback recommendation so flow never breaks
        setRecommendation({
          topNiches: [
            { niche: 'Finance', reason: 'Building financial literacy is foundational to every life goal.' },
            { niche: 'Mental Health', reason: 'A clear mind amplifies every other area of growth.' },
            { niche: 'Productivity', reason: 'Better systems = more time for what matters.' },
          ],
          recommendedDuration: { days: 21, label: '21 Days', reason: 'Long enough to build a habit, short enough to stay motivated.' },
          bestCoachType: 'Supportive & data-driven — someone who tracks your wins and keeps you honest.',
          whyThisMatters: 'Your answers show someone ready for real, structured change.',
        });
      }
    } catch {
      // Network fallback
      setRecommendation({
        topNiches: [
          { niche: 'Productivity', reason: 'Mastering your time unlocks everything else.' },
          { niche: 'Mental Health', reason: 'Clarity of mind is the ultimate competitive edge.' },
          { niche: 'Fitness', reason: 'Physical momentum creates mental momentum.' },
        ],
        recommendedDuration: { days: 21, label: '21 Days', reason: 'The science-backed habit formation window.' },
        bestCoachType: 'Motivating & accountability-focused.',
        whyThisMatters: 'Based on your profile, structured challenges work best for you.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartChallenge = (niche: string, days: number) => {
    const params = new URLSearchParams({
      niche: niche,
      days:  String(days),
    });
    router.push(`/challenges/new?${params.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080706] px-4 py-8 flex flex-col">
      <LoadingScreen />
    </div>
  );

  if (recommendation) return (
    <div className="min-h-screen bg-[#080706] px-4 py-8 max-w-lg mx-auto">
      <RecommendationView rec={recommendation} onStart={handleStartChallenge} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080706] px-4 py-8 max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[#f59e0b] text-sm font-semibold uppercase tracking-widest text-center mb-1">
          Step {step} of {TOTAL_STEPS}
        </p>
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── Step 1 ── */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">
                  What area of your life do you most want to improve?
                </h1>
                <p className="text-[#a09060] text-sm mb-6">Choose the one that matters most right now.</p>
                <div className="grid grid-cols-2 gap-3">
                  {LIFE_AREAS.map((area) => (
                    <LifeAreaCard
                      key={area.id}
                      area={area}
                      selected={answers.lifeArea === area.id}
                      onSelect={() => setAnswers((a) => ({ ...a, lifeArea: area.id }))}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">
                  Describe your goal in one sentence
                </h1>
                <p className="text-[#a09060] text-sm mb-6">Be specific — the more detail, the better your plan.</p>
                <div className="relative">
                  <textarea
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value.slice(0, GOAL_MAX))}
                    placeholder="e.g. I want to save $500/month by cutting unnecessary expenses..."
                    rows={5}
                    className="w-full bg-[#100e0a] border-2 border-[#2a2418] rounded-xl p-4 text-[#fdfaf3] placeholder-[#504830] resize-none focus:outline-none focus:border-[#f59e0b] transition-colors"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-[#504830]">
                    {goalText.length}/{GOAL_MAX}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">
                  How much time can you commit daily?
                </h1>
                <p className="text-[#a09060] text-sm mb-6">Be realistic — consistency beats intensity.</p>
                <div className="space-y-3">
                  {TIME_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      selected={answers.timeAvailable === opt.id}
                      onClick={() => setAnswers((a) => ({ ...a, timeAvailable: opt.id }))}
                    >
                      <span className="text-2xl font-bold text-[#f59e0b] font-[Syne] w-16">{opt.label}</span>
                      <span className="text-[#a09060] text-sm">{opt.desc}</span>
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 4 ── */}
            {step === 4 && (
              <div>
                <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">
                  What&apos;s your experience level with this?
                </h1>
                <p className="text-[#a09060] text-sm mb-6">We&apos;ll calibrate your daily tasks accordingly.</p>
                <div className="space-y-3">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      selected={answers.experience === opt.id}
                      onClick={() => setAnswers((a) => ({ ...a, experience: opt.id }))}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="text-[#fdfaf3] font-semibold">{opt.label}</p>
                        <p className="text-[#a09060] text-sm">{opt.desc}</p>
                      </div>
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 5 ── */}
            {step === 5 && (
              <div>
                <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne] mb-2">
                  What keeps you motivated?
                </h1>
                <p className="text-[#a09060] text-sm mb-6">We&apos;ll personalise your experience around this.</p>
                <div className="space-y-3">
                  {MOTIVATION_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      selected={answers.motivationStyle === opt.id}
                      onClick={() => setAnswers((a) => ({ ...a, motivationStyle: opt.id }))}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="text-[#fdfaf3] font-semibold">{opt.label}</p>
                        <p className="text-[#a09060] text-sm">{opt.desc}</p>
                      </div>
                    </OptionButton>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-shrink-0 px-5 py-4 rounded-xl border-2 border-[#2a2418] text-[#a09060] font-semibold hover:border-[#362e1e] transition-colors"
          >
            ←
          </button>
        )}
        <motion.button
          onClick={handleContinue}
          disabled={!canContinue()}
          whileHover={canContinue() ? { scale: 1.02 } : {}}
          whileTap={canContinue() ? { scale: 0.98 } : {}}
          className={`flex-1 py-4 rounded-xl font-bold text-lg font-[Syne] transition-all duration-200
            ${canContinue()
              ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black shadow-lg shadow-[rgba(245,158,11,0.25)]'
              : 'bg-[#1a1610] text-[#504830] cursor-not-allowed'
            }`}
        >
          {step === TOTAL_STEPS ? 'Get My Recommendation ✨' : 'Continue →'}
        </motion.button>
      </div>
    </div>
  );
}
