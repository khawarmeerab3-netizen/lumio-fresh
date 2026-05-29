import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { checkDurationAllowed, checkChallengeLimitNotReached, requirePlan } from '../middleware/plan-gate';
import { generatePlan, generateDailyTask, generateMilestoneMessage } from '../services/ai/lumio-coach';
import { supabase } from '../utils/supabase';
import { LumioError } from '../utils/errors';
import { validate } from '../utils/validate';
import { POINTS_EARN, POINTS_PENALTY } from '../../../shared/constants/points';
import { MILESTONE_MAP } from '../../../shared/constants/durations';

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const CreateChallengeSchema = z.object({
  nicheId: z.string().min(1),
  nicheCategory: z.string().min(1),
  nicheColor: z.string().min(1),
  goal: z.string().min(1).max(200),
  customGoal: z.string().max(500).optional(),
  durationDays: z.number().int().positive(),
  coachId: z.string().optional(),
  title: z.string().max(200).optional(),
});

const CompleteDaySchema = z.object({
  note: z.string().max(500).optional(),
});

const JustifyMissSchema = z.object({
  justification: z.string().min(10).max(500),
});

// ─── Helper: award points + log transaction ──────────────────────────────────

async function awardPoints(
  userId: string,
  points: number,
  action: string,
  description: string,
  referenceId?: string
): Promise<void> {
  // Update user points balance
  const { data: user, error: fetchErr } = await supabase
    .from('users')
    .select('points, total_points_earned')
    .eq('id', userId)
    .single();

  if (fetchErr || !user) throw new LumioError('Failed to fetch user for points update', 500);

  const newPoints = user.points + points;
  const newTotal = points > 0 ? user.total_points_earned + points : user.total_points_earned;

  await supabase
    .from('users')
    .update({ points: Math.max(0, newPoints), total_points_earned: newTotal })
    .eq('id', userId);

  // Log transaction
  await supabase.from('points_transactions').insert({
    user_id: userId,
    action,
    points,
    description,
    reference_id: referenceId ?? null,
  });
}

// ─── Helper: get points multiplier for user plan ─────────────────────────────

function getPointsMultiplier(plan: string): number {
  return plan === 'elite' || plan === 'enterprise' ? 2 : 1;
}

// ─── Router ──────────────────────────────────────────────────────────────────

const router = Router();

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges — Create challenge
// ────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  auth,
  checkDurationAllowed,
  checkChallengeLimitNotReached,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = validate(CreateChallengeSchema, req.body);
      const user = req.user!;

      // Generate AI plan
      const aiPlan = await generatePlan(
        body.goal,
        body.nicheId,
        body.durationDays,
        body.customGoal,
        user.selectedLanguage ?? 'en'
      );

      // Derive dates
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + body.durationDays * 86400000)
        .toISOString()
        .split('T')[0];

      // Derive title: from body override, or from AI plan, or fallback
      const title = body.title ?? (aiPlan as { title?: string }).title ?? body.goal;

      // Insert challenge
      const { data: challenge, error: insertErr } = await supabase
        .from('challenges')
        .insert({
          user_id: user.id,
          niche_id: body.nicheId,
          niche_category: body.nicheCategory,
          niche_color: body.nicheColor,
          title,
          goal: body.goal,
          custom_goal: body.customGoal ?? null,
          duration_days: body.durationDays,
          coach_id: body.coachId ?? null,
          ai_plan: aiPlan,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single();

      if (insertErr || !challenge) {
        throw new LumioError('Failed to create challenge', 500);
      }

      // Award onboarding points on first challenge only
      const { count } = await supabase
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((count ?? 0) === 1) {
        const multiplier = getPointsMultiplier(user.plan);
        await awardPoints(
          user.id,
          POINTS_EARN.COMPLETE_ONBOARDING * multiplier,
          'COMPLETE_ONBOARDING',
          'Welcome to Lumio — first challenge created!',
          challenge.id
        );
      }

      res.status(201).json({ data: { challenge }, error: null, message: 'Challenge created' });
    } catch (err) {
      if (err instanceof LumioError) {
        res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
      } else {
        res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
      }
    }
  }
);

