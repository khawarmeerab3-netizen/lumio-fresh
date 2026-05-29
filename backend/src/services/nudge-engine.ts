import { supabaseAdmin } from '../utils/supabase';
import { sendNotification, countNotificationsSentToday } from './notifications';
import type { User, Challenge } from '../../../shared/types/index';

// ─── generateNudgeMessage stub ────────────────────────────────────────────────
// lumio-coach.ts is implemented in Phase 10 (AI Engine).
// This interface contract matches what that service will export.
// Replace the stub body with the real import once Phase 10 lands.

async function generateNudgeMessage(
  goal: string,
  niche: string,
  daysSinceLastLogin: number,
  streak: number,
  daysLeft: number,
  language: string
): Promise<{ title: string; message: string }> {
  try {
    // Attempt to use real coach if already available (Phase 10+)
    const coachModule = await import('./ai/lumio-coach').catch(() => null);
    if (coachModule?.generateNudgeMessage) {
      return coachModule.generateNudgeMessage(
        goal, niche, daysSinceLastLogin, streak, daysLeft, language
      );
    }
  } catch {
    // Coach module not yet available — use fallback below
  }

  // Fallback: deterministic messages by inactivity window
  const streakText = streak > 0 ? ` Your ${streak}-day streak is counting on you.` : '';
  const daysLeftText = daysLeft > 0 ? ` Only ${daysLeft} days left.` : '';

  if (daysSinceLastLogin >= 7) {
    return {
      title:   "It's been a week 🌑",
      message: `Your ${niche} challenge is still waiting. Don't let your goal slip away.${streakText}${daysLeftText}`,
    };
  }
  if (daysSinceLastLogin >= 3) {
    return {
      title:   'Come back to your challenge ✨',
      message: `You haven't checked in for ${daysSinceLastLogin} days. Your ${niche} goal needs you.${streakText}${daysLeftText}`,
    };
  }
  return {
    title:   'Your challenge is waiting 🔥',
    message: `It's been ${daysSinceLastLogin} days. One small step today keeps momentum alive.${streakText}${daysLeftText}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NudgeResult {
  userId: string;
  nudged: boolean;
  reason: string;
}

// ─── checkAndNudge ────────────────────────────────────────────────────────────

export async function checkAndNudge(user: User): Promise<NudgeResult> {
  const userId = user.id;

  // 1. Calculate days since last login (updated_at is refreshed on every auth)
  const lastSeen   = new Date(user.updated_at);
  const now        = new Date();
  const msPerDay   = 24 * 60 * 60 * 1000;
  const daysSince  = Math.floor((now.getTime() - lastSeen.getTime()) / msPerDay);

  if (daysSince < 2) {
    return { userId, nudged: false, reason: `active ${daysSince}d ago` };
  }

  // 2. Enforce 1 nudge/day cap
  const sentToday = await countNotificationsSentToday(userId, 'nudge');
  if (sentToday > 0) {
    return { userId, nudged: false, reason: 'nudge already sent today' };
  }

  // 3. Find most recent active challenge
  const { data: challenges } = await supabaseAdmin
    .from('challenges')
    .select('id, title, goal, niche_id, niche_category, streak, duration_days, current_day, start_date')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  const challenge = challenges?.[0] as Challenge | undefined;
  if (!challenge) {
    return { userId, nudged: false, reason: 'no active challenge' };
  }

  // 4. Calculate days left in the challenge
  const startDate  = new Date(challenge.start_date);
  const elapsedDays = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
  const daysLeft   = Math.max(0, challenge.duration_days - elapsedDays);

  // 5. Generate personalised message
  const { title, message } = await generateNudgeMessage(
    challenge.goal,
    challenge.niche_category ?? challenge.niche_id,
    daysSince,
    challenge.streak ?? 0,
    daysLeft,
    user.selected_language ?? 'en'
  );

  // 6. Send
  await sendNotification(userId, title, message, 'nudge', {
    challengeId: challenge.id,
    daysSince,
    daysLeft,
  });

  return { userId, nudged: true, reason: `inactive ${daysSince}d` };
}

// ─── processAllUsers ──────────────────────────────────────────────────────────

export async function processAllUsers(): Promise<number> {
  console.log('[NudgeEngine] Starting processAllUsers...');

  // Fetch all active, non-banned users in batches to avoid memory pressure
  const BATCH = 100;
  let offset   = 0;
  let nudgeCount = 0;
  let processed  = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('is_banned', false)
      .range(offset, offset + BATCH - 1);

    if (error) {
      console.error('[NudgeEngine] Failed to fetch users batch:', error.message);
      break;
    }
    if (!users || users.length === 0) break;

    for (const user of users as User[]) {
      try {
        const result = await checkAndNudge(user);
        if (result.nudged) nudgeCount++;
        processed++;
      } catch (err) {
        console.error(`[NudgeEngine] Error processing user ${user.id}:`, err);
      }
    }

    if (users.length < BATCH) break; // last page
    offset += BATCH;
  }

  console.log(`[NudgeEngine] Done. Processed ${processed} users, sent ${nudgeCount} nudges.`);

  // SuperSonic runs after all users have been nudged
  const { processSuperSonicUsers } = await import('./supersonic');
  await processSuperSonicUsers();

  return nudgeCount;
}
