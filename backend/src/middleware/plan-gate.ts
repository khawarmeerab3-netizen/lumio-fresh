import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { planLimitReached } from '../utils/errors';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanType = 'free' | 'starter' | 'pro' | 'elite' | 'enterprise' | 'custom';

const PLAN_RANK: Record<PlanType, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
  custom: 3,
  enterprise: 4,
};

/** Returns true if the user's plan meets or exceeds the required minimum. */
export function hasAccess(userPlan: PlanType, minimumPlan: PlanType): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[minimumPlan];
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<PlanType, { maxActiveChallenges: number; allowedDurations: number[] | 'all' }> = {
  free:       { maxActiveChallenges: 1,        allowedDurations: [1, 3, 7] },
  starter:    { maxActiveChallenges: 3,        allowedDurations: 'all' },
  pro:        { maxActiveChallenges: 10,       allowedDurations: 'all' },
  elite:      { maxActiveChallenges: Infinity, allowedDurations: 'all' },
  custom:     { maxActiveChallenges: Infinity, allowedDurations: 'all' },
  enterprise: { maxActiveChallenges: Infinity, allowedDurations: 'all' },
};

// ─── requirePlan ──────────────────────────────────────────────────────────────

/**
 * Middleware factory. Blocks the request if the user's plan is below
 * `minimumPlan` and throws a `planLimitReached` error.
 *
 * @example
 *   router.post('/report', requirePlan('pro'), generateReportHandler);
 */
export function requirePlan(minimumPlan: PlanType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const userPlan = req.user.plan as PlanType;

      if (!hasAccess(userPlan, minimumPlan)) {
        throw planLimitReached(
          `This feature requires ${minimumPlan.charAt(0).toUpperCase() + minimumPlan.slice(1)} or higher`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── checkDurationAllowed ─────────────────────────────────────────────────────

/**
 * Middleware. Reads `durationDays` from `req.body` and validates it against
 * the user's plan. Free users may only use 1, 3, or 7-day challenges.
 */
export function checkDurationAllowed(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const userPlan = req.user.plan as PlanType;
    const durationDays = Number(req.body?.durationDays);

    if (!durationDays || isNaN(durationDays)) {
      throw new Error('durationDays is required');
    }

    const limits = PLAN_LIMITS[userPlan];

    if (
      limits.allowedDurations !== 'all' &&
      !limits.allowedDurations.includes(durationDays)
    ) {
      throw planLimitReached(
        `Your plan only allows challenges of ${limits.allowedDurations.join(', ')} days. Upgrade to unlock longer durations.`,
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

// ─── checkChallengeLimitNotReached ────────────────────────────────────────────

/**
 * Middleware. Counts the user's active challenges this month and blocks
 * creation if the plan's `maxActiveChallenges` limit is reached.
 */
export async function checkChallengeLimitNotReached(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user.id;
    const userPlan = req.user.plan as PlanType;
    const maxAllowed = PLAN_LIMITS[userPlan].maxActiveChallenges;

    // Unlimited plans skip the check
    if (maxAllowed === Infinity) {
      return next();
    }

    const { count, error } = await supabase
      .from('challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('[PlanGate] challenge count query failed:', error.message);
      // Fail open — don't block the user due to a DB error
      return next();
    }

    const activeCount = count ?? 0;

    if (activeCount >= maxAllowed) {
      throw planLimitReached(
        `You've reached your plan's limit of ${maxAllowed} active challenge${maxAllowed === 1 ? '' : 's'}. Upgrade to run more simultaneously.`,
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

// ─── checkCommunityPostAllowed ────────────────────────────────────────────────

/**
 * Middleware. Blocks community posting for Free users — requires Starter or higher.
 */
export function checkCommunityPostAllowed(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const userPlan = req.user.plan as PlanType;

    if (userPlan === 'free') {
      throw planLimitReached('Community posting requires Starter or higher');
    }

    next();
  } catch (err) {
    next(err);
  }
}
