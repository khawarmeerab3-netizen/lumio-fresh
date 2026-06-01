// ─── backend/src/routes/admin.ts ─────────────────────────────────────────────
// All admin routes.  Every handler is protected by: auth → requireAdmin.
// Uses the service-role Supabase client (getAdminSupabase) for writes that
// must bypass RLS (ban/unban, plan changes, broadcast inserts).

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { LumioError, toApiError } from '../utils/errors';
import { getAdminSupabase } from '../utils/supabase';
import { broadcastNotification, notifyUser } from '../services/notifications';
import {
  generateAdminReport,
  generateBroadcastTip,
} from '../services/ai/lumio-coach';
import type {
  ClientStatus,
  EnrichedClient,
  RevenueSummary,
  PlatformStats,
} from '../../../shared/types/analytics';

const router = Router();

// Every route in this file requires both auth AND admin
router.use(auth, requireAdmin);

// ── Zod schemas ───────────────────────────────────────────────────────────────
const VALID_PLANS = ['free', 'starter', 'pro', 'elite', 'custom', 'enterprise'] as const;

const ChangePlanSchema = z.object({
  plan: z.enum(VALID_PLANS),
  plan_expires_at: z.string().datetime().optional(), // ISO 8601 — omit for indefinite
});

const BroadcastSchema = z.object({
  topic: z.string().max(200).optional(),
  targetPlan: z.enum(['all', 'free', 'starter', 'pro', 'elite', 'custom', 'enterprise']).default('all'),
});

// ── Status classification helper ─────────────────────────────────────────────
function classifyStatus(completionRate: number, streak: number): ClientStatus {
  if (completionRate > 80) return 'excellent';
  if (completionRate >= 50) return 'on-track';
  if (completionRate >= 20 && streak > 0) return 'needs-support';
  return 'at-risk';
}

