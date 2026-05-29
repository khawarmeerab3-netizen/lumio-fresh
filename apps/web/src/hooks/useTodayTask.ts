'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AITask {
  dayTitle: string;
  mainTask: string;
  timeRequired: string;
  steps: string[];
  motivationalNote: string;
  checkIn: string;
}

export interface CachedTask {
  challengeId: string;
  challengeTitle: string;
  dayNumber: number;
  task: AITask;
  cachedAt: string;
}

export interface TodayTaskState {
  task: CachedTask | null;
  isLoading: boolean;
  isFromCache: boolean;
  isOffline: boolean;
  error: string | null;
  refetch: () => void;
}

// ─── Storage key ─────────────────────────────────────────────────────────────

const CACHE_KEY = 'lumio:today-task';

// ─── localStorage helpers ─────────────────────────────────────────────────────

export function saveTodayTaskToCache(data: CachedTask): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or unavailable — silently ignore
  }
}

export function loadTodayTaskFromCache(): CachedTask | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTask;
    return parsed;
  } catch {
    return null;
  }
}

export function clearTodayTaskCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTodayTask(
  challengeId: string | null | undefined,
  authToken: string | null | undefined
): TodayTaskState {
  const [task, setTask] = useState<CachedTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async () => {
    if (!challengeId || !authToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check online status
    const online = navigator.onLine;
    setIsOffline(!online);

    if (!online) {
      // Offline: serve from cache immediately
      const cached = loadTodayTaskFromCache();
      if (cached && cached.challengeId === challengeId) {
        setTask(cached);
        setIsFromCache(true);
      } else {
        setError('No cached task available for offline use');
      }
      setIsLoading(false);
      return;
    }

    try {
      const apiBase =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_API_URL ?? '';

      const res = await fetch(`${apiBase}/api/challenges/${challengeId}/today`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const json = (await res.json()) as {
        data: {
          dayNumber: number;
          challengeTitle: string;
          task: AITask;
        };
      };

      const freshData: CachedTask = {
        challengeId,
        challengeTitle: json.data.challengeTitle,
        dayNumber: json.data.dayNumber,
        task: json.data.task,
        cachedAt: new Date().toISOString(),
      };

      setTask(freshData);
      setIsFromCache(false);

      // Persist to localStorage for offline use
      saveTodayTaskToCache(freshData);
    } catch (fetchErr) {
      // Network failed even though navigator.onLine was true (flaky connection)
      const cached = loadTodayTaskFromCache();
      if (cached && cached.challengeId === challengeId) {
        setTask(cached);
        setIsFromCache(true);
        setIsOffline(true);
      } else {
        setError(fetchErr instanceof Error ? fetchErr.message : 'Failed to load task');
      }
    } finally {
      setIsLoading(false);
    }
  }, [challengeId, authToken]);

  // Initial fetch
  useEffect(() => {
    void fetchTask();
  }, [fetchTask]);

  // Listen for online/offline events to re-fetch when connection restores
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      void fetchTask();
    };
    const handleOffline = () => {
      setIsOffline(true);
      // Load from cache without re-fetching
      const cached = loadTodayTaskFromCache();
      if (cached && cached.challengeId === challengeId) {
        setTask(cached);
        setIsFromCache(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchTask, challengeId]);

  return {
    task,
    isLoading,
    isFromCache,
    isOffline,
    error,
    refetch: fetchTask,
  };
}
