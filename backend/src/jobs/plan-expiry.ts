import cron from 'node-cron';
import { supabaseAdmin } from '../utils/supabase';

/**
 * Downgrade all users whose paid plan has expired.
 * This catches subscription_cancelled events where we preserved access
 * until the end of the billing period.
 *
 * Schedule: "0 0 * * *" — runs every day at midnight UTC.
 */
export async function runPlanExpiryJob(): Promise<void> {
  console.log('[PlanExpiryJob] Running...');

  try {
    const now = new Date().toISOString();

    // Find all non-free users whose plan_expires_at is in the past
    const { data: expiredUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, name, plan, plan_expires_at')
      .neq('plan', 'free')
      .not('plan_expires_at', 'is', null)
      .lt('plan_expires_at', now);

    if (error) {
      console.error('[PlanExpiryJob] Failed to fetch expired users:', error.message);
      return;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('[PlanExpiryJob] No expired plans found.');
      return;
    }

    console.log(`[PlanExpiryJob] Found ${expiredUsers.length} expired plan(s).`);

    for (const user of expiredUsers) {
      try {
        // Downgrade to free
        await supabaseAdmin
          .from('users')
          .update({
            plan:           'free',
            plan_expires_at: null,
            updated_at:     now,
          })
          .eq('id', user.id);

        // Notify user
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          type:    'plan_expired',
          title:   'Your Lumio plan has expired',
          message: `Your ${user.plan} plan has expired. Upgrade to continue unlocking your full potential.`,
          data:    { previousPlan: user.plan },
        });

        console.log(`[PlanExpiryJob] Downgraded user ${user.id} from ${user.plan} → free`);
      } catch (userErr) {
        // Log individual failures but continue processing remaining users
        console.error(`[PlanExpiryJob] Failed to downgrade user ${user.id}:`, userErr);
      }
    }

    console.log('[PlanExpiryJob] Done.');
  } catch (err) {
    console.error('[PlanExpiryJob] Unexpected error:', err);
  }
}

/**
 * Register the cron schedule.
 * Call this once during server startup (from index.ts).
 */
export function startPlanExpiryJob(): void {
  // "0 0 * * *" = midnight UTC every day
  cron.schedule('0 0 * * *', () => {
    void runPlanExpiryJob();
  });
  console.log('[PlanExpiryJob] Scheduled: daily at midnight UTC');
}
