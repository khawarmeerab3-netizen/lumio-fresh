'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Mood {
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
  g: string;   // gradient
  o1: string;  // orb color 1
  o2: string;  // orb color 2
  animStyle: 'sharp' | 'explosive' | 'fluid' | 'organic' | 'expressive' | 'nurturing' | 'transcendent' | 'ethereal';
}

export const MOODS: Mood[] = [
  {
    id: 'gold', emoji: '✨', name: 'Gold', label: 'Ambitious',
    bg: '#080706', bg2: '#100e0a', bg3: '#181510', bg4: '#201c14',
    border: '#2a2418', border2: '#362e1e',
    accent: '#f59e0b', accent2: '#fbbf24',
    soft: 'rgba(245,158,11,0.12)',
    text: '#fdfaf3', text2: '#a09060', text3: '#504830',
    g: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    o1: '#f59e0b', o2: '#f97316', animStyle: 'sharp',
  },
  {
    id: 'fire', emoji: '🔥', name: 'Fire', label: 'Intense',
    bg: '#0a0604', bg2: '#120a06', bg3: '#1c1008', bg4: '#26160a',
    border: '#2e1a0c', border2: '#3d2210',
    accent: '#f97316', accent2: '#fb923c',
    soft: 'rgba(249,115,22,0.12)',
    text: '#fef3ec', text2: '#c08060', text3: '#6b4030',
    g: 'linear-gradient(135deg,#f97316,#fb923c)',
    o1: '#f97316', o2: '#ef4444', animStyle: 'explosive',
  },
  {
    id: 'ocean', emoji: '🌊', name: 'Ocean', label: 'Focused',
    bg: '#03080f', bg2: '#050e18', bg3: '#081420', bg4: '#0b1c2e',
    border: '#0d2540', border2: '#0f3055',
    accent: '#0ea5e9', accent2: '#38bdf8',
    soft: 'rgba(14,165,233,0.12)',
    text: '#ecf6ff', text2: '#6090b0', text3: '#2a4a60',
    g: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    o1: '#0ea5e9', o2: '#6366f1', animStyle: 'fluid',
  },
  {
    id: 'forest', emoji: '🌿', name: 'Forest', label: 'Grounded',
    bg: '#030a05', bg2: '#060f08', bg3: '#0a160c', bg4: '#0e1e10',
    border: '#122514', border2: '#173018',
    accent: '#22c55e', accent2: '#4ade80',
    soft: 'rgba(34,197,94,0.12)',
    text: '#edfbf2', text2: '#60a070', text3: '#2a5030',
    g: 'linear-gradient(135deg,#22c55e,#4ade80)',
    o1: '#22c55e', o2: '#14b8a6', animStyle: 'organic',
  },
  {
    id: 'violet', emoji: '🔮', name: 'Violet', label: 'Creative',
    bg: '#070509', bg2: '#0d0812', bg3: '#140d1c', bg4: '#1a1126',
    border: '#211530', border2: '#2c1c40',
    accent: '#a855f7', accent2: '#c084fc',
    soft: 'rgba(168,85,247,0.12)',
    text: '#f5f0ff', text2: '#9070c0', text3: '#4a3060',
    g: 'linear-gradient(135deg,#a855f7,#c084fc)',
    o1: '#a855f7', o2: '#ec4899', animStyle: 'expressive',
  },
  {
    id: 'rose', emoji: '🌸', name: 'Rose', label: 'Nurturing',
    bg: '#090507', bg2: '#130810', bg3: '#1c0c18', bg4: '#261020',
    border: '#301428', border2: '#3e1a34',
    accent: '#f43f8e', accent2: '#fb7bb8',
    soft: 'rgba(244,63,142,0.12)',
    text: '#fff0f8', text2: '#b06090', text3: '#603050',
    g: 'linear-gradient(135deg,#f43f8e,#fb7bb8)',
    o1: '#f43f8e', o2: '#f97316', animStyle: 'nurturing',
  },
  {
    id: 'cosmic', emoji: '🌌', name: 'Cosmic', label: 'Transcendent',
    bg: '#030308', bg2: '#06060f', bg3: '#0a0a18', bg4: '#0e0e24',
    border: '#121230', border2: '#181840',
    accent: '#6366f1', accent2: '#818cf8',
    soft: 'rgba(99,102,241,0.12)',
    text: '#f0f0ff', text2: '#7070b0', text3: '#303060',
    g: 'linear-gradient(135deg,#6366f1,#818cf8)',
    o1: '#6366f1', o2: '#a855f7', animStyle: 'transcendent',
  },
  {
    id: 'arctic', emoji: '❄️', name: 'Arctic', label: 'Clear',
    bg: '#04080c', bg2: '#080f16', bg3: '#0c1620', bg4: '#101e2c',
    border: '#14263a', border2: '#1a3050',
    accent: '#67e8f9', accent2: '#a5f3fc',
    soft: 'rgba(103,232,249,0.12)',
    text: '#f0fcff', text2: '#60a0b0', text3: '#2a5060',
    g: 'linear-gradient(135deg,#67e8f9,#a5f3fc)',
    o1: '#67e8f9', o2: '#0ea5e9', animStyle: 'ethereal',
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface MoodState {
  currentMood: Mood;
  setMood: (mood: Mood) => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      currentMood: MOODS[0],
      setMood: (mood) => set({ currentMood: mood }),
    }),
    { name: 'lumio-mood' },
  ),
);
