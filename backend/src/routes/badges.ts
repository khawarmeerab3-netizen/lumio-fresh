import { Router, Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { supabaseAdmin } from '../utils/supabase';
import { getUserBadges } from '../services/badge-engine';
import type { Badge } from '../../../shared/types/index';

export const badgesRouter = Router();

// ─── GET /api/badges — All available badges, with earned status ───────────────

badgesRouter.get(
  '/',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // All system badges
      const { data: allBadges, error: badgesError } = await supabaseAdmin
        .from('badges')
        .select('*')
        .order('condition_value', { ascending: true });

      if (badgesError) throw new Error(badgesError.message);

      // Badges the current user owns
      const { data: ownedRows } = await supabaseAdmin
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', req.user.id);

      const ownedMap = new Map(
        (ownedRows ?? []).map((r: { badge_id: string; earned_at: string }) => [
          r.badge_id,
          r.earned_at,
        ])
      );

      const badges = (allBadges ?? []).map((badge: Badge) => ({
        ...badge,
        is_earned: ownedMap.has(badge.id),
        earned_at: ownedMap.get(badge.id) ?? null,
      }));

      res.status(200).json({
        data: { badges },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/badges/me — My earned badges (also mounted on usersRouter) ──────

badgesRouter.get(
  '/me',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const badges = await getUserBadges(req.user.id);
      res.status(200).json({
        data: { badges },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);