// Status severity order for sorting (worst first)
const STATUS_ORDER: Record<ClientStatus, number> = {
  'at-risk': 0,
  'needs-support': 1,
  'on-track': 2,
  'excellent': 3,
};

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/clients — All clients with enriched status
// ══════════════════════════════════════════════════════════════════════════════
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    // Fetch all users
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, plan, is_banned, streak_current, streak_longest, points, total_points_earned, created_at')
      .order('created_at', { ascending: false });

    if (userErr || !users) throw new Error('Failed to fetch users');

    // For each user, fetch their most recent active challenge
    const enriched: EnrichedClient[] = await Promise.all(
      (users as Array<{
        id: string;
        email: string;
        name: string;
        avatar_url: string | null;
        plan: string;
        is_banned: boolean;
        streak_current: number;
        streak_longest: number;
        points: number;
        total_points_earned: number;
        created_at: string;
      }>).map(async (user) => {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('id, title, niche_id, current_day, duration_days, completed_days, streak')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let activeChallenge: EnrichedClient['activeChallenge'] = null;
        let status: ClientStatus = 'at-risk';

        if (challenge) {
          const completed = (challenge.completed_days as number[]).length;
          const completionRate =
            challenge.current_day > 1
              ? Math.round((completed / (challenge.current_day - 1)) * 100)
              : 0;

          activeChallenge = {
            id: challenge.id as string,
            title: challenge.title as string,
            niche_id: challenge.niche_id as string,
            current_day: challenge.current_day as number,
            duration_days: challenge.duration_days as number,
            completionRate,
            streak: challenge.streak as number,
          };
          status = classifyStatus(completionRate, challenge.streak as number);
        }

        return { ...user, activeChallenge, status };
      })
    );

    // Sort at-risk first
    enriched.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

    res.json({
      data: { clients: enriched, total: enriched.length },
      error: null,
      message: `${enriched.length} clients`,
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/clients/:id — Single client full profile
// ══════════════════════════════════════════════════════════════════════════════
router.get('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();
    const targetId = req.params.id;

    // User profile
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, plan, plan_started_at, plan_expires_at, points, total_points_earned, streak_current, streak_longest, is_admin, is_banned, onboarding_completed, selected_language, created_at')
      .eq('id', targetId)
      .single();

    if (userErr || !user) throw LumioError.notFound('User');

    // All challenges
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, niche_id, title, goal, status, current_day, duration_days, completed_days, streak, longest_streak, start_date, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    // Recent daily tasks (last 14)
    const { data: recentTasks } = await supabase
      .from('daily_tasks')
      .select('id, challenge_id, day_number, status, points_awarded, completed_at, note')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(14);

    // Points history (last 30 transactions)
    const { data: pointsHistory } = await supabase
      .from('points_transactions')
      .select('id, action, points, description, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(30);

    // Badges
    const { data: badges } = await supabase
      .from('user_badges')
      .select('badge_id, earned_at, badges(id, name, image_url)')
      .eq('user_id', targetId)
      .order('earned_at', { ascending: false });

    res.json({
      data: {
        user,
        challenges: challenges ?? [],
        recentTasks: recentTasks ?? [],
        pointsHistory: pointsHistory ?? [],
        badges: badges ?? [],
      },
      error: null,
      message: 'Client detail loaded',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/clients/:id/plan — Change user plan
// ══════════════════════════════════════════════════════════════════════════════
router.patch('/clients/:id/plan', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = ChangePlanSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw LumioError.badRequest(
        parseResult.error.errors.map(e => e.message).join(', ')
      );
    }
    const { plan, plan_expires_at } = parseResult.data;

    const supabase = getAdminSupabase();
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        plan,
        plan_started_at: now,
        plan_expires_at: plan_expires_at ?? null,
        updated_at: now,
      })
      .eq('id', req.params.id)
      .select('id, email, name, plan, plan_started_at, plan_expires_at')
      .single();

    if (error || !updated) throw new LumioError('Failed to update plan', 500);

    res.json({
      data: { user: updated },
      error: null,
      message: `Plan changed to ${plan}`,
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/clients/:id/ban — Ban a user
// ══════════════════════════════════════════════════════════════════════════════
router.post('/clients/:id/ban', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();
    const targetId = req.params.id;

    // Prevent self-ban
    if (targetId === req.user.id) {
      throw LumioError.badRequest('You cannot ban your own account');
    }

    const { error } = await supabase
      .from('users')
      .update({ is_banned: true, updated_at: new Date().toISOString() })
      .eq('id', targetId);

    if (error) throw new LumioError('Failed to ban user', 500);

    res.json({
      data: { banned: true, userId: targetId },
      error: null,
      message: 'User banned',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/clients/:id/unban — Unban a user
// ══════════════════════════════════════════════════════════════════════════════
router.post('/clients/:id/unban', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from('users')
      .update({ is_banned: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw new LumioError('Failed to unban user', 500);

    res.json({
      data: { banned: false, userId: req.params.id },
      error: null,
      message: 'User unbanned',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/report — AI platform health report
// ══════════════════════════════════════════════════════════════════════════════
router.get('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    // Fetch top 20 active users with their most recent challenge data
    const { data: activeChallenges, error } = await supabase
      .from('challenges')
      .select('goal, current_day, duration_days, status, completed_days')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new Error('Failed to fetch challenge data for report');

    const clientInputs = (activeChallenges ?? []).map((c: {
      goal: string;
      current_day: number;
      duration_days: number;
      status: string;
      completed_days: number[];
    }) => ({
      goal: c.goal,
      day: c.current_day,
      duration: c.duration_days,
      status: c.status,
    }));

    const report = await generateAdminReport(clientInputs);

    res.json({
      data: { report },
      error: null,
      message: 'Platform health report generated',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/broadcast — Generate tip + notify all users
// ══════════════════════════════════════════════════════════════════════════════
router.post('/broadcast', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = BroadcastSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw LumioError.badRequest(
        parseResult.error.errors.map(e => e.message).join(', ')
      );
    }
    const { topic, targetPlan } = parseResult.data;

    // Generate the AI tip
    const tip = await generateBroadcastTip(topic);

    // Persist the broadcast record
    const supabase = getAdminSupabase();
    const { data: broadcast, error: insertErr } = await supabase
      .from('admin_broadcasts')
      .insert({
        admin_id: req.user.id,
        title: tip.title,
        message: tip.tip,
        tip_data: tip,
        target_plan: targetPlan,
        sent_count: 0, // updated below
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !broadcast) {
      throw new LumioError('Failed to save broadcast', 500);
    }

    // Send in-app notifications to all matching users
    const sentCount = await broadcastNotification(
      'admin_broadcast',
      `${tip.emoji} ${tip.title}`,
      tip.tip,
      targetPlan,
      { broadcastId: broadcast.id, actionStep: tip.actionStep }
    );

    // Update sent_count now that we know the actual number
    await supabase
      .from('admin_broadcasts')
      .update({ sent_count: sentCount })
      .eq('id', broadcast.id);

    res.json({
      data: { tip, sentCount, broadcastId: broadcast.id },
      error: null,
      message: `Broadcast sent to ${sentCount} users`,
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/moderation — Flagged content queue
// ══════════════════════════════════════════════════════════════════════════════
router.get('/moderation', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    const [{ data: posts }, { data: comments }] = await Promise.all([
      supabase
        .from('community_posts')
        .select('id, user_id, content, image_url, niche_id, flag_count, likes_count, created_at, users(id, name, email, avatar_url)')
        .eq('is_flagged', true)
        .eq('is_hidden', false)
        .order('flag_count', { ascending: false }),

      supabase
        .from('post_comments')
        .select('id, post_id, user_id, content, created_at, users(id, name, email)')
        .eq('is_flagged', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false }),
    ]);

    res.json({
      data: {
        posts: posts ?? [],
        comments: comments ?? [],
        totalFlagged: (posts?.length ?? 0) + (comments?.length ?? 0),
      },
      error: null,
      message: 'Moderation queue loaded',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/moderation/posts/:id/hide — Hide a post
// ══════════════════════════════════════════════════════════════════════════════
router.post('/moderation/posts/:id/hide', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();
    const postId = req.params.id;

    // Fetch before hiding so we can notify the owner
    const { data: post, error: fetchErr } = await supabase
      .from('community_posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();

    if (fetchErr || !post) throw LumioError.notFound('Post');

    const { error: hideErr } = await supabase
      .from('community_posts')
      .update({ is_hidden: true })
      .eq('id', postId);

    if (hideErr) throw new LumioError('Failed to hide post', 500);

    // Notify the post owner
    await notifyUser({
      userId: post.user_id as string,
      type: 'moderation',
      title: 'Post Removed',
      message: 'Your post was removed for violating community guidelines.',
      data: { postId },
    });

    res.json({
      data: { hidden: true, postId },
      error: null,
      message: 'Post hidden and owner notified',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/admin/moderation/comments/:id/hide — Hide a comment
// ══════════════════════════════════════════════════════════════════════════════
router.post('/moderation/comments/:id/hide', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();
    const commentId = req.params.id;

    const { error } = await supabase
      .from('post_comments')
      .update({ is_hidden: true })
      .eq('id', commentId);

    if (error) throw new LumioError('Failed to hide comment', 500);

    res.json({
      data: { hidden: true, commentId },
      error: null,
      message: 'Comment hidden',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/revenue — Revenue overview from payments table
// ══════════════════════════════════════════════════════════════════════════════
router.get('/revenue', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, user_id, type, plan, amount, currency, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch payments');

    const allPayments = (payments ?? []) as Array<{
      id: string;
      user_id: string;
      type: string;
      plan: string | null;
      amount: number;
      currency: string;
      status: string;
      created_at: string;
    }>;

    // Group by plan
    const byPlan: Record<string, { count: number; total: number }> = {};
    let totalRevenue = 0;
    let thisMonthRevenue = 0;

    const thisMonthStart = new Date();
    thisMonthStart.setUTCDate(1);
    thisMonthStart.setUTCHours(0, 0, 0, 0);

    for (const p of allPayments) {
      if (p.status !== 'active') continue;
      const key = p.plan ?? p.type;
      if (!byPlan[key]) byPlan[key] = { count: 0, total: 0 };
      byPlan[key].count++;
      byPlan[key].total = Math.round((byPlan[key].total + p.amount) * 100) / 100;
      totalRevenue = Math.round((totalRevenue + p.amount) * 100) / 100;

      if (new Date(p.created_at) >= thisMonthStart) {
        thisMonthRevenue = Math.round((thisMonthRevenue + p.amount) * 100) / 100;
      }
    }

    const summary: RevenueSummary = {
      payments: allPayments,
      byPlan,
      totalRevenue,
      thisMonthRevenue,
    };

    res.json({
      data: summary,
      error: null,
      message: `${allPayments.length} payment records`,
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats — Platform-wide stats
// ══════════════════════════════════════════════════════════════════════════════
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const supabase = getAdminSupabase();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

    const [
      { count: totalUsers },
      { count: activeChallenges },
      { count: postsToday },
      { count: newUsersThisWeek },
      { data: aiData },
      { data: completionData },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),

      supabase
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),

      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString()),

      // Sum of ai_queries_today across all users
      supabase
        .from('users')
        .select('ai_queries_today')
        .gte('ai_queries_reset_at', todayStart.toISOString()),

      // For average completion rate: fetch active challenges' completed_days
      supabase
        .from('challenges')
        .select('completed_days, current_day')
        .eq('status', 'active')
        .limit(500),
    ]);

    // Sum AI queries from users who've been reset today
    const aiQueriesToday = ((aiData ?? []) as Array<{ ai_queries_today: number }>)
      .reduce((sum, u) => sum + (u.ai_queries_today ?? 0), 0);

    // Average completion rate across active challenges
    let averageCompletionRate = 0;
    if (completionData && completionData.length > 0) {
      const rates = (completionData as Array<{ completed_days: number[]; current_day: number }>)
        .map(c => {
          const daysElapsed = Math.max(c.current_day - 1, 1);
          return Math.min(100, Math.round((c.completed_days.length / daysElapsed) * 100));
        });
      averageCompletionRate =
        Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10;
    }

    const stats: PlatformStats = {
      totalUsers: totalUsers ?? 0,
      activeChallenges: activeChallenges ?? 0,
      postsToday: postsToday ?? 0,
      newUsersThisWeek: newUsersThisWeek ?? 0,
      aiQueriesToday,
      averageCompletionRate,
    };

    res.json({
      data: stats,
      error: null,
      message: 'Platform stats loaded',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

export default router;
