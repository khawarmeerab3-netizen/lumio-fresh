import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../utils/validate';
import { supabaseAdmin } from '../utils/supabase';
import { notFound } from '../utils/errors';

export const notificationsRouter = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const GetNotificationsSchema = z.object({
  unread_only: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(100, Math.max(1, parseInt(v ?? '50', 10))))
    .catch(50),
  offset: z
    .string()
    .optional()
    .transform((v) => Math.max(0, parseInt(v ?? '0', 10)))
    .catch(0),
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

notificationsRouter.get(
  '/',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = validate(GetNotificationsSchema, req.query);

      let dbQuery = supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1);

      if (query.unread_only) {
        dbQuery = dbQuery.eq('is_read', false);
      }

      const { data, error, count } = await dbQuery;

      if (error) throw new Error(error.message);

      // Count total unread (regardless of filter) for badge display
      const { count: unreadCount } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('is_read', false);

      res.status(200).json({
        data: {
          notifications: data ?? [],
          total:         count ?? 0,
          unreadCount:   unreadCount ?? 0,
          limit:         query.limit,
          offset:        query.offset,
        },
        error:   null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/notifications/mark-read — Mark ALL as read ────────────────────

notificationsRouter.post(
  '/mark-read',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', req.user.id)
        .eq('is_read', false); // only touch unread rows

      if (error) throw new Error(error.message);

      res.status(200).json({
        data:    { success: true },
        error:   null,
        message: 'All notifications marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/notifications/:id/mark-read — Mark ONE as read ────────────────

notificationsRouter.post(
  '/:id/mark-read',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Verify notification belongs to requesting user before updating
      const { data: existing } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('id', id)
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (!existing) {
        throw notFound('Notification not found');
      }

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', req.user.id);

      if (error) throw new Error(error.message);

      res.status(200).json({
        data:    { success: true },
        error:   null,
        message: 'Notification marked as read',
      });
    } catch (err) {
      next(err);
    }
  }
);
