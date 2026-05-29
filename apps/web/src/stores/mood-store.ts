/**
 * Lumio Mood Store
 * Central Zustand store that owns the active mood, applies CSS custom properties
 * to :root on every switch, and persists to the backend.
 */

import { create } from 'zustand';

// ─── Mood Definitions ─────────────────────────────────────────────────────────

export interface MoodDef {
  id: string;
  emoji: string;
  name: string;
  label: string;
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  border: string;
  border2: string;
  accent: string;
  accent2: string;
  soft: string;
  text: string;
  text2: string;
  text3: string;
  g: string;
  o1: string;
  o2: string;
  animStyle: string;
  /** Which plan tier unlocks this mood */
  minPlan: 'free' | 'starter' | 'pro';
}

export const MOODS: MoodDef[] = [
  {
    id: 'gold', emoji: '✨', name: 'Gold', label: 'Ambitious',
    bg: '#080706', bg2: '#100e0a', bg3: '#181510', bg4: '#201c14',
    border: '#2a2418', border2: '#362e1e',
    accent: '#f59e0b', accent2: '#fbbf24',
    soft: 'rgba(245,158,11,0.12)',
    text: '#fdfaf3', text2: '#a09060', text3: '#504830',
    g: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    o1: '#f59e0b', o2: '#f97316',
    animStyle: 'sharp',
    minPlan: 'free',
  },
  {
    id: 'ocean', emoji: '🌊', name: 'Ocean', label: 'Focused',
    bg: '#03080f', bg2: '#050e18', bg3: '#081420', bg4: '#0b1c2e',
    border: '#0d2540', border2: '#0f3055',
    accent: '#0ea5e9', accent2: '#38bdf8',
    soft: 'rgba(14,165,233,0.12)',
    text: '#ecf6ff', text2: '#6090b0', text3: '#2a4a60',
    g: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    o1: '#0ea5e9', o2: '#6366f1',
    animStyle: 'fluid',
    minPlan: 'free',
  },
  {
    id: 'forest', emoji: '🌿', name: 'Forest', label: 'Grounded',
    bg: '#030a05', bg2: '#060f08', bg3: '#0a160c', bg4: '#0e1e10',
    border: '#122514', border2: '#173018',
    accent: '#22c55e', accent2: '#4ade80',
    soft: 'rgba(34,197,94,0.12)',
    text: '#edfbf2', text2: '#60a070', text3: '#2a5030',
    g: 'linear-gradient(135deg,#22c55e,#4ade80)',
    o1: '#22c55e', o2: '#14b8a6',
    animStyle: 'organic',
    minPlan: 'free',
  },
  {
    id: 'fire', emoji: '🔥', name: 'Fire', label: 'Intense',
    bg: '#0a0604', bg2: '#120a06', bg3: '#1c1008', bg4: '#26160a',
    border: '#2e1a0c', border2: '#3d2210',
    accent: '#f97316', accent2: '#fb923c',
    soft: 'rgba(249,115,22,0.12)',
    text: '#fef3ec', text2: '#c08060', text3: '#6b4030',
    g: 'linear-gradient(135deg,#f97316,#fb923c)',
    o1: '#f97316', o2: '#ef4444',
    animStyle: 'explosive',
    minPlan: 'starter',
  },
  {
    id: 'violet', emoji: '🔮', name: 'Violet', label: 'Creative',
    bg: '#070509', bg2: '#0d0812', bg3: '#140d1c', bg4: '#1a1126',
    border: '#211530', border2: '#2c1c40',
    accent: '#a855f7', accent2: '#c084fc',
    soft: 'rgba(168,85,247,0.12)',
    text: '#f5f0ff', text2: '#9070c0', text3: '#4a3060',
    g: 'linear-gradient(135deg,#a855f7,#c084fc)',
    o1: '#a855f7', o2: '#ec4899',
    animStyle: 'expressive',
    minPlan: 'starter',
  },
  {
    id: 'rose', emoji: '🌸', name: 'Rose', label: 'Nurturing',
    bg: '#090507', bg2: '#130810', bg3: '#1c0c18', bg4: '#261020',
    border: '#301428', border2: '#3e1a34',
    accent: '#f43f8e', accent2: '#fb7bb8',
    soft: 'rgba(244,63,142,0.12)',
    text: '#fff0f8', text2: '#b06090', text3: '#603050',
    g: 'linear-gradient(135deg,#f43f8e,#fb7bb8)',
    o1: '#f43f8e', o2: '#f97316',
    animStyle: 'gentle',
    minPlan: 'pro',
  },
  {
    id: 'ice', emoji: '❄️', name: 'Ice', label: 'Precise',
    bg: '#050708', bg2: '#080c0f', bg3: '#0c1218', bg4: '#101820',
    border: '#141e28', border2: '#1a2834',
    accent: '#67e8f9', accent2: '#a5f3fc',
    soft: 'rgba(103,232,249,0.1)',
    text: '#f0fbff', text2: '#6090a0', text3: '#2a4050',
    g: 'linear-gradient(135deg,#67e8f9,#a5f3fc)',
    o1: '#67e8f9', o2: '#818cf8',
    animStyle: 'precise',
    minPlan: 'pro',
  },
  {
    id: 'midnight', emoji: '🌙', name: 'Midnight', label: 'Mysterious',
    bg: '#020204', bg2: '#060608', bg3: '#0c0c12', bg4: '#101018',
    border: '#16161e', border2: '#1e1e2a',
    accent: '#818cf8', accent2: '#a5b4fc',
    soft: 'rgba(129,140,248,0.12)',
    text: '#f0f0ff', text2: '#7070a0', text3: '#383850',
    g: 'linear-gradient(135deg,#818cf8,#a5b4fc)',
    o1: '#818cf8', o2: '#c084fc',
    animStyle: 'mysterious',
    minPlan: 'pro',
  },
];

