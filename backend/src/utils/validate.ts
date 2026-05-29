// Lumio — backend/src/utils/validate.ts — Zod schemas for all request bodies

import { z, ZodSchema } from 'zod';
import { validationError } from './errors';

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email:         z.string().email('Invalid email address'),
  name:          z.string().min(2, 'Name must be at least 2 characters').max(80),
  password:      z.string().min(8, 'Password must be at least 8 characters').max(128),
  referralCode:  z.string().optional(),
});

export const LoginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── User schemas ─────────────────────────────────────────────────────────────

export const UpdateUserSchema = z.object({
  name:             z.string().min(2).max(80).optional(),
  avatar_url:       z.string().url().optional(),
  selected_mood:    z.string().optional(),
  selected_language:z.string().optional(),
  notification_time:z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM').optional(),
});

export const DeviceTokenSchema = z.object({
  deviceToken: z.string().min(1),
});

// ─── Challenge schemas ────────────────────────────────────────────────────────

export const CreateChallengeSchema = z.object({
  goal:          z.string().min(3, 'Goal must be at least 3 characters').max(200),
  nicheId:       z.string().min(1),
  nicheCategory: z.string().min(1),
  nicheColor:    z.string().min(1),
  customGoal:    z.string().max(500).optional(),
  durationDays:  z.number().int().positive(),
  coachId:       z.string().optional(),
});

export const CompleteDaySchema = z.object({
  note: z.string().max(1000).optional(),
});

export const JustifyMissSchema = z.object({
  justification: z.string()
    .min(10, 'Justification must be at least 10 characters')
    .max(200, 'Justification must be 200 characters or less'),
});

export const SetCoachSchema = z.object({
  coachId: z.string().min(1),
});

export const MilestoneMessageSchema = z.object({
  milestoneLabel: z.string().min(1),
  dayNumber:      z.number().int().positive(),
});

// ─── Community schemas ────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  content:     z.string().min(1, 'Post cannot be empty').max(500, 'Post must be 500 characters or less'),
  nicheId:     z.string().optional(),
  challengeId: z.string().uuid().optional(),
  imageUrl:    z.string().url().optional(),
});

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(300, 'Comment must be 300 characters or less'),
});

// ─── Admin schemas ────────────────────────────────────────────────────────────

export const BroadcastSchema = z.object({
  topic:      z.string().max(200).optional(),
  targetPlan: z.enum(['all', 'free', 'starter', 'pro', 'elite', 'enterprise']).default('all'),
});

export const ChangeUserPlanSchema = z.object({
  plan: z.enum(['free', 'starter', 'pro', 'elite', 'custom', 'enterprise']),
});

// ─── Onboarding schema ────────────────────────────────────────────────────────

export const OnboardingQuizSchema = z.object({
  lifeArea:        z.string().min(1),
  goal:            z.string().min(5).max(300),
  timeAvailable:   z.string().min(1),
  experience:      z.enum(['beginner', 'intermediate', 'advanced']),
  motivationStyle: z.string().min(1),
});

// ─── Buddy schema ─────────────────────────────────────────────────────────────

export const BuddyInviteSchema = z.object({
  buddyUserId: z.string().uuid(),
  challengeId: z.string().uuid(),
});

// ─── Points schema ────────────────────────────────────────────────────────────

export const RedeemPointsSchema = z.object({
  redemptionType: z.enum([
    'ONE_MONTH_STARTER',
    'ONE_MONTH_PRO',
    'ONE_MONTH_ELITE',
    'UNLOCK_MOOD_THEME',
    'UNLOCK_COACH',
    'UNLOCK_BADGE',
  ]),
  targetId: z.string().optional(), // badge id or coach id for unlock types
});

// ─── Payment schema ───────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  plan:   z.enum(['starter', 'pro', 'elite']),
  annual: z.boolean().default(false),
});

export const MemoryPackCheckoutSchema = z.object({
  challengeId:  z.string().uuid(),
  durationDays: z.number().int().positive(),
});

// ─── Validate helper ──────────────────────────────────────────────────────────
// Throws LumioError on failure — never returns null

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field      = firstIssue.path.join('.');
    const message    = field
      ? `${field}: ${firstIssue.message}`
      : firstIssue.message;
    throw validationError(message);
  }

  return result.data;
}

// ─── Type exports ─────────────────────────────────────────────────────────────

export type RegisterInput          = z.infer<typeof RegisterSchema>;
export type LoginInput             = z.infer<typeof LoginSchema>;
export type UpdateUserInput        = z.infer<typeof UpdateUserSchema>;
export type CreateChallengeInput   = z.infer<typeof CreateChallengeSchema>;
export type CompleteDayInput       = z.infer<typeof CompleteDaySchema>;
export type JustifyMissInput       = z.infer<typeof JustifyMissSchema>;
export type CreatePostInput        = z.infer<typeof CreatePostSchema>;
export type CreateCommentInput     = z.infer<typeof CreateCommentSchema>;
export type BroadcastInput         = z.infer<typeof BroadcastSchema>;
export type OnboardingQuizInput    = z.infer<typeof OnboardingQuizSchema>;
export type BuddyInviteInput       = z.infer<typeof BuddyInviteSchema>;
export type RedeemPointsInput      = z.infer<typeof RedeemPointsSchema>;
export type CheckoutInput          = z.infer<typeof CheckoutSchema>;
