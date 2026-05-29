// ─── backend/src/routes/analytics.ts ─────────────────────────────────────────
// Personal analytics endpoints.
// All routes require auth — users can only see their own data.

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { toApiError } from '../utils/errors';
import type {
  HeatmapEntry,
  StreakHistoryEntry,
  PointsHistoryEntry,
  ChallengeStats,
  NicheBreakdownEntry,
  PersonalAnalytics,
} from '../../../shared/types/analytics';

const router = Router();

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns an ISO date string (YYYY-MM-DD) offset from today by `daysAgo`. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Convert a PostgreSQL timestamptz string to an ISO date (YYYY-MM-DD). */
function toDate(ts: string): string {
  return ts.slice(0, 10);
}

// ── Streak-history derivation ─────────────────────────────────────────────────
// We reconstruct a simple "streak over time" series from the sorted list of
// completed-day dates across all challenges.  Each unique date that had at
// least one task completion bumps the running streak counter; any gap resets it.
function buildStreakHistory(sortedDates: string[]): StreakHistoryEntry[] {
  if (sortedDates.length === 0) return [];

  const history: StreakHistoryEntry[] = [];
  let streak = 0;
  let prev: string | null = null;

  for (const date of sortedDates) {
    if (prev === null) {
      streak = 1;
    } else {
      // Check if consecutive calendar day
      const prevMs = new Date(prev).getTime();
      const curMs = new Date(date).getTime();
      const diffDays = Math.round((curMs - prevMs) / 86_400_000);
      streak = diffDays === 1 ? streak + 1 : 1;
    }
    history.push({ date, streak });
    prev = date;
  }

  return history;
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/analytics/me
// ══════════════════════════════════════════════════════════════════════════════
router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const cutoff365 = daysAgo(365);
    const cutoff90  = daysAgo(90);

    // ── 1. All challenges for this user ───────────────────────────────────────
    const { data: challenges, error: challengeErr } = await req.supabase
      .from('challenges')
      .select('id, niche_id, status, duration_days, completed_days, streak, longest_streak, start_date, created_at')
      .eq('user_id', userId);

    if (challengeErr) throw new Error('Failed to load challenges');
    const allChallenges = (challenges ?? []) as Array<{
      id: string;
      niche_id: string;
      status: string;
      duration_days: number;
      completed_days: number[];
      streak: number;
      longest_streak: number;
      start_date: string;
      created_at: string;
    }>;

    // ── 2. All completed daily_tasks (for heatmap + streak history) ───────────
    const { data: tasks, error: taskErr } = await req.supabase
      .from('daily_tasks')
      .select('completed_at, challenge_id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', `${cutoff365}T00:00:00Z`)
      .order('completed_at', { ascending: true });

    if (taskErr) throw new Error('Failed to load tasks');
    const completedTasks = (tasks ?? []) as Array<{
      completed_at: string;
      challenge_id: string;
    }>;

    // ── 3. Points transactions (last 90 days) ─────────────────────────────────
    const { data: txns, error: txnErr } = await req.supabase
      .from('points_transactions')
      .select('created_at, points, action')
      .eq('user_id', userId)
      .gte('created_at', `${cutoff90}T00:00:00Z`)
      .order('created_at', { ascending: true });

    if (txnErr) throw new Error('Failed to load points history');
    const pointsTxns = (txns ?? []) as Array<{
      created_at: string;
      points: number;
      action: string;
    }>;

    // ── 4. Badge count ────────────────────────────────────────────────────────
    const { count: badgeCount } = await req.supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // ── Derive: completion heatmap ────────────────────────────────────────────
    // Aggregate completed task counts by date
    const heatmapMap = new Map<string, number>();
    for (const task of completedTasks) {
      const date = toDate(task.completed_at);
      heatmapMap.set(date, (heatmapMap.get(date) ?? 0) + 1);
    }
    const completionHeatmap: HeatmapEntry[] = Array.from(heatmapMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Derive: streak history ────────────────────────────────────────────────
    // Unique sorted dates where at least one task was completed
    const uniqueCompletedDates = [...new Set(completedTasks.map(t => toDate(t.completed_at)))].sort();
    const streakHistory: StreakHistoryEntry[] = buildStreakHistory(uniqueCompletedDates);

    // ── Derive: points history ────────────────────────────────────────────────
    const pointsHistory: PointsHistoryEntry[] = pointsTxns.map(t => ({
      date: toDate(t.created_at),
      points: t.points,
      action: t.action,
    }));

    // ── Derive: challenge stats ───────────────────────────────────────────────
    const total     = allChallenges.length;
    const completed = allChallenges.filter(c => c.status === 'completed').length;
    const active    = allChallenges.filter(c => c.status === 'active').length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    const challengeStats: ChallengeStats = { total, completed, active, completionRate };

    // ── Derive: niche breakdown ───────────────────────────────────────────────
    const nicheMap = new Map<string, number>();
    for (const c of allChallenges) {
      nicheMap.set(c.niche_id, (nicheMap.get(c.niche_id) ?? 0) + 1);
    }
    const nicheBreakdown: NicheBreakdownEntry[] = Array.from(nicheMap.entries())
      .map(([niche, count]) => ({ niche, count }))
      .sort((a, b) => b.count - a.count);

    // ── Derive: aggregate scalars ─────────────────────────────────────────────
    const longestStreak = allChallenges.reduce(
      (max, c) => Math.max(max, c.longest_streak),
      req.user.streak_longest // also check user-level record
    );
    const totalDaysCompleted = completedTasks.length;

    const analytics: PersonalAnalytics = {
      completionHeatmap,
      streakHistory,
      pointsHistory,
      challengeStats,
      nicheBreakdown,
      longestStreak,
      totalDaysCompleted,
      badgeCount: badgeCount ?? 0,
    };

    res.json({
      data: analytics,
      error: null,
      message: 'Analytics loaded',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

export default router;
