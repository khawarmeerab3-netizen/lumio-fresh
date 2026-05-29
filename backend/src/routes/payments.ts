import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { validate } from '../utils/validate';
import { supabaseAdmin } from '../utils/supabase';
import { badRequest, notFound } from '../utils/errors';
import {
  createCheckoutUrl,
  createMemoryPackCheckout,
  createBillingPortalUrl,
} from '../services/payments';

export const paymentsRouter = Router();

// ─── Schemas ─────────────────────────────────────────────────────────────────

const CheckoutSchema = z.object({
  plan:   z.enum(['starter', 'pro', 'elite']),
  annual: z.boolean().optional().default(false),
});

const MemoryPackSchema = z.object({
  challengeId:  z.string().uuid(),
  durationDays: z.number().int().refine(
    (d) => [3, 7, 15, 30, 90, 365].includes(d),
    { message: 'durationDays must be one of: 3, 7, 15, 30, 90, 365' }
  ),
});

// ─── POST /api/payments/checkout ─────────────────────────────────────────────

paymentsRouter.post(
  '/checkout',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(CheckoutSchema, req.body);
      const checkoutUrl = await createCheckoutUrl(req.user.id, body.plan, body.annual);

      res.status(200).json({
        data: { checkoutUrl },
        error: null,
        message: 'Checkout URL created',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/payments/memory-pack ──────────────────────────────────────────

paymentsRouter.post(
  '/memory-pack',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(MemoryPackSchema, req.body);

      // 3-day pack is free — activate directly, no checkout needed
      if (body.durationDays === 3) {
        await supabaseAdmin.from('memory_packs').insert({
          user_id:      req.user.id,
          challenge_id: body.challengeId,
          duration_days: 3,
          price_paid:   0,
          status:       'active',
        });
        res.status(200).json({
          data: { activated: true, durationDays: 3, free: true },
          error: null,
          message: '3-day memory pack activated (free)',
        });
        return;
      }

      // Verify challenge belongs to the requesting user
      const { data: challenge, error: challengeError } = await supabaseAdmin
        .from('challenges')
        .select('id, user_id')
        .eq('id', body.challengeId)
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (challengeError || !challenge) {
        throw notFound('Challenge not found or does not belong to you');
      }

      const checkoutUrl = await createMemoryPackCheckout(
        req.user.id,
        body.challengeId,
        body.durationDays
      );

      res.status(200).json({
        data: { checkoutUrl },
        error: null,
        message: 'Memory pack checkout URL created',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/payments/portal ─────────────────────────────────────────────────

paymentsRouter.get(
  '/portal',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Look up the user's most recent active subscription
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('lemonsqueezy_subscription_id')
        .eq('user_id', req.user.id)
        .eq('type', 'subscription')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) throw new Error(paymentError.message);

      const subscriptionId = payment?.lemonsqueezy_subscription_id as string | undefined;
      if (!subscriptionId) {
        throw badRequest('No active subscription found');
      }

      const portalUrl = await createBillingPortalUrl(subscriptionId);

      res.status(200).json({
        data: { portalUrl },
        error: null,
        message: 'Billing portal URL retrieved',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/payments/status ─────────────────────────────────────────────────

paymentsRouter.get(
  '/status',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const now = new Date();
      const expiresAt = user.plan_expires_at ? new Date(user.plan_expires_at) : null;
      const isActive =
        user.plan !== 'free' && (expiresAt === null || expiresAt > now);

      res.status(200).json({
        data: {
          plan:          user.plan,
          planExpiresAt: user.plan_expires_at ?? null,
          isActive,
        },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);
