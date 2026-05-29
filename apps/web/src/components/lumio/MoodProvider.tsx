'use client';

/**
 * apps/web/src/components/lumio/MoodProvider.tsx
 *
 * Drop this once inside the (app) layout.
 * It:
 *   1. Fetches the current user's plan + selected_mood on mount
 *   2. Injects CSS vars via applyMoodToDOM
 *   3. Exposes mood context so any child can call useMood()
 */

import { useEffect, createContext, useContext, useState } from 'react';
import { useMoodStore, applyMoodToDOM, MOODS, type MoodDef } from '@/stores/mood-store';

// ─── Context (thin wrapper for components that prefer hooks over Zustand) ─────

interface MoodContextValue {
  mood: MoodDef;
  switchMood: (id: string) => boolean;
  userPlan: string;
}

const MoodContext = createContext<MoodContextValue | null>(null);

export function useMood(): MoodContextValue {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error('useMood must be used inside <MoodProvider>');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const { activeMood, userPlan, hydrateMood, setUserPlan, switchMood } = useMoodStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = localStorage.getItem('lumio_token');
        if (!token) {
          // Not logged in — apply default (gold) and continue
          applyMoodToDOM(MOODS[0]);
          setReady(true);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const user = data.user ?? data;
          setUserPlan(user.plan ?? 'free');
          hydrateMood(user.selected_mood ?? 'gold');
        } else {
          applyMoodToDOM(MOODS[0]);
        }
      } catch {
        // Fallback silently
        applyMoodToDOM(MOODS[0]);
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent flash of unstyled content: render nothing until CSS vars are injected
  if (!ready) return null;

  return (
    <MoodContext.Provider value={{ mood: activeMood, switchMood, userPlan }}>
      {children}
    </MoodContext.Provider>
  );
}
