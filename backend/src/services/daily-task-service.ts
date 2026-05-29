// ─── backend/src/services/ai/daily-task-service.ts ───────────────────────────
// Wraps generateDailyTask from lumio-coach.ts with the in-memory TTL cache.
//
// Usage in routes (replaces direct generateDailyTask calls):
//   import { getDailyTask } from '../services/ai/daily-task-service';
//
// Cache behaviour:
//   1. Check DB first (task may already be stored from an earlier session)
//   2. Check in-memory cache (same process, avoids DB round-trip)
//   3. Generate via AI (Groq → Mistral → Anthropic failover)
//   4. Write to DB + in-memory cache

import { createClient } from '@supabase/supabase-js';
import { getCachedTask, setCachedTask } from '../../cache/task-cache';
import { generateDailyTask, type GeneratedDailyTask } from './lumio-coach';

// Service-role client for reading/writing daily_tasks without RLS
const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface GetDailyTaskParams {
  challengeId: string;
  userId: string;
  dayNumber: number;
  goal: string;
  niche: string;
  totalDays: number;
  completionRate: number; // 0–100
  language: string;
}

export interface DailyTaskResult {
  task: GeneratedDailyTask;
  source: 'db' | 'memory-cache' | 'ai-generated';
  cachedAt?: number;
}

/**
 * Returns the daily task for a given challenge day.
 * Checks DB → in-memory cache → AI generation, in that order.
 * Writes through to both DB and in-memory cache after AI generation.
 */
export async function getDailyTask(
  params: GetDailyTaskParams
): Promise<DailyTaskResult> {
  const {
    challengeId,
    userId,
    dayNumber,
    goal,
    niche,
    totalDays,
    completionRate,
    language,
  } = params;

  // ── 1. Check Supabase DB (persistent, survives restarts) ─────────────────
  const { data: existingRow } = await adminSupabase
    .from('daily_tasks')
    .select('task_data, created_at')
    .eq('challenge_id', challengeId)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (existingRow?.task_data) {
    const task = existingRow.task_data as GeneratedDailyTask;
    // Warm the in-memory cache from DB data so the next call is instant
    setCachedTask(challengeId, dayNumber, task);
    return { task, source: 'db' };
  }

  // ── 2. Check in-memory cache (same process only) ─────────────────────────
  const cachedTask = getCachedTask(challengeId, dayNumber);
  if (cachedTask) {
    return { task: cachedTask, source: 'memory-cache', cachedAt: Date.now() };
  }

  // ── 3. Generate via AI ───────────────────────────────────────────────────
  const task = await generateDailyTask(
    goal,
    niche,
    dayNumber,
    totalDays,
    completionRate,
    language
  );

  // ── 4. Write to DB (upsert — handles rare race condition) ────────────────
  await adminSupabase
    .from('daily_tasks')
    .upsert(
      {
        challenge_id: challengeId,
        user_id: userId,
        day_number: dayNumber,
        task_data: task,
        status: 'pending',
        points_awarded: 0,
      },
      { onConflict: 'challenge_id,day_number', ignoreDuplicates: true }
    );

  // ── 5. Write to in-memory cache ──────────────────────────────────────────
  setCachedTask(challengeId, dayNumber, task);

  return { task, source: 'ai-generated' };
}
