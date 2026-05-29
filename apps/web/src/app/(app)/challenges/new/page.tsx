'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NicheCategory {
  icon:  string;
  label: string;
  color: string;
  items: readonly string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NICHES: NicheCategory[] = [
  { icon: '💰', label: 'Finance',       color: '#fbbf24',
    items: ['Save Money','Invest Smart','Debt Free','Budget Mastery','Financial Freedom','Side Income','Real Estate Basics','Crypto Basics'] },
  { icon: '🍳', label: 'Cooking',       color: '#fb923c',
    items: ['Learn Cooking','Meal Prep','Baking','Healthy Eating','Plant-Based','World Cuisines','Zero Waste Cooking','Home Brewing'] },
  { icon: '💪', label: 'Fitness',       color: '#34d399',
    items: ['Morning Workout','Weight Loss','Muscle Building','Yoga & Flexibility','Running Journey','Home Gym','Sports Training','Posture Fix'] },
  { icon: '📚', label: 'Learning',      color: '#60a5fa',
    items: ['Learn a Language','Speed Reading','Memory Training','Critical Thinking','Math Skills','Writing Mastery','Public Speaking','Research Skills'] },
  { icon: '💼', label: 'Business',      color: '#a78bfa',
    items: ['Start a Business','Personal Branding','Networking','Leadership Skills','Sales Mastery','Product Launch','Remote Work','Career Switch'] },
  { icon: '🧠', label: 'Mental Health', color: '#f472b6',
    items: ['Stress Management','Anxiety Relief','Mindfulness','Journaling','Sleep Optimization','Self-Compassion','Digital Detox','Emotional Balance'] },
  { icon: '👶', label: 'Parenting',     color: '#4ade80',
    items: ['Mindful Parenting','Read with Kids','Screen Time Balance','Positive Discipline','Family Bonding','Kids Nutrition','Homework Habits','Emotional IQ'] },
  { icon: '🎨', label: 'Creative',      color: '#f87171',
    items: ['Learn Drawing','Photography','Music Instrument','Creative Writing','Graphic Design','Pottery & Crafts','Digital Art','Filmmaking'] },
  { icon: '🌱', label: 'Eco Life',      color: '#86efac',
    items: ['Zero Waste Life','Go Vegan','Eco-Friendly Home','Gardening','Minimalism','Upcycling','Green Business','Carbon Footprint'] },
  { icon: '⚙️', label: 'Productivity', color: '#fde047',
    items: ['Deep Work','Morning Routine','Task Management','Focus Training','No Procrastination','Goal Setting','Time Blocking','Inbox Zero'] },
  { icon: '🧘', label: 'Spirituality',  color: '#c4b5fd',
    items: ['Meditation Practice','Gratitude Journal','Manifestation','Spiritual Reading','Prayer Routine','Vision Board','Inner Peace','Energy Work'] },
  { icon: '🤝', label: 'Relationships', color: '#fdba74',
    items: ['Better Communication','Date Night Ideas','Build Friendships','Family Reconnect','Conflict Resolution','Social Skills','Empathy Practice','Community Service'] },
];

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:       { label: 'Free',       color: '#a09060' },
  starter:    { label: 'Starter',    color: '#60a5fa' },
  pro:        { label: 'Pro',        color: '#a78bfa' },
  elite:      { label: 'Elite',      color: '#f59e0b' },
  enterprise: { label: 'Enterprise', color: '#34d399' },
};

// ─── Niche Chip ───────────────────────────────────────────────────────────────

