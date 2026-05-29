// Lumio — shared/constants/badges.ts — All badge definitions for the achievement system

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  image_url: string;
  condition_type:
    | 'challenges_created'
    | 'challenges_completed'
    | 'streak_days'
    | 'niches_tried'
    | 'posts_created'
    | 'likes_received'
    | 'total_points'
    | 'buddy_challenges';
  condition_value: number;
  points_cost: number;
  is_purchasable: boolean;
  emoji: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ─── First-time badges ───────────────────────────────────────────────────
  {
    id: 'first_challenge',
    name: 'Pioneer',
    description: 'Created your very first Lumio challenge.',
    image_url: '/badges/pioneer.svg',
    condition_type: 'challenges_created',
    condition_value: 1,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🚀',
  },
  {
    id: 'first_complete',
    name: 'Finisher',
    description: 'Completed a full challenge from start to finish.',
    image_url: '/badges/finisher.svg',
    condition_type: 'challenges_completed',
    condition_value: 1,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🏆',
  },
  {
    id: 'first_post',
    name: 'Voice',
    description: 'Shared your first post with the Lumio community.',
    image_url: '/badges/voice.svg',
    condition_type: 'posts_created',
    condition_value: 1,
    points_cost: 0,
    is_purchasable: false,
    emoji: '📢',
  },

  // ─── Streak badges ───────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Spark',
    description: 'Maintained a 3-day streak.',
    image_url: '/badges/spark.svg',
    condition_type: 'streak_days',
    condition_value: 3,
    points_cost: 0,
    is_purchasable: false,
    emoji: '⚡',
  },
  {
    id: 'streak_7',
    name: 'Flame',
    description: 'Maintained a 7-day streak — one full week.',
    image_url: '/badges/flame.svg',
    condition_type: 'streak_days',
    condition_value: 7,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🔥',
  },
  {
    id: 'streak_21',
    name: 'Habit',
    description: 'Maintained a 21-day streak — a real habit is born.',
    image_url: '/badges/habit.svg',
    condition_type: 'streak_days',
    condition_value: 21,
    points_cost: 0,
    is_purchasable: false,
    emoji: '💎',
  },
  {
    id: 'streak_30',
    name: 'Iron Will',
    description: 'Maintained a 30-day streak without breaking.',
    image_url: '/badges/iron-will.svg',
    condition_type: 'streak_days',
    condition_value: 30,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🦾',
  },
  {
    id: 'streak_90',
    name: 'Inferno',
    description: 'Maintained a 90-day streak — you are unstoppable.',
    image_url: '/badges/inferno.svg',
    condition_type: 'streak_days',
    condition_value: 90,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🌋',
  },
  {
    id: 'streak_365',
    name: 'Legend',
    description: 'Maintained a full-year streak. Truly legendary.',
    image_url: '/badges/legend.svg',
    condition_type: 'streak_days',
    condition_value: 365,
    points_cost: 0,
    is_purchasable: false,
    emoji: '👑',
  },

  // ─── Niche diversity badges ──────────────────────────────────────────────
  {
    id: 'niche_3',
    name: 'Explorer',
    description: 'Tried challenges in 3 different life areas.',
    image_url: '/badges/explorer.svg',
    condition_type: 'niches_tried',
    condition_value: 3,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🧭',
  },
  {
    id: 'niche_6',
    name: 'Polymath',
    description: 'Tried challenges in 6 different life areas.',
    image_url: '/badges/polymath.svg',
    condition_type: 'niches_tried',
    condition_value: 6,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🎓',
  },

  // ─── Social badges ───────────────────────────────────────────────────────
  {
    id: 'likes_50',
    name: 'Inspiring',
    description: 'Your community posts received 50 likes total.',
    image_url: '/badges/inspiring.svg',
    condition_type: 'likes_received',
    condition_value: 50,
    points_cost: 0,
    is_purchasable: false,
    emoji: '❤️',
  },
  {
    id: 'buddy_complete',
    name: 'Accountability',
    description: 'Completed a challenge alongside a buddy.',
    image_url: '/badges/accountability.svg',
    condition_type: 'buddy_challenges',
    condition_value: 1,
    points_cost: 0,
    is_purchasable: false,
    emoji: '🤝',
  },

  // ─── Points badges ───────────────────────────────────────────────────────
  {
    id: 'points_1000',
    name: 'Earner',
    description: 'Earned 1,000 total Lumio Points.',
    image_url: '/badges/earner.svg',
    condition_type: 'total_points',
    condition_value: 1000,
    points_cost: 0,
    is_purchasable: false,
    emoji: '💰',
  },
  {
    id: 'points_10000',
    name: 'Luminary',
    description: 'Earned 10,000 total Lumio Points — you shine bright.',
    image_url: '/badges/luminary.svg',
    condition_type: 'total_points',
    condition_value: 10000,
    points_cost: 0,
    is_purchasable: false,
    emoji: '✨',
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

export function getBadgesByConditionType(
  type: BadgeDefinition['condition_type']
): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.condition_type === type);
}
