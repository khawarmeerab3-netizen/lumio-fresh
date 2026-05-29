import cron from 'node-cron';
import { supabaseAdmin } from '../utils/supabase';
import { sendNotification } from '../services/notifications';
import type { User, Challenge } from '../../../shared/types/index';

// ─── Core job logic ───────────────────────────────────────────────────────────

export async function runStreakCheckJob(): Promise<void> {
  console.log('[StreakCheckJob] Running...');

  const BATCH  = 100;
  let offset   = 0;
  let notified = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Fetch non-banned, non-Elite users who have active challenges
    // Elite users receive their streak-at-risk alert via SuperSonic instead
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_banned', false)
      .neq('plan', 'elite')
      .range(offset, offset + BATCH - 1);

    if (error) {
      console.error('[StreakCheckJob] Failed to fetch users:', error.message);
      break;
    }
    if (!users || users.length === 0) break;

    for (const user of users as User[]) {
      try {
        await checkUserStreak(user);
        notified++;
      } catch (err) {
        console.error(`[StreakCheckJob] Error for user ${user.id}:`, err);
      }
    }

    if (users.length < BATCH) break;
    offset += BATCH;
  }

  console.log(`[StreakCheckJob] Done — checked users, notifications sent where needed.`);
}

async function checkUserStreak(user: User): Promise<void> {
  // Find most recent active challenge
  const { data: challenges } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  const challenge = challenges?.[0] as Challenge | undefined;
  if (!challenge) return;

  // Check if today's task is already completed
  const { data: todayTask } = await supabaseAdmin
    .from('daily_tasks')
    .select('status')
    .eq('challenge_id', challenge.id)
    .eq('user_id', user.id)
    .eq('day_number', challenge.current_day)
    .maybeSingle();

  // Task already done — streak safe, nothing to do
  if (todayTask?.status === 'completed') return;

  // Avoid double-notifying: check if a streak_at_risk notification already
  // went out today for this user
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count: alreadySent } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('type', 'streak_at_risk')
    .gte('created_at', todayStart.toISOString());

  if ((alreadySent ?? 0) > 0) return;

  // Build message — personalised with niche and streak count
  const niche   = challenge.niche_category ?? 'challenge';
  const streak  = challenge.streak ?? 0;
  const streakMsg = streak > 0
    ? `Complete today's ${niche} task before midnight to keep your ${streak}-day streak!`
    : `Complete today's ${niche} task before midnight to stay on track!`;

  await sendNotification(
    user.id,
    '⚠️ Streak at risk!',
    streakMsg,
    'streak_at_risk',
    { challengeId: challenge.id, streak, niche }
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Register the cron schedule.
 * "0 20 * * *" = every day at 20:00 UTC (8pm).
 * Call once from index.ts after server starts.
 */
export function startStreakCheckJob(): void {
  cron.schedule('0 20 * * *', () => {
    void runStreakCheckJob();
  });
  console.log('[StreakCheckJob] Scheduled: daily at 20:00 UTC');
}