// ────────────────────────────────────────────────────────────────────────────
// GET /api/challenges — List user's active challenges
// ────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw new LumioError('Failed to fetch challenges', 500);

    res.json({ data: { challenges }, error: null, message: 'Challenges retrieved' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/challenges/:id — Get single challenge with full data
// ────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) {
      throw new LumioError('Challenge not found', 404);
    }

    if (challenge.user_id !== user.id) {
      throw new LumioError('Forbidden', 403);
    }

    // Fetch daily tasks + milestones in parallel
    const [{ data: dailyTasks }, { data: milestones }] = await Promise.all([
      supabase.from('daily_tasks').select('*').eq('challenge_id', id).order('day_number'),
      supabase.from('milestones').select('*').eq('challenge_id', id).order('day_number'),
    ]);

    res.json({
      data: { challenge: { ...challenge, daily_tasks: dailyTasks ?? [], milestones: milestones ?? [] } },
      error: null,
      message: 'Challenge retrieved',
    });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/complete-day — Mark today's task complete
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/complete-day', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const body = validate(CompleteDaySchema, req.body);

    // Fetch challenge
    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);
    if (challenge.status !== 'active') throw new LumioError('Challenge is not active', 400);

    const currentDay: number = challenge.current_day;
    const completedDays: number[] = challenge.completed_days ?? [];

    // Duplicate check
    if (completedDays.includes(currentDay)) {
      throw new LumioError('Today has already been completed', 400);
    }

    // ── Streak calculation ────────────────────────────────────────────────
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
    const lastDate: string | null = challenge.last_completed_date;

    let streak: number = challenge.streak ?? 0;
    let longestStreak: number = challenge.longest_streak ?? 0;

    if (lastDate === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }

    if (streak > longestStreak) longestStreak = streak;

    // ── Update/create daily_task row ─────────────────────────────────────
    const { data: existingTask } = await supabase
      .from('daily_tasks')
      .select('id')
      .eq('challenge_id', id)
      .eq('day_number', currentDay)
      .maybeSingle();

    if (existingTask) {
      await supabase
        .from('daily_tasks')
        .update({
          status: 'completed',
          note: body.note ?? null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', existingTask.id);
    } else {
      await supabase.from('daily_tasks').insert({
        challenge_id: id,
        user_id: user.id,
        day_number: currentDay,
        task_data: {},
        status: 'completed',
        note: body.note ?? null,
        completed_at: new Date().toISOString(),
      });
    }

    // ── Points: daily task ────────────────────────────────────────────────
    const multiplier = getPointsMultiplier(user.plan);
    const dailyPoints = POINTS_EARN.COMPLETE_DAILY_TASK * multiplier;
    await awardPoints(user.id, dailyPoints, 'COMPLETE_DAILY_TASK', `Day ${currentDay} complete`, id);

    // ── Streak bonus points ───────────────────────────────────────────────
    if (streak === 7) {
      await awardPoints(user.id, POINTS_EARN.STREAK_7_DAY_BONUS * multiplier, 'STREAK_7_DAY_BONUS', '7-day streak bonus!', id);
    } else if (streak === 30) {
      await awardPoints(user.id, POINTS_EARN.STREAK_30_DAY_BONUS * multiplier, 'STREAK_30_DAY_BONUS', '30-day streak bonus!', id);
    } else if (streak === 100) {
      await awardPoints(user.id, POINTS_EARN.STREAK_100_DAY_BONUS * multiplier, 'STREAK_100_DAY_BONUS', '100-day streak bonus!', id);
    }

    // ── Milestone check ───────────────────────────────────────────────────
    const milestoneMap = MILESTONE_MAP[challenge.duration_days as keyof typeof MILESTONE_MAP] ?? [];
    const milestoneDef = milestoneMap.find((m) => m.d === currentDay);
    let milestoneReached: { label: string; message: string } | null = null;

    if (milestoneDef) {
      const aiMessage = await generateMilestoneMessage(
        challenge.goal,
        challenge.niche_id,
        milestoneDef.l,
        currentDay,
        undefined
      );

      await supabase.from('milestones').insert({
        challenge_id: id,
        user_id: user.id,
        day_number: currentDay,
        label: milestoneDef.l,
        ai_message: aiMessage,
      });

      milestoneReached = { label: milestoneDef.l, message: aiMessage };
    }

    // ── Advance day + maybe complete challenge ────────────────────────────
    const newCompletedDays = [...completedDays, currentDay];
    const isLastDay = currentDay >= challenge.duration_days;
    const newDay = isLastDay ? currentDay : currentDay + 1;
    const newStatus = isLastDay ? 'completed' : 'active';

    if (isLastDay) {
      await awardPoints(user.id, POINTS_EARN.COMPLETE_FULL_CHALLENGE * multiplier, 'COMPLETE_FULL_CHALLENGE', 'Challenge completed!', id);
    }

    const { data: updatedChallenge, error: updateErr } = await supabase
      .from('challenges')
      .update({
        completed_days: newCompletedDays,
        last_completed_date: todayStr,
        streak,
        longest_streak: longestStreak,
        current_day: newDay,
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedChallenge) throw new LumioError('Failed to update challenge', 500);

    res.json({
      data: { challenge: updatedChallenge, milestoneReached },
      error: null,
      message: isLastDay ? 'Challenge completed! 🏆' : `Day ${currentDay} complete!`,
    });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/miss-day — Mark today as missed (non-Elite)
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/miss-day', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.plan === 'elite' || user.plan === 'enterprise') {
      throw new LumioError('Elite users cannot mark days as missed via this endpoint', 403);
    }

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);
    if (challenge.status !== 'active') throw new LumioError('Challenge is not active', 400);

    const currentDay: number = challenge.current_day;
    const completedDays: number[] = challenge.completed_days ?? [];

    if (completedDays.includes(currentDay)) {
      throw new LumioError('Today has already been completed', 400);
    }

    // Update or insert daily_task as missed
    const { data: existingTask } = await supabase
      .from('daily_tasks')
      .select('id')
      .eq('challenge_id', id)
      .eq('day_number', currentDay)
      .maybeSingle();

    if (existingTask) {
      await supabase.from('daily_tasks').update({ status: 'missed' }).eq('id', existingTask.id);
    } else {
      await supabase.from('daily_tasks').insert({
        challenge_id: id,
        user_id: user.id,
        day_number: currentDay,
        task_data: {},
        status: 'missed',
      });
    }

    // Deduct points and reset streak
    await awardPoints(
      user.id,
      POINTS_PENALTY.MISS_TASK_NO_JUSTIFICATION,
      'MISS_TASK_NO_JUSTIFICATION',
      `Day ${currentDay} missed`,
      id
    );

    const { data: updatedChallenge, error: updateErr } = await supabase
      .from('challenges')
      .update({
        streak: 0,
        current_day: Math.min(currentDay + 1, challenge.duration_days),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedChallenge) throw new LumioError('Failed to update challenge', 500);

    res.json({ data: { challenge: updatedChallenge }, error: null, message: `Day ${currentDay} marked as missed` });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/justify-miss — Add justification (Starter+, not Elite)
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/justify-miss', auth, requirePlan('starter'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    if (user.plan === 'elite' || user.plan === 'enterprise') {
      throw new LumioError('Elite users cannot justify missed tasks', 403);
    }

    const body = validate(JustifyMissSchema, req.body);

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('id, user_id, current_day')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    // Find the most recent missed task for this challenge
    const { data: missedTask, error: taskErr } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('challenge_id', id)
      .eq('status', 'missed')
      .order('day_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (taskErr || !missedTask) throw new LumioError('No missed task found to justify', 404);

    const { data: updatedTask, error: updateErr } = await supabase
      .from('daily_tasks')
      .update({ status: 'justified', justification: body.justification })
      .eq('id', missedTask.id)
      .select()
      .single();

    if (updateErr || !updatedTask) throw new LumioError('Failed to update task', 500);

    await awardPoints(
      user.id,
      POINTS_EARN.JUSTIFY_MISSED_TASK,
      'JUSTIFY_MISSED_TASK',
      `Justified missed day ${missedTask.day_number}`,
      id
    );

    res.json({ data: { task: updatedTask }, error: null, message: 'Justification saved (+3 points)' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/challenges/:id/task — Get or generate today's task
// ────────────────────────────────────────────────────────────────────────────
router.get('/:id/task', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    const currentDay: number = challenge.current_day;

    // Check cache
    const { data: existingTask } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('challenge_id', id)
      .eq('day_number', currentDay)
      .maybeSingle();

    if (existingTask && existingTask.status !== 'pending') {
      res.json({ data: { task: existingTask }, error: null, message: 'Task retrieved' });
      return;
    }

    // Generate new task
    const completedDays: number[] = challenge.completed_days ?? [];
    const completionRate = currentDay > 1 ? (completedDays.length / (currentDay - 1)) * 100 : 100;

    const taskData = await generateDailyTask(
      challenge.goal,
      challenge.niche_id,
      currentDay,
      challenge.duration_days,
      Math.round(completionRate)
    );

    let savedTask;

    if (existingTask) {
      const { data } = await supabase
        .from('daily_tasks')
        .update({ task_data: taskData })
        .eq('id', existingTask.id)
        .select()
        .single();
      savedTask = data;
    } else {
      const { data } = await supabase
        .from('daily_tasks')
        .insert({
          challenge_id: id,
          user_id: user.id,
          day_number: currentDay,
          task_data: taskData,
          status: 'pending',
        })
        .select()
        .single();
      savedTask = data;
    }

    res.json({ data: { task: savedTask }, error: null, message: 'Task generated' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/regenerate-plan — Regenerate plan (Pro+)
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/regenerate-plan', auth, requirePlan('pro'), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    const completedDays: number[] = challenge.completed_days ?? [];
    if (completedDays.length > 0) {
      throw new LumioError('Cannot regenerate plan after completing days', 400);
    }

    const newPlan = await generatePlan(
      challenge.goal,
      challenge.niche_id,
      challenge.duration_days,
      challenge.custom_goal ?? undefined,
      user.selectedLanguage ?? 'en'
    );

    const { data: updatedChallenge, error: updateErr } = await supabase
      .from('challenges')
      .update({ ai_plan: newPlan })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updatedChallenge) throw new LumioError('Failed to update challenge plan', 500);

    res.json({ data: { challenge: updatedChallenge }, error: null, message: 'Plan regenerated' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/pause — Pause challenge
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/pause', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    const { data: updated, error: updateErr } = await supabase
      .from('challenges')
      .update({ status: 'paused' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updated) throw new LumioError('Failed to pause challenge', 500);

    res.json({ data: { challenge: updated }, error: null, message: 'Challenge paused' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/challenges/:id/resume — Resume paused challenge
// ────────────────────────────────────────────────────────────────────────────
router.post('/:id/resume', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    const { data: updated, error: updateErr } = await supabase
      .from('challenges')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (updateErr || !updated) throw new LumioError('Failed to resume challenge', 500);

    res.json({ data: { challenge: updated }, error: null, message: 'Challenge resumed' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/challenges/:id — Abandon challenge
// ────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const { data: challenge, error: challengeErr } = await supabase
      .from('challenges')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (challengeErr || !challenge) throw new LumioError('Challenge not found', 404);
    if (challenge.user_id !== user.id) throw new LumioError('Forbidden', 403);

    const { error: updateErr } = await supabase
      .from('challenges')
      .update({ status: 'abandoned' })
      .eq('id', id);

    if (updateErr) throw new LumioError('Failed to abandon challenge', 500);

    res.json({ data: { id }, error: null, message: 'Challenge abandoned' });
  } catch (err) {
    if (err instanceof LumioError) {
      res.status(err.statusCode).json({ data: null, error: err.message, message: err.message });
    } else {
      res.status(500).json({ data: null, error: 'Internal server error', message: 'Something went wrong' });
    }
  }
});

export default router;
