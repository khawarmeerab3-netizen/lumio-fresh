// Lumio — shared/constants/plans.ts — Plan limits, pricing, and access control helpers

import type { PlanType, PlanLimits, PricingPlan } from '../types/index';

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxActiveChallenges: 1,
    allowedDurations: [1, 3, 7],
    aiQueriesPerDay: 0,
    coaches: 0,
    canPostCommunity: false,
    canViewCommunity: true,
    moodModes: 3,
    canUsePhotoVideo: false,
    canRedeemPoints: false,
    maxNichesPerMonth: null,
  },
  starter: {
    maxActiveChallenges: 3,
    allowedDurations: 'all',
    aiQueriesPerDay: 0,
    coaches: 2,
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 5,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    streakFreezePerMonth: 0,
    justificationAllowed: true,
  },
  pro: {
    maxActiveChallenges: 10,
    allowedDurations: 'all',
    aiQueriesPerDay: 5,
    coaches: 4,
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 8,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    streakFreezePerMonth: 1,
    justificationAllowed: true,
  },
  elite: {
    maxActiveChallenges: Infinity,
    allowedDurations: 'all',
    aiQueriesPerDay: Infinity,
    coaches: 5,
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 10,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    pointsMultiplier: 2,
    streakFreezePerMonth: 2,
    justificationAllowed: false,  // Elite: no excuses, no justification
    superSonicEnabled: true,
  },
  custom: {
    maxActiveChallenges: Infinity,
    allowedDurations: 'all',
    aiQueriesPerDay: Infinity,
    coaches: 5,
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 8,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    justificationAllowed: true,
  },
  enterprise: {
    maxActiveChallenges: Infinity,
    allowedDurations: 'all',
    aiQueriesPerDay: Infinity,
    coaches: 5,
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 10,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    pointsMultiplier: 2,
    justificationAllowed: true,
    apiAccess: true,
    whiteLabel: true,
    dedicatedManager: true,
  },
};

// ─── Plan Rank (for comparison) ───────────────────────────────────────────────
// Higher number = more powerful plan

export const PLAN_RANK: Record<PlanType, number> = {
  free:       0,
  starter:    1,
  pro:        2,
  elite:      3,
  custom:     2,  // between pro and elite
  enterprise: 4,
};

// ─── Pricing ──────────────────────────────────────────────────────────────────

export const PRICING: PricingPlan[] = [
  {
    id: 'free',
    name: 'FREE',
    price: '$0',
    period: 'forever',
    color: '#6b7280',
    features: [
      '1-day, 3-day & 7-day challenges',
      'All 100+ niches (browse)',
      'Community feed — view only',
      'Basic progress tracking',
      '1 active challenge',
    ],
    cta: 'START FREE',
  },
  {
    id: 'starter',
    name: 'STARTER',
    price: '$5',
    period: '/month',
    monthlyFee: '5',
    annualPrice: '$39/year',
    color: '#3b82f6',
    features: [
      'All challenge durations',
      'Up to 3 simultaneous challenges',
      'Community posting + comments',
      '2 AI coaches per niche',
      '5 mood themes',
      'Photo/video memory packs',
      'Points system + redemption',
    ],
    cta: 'START STARTER',
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '$9',
    period: '/month',
    monthlyFee: '9',
    annualPrice: '$69/year',
    color: '#f59e0b',
    popular: true,
    features: [
      'Up to 10 simultaneous challenges',
      '90-day max duration',
      '5 AI coach queries per day',
      '4 AI coaches per niche',
      'All 8 mood themes',
      'Daily AI progress reports',
      'Streak freeze (1/month)',
      'Analytics dashboard',
    ],
    cta: 'START PRO',
  },
  {
    id: 'elite',
    name: 'ELITE',
    price: '$19',
    period: '/month',
    monthlyFee: '19',
    annualPrice: '$149/year',
    color: '#10b981',
    features: [
      'Unlimited challenges',
      '365-day challenges',
      'Unlimited AI queries',
      'All 5 coaches + SuperSonic AI',
      'All mood themes',
      '2× points on everything',
      'Streak freeze (2/month)',
      'SuperSonic proactive coach',
      'VIP community badge',
    ],
    cta: 'START ELITE',
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    price: 'Custom',
    period: 'pay-as-you-go',
    color: '#a78bfa',
    features: [
      'Set your own limits',
      'Pay only for what you use',
      'Custom rate card in 24h',
      'Scale up or down anytime',
      'No monthly commitment',
      'Full platform access',
    ],
    cta: 'CONFIGURE CUSTOM',
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    price: 'Contact',
    period: 'us',
    color: '#f43f5e',
    features: [
      'Unlimited employee seats',
      'Employee development programs',
      'HR admin dashboard',
      'Custom branded challenges',
      'Dedicated account manager',
      'API access for HR integrations',
      'SLA guarantee',
      'White-label option',
    ],
    cta: 'CONTACT SALES',
  },
];

// ─── Memory Pack Pricing ──────────────────────────────────────────────────────

export const MEMORY_PACK_PRICING: Record<number, number> = {
  3:   0,   // FREE
  7:   2,
  15:  3,
  30:  5,
  90:  10,
  365: 25,
};

export function getMemoryPackPrice(days: number): number {
  // Find closest match
  const keys = Object.keys(MEMORY_PACK_PRICING).map(Number).sort((a, b) => a - b);
  const match = keys.find((k) => k >= days);
  return MEMORY_PACK_PRICING[match ?? 365] ?? 25;
}

// ─── Access Helpers ───────────────────────────────────────────────────────────

export function hasAccess(userPlan: PlanType, requiredPlan: PlanType): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[requiredPlan];
}

export function canUseAI(userPlan: PlanType): boolean {
  return PLAN_LIMITS[userPlan].aiQueriesPerDay > 0;
}

export function isDurationAllowed(userPlan: PlanType, days: number): boolean {
  const allowed = PLAN_LIMITS[userPlan].allowedDurations;
  if (allowed === 'all') return true;
  return (allowed as number[]).includes(days);
}

export function getPointsMultiplier(userPlan: PlanType): number {
  return PLAN_LIMITS[userPlan].pointsMultiplier ?? 1;
}

export function canJustifyMiss(userPlan: PlanType): boolean {
  return PLAN_LIMITS[userPlan].justificationAllowed !== false;
}

export function getPlanColor(plan: PlanType): string {
  return PRICING.find((p) => p.id === plan)?.color ?? '#6b7280';
}
