// Lumio — shared/constants/points.ts — Complete points economy rules

// ─── Earning Actions ──────────────────────────────────────────────────────────
// Base rates — Elite plan earns 2× all of these

export const POINTS_EARN = {
  COMPLETE_DAILY_TASK:       10,
  COMPLETE_FULL_CHALLENGE:   100,
  STREAK_7_DAY_BONUS:        50,
  STREAK_30_DAY_BONUS:       200,
  STREAK_100_DAY_BONUS:      500,
  POST_IN_COMMUNITY:         5,
  POST_GETS_LIKE:            2,
  REFER_FRIEND:              150,
  JUSTIFY_MISSED_TASK:       3,   // Starter/Pro only — Elite cannot justify
  COMPLETE_ONBOARDING:       25,
  EARN_BADGE:                20,
  BUDDY_CHALLENGE_COMPLETE:  50,  // Both buddies must complete the challenge
} as const;

// ─── Penalties ────────────────────────────────────────────────────────────────

export const POINTS_PENALTY = {
  MISS_TASK_NO_JUSTIFICATION: -20,  // Starter / Pro
  MISS_TASK_ELITE:            -40,  // Elite — no justification option whatsoever
  BREAK_STREAK:               -10,  // Additional penalty on streak reset
} as const;

// ─── Redemption Costs ─────────────────────────────────────────────────────────

export const POINTS_REDEEM = {
  ONE_MONTH_STARTER:  500,
  ONE_MONTH_PRO:      1500,
  ONE_MONTH_ELITE:    5000,
  UNLOCK_MOOD_THEME:  200,
  UNLOCK_COACH:       300,
  UNLOCK_BADGE:       100,
} as const;

// ─── Streak Bonus Thresholds ──────────────────────────────────────────────────
// Days at which streak bonuses fire (one-time per threshold per challenge)

export const STREAK_BONUS_THRESHOLDS: { days: number; points: number; label: string }[] = [
  { days: 7,   points: POINTS_EARN.STREAK_7_DAY_BONUS,   label: '7-Day Streak! 🔥' },
  { days: 30,  points: POINTS_EARN.STREAK_30_DAY_BONUS,  label: '30-Day Streak! 💎' },
  { days: 100, points: POINTS_EARN.STREAK_100_DAY_BONUS, label: '100-Day Streak! 👑' },
];

// ─── Action Labels (for transaction history display) ─────────────────────────

export const POINTS_ACTION_LABELS: Record<string, string> = {
  COMPLETE_DAILY_TASK:        'Completed daily task',
  COMPLETE_FULL_CHALLENGE:    'Completed full challenge',
  STREAK_7_DAY_BONUS:         '7-day streak bonus',
  STREAK_30_DAY_BONUS:        '30-day streak bonus',
  STREAK_100_DAY_BONUS:       '100-day streak bonus',
  POST_IN_COMMUNITY:          'Posted in community',
  POST_GETS_LIKE:             'Post received a like',
  REFER_FRIEND:               'Referred a friend',
  JUSTIFY_MISSED_TASK:        'Submitted day justification',
  COMPLETE_ONBOARDING:        'Completed onboarding quiz',
  EARN_BADGE:                 'Earned a badge',
  BUDDY_CHALLENGE_COMPLETE:   'Buddy challenge completed',
  MISS_TASK_NO_JUSTIFICATION: 'Missed daily task',
  MISS_TASK_ELITE:            'Missed daily task (Elite penalty)',
  BREAK_STREAK:               'Streak broken',
  REDEEM_STARTER:             'Redeemed: 1 month Starter',
  REDEEM_PRO:                 'Redeemed: 1 month Pro',
  REDEEM_ELITE:               'Redeemed: 1 month Elite',
  REDEEM_MOOD:                'Redeemed: Mood theme unlock',
  REDEEM_COACH:               'Redeemed: Coach unlock',
  REDEEM_BADGE:               'Redeemed: Badge unlock',
};
