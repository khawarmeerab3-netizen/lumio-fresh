import { supabaseAdmin } from '../utils/supabase';
import { sendNotification, countNotificationsSentToday } from './notifications';
import { sanitizeAIInput } from '../utils/sanitize';
import type { User, Challenge } from '../../../shared/types/index';

// ─── chatWithCoach stub ───────────────────────────────────────────────────────
// lumio-coach.ts implemented in Phase 10. Lazy import with fallback.

async function chatWithCoachSuperSonic(
  systemPrompt: string,
  userContext: string
): Promise<string> {
  try {
    const coachModule = await import('./ai/lumio-coach').catch(() => null);
    if (coachModule?.chatWithCoach) {
      return coachModule.chatWithCoach(systemPrompt, userContext);
    }
  } catch {
    // Not yet available
  }
  // Deterministic fallback
  return userContext;
}

// ─── SuperSonic system prompt builder ────────────────────────────────────────

function buildSuperSonicPrompt(coachPersonality: string, userName: string): string {
  return `You are ${coachPersonality} — but right now you are in SuperSonic mode.
SuperSonic means: relentless, no excuses, urgency in every word.
You are speaking directly to ${userName}. Keep it under 3 sentences.
No fluff. Pure momentum. Make them feel they CANNOT miss another day.`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SuperSonicTrigger {
  id: string;
  title: string;
  message: string;
}

interface CoachRow {
  id: string;
  name: string;
  personality: string;
}

// ─── checkSuperSonic ─────────────────────────────────────────────────────────

export async function checkSuperSonic(user: User, challenge: Challenge): Promise<void> {
  const userId = user.id;

  // Enforce 2 SuperSonic messages per user per day
  const sentToday = await countNotificationsSentToday(userId, 'supersonic');
  if (sentToday >= 2) return;

  // Fetch user's coach (nullable — may not have selected one)
  let coachPersonality = 'your AI coach';
  if (challenge.coach_id) {
    const { data: coach } = await supabaseAdmin
      .from('coaches')
      .select('id, name, personality')
      .eq('id', challenge.coach_id)
      .maybeSingle();

    if (coach) {
      coachPersonality = (coach as CoachRow).personality ?? (coach as CoachRow).name;
    }
  }

  const superSonicPrompt = buildSuperSonicPrompt(coachPersonality, user.name);

  const now        = new Date();
  const msPerDay   = 24 * 60 * 60 * 1000;
  const todayStr   = now.toISOString().slice(0, 10);
  const yesterdayStr = new Date(now.getTime() - msPerDay).toISOString().slice(0, 10);

  const lastLoginMs = new Date(user.updated_at).getTime();
  const hourUTC     = now.getUTCHours();

  const elapsedDays  = Math.floor((now.getTime() - new Date(challenge.start_date).getTime()) / msPerDay);
  const daysLeft     = Math.max(0, challenge.duration_days - elapsedDays);
  const isLastWeek   = daysLeft > 0 && daysLeft <= 7;
  const isMilestone  = [7, 14, 21, 30].includes(elapsedDays + 1); // tomorrow is milestone

  // Check if today's task already completed
  const { data: todayTask } = await supabaseAdmin
    .from('daily_tasks')
    .select('status')
    .eq('challenge_id', challenge.id)
    .eq('user_id', userId)
    .eq('day_number', challenge.current_day)
    .maybeSingle();

  const taskDoneToday = todayTask?.status === 'completed';

  // Check if yesterday's task was missed
  const { data: yesterdayTask } = await supabaseAdmin
    .from('daily_tasks')
    .select('status')
    .eq('challenge_id', challenge.id)
    .eq('user_id', userId)
    .eq('day_number', Math.max(1, challenge.current_day - 1))
    .maybeSingle();

  const missedYesterday = yesterdayTask?.status === 'missed';

  // ── Evaluate triggers in priority order ──────────────────────────────────

  const triggers: SuperSonicTrigger[] = [];

  // Trigger 1: No login in 24h
  const hoursInactive = (now.getTime() - lastLoginMs) / (1000 * 60 * 60);
  if (hoursInactive >= 24) {
    const context = sanitizeAIInput(
      `User ${user.name} has not logged in for ${Math.floor(hoursInactive)} hours. Challenge: ${challenge.title}. Goal: ${challenge.goal}.`
    );
    const msg = await chatWithCoachSuperSonic(
      superSonicPrompt,
      `Generate a 1-2 sentence urgent check-in for someone who hasn't logged in. Context: ${context}`
    );
    triggers.push({
      id:      'no_login_24h',
      title:   "⚡ SuperSonic: You haven't checked in",
      message: msg || `You haven't checked in. Your challenge is waiting. No excuses.`,
    });
  }

  // Trigger 2: Missed task yesterday
  if (missedYesterday && triggers.length < 2) {
    const context = sanitizeAIInput(
      `User ${user.name} missed their task yesterday on challenge: ${challenge.title}. Streak: ${challenge.streak}.`
    );
    const msg = await chatWithCoachSuperSonic(
      superSonicPrompt,
      `Generate an intervention message for someone who missed yesterday's task. Context: ${context}`
    );
    triggers.push({
      id:      'missed_yesterday',
      title:   '⚡ SuperSonic: Yesterday you quit',
      message: msg || `You missed yesterday. That ends today. Open the app and do your task right now.`,
    });
  }

  // Trigger 3: Task completed today — celebration
  if (taskDoneToday && triggers.length < 2) {
    const msg = `Day ${challenge.current_day} done. ${daysLeft} days left. That's how it's done, ${user.name}.`;
    triggers.push({
      id:      'task_completed',
      title:   '⚡ SuperSonic: Day complete 🔥',
      message: msg,
    });
  }

  // Trigger 4: Milestone day (tomorrow hits 7/14/21/30)
  if (isMilestone && !taskDoneToday && triggers.length < 2) {
    const milestone = elapsedDays + 1;
    const msg = await chatWithCoachSuperSonic(
      superSonicPrompt,
      `Tomorrow is day ${milestone} — a milestone. User ${user.name} must complete today's task first. Challenge: ${challenge.title}.`
    );
    triggers.push({
      id:      'milestone',
      title:   `⚡ SuperSonic: Day ${milestone} milestone tomorrow`,
      message: msg || `Tomorrow you hit day ${milestone}. But first you have to get through today. Don't stop now.`,
    });
  }

  // Trigger 5: Streak at risk — logged in but task not done, after 8pm UTC
  if (!taskDoneToday && hourUTC >= 20 && hoursInactive < 24 && triggers.length < 2) {
    const streak = challenge.streak ?? 0;
    triggers.push({
      id:      'streak_at_risk',
      title:   '⚡ SuperSonic: You have until midnight',
      message: streak > 0
        ? `${streak}-day streak. Task not done. You have until midnight. Move.`
        : `Task not done. You have until midnight. Go.`,
    });
  }

  // Trigger 6: Final week — daily urgency
  if (isLastWeek && !taskDoneToday && triggers.length < 2) {
    const msg = await chatWithCoachSuperSonic(
      superSonicPrompt,
      `User ${user.name} is in the final ${daysLeft} days of their challenge: ${challenge.title}. Make it urgent.`
    );
    triggers.push({
      id:      'final_week',
      title:   `⚡ SuperSonic: ${daysLeft} days left`,
      message: msg || `${daysLeft} days. That's all. You didn't come this far to stop now.`,
    });
  }

  // ── Fire up to 2 notifications ────────────────────────────────────────────
  const remaining = 2 - sentToday;
  const toFire    = triggers.slice(0, remaining);

  for (const trigger of toFire) {
    await sendNotification(
      userId,
      trigger.title,
      trigger.message,
      'supersonic',
      { triggerId: trigger.id, challengeId: challenge.id }
    );
    console.log(`[SuperSonic] Sent '${trigger.id}' to user ${userId}`);
  }
}

// ─── processSuperSonicUsers ───────────────────────────────────────────────────

export async function processSuperSonicUsers(): Promise<void> {
  console.log('[SuperSonic] Processing Elite users...');

  // Fetch all Elite users who have at least one active challenge
  const { data: eliteUsers, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('plan', 'elite')
    .eq('is_banned', false);

  if (error || !eliteUsers || eliteUsers.length === 0) {
    console.log('[SuperSonic] No Elite users found.');
    return;
  }

  let processed = 0;

  for (const user of eliteUsers as User[]) {
    try {
      // Find most recent active challenge for this user
      const { data: challenges } = await supabaseAdmin
        .from('challenges')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const challenge = challenges?.[0] as Challenge | undefined;
      if (!challenge) continue;

      await checkSuperSonic(user, challenge);
      processed++;
    } catch (err) {
      console.error(`[SuperSonic] Error processing user ${user.id}:`, err);
    }
  }

  console.log(`[SuperSonic] Done. Processed ${processed} Elite users.`);
}
