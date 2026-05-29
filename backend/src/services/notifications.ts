import { supabaseAdmin } from '../utils/supabase';
import type { Notification } from '../../../shared/types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'nudge'
  | 'supersonic'
  | 'streak_at_risk'
  | 'badge_unlocked'
  | 'challenge_completed'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'plan_expired'
  | 'general';

// ─── sendPushNotification ─────────────────────────────────────────────────────

/**
 * Fire-and-forget push notification via OneSignal REST API.
 * Never throws — push failures must not crash the caller.
 */
export async function sendPushNotification(
  deviceToken: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  const appId  = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    // OneSignal not configured — dev/test environment, skip silently
    return;
  }

  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id:             appId,
        include_player_ids: [deviceToken],
        headings:           { en: title },
        contents:           { en: message },
        data:               data ?? {},
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[Push] OneSignal error ${res.status}: ${body}`);
    }
  } catch (err) {
    // Network failure — log and continue; never propagate
    console.error('[Push] Failed to reach OneSignal:', err);
  }
}

// ─── sendNotification ─────────────────────────────────────────────────────────

/**
 * Insert a notification into the DB, then attempt a push if the user has
 * a device token.  Returns the created Notification row.
 *
 * Never throws — callers (nudge engine, badge engine, etc.) must not crash
 * because a notification failed.
 */
export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'general',
  data?: Record<string, unknown>
): Promise<Notification | null> {
  try {
    // 1. Persist to DB
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data:    data ?? null,
        is_read: false,
      })
      .select()
      .single();

    if (error || !notification) {
      console.error('[Notifications] DB insert failed:', error?.message);
      return null;
    }

    // 2. Push notification if device token present
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('device_token')
      .eq('id', userId)
      .single();

    if (userRow?.device_token) {
      // Fire-and-forget — don't await so it never blocks the return
      void sendPushNotification(
        userRow.device_token as string,
        title,
        message,
        data
      );
    }

    return notification as Notification;
  } catch (err) {
    console.error('[Notifications] sendNotification error:', err);
    return null;
  }
}

// ─── wasNotificationSentToday ─────────────────────────────────────────────────

/**
 * Check if a notification of a given type was already sent to this user today.
 * Used to enforce per-day caps (1 nudge/day, 2 SuperSonic/day).
 */
export async function countNotificationsSentToday(
  userId: string,
  type: NotificationType
): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', todayStart.toISOString());

  if (error) return 0; // on error, assume not sent (safe default: may send)
  return count ?? 0;
}
