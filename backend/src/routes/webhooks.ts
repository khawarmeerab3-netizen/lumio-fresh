import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase';

export const webhooksRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Verify the HMAC-SHA256 signature sent by LemonSqueezy.
 * The signature is computed over the raw request body bytes.
 * Express must NOT have parsed this body through express.json() yet —
 * we mount the webhook router BEFORE express.json() in index.ts,
 * and use express.raw() here instead.
 */
function verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set');
    return false;
  }
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

// Map LemonSqueezy variant IDs → Lumio plan names.
// Populate these from your LS dashboard / env vars.
function variantToPlan(variantId: string): 'starter' | 'pro' | 'elite' | null {
  const map: Record<string, 'starter' | 'pro' | 'elite'> = {
    [process.env.LS_VARIANT_STARTER_MONTHLY ?? 'STARTER_MONTHLY']: 'starter',
    [process.env.LS_VARIANT_STARTER_ANNUAL  ?? 'STARTER_ANNUAL']:  'starter',
    [process.env.LS_VARIANT_PRO_MONTHLY     ?? 'PRO_MONTHLY']:     'pro',
    [process.env.LS_VARIANT_PRO_ANNUAL      ?? 'PRO_ANNUAL']:      'pro',
    [process.env.LS_VARIANT_ELITE_MONTHLY   ?? 'ELITE_MONTHLY']:   'elite',
    [process.env.LS_VARIANT_ELITE_ANNUAL    ?? 'ELITE_ANNUAL']:    'elite',
  };
  return map[variantId] ?? null;
}

// ─── Event handlers (all return void, swallow errors internally) ──────────────

async function handleOrderCreated(payload: Record<string, unknown>): Promise<void> {
  try {
    const meta = payload.meta as Record<string, unknown> | undefined;
    const custom = meta?.custom_data as Record<string, unknown> | undefined;
    const userId      = custom?.userId      as string | undefined;
    const type        = custom?.type        as string | undefined;
    const challengeId = custom?.challengeId as string | undefined;
    const durationStr = custom?.durationDays as string | undefined;
    const orderId     = (payload.data as Record<string, unknown>)?.id as string | undefined;

    if (!userId) {
      console.warn('[Webhook] order_created: missing userId in custom_data');
      return;
    }

    if (type === 'memory_pack' && challengeId && durationStr) {
      const durationDays = parseInt(durationStr, 10);
      const attrs = ((payload.data as Record<string, unknown>)?.attributes ?? {}) as Record<string, unknown>;
      const pricePaid = ((attrs.total ?? 0) as number) / 100; // LS sends cents

      await supabaseAdmin.from('memory_packs').insert({
        user_id:      userId,
        challenge_id: challengeId,
        duration_days: durationDays,
        price_paid:   pricePaid,
        payment_id:   orderId ?? null,
        status:       'active',
      });

      console.log(`[Webhook] order_created: memory pack activated for user ${userId}, challenge ${challengeId}, ${durationDays} days`);
    } else {
      console.log(`[Webhook] order_created: logged order ${orderId} for user ${userId}`);
    }
  } catch (err) {
    console.error('[Webhook] order_created handler error:', err);
  }
}

