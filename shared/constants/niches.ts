// Lumio — shared/constants/niches.ts — All 12 niche categories with visual definitions

import type { Niche, NicheVisual } from '../types/index';

export const NICHES: Niche[] = [
  {
    icon: '💰',
    label: 'Finance',
    color: '#fbbf24',
    items: [
      'Save Money',
      'Invest Smart',
      'Debt Free',
      'Budget Mastery',
      'Financial Freedom',
      'Side Income',
      'Real Estate Basics',
      'Crypto Basics',
    ],
  },
  {
    icon: '🍳',
    label: 'Cooking',
    color: '#fb923c',
    items: [
      'Learn Cooking',
      'Meal Prep',
      'Baking',
      'Healthy Eating',
      'Plant-Based',
      'World Cuisines',
      'Zero Waste Cooking',
      'Home Brewing',
    ],
  },
  {
    icon: '💪',
    label: 'Fitness',
    color: '#34d399',
    items: [
      'Morning Workout',
      'Weight Loss',
      'Muscle Building',
      'Yoga & Flexibility',
      'Running Journey',
      'Home Gym',
      'Sports Training',
      'Posture Fix',
    ],
  },
  {
    icon: '📚',
    label: 'Learning',
    color: '#60a5fa',
    items: [
      'Learn a Language',
      'Speed Reading',
      'Memory Training',
      'Critical Thinking',
      'Math Skills',
      'Writing Mastery',
      'Public Speaking',
      'Research Skills',
    ],
  },
  {
    icon: '💼',
    label: 'Business',
    color: '#a78bfa',
    items: [
      'Start a Business',
      'Personal Branding',
      'Networking',
      'Leadership Skills',
      'Sales Mastery',
      'Product Launch',
      'Remote Work',
      'Career Switch',
    ],
  },
  {
    icon: '🧠',
    label: 'Mental Health',
    color: '#f472b6',
    items: [
      'Stress Management',
      'Anxiety Relief',
      'Mindfulness',
      'Journaling',
      'Sleep Optimization',
      'Self-Compassion',
      'Digital Detox',
      'Emotional Balance',
    ],
  },
  {
    icon: '👶',
    label: 'Parenting',
    color: '#4ade80',
    items: [
      'Mindful Parenting',
      'Read with Kids',
      'Screen Time Balance',
      'Positive Discipline',
      'Family Bonding',
      'Kids Nutrition',
      'Homework Habits',
      'Emotional IQ',
    ],
  },
  {
    icon: '🎨',
    label: 'Creative',
    color: '#f87171',
    items: [
      'Learn Drawing',
      'Photography',
      'Music Instrument',
      'Creative Writing',
      'Graphic Design',
      'Pottery & Crafts',
      'Digital Art',
      'Filmmaking',
    ],
  },
  {
    icon: '🌱',
    label: 'Eco Life',
    color: '#86efac',
    items: [
      'Zero Waste Life',
      'Go Vegan',
      'Eco-Friendly Home',
      'Gardening',
      'Minimalism',
      'Upcycling',
      'Green Business',
      'Carbon Footprint',
    ],
  },
  {
    icon: '⚙️',
    label: 'Productivity',
    color: '#fde047',
    items: [
      'Deep Work',
      'Morning Routine',
      'Task Management',
      'Focus Training',
      'No Procrastination',
      'Goal Setting',
      'Time Blocking',
      'Inbox Zero',
    ],
  },
  {
    icon: '🧘',
    label: 'Spirituality',
    color: '#c4b5fd',
    items: [
      'Meditation Practice',
      'Gratitude Journal',
      'Manifestation',
      'Spiritual Reading',
      'Prayer Routine',
      'Vision Board',
      'Inner Peace',
      'Energy Work',
    ],
  },
  {
    icon: '🤝',
    label: 'Relationships',
    color: '#fdba74',
    items: [
      'Better Communication',
      'Date Night Ideas',
      'Build Friendships',
      'Family Reconnect',
      'Conflict Resolution',
      'Social Skills',
      'Empathy Practice',
      'Community Service',
    ],
  },
] as const;

