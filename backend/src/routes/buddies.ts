import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { authenticate } from '../middleware/auth';
import { requirePlan } from '../middleware/plan-gate';
import { createNotification } from '../services/notifications';
import { validate } from '../utils/validate';
import { notFound, forbidden, badRequest } from '../utils/errors';
import { z } from 'zod';

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const BuddyInviteSchema = z.object({
  challenge_id: z.string().uuid(),
  buddy_user_id: z.string().uuid(),
});

// ─── POST /api/buddies/invite — Invite buddy to challenge ────────────────────

router.post(
  '/invite',
  authenticate,
  requirePlan('starter'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = validate(BuddyInviteSchema, req.body);
      const inviterId = req.user.id;

      if (body.buddy_user_id === inviterId) {
        throw badRequest('You cannot invite yourself as a buddy');
      }

      // Verify the challenge belongs to requesting user and is active
      const { data: challenge, error: challengeErr } = await supabase
        .from('challenges')
        .select('id, user_id, status, goal, niche_id')
        .eq('id', body.challenge_id)
        .single();

      if (challengeErr || !challenge) throw notFound('Challenge not found');
      if (challenge.user_id !== inviterId) throw forbidden('This challenge does not belong to you');
      if (challenge.status !== 'active') throw badRequest('You can only invite buddies to active challenges');

      // Verify the buddy user exists
      const { data: buddy, error: buddyErr } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', body.buddy_user_id)
        .single();

      if (buddyErr || !buddy) throw notFound('Buddy user not found');

      // Insert invitation (pending)
      const { data: invitation, error: insertErr } = await supabase
        .from('challenge_buddies')
        .insert({
          challenge_id: body.challenge_id,
          inviter_id: inviterId,
          buddy_id: body.buddy_user_id,
          status: 'pending',
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Notify the buddy
      createNotification(body.buddy_user_id, {
        type: 'buddy_invite',
        title: 'Buddy invitation!',
        body: `${req.user.name ?? 'Someone'} invited you to be their accountability buddy.`,
        data: { buddy_record_id: invitation.id, challenge_id: body.challenge_id },
      }).catch(() => {});

      return res.status(201).json({ data: invitation });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/buddies/:id/accept — Accept buddy invitation ──────────────────

router.post('/:id/accept', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buddyRecordId = req.params.id;
    const userId = req.user.id;

    const { data: record, error } = await supabase
      .from('challenge_buddies')
      .select('id, buddy_id, inviter_id, challenge_id, status')
      .eq('id', buddyRecordId)
      .single();

    if (error || !record) throw notFound('Buddy invitation not found');
    if (record.buddy_id !== userId) throw forbidden('This invitation is not for you');
    if (record.status !== 'pending') throw badRequest('Invitation is no longer pending');

    const { data: updated, error: updateErr } = await supabase
      .from('challenge_buddies')
      .update({ status: 'accepted' })
      .eq('id', buddyRecordId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Notify the inviter
    createNotification(record.inviter_id, {
      type: 'buddy_accepted',
      title: 'Buddy request accepted!',
      body: `${req.user.name ?? 'Your buddy'} accepted your accountability invite. You're in this together! 💪`,
      data: { buddy_record_id: buddyRecordId, challenge_id: record.challenge_id },
    }).catch(() => {});

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/buddies/:id/decline — Decline invitation ──────────────────────

router.post('/:id/decline', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buddyRecordId = req.params.id;
    const userId = req.user.id;

    const { data: record, error } = await supabase
      .from('challenge_buddies')
      .select('id, buddy_id, status')
      .eq('id', buddyRecordId)
      .single();

    if (error || !record) throw notFound('Buddy invitation not found');
    if (record.buddy_id !== userId) throw forbidden('This invitation is not for you');
    if (record.status !== 'pending') throw badRequest('Invitation is no longer pending');

    const { error: updateErr } = await supabase
      .from('challenge_buddies')
      .update({ status: 'declined' })
      .eq('id', buddyRecordId);

    if (updateErr) throw updateErr;

    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/challenges/:challengeId/buddy — Get buddy for this challenge ────
// Note: mounted at /api/buddies/challenge/:challengeId for consistency with this router

router.get(
  '/challenge/:challengeId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { challengeId } = req.params;
      const userId = req.user.id;

      // Verify the challenge belongs to or involves the requesting user
      const { data: record, error } = await supabase
        .from('challenge_buddies')
        .select('id, inviter_id, buddy_id, status')
        .eq('challenge_id', challengeId)
        .eq('status', 'accepted')
        .or(`inviter_id.eq.${userId},buddy_id.eq.${userId}`)
        .maybeSingle();

      if (error) throw error;
      if (!record) return res.json({ data: null });

      // Resolve the other party's ID
      const buddyUserId = record.inviter_id === userId ? record.buddy_id : record.inviter_id;

      // Fetch buddy's user + challenge progress
      const [{ data: buddyUser }, { data: buddyChallenge }] = await Promise.all([
        supabase.from('users').select('id, name, avatar_url').eq('id', buddyUserId).single(),
        supabase
          .from('challenges')
          .select('current_day, completed_days, streak')
          .eq('user_id', buddyUserId)
          .eq('id', challengeId)
          .maybeSingle(),
      ]);

      return res.json({
        data: {
          buddy_id: buddyUserId,
          name: buddyUser?.name ?? null,
          avatar_url: buddyUser?.avatar_url ?? null,
          progress: buddyChallenge
            ? {
                current_day: buddyChallenge.current_day,
                completed_days: buddyChallenge.completed_days,
                streak: buddyChallenge.streak,
              }
            : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── GET /api/buddies/pending — My pending invitations ───────────────────────

router.get('/pending', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('challenge_buddies')
      .select(
        `
        id, status, created_at,
        challenges:challenge_id (id, goal, niche_id, duration_days, current_day),
        inviter:inviter_id (id, name, avatar_url)
        `,
      )
      .eq('buddy_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ data: { invitations: data ?? [] } });
  } catch (err) {
    next(err);
  }
});

export default router;
