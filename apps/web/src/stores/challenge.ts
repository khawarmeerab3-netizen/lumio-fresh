'use client';

import { create } from 'zustand';
import { client } from '@/lib/api';

export interface Challenge {
  id: string;
  user_id: string;
  niche_id: string;
  niche_category: string;
  niche_color: string;
  title: string;
  goal: string;
  custom_goal?: string | null;
  duration_days: number;
  coach_id?: string | null;
  ai_plan?: Record<string, unknown> | null;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  current_day: number;
  completed_days: number[];
  streak: number;
  longest_streak: number;
  last_completed_date?: string | null;
  start_date: string;
  end_date?: string | null;
  created_at: string;
}

export interface CreateChallengePayload {
  niche_id: string;
  niche_category: string;
  niche_color: string;
  goal: string;
  custom_goal?: string;
  duration_days: number;
  coach_id?: string;
}

interface ChallengeState {
  challenges: Challenge[];
  activeChallenge: Challenge | null;
  isLoading: boolean;
  isLoadingChallenge: boolean;
  challengeError: string | null;
}

interface ChallengeActions {
  fetchChallenges: () => Promise<void>;
  createChallenge: (payload: CreateChallengePayload) => Promise<Challenge>;
  setActive: (challenge: Challenge | null) => void;
  loadChallenge: (id: string) => Promise<void>;
  refreshChallenge: (id: string) => Promise<void>;
}

export const useChallengeStore = create<ChallengeState & ChallengeActions>()((set) => ({
  challenges: [],
  activeChallenge: null,
  isLoading: false,
  isLoadingChallenge: false,
  challengeError: null,

  fetchChallenges: async () => {
    set({ isLoading: true });
    try {
      const res = await client.get<{ challenges: Challenge[] }>('/api/challenges');
      set({ challenges: res.data.challenges, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createChallenge: async (payload) => {
    set({ isLoading: true });
    try {
      const res = await client.post<{ challenge: Challenge }>('/api/challenges', payload);
      const created = res.data.challenge;
      set((state) => ({
        challenges: [created, ...state.challenges],
        activeChallenge: created,
        isLoading: false,
      }));
      return created;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setActive: (challenge) => {
    set({ activeChallenge: challenge });
  },

  loadChallenge: async (id) => {
    set({ isLoadingChallenge: true, challengeError: null });
    try {
      const res = await client.get<{ challenge: Challenge }>(`/api/challenges/${id}`);
      set({ activeChallenge: res.data.challenge, isLoadingChallenge: false });
    } catch {
      set({ isLoadingChallenge: false, challengeError: 'Failed to load challenge' });
    }
  },

  refreshChallenge: async (id) => {
    try {
      const res = await client.get<{ challenge: Challenge }>(`/api/challenges/${id}`);
      const updated = res.data.challenge;
      set((state) => ({
        challenges: state.challenges.map((c) => (c.id === id ? updated : c)),
        activeChallenge: state.activeChallenge?.id === id ? updated : state.activeChallenge,
      }));
    } catch {
      // silent - stale data is acceptable
    }
  },
}));