function NicheChip({
  label,
  color,
  selected,
  onClick,
}: {
  label: string;
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={selected ? { borderColor: color, boxShadow: `0 0 12px ${color}40` } : {}}
      className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 flex items-center gap-1.5
        ${selected
          ? 'text-white'
          : 'border-[#2a2418] text-[#a09060] bg-[#100e0a] hover:border-[#362e1e] hover:text-[#fdfaf3]'
        }`}
    >
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xs">✓</motion.span>
      )}
      {label}
    </motion.button>
  );
}

// ─── Category Accordion ───────────────────────────────────────────────────────

function CategoryAccordion({
  category,
  selected,
  onSelect,
  defaultOpen,
}: {
  category: NicheCategory;
  selected: string | null;
  onSelect: (label: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasSelected = category.items.some((item) => item === selected);

  return (
    <div className="border border-[#2a2418] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#100e0a] hover:bg-[#14110c] transition-colors"
      >
        <span className="text-xl">{category.icon}</span>
        <span className="flex-1 text-left font-semibold text-[#fdfaf3] font-[Syne]">{category.label}</span>
        {hasSelected && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            Selected
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#a09060]"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 flex flex-wrap gap-2 bg-[#0c0a08]">
              {category.items.map((item) => (
                <NicheChip
                  key={item}
                  label={item}
                  color={category.color}
                  selected={selected === item}
                  onClick={() => onSelect(item)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NicheSelectPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const preNiche    = searchParams.get('niche');
  const preDays     = searchParams.get('days');

  // Flatten all niche items to pre-select if coming from onboarding
  const initialNiche = useMemo(() => {
    if (!preNiche) return null;
    // Try to find exact match or first item of matching category
    for (const cat of NICHES) {
      if (cat.label.toLowerCase() === preNiche.toLowerCase()) return cat.items[0] ?? null;
      const found = cat.items.find((i) => i.toLowerCase() === preNiche.toLowerCase());
      if (found) return found;
    }
    return null;
  }, [preNiche]);

  const [selectedNiche, setSelectedNiche] = useState<string | null>(initialNiche);
  const [customGoal, setCustomGoal]       = useState('');
  const [search, setSearch]               = useState('');
  // Simulate user plan — in real app read from auth/store
  const userPlan = 'free';
  const planInfo = PLAN_LABELS[userPlan] ?? PLAN_LABELS.free;

  // Find the category of selected niche
  const selectedCategory = useMemo(() => {
    if (!selectedNiche) return null;
    return NICHES.find((cat) => cat.items.includes(selectedNiche)) ?? null;
  }, [selectedNiche]);

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return NICHES;
    const q = search.toLowerCase();
    return NICHES
      .map((cat) => ({ ...cat, items: cat.items.filter((i) => i.toLowerCase().includes(q)) }))
      .filter((cat) => cat.items.length > 0 || cat.label.toLowerCase().includes(q));
  }, [search]);

  const handleContinue = () => {
    if (!selectedNiche) return;
    const params = new URLSearchParams({
      niche:      selectedNiche,
      category:   selectedCategory?.label ?? '',
      color:      selectedCategory?.color ?? '#f59e0b',
      customGoal: customGoal.trim(),
      ...(preDays ? { days: preDays } : {}),
    });
    router.push(`/challenges/new/duration?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#080706] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-[#fdfaf3] font-[Syne]">Choose Your Challenge</h1>
          <span
            className="text-xs px-3 py-1 rounded-full font-bold border"
            style={{ borderColor: `${planInfo.color}40`, color: planInfo.color, backgroundColor: `${planInfo.color}15` }}
          >
            {planInfo.label} Plan
          </span>
        </div>
        <p className="text-[#a09060] text-sm mb-5">Pick the niche that excites you most — your AI plan will be built around it.</p>

        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#504830]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search niches..."
            className="w-full bg-[#100e0a] border-2 border-[#2a2418] rounded-xl pl-9 pr-4 py-3 text-[#fdfaf3] placeholder-[#504830] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#504830] hover:text-[#a09060]">✕</button>
          )}
        </div>
      </div>

      {/* Accordion list — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 max-w-lg mx-auto w-full space-y-2 pb-36">
        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-[#504830]">No niches match &quot;{search}&quot;</div>
        )}
        {filteredCategories.map((cat, i) => (
          <CategoryAccordion
            key={cat.label}
            category={cat as NicheCategory}
            selected={selectedNiche}
            onSelect={(item) => setSelectedNiche(selectedNiche === item ? null : item)}
            defaultOpen={i === 0 || cat.items.some((it) => it === initialNiche)}
          />
        ))}

        {/* Custom goal */}
        {selectedNiche && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <p className="text-[#a09060] text-sm mb-2 font-semibold">Custom goal description (optional)</p>
            <textarea
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value.slice(0, 300))}
              placeholder="Describe exactly what you want to achieve in your own words..."
              rows={3}
              className="w-full bg-[#100e0a] border-2 border-[#2a2418] rounded-xl p-3 text-[#fdfaf3] placeholder-[#504830] resize-none focus:outline-none focus:border-[#f59e0b] transition-colors text-sm"
            />
            <p className="text-right text-xs text-[#504830] mt-1">{customGoal.length}/300</p>
          </motion.div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080706]/95 backdrop-blur-sm border-t border-[#2a2418] p-4">
        <div className="max-w-lg mx-auto">
          {selectedNiche && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-3"
            >
              <span className="text-sm text-[#a09060]">Selected:</span>
              <span
                className="text-sm font-semibold px-3 py-0.5 rounded-full"
                style={{ backgroundColor: `${selectedCategory?.color ?? '#f59e0b'}20`, color: selectedCategory?.color ?? '#f59e0b' }}
              >
                {selectedCategory?.icon} {selectedNiche}
              </span>
            </motion.div>
          )}
          <motion.button
            onClick={handleContinue}
            disabled={!selectedNiche}
            whileHover={selectedNiche ? { scale: 1.02 } : {}}
            whileTap={selectedNiche ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-xl font-bold text-lg font-[Syne] transition-all duration-200
              ${selectedNiche
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-black shadow-lg shadow-[rgba(245,158,11,0.25)]'
                : 'bg-[#1a1610] text-[#504830] cursor-not-allowed'
              }`}
          >
            Continue →
          </motion.button>
        </div>
      </div>
    </div>
  );
}