// ─── Niche Visual System ─────────────────────────────────────────────────────
// Each niche has a distinct visual identity applied to challenge screens

export const NICHE_VISUALS: Record<string, NicheVisual> = {
  Finance: {
    primaryColor: '#0D1B2A',
    gradientCss: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a5c 100%)',
    accentColor: '#FFD700',
    bgTint: 'rgba(255,215,0,0.06)',
  },
  Cooking: {
    primaryColor: '#FF6B35',
    gradientCss: 'linear-gradient(135deg, #3d1a0a 0%, #5c2a10 100%)',
    accentColor: '#FF6B35',
    bgTint: 'rgba(255,107,53,0.07)',
  },
  Fitness: {
    primaryColor: '#00D4FF',
    gradientCss: 'linear-gradient(135deg, #001a20 0%, #002a35 100%)',
    accentColor: '#39FF14',
    bgTint: 'rgba(57,255,20,0.06)',
  },
  Learning: {
    primaryColor: '#1B4332',
    gradientCss: 'linear-gradient(135deg, #0a1f17 0%, #1B4332 100%)',
    accentColor: '#8B6914',
    bgTint: 'rgba(139,105,20,0.07)',
  },
  Business: {
    primaryColor: '#CC0000',
    gradientCss: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
    accentColor: '#CC0000',
    bgTint: 'rgba(204,0,0,0.07)',
  },
  'Mental Health': {
    primaryColor: '#FFB5C8',
    gradientCss: 'linear-gradient(135deg, #1a0f14 0%, #2a1520 100%)',
    accentColor: '#87CEEB',
    bgTint: 'rgba(135,206,235,0.07)',
  },
  Parenting: {
    primaryColor: '#FFE066',
    gradientCss: 'linear-gradient(135deg, #1a1800 0%, #2a2800 100%)',
    accentColor: '#FFB5C8',
    bgTint: 'rgba(255,181,200,0.07)',
  },
  Creative: {
    primaryColor: '#f87171',
    gradientCss: 'linear-gradient(135deg, #1a0505 0%, #f97316 100%)',
    accentColor: '#a855f7',
    bgTint: 'rgba(168,85,247,0.07)',
  },
  'Eco Life': {
    primaryColor: '#228B22',
    gradientCss: 'linear-gradient(135deg, #071207 0%, #0e240e 100%)',
    accentColor: '#86efac',
    bgTint: 'rgba(134,239,172,0.07)',
  },
  Productivity: {
    primaryColor: '#4299E1',
    gradientCss: 'linear-gradient(135deg, #070d12 0%, #0d1a24 100%)',
    accentColor: '#fde047',
    bgTint: 'rgba(253,224,71,0.07)',
  },
  Spirituality: {
    primaryColor: '#4B0082',
    gradientCss: 'linear-gradient(135deg, #0d0014 0%, #1a0028 100%)',
    accentColor: '#FFE5A0',
    bgTint: 'rgba(255,229,160,0.07)',
  },
  Relationships: {
    primaryColor: '#FF6B8A',
    gradientCss: 'linear-gradient(135deg, #1a050c 0%, #2d0a14 100%)',
    accentColor: '#fdba74',
    bgTint: 'rgba(253,186,116,0.07)',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getNicheByItem(item: string): Niche | undefined {
  return NICHES.find((n) => n.items.includes(item));
}

export function getNicheByLabel(label: string): Niche | undefined {
  return NICHES.find((n) => n.label === label);
}

export function getNicheVisual(label: string): NicheVisual {
  return (
    NICHE_VISUALS[label] ?? {
      primaryColor: '#f59e0b',
      gradientCss: 'linear-gradient(135deg, #080706, #100e0a)',
      accentColor: '#f59e0b',
      bgTint: 'rgba(245,158,11,0.07)',
    }
  );
}

export function getAllNicheItems(): { niche: Niche; item: string }[] {
  return NICHES.flatMap((niche) =>
    niche.items.map((item) => ({ niche, item }))
  );
}
