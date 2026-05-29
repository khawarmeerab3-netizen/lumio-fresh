import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../utils/validate';
import { supabaseAdmin } from '../utils/supabase';
import {
  awardPoints,
  deductPoints,
  redeemPoints,
  getUserPointsHistory,
} from '../services/points-engine';
import { POINTS_REDEEM, type RedemptionType } from '../../../shared/constants/points';
import { badRequest } from '../utils/errors';

export const pointsRouter = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const RedeemSchema = z.object({
  redemptionType: z.enum(Object.keys(POINTS_REDEEM) as [RedemptionType, ...RedemptionType[]]),
  // Optional meta for certain redemption types — max length guards prevent oversized IDs
  moodThemeId: z.string().max(100).optional(),
  coachId:     z.string().max(100).optional(),
  badgeId:     z.string().max(100).optional(),
});

// ─── GET /api/points ─────────────────────────────────────────────────────────

pointsRouter.get(
  '/',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('points, total_points_earned')
        .eq('id', req.user.id)
        .single();

      const { transactions, total } = await getUserPointsHistory(req.user.id, 50, 0);

      res.status(200).json({
        data: {
          balance: user?.points ?? 0,
          totalEarned: user?.total_points_earned ?? 0,
          history: transactions,
          historyTotal: total,
        },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/points/redeem ──────────────────────────────────────────────────

pointsRouter.post(
  '/redeem',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(RedeemSchema, req.body);

      const result = await redeemPoints(req.user.id, body.redemptionType as RedemptionType, {
        moodThemeId: body.moodThemeId,
        coachId: body.coachId,
        badgeId: body.badgeId,
      });

      res.status(200).json({
        data: { newBalance: result.newBalance, reward: result.reward },
        error: null,
        message: 'Points redeemed',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/points/leaderboard ─────────────────────────────────────────────

pointsRouter.get(
  '/leaderboard',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const nicheId = typeof req.query.nicheId === 'string' ? req.query.nicheId : undefined;

      // Calculate 7 days ago boundary
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Aggregate points per user from transactions in the last 7 days
      // Supabase doesn't have a GROUP BY sugar so we fetch all relevant rows
      // and aggregate in JS. For production scale, use a DB view or RPC.
      let txQuery = supabaseAdmin
        .from('points_transactions')
        .select('user_id, points')
        .gte('created_at', sevenDaysAgo)
        .gt('points', 0); // only earning transactions

      // If filtering by niche, join via a subquery on challenge user_ids active in that niche
      let nicheUserIds: string[] | undefined;
      if (nicheId) {
        const { data: nicheUsers } = await supabaseAdmin
          .from('challenges')
          .select('user_id')
          .eq('niche_id', nicheId);
        nicheUserIds = (nicheUsers ?? []).map((r: { user_id: string }) => r.user_id);
        if (nicheUserIds.length === 0) {
          res.status(200).json({ data: [], error: null, message: 'OK' });
          return;
        }
        txQuery = txQuery.in('user_id', nicheUserIds);
      }

      const { data: txRows, error: txError } = await txQuery;
      if (txError) throw new Error(txError.message);

      // Aggregate by userId
      const totals = new Map<string, number>();
      for (const row of txRows ?? []) {
        const uid = row.user_id as string;
        totals.set(uid, (totals.get(uid) ?? 0) + (row.points as number));
      }

      // Sort descending, take top 20
      const sorted = [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      if (sorted.length === 0) {
        res.status(200).json({ data: [], error: null, message: 'OK' });
        return;
      }

      // Fetch user info for those ids
      const topIds = sorted.map(([uid]) => uid);
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar_url, plan')
        .in('id', topIds);

      if (usersError) throw new Error(usersError.message);

      const userMap = new Map(
        (users ?? []).map((u: { id: string; name: string; avatar_url: string | null; plan: string }) => [
          u.id,
          u,
        ])
      );

      const leaderboard = sorted.map(([uid, pts], idx) => {
        const u = userMap.get(uid);
        return {
          userId: uid,
          name: u?.name ?? 'Unknown',
          avatarUrl: u?.avatar_url ?? null,
          plan: u?.plan ?? 'free',
          pointsThisWeek: pts,
          rank: idx + 1,
        };
      });

      res.status(200).json({
        data: leaderboard,
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);