// ─── Plan access helper ───────────────────────────────────────────────────────

const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, elite: 3, enterprise: 3 };

export function isMoodUnlocked(mood: MoodDef, userPlan: string): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[mood.minPlan] ?? 0);
}

// ─── CSS variable injection ───────────────────────────────────────────────────

/**
 * Writes all mood tokens as CSS custom properties on <html>.
 * Every styled element that uses var(--lumio-*) will react instantly.
 */
export function applyMoodToDOM(mood: MoodDef): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--lumio-bg',       mood.bg);
  root.style.setProperty('--lumio-bg2',      mood.bg2);
  root.style.setProperty('--lumio-bg3',      mood.bg3);
  root.style.setProperty('--lumio-bg4',      mood.bg4);
  root.style.setProperty('--lumio-border',   mood.border);
  root.style.setProperty('--lumio-border2',  mood.border2);
  root.style.setProperty('--lumio-accent',   mood.accent);
  root.style.setProperty('--lumio-accent2',  mood.accent2);
  root.style.setProperty('--lumio-soft',     mood.soft);
  root.style.setProperty('--lumio-text',     mood.text);
  root.style.setProperty('--lumio-text2',    mood.text2);
  root.style.setProperty('--lumio-text3',    mood.text3);
  root.style.setProperty('--lumio-g',        mood.g);
  root.style.setProperty('--lumio-o1',       mood.o1);
  root.style.setProperty('--lumio-o2',       mood.o2);
  root.style.setProperty('--lumio-anim',     mood.animStyle);
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface MoodState {
  activeMood: MoodDef;
  userPlan: string;
  /** Set plan — call on auth/hydration */
  setUserPlan: (plan: string) => void;
  /** Switch mood. Applies CSS vars, persists to API, shows toast. Returns false if locked. */
  switchMood: (moodId: string) => boolean;
  /** Hydrate mood from stored value (e.g. on app load) without triggering API call */
  hydrateMood: (moodId: string) => void;
  /** Active mood def shorthand */
  mood: MoodDef;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  activeMood: MOODS[0],   // gold default
  userPlan: 'free',
  mood: MOODS[0],

  setUserPlan: (plan) => set({ userPlan: plan }),

  hydrateMood: (moodId) => {
    const found = MOODS.find(m => m.id === moodId) ?? MOODS[0];
    applyMoodToDOM(found);
    set({ activeMood: found, mood: found });
  },

  switchMood: (moodId) => {
    const { userPlan } = get();
    const found = MOODS.find(m => m.id === moodId);
    if (!found) return false;
    if (!isMoodUnlocked(found, userPlan)) return false;

    applyMoodToDOM(found);
    set({ activeMood: found, mood: found });

    // Persist to backend (fire-and-forget)
    const token = typeof window !== 'undefined' ? localStorage.getItem('lumio_token') : null;
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
      fetch(`${apiUrl}/api/users/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_mood: moodId }),
      }).catch(console.error);
    }

    return true;
  },
}));
