import { supabaseAdmin } from '../utils/supabase';
import { badRequest, notFound } from '../utils/errors';
import { POINTS_EARN, POINTS_REDEEM, type RedemptionType } from '../../../shared/constants/points';
import type { PointsTransaction, UserPlan } from '../../../shared/types/index';

// Lazy import to avoid circular dependency (badge-engine also imports points-engine)
async function runBadgeCheck(userId: string): Promise<void> {
  try {
    const { checkBadgeUnlocks } = await import('./badge-engine');
    await checkBadgeUnlocks(userId);
  } catch {
    // Badge check must never fail the parent transaction
  }
}

// ─── awardPoints ─────────────────────────────────────────────────────────────

export async function awardPoints(
  userId: string,
  action: string,
  basePoints: number,
  description: string,
  referenceId?: string
): Promise<number> {
  // Fetch user to check plan for Elite 2× multiplier
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, plan, points, total_points_earned')
    .eq('id', userId)
    .single();

  if (userError || !user) throw notFound('User not found');

  const multiplier = (user.plan as UserPlan) === 'elite' ? 2 : 1;
  const points = basePoints * multiplier;

  // Record transaction
  await supabaseAdmin.from('points_transactions').insert({
    user_id: userId,
    action,
    points,
    description,
    reference_id: referenceId ?? null,
  });

  // Update balance — total_points_earned only increases (never for negative base)
  const newPoints = (user.points as number) + points;
  const additionalEarned = Math.max(0, points);

  await supabaseAdmin
    .from('users')
    .update({
      points: newPoints,
      total_points_earned: (user.total_points_earned as number) + additionalEarned,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Fire badge check asynchronously — never blocks or fails the caller
  void runBadgeCheck(userId);

  return newPoints;
}

// ─── deductPoints ─────────────────────────────────────────────────────────────

export async function deductPoints(
  userId: string,
  action: string,
  amount: number,       // positive number — we'll negate it
  description: string,
  referenceId?: string
): Promise<number> {
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, points')
    .eq('id', userId)
    .single();

  if (userError || !user) throw notFound('User not found');

  const deduction = Math.abs(amount);
  // Points floor is 0
  const newPoints = Math.max(0, (user.points as number) - deduction);
  const actualDeducted = (user.points as number) - newPoints; // may be less than deduction if floored

  await supabaseAdmin.from('points_transactions').insert({
    user_id: userId,
    action,
    points: -actualDeducted,
    description,
    reference_id: referenceId ?? null,
  });

  await supabaseAdmin
    .from('users')
    .update({ points: newPoints, updated_at: new Date().toISOString() })
    .eq('id', userId);

  return newPoints;
}

// ─── redeemPoints ─────────────────────────────────────────────────────────────

export interface RedemptionResult {
  success: boolean;
  newBalance: number;
  reward: Record<string, unknown>;
}

export async function redeemPoints(
  userId: string,
  redemptionType: RedemptionType,
  meta?: { moodThemeId?: string; coachId?: string; badgeId?: string }
): Promise<RedemptionResult> {
  const cost = POINTS_REDEEM[redemptionType];

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, points, plan')
    .eq('id', userId)
    .single();

  if (userError || !user) throw notFound('User not found');

  if ((user.points as number) < cost) {
    throw badRequest(`Not enough points. Need ${cost}, have ${user.points}.`);
  }

  // Deduct
  const newBalance = await deductPoints(userId, `REDEEM_${redemptionType}`, cost, `Redeemed: ${redemptionType}`);

  const reward: Record<string, unknown> = { redemptionType };

  // Apply reward
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  switch (redemptionType) {
    case 'ONE_MONTH_STARTER': {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'starter', plan_started_at: new Date().toISOString(), plan_expires_at: thirtyDaysFromNow, updated_at: new Date().toISOString() })
        .eq('id', userId);
      reward.plan = 'starter';
      reward.expiresAt = thirtyDaysFromNow;
      break;
    }
    case 'ONE_MONTH_PRO': {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'pro', plan_started_at: new Date().toISOString(), plan_expires_at: thirtyDaysFromNow, updated_at: new Date().toISOString() })
        .eq('id', userId);
      reward.plan = 'pro';
      reward.expiresAt = thirtyDaysFromNow;
      break;
    }
    case 'ONE_MONTH_ELITE': {
      await supabaseAdmin
        .from('users')
        .update({ plan: 'elite', plan_started_at: new Date().toISOString(), plan_expires_at: thirtyDaysFromNow, updated_at: new Date().toISOString() })
        .eq('id', userId);
      reward.plan = 'elite';
      reward.expiresAt = thirtyDaysFromNow;
      break;
    }
    case 'UNLOCK_MOOD_THEME': {
      if (!meta?.moodThemeId) throw badRequest('moodThemeId required for UNLOCK_MOOD_THEME');
      // Store unlocked themes in user metadata (Supabase user_metadata or a dedicated column)
      // Using a simple JSONB approach via a separate query to fetch current metadata
      const { data: userMeta } = await supabaseAdmin
        .from('users')
        .select('unlocked_mood_themes')
        .eq('id', userId)
        .single();
      const existing: string[] = (userMeta as Record<string, unknown> | null)?.unlocked_mood_themes as string[] ?? [];
      if (!existing.includes(meta.moodThemeId)) {
        existing.push(meta.moodThemeId);
        await supabaseAdmin
          .from('users')
          .update({ unlocked_mood_themes: existing, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
      reward.unlockedMoodTheme = meta.moodThemeId;
      break;
    }
    case 'UNLOCK_COACH': {
      if (!meta?.coachId) throw badRequest('coachId required for UNLOCK_COACH');
      const { data: userMeta } = await supabaseAdmin
        .from('users')
        .select('unlocked_coach_ids')
        .eq('id', userId)
        .single();
      const existing: string[] = (userMeta as Record<string, unknown> | null)?.unlocked_coach_ids as string[] ?? [];
      if (!existing.includes(meta.coachId)) {
        existing.push(meta.coachId);
        await supabaseAdmin
          .from('users')
          .update({ unlocked_coach_ids: existing, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
      reward.unlockedCoachId = meta.coachId;
      break;
    }
    case 'UNLOCK_BADGE': {
      if (!meta?.badgeId) throw badRequest('badgeId required for UNLOCK_BADGE');
      const { awardBadge } = await import('./badge-engine');
      const badge = await awardBadge(userId, meta.badgeId);
      reward.badge = badge;
      break;
    }
  }

  return { success: true, newBalance, reward };
}

// ─── getUserPointsHistory ─────────────────────────────────────────────────────

export async function getUserPointsHistory(
  userId: string,
  limit = 50,
  offset = 0
): Promise<{ transactions: PointsTransaction[]; total: number }> {
  const { data, error, count } = await supabaseAdmin
    .from('points_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    transactions: (data ?? []) as PointsTransaction[],
    total: count ?? 0,
  };
}

// ─── awardStreakBonus ─────────────────────────────────────────────────────────
// Convenience: call after streak increments, awards bonus only at exact thresholds

export async function awardStreakBonus(userId: string, streakCount: number): Promise<void> {
  if (streakCount === 7) {
    await awardPoints(userId, 'STREAK_7_DAY_BONUS', POINTS_EARN.STREAK_7_DAY_BONUS, '7-day streak bonus! 🔥');
  } else if (streakCount === 30) {
    await awardPoints(userId, 'STREAK_30_DAY_BONUS', POINTS_EARN.STREAK_30_DAY_BONUS, '30-day streak bonus! 💪');
  } else if (streakCount === 100) {
    await awardPoints(userId, 'STREAK_100_DAY_BONUS', POINTS_EARN.STREAK_100_DAY_BONUS, '100-day streak bonus! 🏆');
  }
}
