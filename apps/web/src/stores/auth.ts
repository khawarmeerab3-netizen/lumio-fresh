'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { client } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'starter' | 'pro' | 'elite' | 'enterprise' | 'custom';
  points: number;
  streak_current: number;
  streak_longest: number;
  selected_mood: string;
  selected_language: string;
  onboarding_completed: boolean;
  avatar_url?: string | null;
  is_admin: boolean;
  ai_queries_today: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateMood: (mood: string) => Promise<void>;
  onboardingComplete: () => void;
}

// ─── Cookie (middleware reads lumio-token) ──────────────────────────────────

function setAuthCookie(token: string): void {
  document.cookie = `lumio-token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
}

function clearAuthCookie(): void {
  document.cookie = 'lumio-token=; path=/; max-age=0';
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await client.post<{ user: User; token: string }>('/api/auth/login', {
            email,
            password,
          });
          const { user, token } = res.data;
          localStorage.setItem('lumio-token', token);
          setAuthCookie(token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (email, name, password, referralCode) => {
        set({ isLoading: true });
        try {
          const res = await client.post<{ user: User; token: string }>('/api/auth/register', {
            email,
            name,
            password,
            ...(referralCode ? { referralCode } : {}),
          });
          const { user, token } = res.data;
          localStorage.setItem('lumio-token', token);
          setAuthCookie(token);
          set({ user, token, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('lumio-token');
        clearAuthCookie();
        set({ user: null, token: null });
        window.location.href = '/auth/login';
      },

      fetchMe: async () => {
        try {
          const res = await client.get<{ user: User }>('/api/auth/me');
          set({ user: res.data.user });
        } catch {
          get().logout();
        }
      },

      updateProfile: async (data) => {
        const res = await client.patch<{ user: User }>('/api/auth/me', data);
        set({ user: res.data.user });
      },

      updateMood: async (mood) => {
        set((state) => ({
          user: state.user ? { ...state.user, selected_mood: mood } : null,
        }));
        await client.patch('/api/auth/me', { selected_mood: mood }).catch(() => {});
      },

      onboardingComplete: () => {
        set((state) => ({
          user: state.user ? { ...state.user, onboarding_completed: true } : null,
        }));
      },
    }),
    {
      name: 'lumio-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
