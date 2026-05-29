// Lumio — shared/constants/durations.ts — Challenge durations and milestone map

import type { Duration, Milestone } from '../types/index';

export const DURATIONS: Duration[] = [
  { label: '1 Day',    days: 1,   free: true,  emoji: '⚡', desc: 'Quick win' },
  { label: '3 Days',   days: 3,   free: true,  emoji: '🔥', desc: 'Mini sprint' },
  { label: '7 Days',   days: 7,   free: true,  emoji: '✨', desc: 'One week' },
  { label: '15 Days',  days: 15,  free: false, emoji: '🌙', desc: 'Half month' },
  { label: '21 Days',  days: 21,  free: false, emoji: '💎', desc: 'Habit former' },
  { label: '30 Days',  days: 30,  free: false, emoji: '🏆', desc: 'Full month' },
  { label: '90 Days',  days: 90,  free: false, emoji: '🚀', desc: 'Life quarter' },
  { label: '6 Months', days: 180, free: false, emoji: '🌟', desc: 'Deep change' },
  { label: '1 Year',   days: 365, free: false, emoji: '👑', desc: 'Life changer' },
] as const;

// ─── Milestone Map ────────────────────────────────────────────────────────────
// Defines milestone checkpoints for each challenge duration

export const MILESTONE_MAP: Record<number, Milestone[]> = {
  1: [
    { d: 1, l: 'Done! 🏆' },
  ],
  3: [
    { d: 1, l: 'Start' },
    { d: 2, l: 'Day 2' },
    { d: 3, l: 'Done! 🏆' },
  ],
  7: [
    { d: 1, l: 'Start' },
    { d: 3, l: 'Day 3' },
    { d: 5, l: 'Day 5' },
    { d: 7, l: 'Week! 🏆' },
  ],
  15: [
    { d: 1,  l: 'Start' },
    { d: 3,  l: '3 Days' },
    { d: 7,  l: 'Week 1' },
    { d: 10, l: 'Day 10' },
    { d: 15, l: 'Done! 🏆' },
  ],
  21: [
    { d: 1,  l: 'Start' },
    { d: 7,  l: 'Week 1' },
    { d: 14, l: 'Week 2' },
    { d: 21, l: 'Habit! 🏆' },
  ],
  30: [
    { d: 1,  l: 'Start' },
    { d: 7,  l: 'Week 1' },
    { d: 14, l: '2 Wks' },
    { d: 21, l: '3 Wks' },
    { d: 30, l: 'Month! 🏆' },
  ],
  90: [
    { d: 1,  l: 'Start' },
    { d: 30, l: 'Month 1' },
    { d: 60, l: 'Month 2' },
    { d: 90, l: 'Quarter! 🏆' },
  ],
  180: [
    { d: 1,   l: 'Start' },
    { d: 30,  l: 'M1' },
    { d: 60,  l: 'M2' },
    { d: 90,  l: 'M3' },
    { d: 120, l: 'M4' },
    { d: 150, l: 'M5' },
    { d: 180, l: '6mo! 🏆' },
  ],
  365: [
    { d: 1,   l: 'Start' },
    { d: 90,  l: 'Q1' },
    { d: 180, l: 'Half' },
    { d: 270, l: 'Q3' },
    { d: 365, l: '1yr! 👑' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDurationByDays(days: number): Duration | undefined {
  return DURATIONS.find((d) => d.days === days);
}

export function getFreeDurations(): Duration[] {
  return DURATIONS.filter((d) => d.free);
}

export function getMilestonesForDuration(days: number): Milestone[] {
  // Exact match first, fall back to 30-day milestones as default
  return MILESTONE_MAP[days] ?? MILESTONE_MAP[30];
}

export function isMilestoneDay(days: number, day: number): boolean {
  const milestones = getMilestonesForDuration(days);
  return milestones.some((m) => m.d === day);
}

export function getMilestoneLabel(days: number, day: number): string | null {
  const milestones = getMilestonesForDuration(days);
  return milestones.find((m) => m.d === day)?.l ?? null;
}
