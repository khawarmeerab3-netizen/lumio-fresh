import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { authenticate } from '../middleware/auth';
import { createNotification } from '../services/notifications';
import { badRequest, notFound } from '../utils/errors';

const router = Router();

// ─── POST /api/users/:id/follow — Follow a user ───────────────────────────────

router.post('/:id/follow', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.params.id;
    const followerId = req.user.id;

    if (targetId === followerId) {
      throw badRequest('You cannot follow yourself');
    }

    // Verify target user exists
    const { data: target, error: userErr } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', targetId)
      .single();

    if (userErr || !target) throw notFound('User not found');

    // ON CONFLICT DO NOTHING — already following is a no-op
    const { error } = await supabase
      .from('user_followers')
      .insert({ follower_id: followerId, following_id: targetId })
      .onConflict('follower_id, following_id')
      .ignoreDuplicates();

    if (error) throw error;

    // Notify followed user (fire-and-forget)
    createNotification(targetId, {
      type: 'follow',
      title: 'New follower!',
      body: `${req.user.name ?? 'Someone'} started following you.`,
      data: { follower_id: followerId },
    }).catch(() => {});

    return res.json({ data: { following: true } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/users/:id/follow — Unfollow ─────────────────────────────────

router.delete('/:id/follow', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.params.id;
    const followerId = req.user.id;

    const { error } = await supabase
      .from('user_followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', targetId);

    if (error) throw error;

    return res.json({ data: { following: false } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/me/followers — My followers ───────────────────────────────

router.get('/me/followers', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_followers')
      .select('follower:follower_id (id, name, avatar_url, plan)')
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const followers = (data ?? []).map((row: Record<string, unknown>) => row.follower);

    return res.json({ data: { followers } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/users/me/following — Who I follow ───────────────────────────────

router.get('/me/following', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('user_followers')
      .select('following:following_id (id, name, avatar_url, plan)')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const following = (data ?? []).map((row: Record<string, unknown>) => row.following);

    return res.json({ data: { following } });
  } catch (err) {
    next(err);
  }
});

export default router;
