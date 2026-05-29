'use client';
// Lumio — apps/web/src/hooks/useMoodCheckIn.ts
// Manages daily mood check-in state for the challenge Today tab.
// Determines whether to show the check-in gate or go straight to the task.

import { useState, useEffect, useCallback } from 'react';
import type { DailyMoodState } from '../../../../shared/types/persona';
import { MOOD_TO_TASK_MAP } from '../../../../shared/types/persona';

interface UseMoodCheckInReturn {
  /** Whether check-in has been done today */
  hasCheckedIn: boolean;
  /** Today's mood if checked in */
  todaysMood: DailyMoodState | null;
  /** Whether we're loading today's check-in from API */
  isLoading: boolean;
  /** The intensity/tone context to pass to generateDailyTask */
  taskContext: typeof MOOD_TO_TASK_MAP[DailyMoodState] | null;
  /** Call when user selects their mood in MoodCheckIn component */
  onMoodSelected: (mood: DailyMoodState) => void;
  /** Force refresh check-in status from API */
  refresh: () => Promise<void>;
}

export function useMoodCheckIn(
  challengeId: string,
  apiToken: string
): UseMoodCheckInReturn {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [todaysMood, setTodaysMood]     = useState<DailyMoodState | null>(null);
  const [isLoading, setIsLoading]       = useState(true);

  const fetchCheckIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch('/api/persona/mood/today', {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const json = await res.json();

      if (json.data?.checkIn) {
        setTodaysMood(json.data.checkIn.mood as DailyMoodState);
        setHasCheckedIn(true);
      } else {
        setHasCheckedIn(false);
        setTodaysMood(null);
      }
    } catch {
      // On error, don't block — default to standard
      setHasCheckedIn(true);
      setTodaysMood('okay');
    } finally {
      setIsLoading(false);
    }
  }, [apiToken]);

  useEffect(() => {
    fetchCheckIn();
  }, [fetchCheckIn]);

  const onMoodSelected = useCallback((mood: DailyMoodState) => {
    setTodaysMood(mood);
    setHasCheckedIn(true);
  }, []);

  const taskContext = todaysMood ? MOOD_TO_TASK_MAP[todaysMood] : null;

  return {
    hasCheckedIn,
    todaysMood,
    isLoading,
    taskContext,
    onMoodSelected,
    refresh: fetchCheckIn,
  };
}