async function handleSubscriptionCreated(payload: Record<string, unknown>): Promise<void> {
  try {
    const meta   = payload.meta as Record<string, unknown> | undefined;
    const custom = meta?.custom_data as Record<string, unknown> | undefined;
    const userId = custom?.userId as string | undefined;

    const dataObj  = (payload.data as Record<string, unknown>) ?? {};
    const attrs    = (dataObj.attributes ?? {}) as Record<string, unknown>;
    const subId    = dataObj.id as string | undefined;
    const variantId = String(attrs.variant_id ?? '');

    if (!userId) {
      console.warn('[Webhook] subscription_created: missing userId in custom_data');
      return;
    }

    const plan = variantToPlan(variantId);
    if (!plan) {
      console.warn(`[Webhook] subscription_created: unknown variant ${variantId}`);
      return;
    }

    const now              = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Determine billing end from LS attrs if available, else use 30-day default
    const renewsAt = attrs.renews_at as string | undefined;
    const expiresAt = renewsAt ?? thirtyDaysFromNow;

    await supabaseAdmin
      .from('users')
      .update({
        plan,
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt,
        updated_at:      now.toISOString(),
      })
      .eq('id', userId);

    // Upsert into payments table
    await supabaseAdmin.from('payments').upsert(
      {
        user_id:                     userId,
        lemonsqueezy_subscription_id: subId ?? null,
        type:                        'subscription',
        plan,
        amount:                      ((attrs.total ?? 0) as number) / 100,
        currency:                    (attrs.currency as string | undefined) ?? 'USD',
        status:                      'active',
        created_at:                  now.toISOString(),
      },
      { onConflict: 'lemonsqueezy_subscription_id' }
    );

    // Welcome notification
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type:    'subscription_activated',
      title:   `🎉 Welcome to Lumio ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
      message: `Your ${plan} plan is now active. Unlock everything and illuminate your growth.`,
      data:    { plan, subId },
    });

    console.log(`[Webhook] subscription_created: user ${userId} → plan ${plan}`);
  } catch (err) {
    console.error('[Webhook] subscription_created handler error:', err);
  }
}

async function handleSubscriptionUpdated(payload: Record<string, unknown>): Promise<void> {
  try {
    const meta   = payload.meta as Record<string, unknown> | undefined;
    const custom = meta?.custom_data as Record<string, unknown> | undefined;
    const userId = custom?.userId as string | undefined;

    const dataObj   = (payload.data as Record<string, unknown>) ?? {};
    const attrs     = (dataObj.attributes ?? {}) as Record<string, unknown>;
    const subId     = dataObj.id as string | undefined;
    const variantId = String(attrs.variant_id ?? '');
    const status    = attrs.status as string | undefined;

    if (!userId) {
      console.warn('[Webhook] subscription_updated: missing userId in custom_data');
      return;
    }

    const plan = variantToPlan(variantId);

    // Update payments record status
    if (subId) {
      await supabaseAdmin
        .from('payments')
        .update({ status: status ?? 'active' })
        .eq('lemonsqueezy_subscription_id', subId);
    }

    if (plan) {
      const renewsAt  = attrs.renews_at as string | undefined;
      const now       = new Date();

      await supabaseAdmin
        .from('users')
        .update({
          plan,
          plan_expires_at: renewsAt ?? null,
          updated_at:      now.toISOString(),
        })
        .eq('id', userId);

      console.log(`[Webhook] subscription_updated: user ${userId} → plan ${plan}`);
    }
  } catch (err) {
    console.error('[Webhook] subscription_updated handler error:', err);
  }
}

async function handleSubscriptionCancelled(payload: Record<string, unknown>): Promise<void> {
  try {
    const meta   = payload.meta as Record<string, unknown> | undefined;
    const custom = meta?.custom_data as Record<string, unknown> | undefined;
    const userId = custom?.userId as string | undefined;

    const dataObj = (payload.data as Record<string, unknown>) ?? {};
    const attrs   = (dataObj.attributes ?? {}) as Record<string, unknown>;
    const subId   = dataObj.id as string | undefined;

    if (!userId) {
      console.warn('[Webhook] subscription_cancelled: missing userId in custom_data');
      return;
    }

    // Do NOT immediately downgrade — keep plan active until period end.
    // The plan-expiry cron will downgrade once plan_expires_at is in the past.
    const endsAt = attrs.ends_at as string | undefined;
    const renewsAt = attrs.renews_at as string | undefined;
    const expiresAt = endsAt ?? renewsAt ?? null;

    await supabaseAdmin
      .from('users')
      .update({
        plan_expires_at: expiresAt,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', userId);

    // Mark payment as cancelled (but still active until expiry)
    if (subId) {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'cancelled' })
        .eq('lemonsqueezy_subscription_id', subId);
    }

    // Notify user — plan remains active until end of billing period
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type:    'subscription_cancelled',
      title:   'Subscription Cancelled',
      message: expiresAt
        ? `Your plan remains active until ${new Date(expiresAt).toLocaleDateString()}. We hope to see you back!`
        : 'Your subscription has been cancelled. Your plan remains active until the end of the billing period.',
      data: { subId, expiresAt },
    });

    console.log(`[Webhook] subscription_cancelled: user ${userId}, active until ${expiresAt}`);
  } catch (err) {
    console.error('[Webhook] subscription_cancelled handler error:', err);
  }
}

async function handleSubscriptionExpired(payload: Record<string, unknown>): Promise<void> {
  try {
    const meta   = payload.meta as Record<string, unknown> | undefined;
    const custom = meta?.custom_data as Record<string, unknown> | undefined;
    const userId = custom?.userId as string | undefined;

    const dataObj = (payload.data as Record<string, unknown>) ?? {};
    const subId   = dataObj.id as string | undefined;

    if (!userId) {
      console.warn('[Webhook] subscription_expired: missing userId in custom_data');
      return;
    }

    await supabaseAdmin
      .from('users')
      .update({
        plan:           'free',
        plan_expires_at: null,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', userId);

    if (subId) {
      await supabaseAdmin
        .from('payments')
        .update({ status: 'expired' })
        .eq('lemonsqueezy_subscription_id', subId);
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type:    'subscription_expired',
      title:   'Your plan has expired',
      message: 'Your plan has expired. Upgrade to continue your AI coaching journey.',
      data:    { subId },
    });

    console.log(`[Webhook] subscription_expired: user ${userId} → free`);
  } catch (err) {
    console.error('[Webhook] subscription_expired handler error:', err);
  }
}

// ─── POST /api/webhooks/lemonsqueezy ─────────────────────────────────────────
// Uses express.raw() body — mounted BEFORE express.json() in index.ts.

webhooksRouter.post(
  '/lemonsqueezy',
  async (req: Request, res: Response): Promise<void> => {
    // Respond 200 for valid/processed events — LemonSqueezy retries on non-2xx.
    // Respond 400 for signature failures — invalid requests should not be retried.
    const ok  = () => res.status(200).json({ received: true });
    const bad = (reason: string) => {
      console.warn(`[Webhook] Rejected: ${reason}`);
      res.status(400).json({ received: false, error: reason });
    };

    const signature = req.headers['x-signature'] as string | undefined;
    const rawBody   = req.body as Buffer;

    if (!signature) {
      bad('Missing X-Signature header');
      return;
    }

    if (!Buffer.isBuffer(rawBody)) {
      bad('Body is not a raw Buffer — misconfigured middleware');
      return;
    }

    if (!verifySignature(rawBody, signature)) {
      bad('Invalid HMAC signature');
      return;
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    } catch {
      console.error('[Webhook] Failed to parse JSON body');
      bad('Invalid JSON body');
      return;
    }

    const eventName = (event.meta as Record<string, unknown>)?.event_name as string | undefined;
    console.log(`[Webhook] Received: ${eventName}`);

    // Dispatch — all handlers are fire-and-forget; errors are caught internally
    switch (eventName) {
      case 'order_created':
        void handleOrderCreated(event);
        break;
      case 'subscription_created':
        void handleSubscriptionCreated(event);
        break;
      case 'subscription_updated':
        void handleSubscriptionUpdated(event);
        break;
      case 'subscription_cancelled':
        void handleSubscriptionCancelled(event);
        break;
      case 'subscription_expired':
        void handleSubscriptionExpired(event);
        break;
      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    ok();
  }
);
