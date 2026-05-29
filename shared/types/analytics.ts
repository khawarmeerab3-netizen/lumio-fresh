// ─── shared/types/analytics.ts ───────────────────────────────────────────────
// Types shared between frontend and backend for analytics and admin data.

// ── Personal analytics (GET /api/analytics/me) ───────────────────────────────

export interface HeatmapEntry {
  date: string;   // ISO date string: "2025-04-03"
  count: number;  // number of tasks completed on that date (0 or 1 per challenge-day)
}

export interface StreakHistoryEntry {
  date: string;   // ISO date string — the day the streak reached this value
  streak: number;
}

export interface PointsHistoryEntry {
  date: string;   // ISO date string
  points: number; // signed — positive earn, negative penalty
  action: string; // e.g. "COMPLETE_DAILY_TASK"
}

export interface ChallengeStats {
  total: number;
  completed: number;
  active: number;
  completionRate: number; // percentage 0-100, rounded to 1 dp
}

export interface NicheBreakdownEntry {
  niche: string;
  count: number;
}

export interface PersonalAnalytics {
  completionHeatmap: HeatmapEntry[];
  streakHistory: StreakHistoryEntry[];
  pointsHistory: PointsHistoryEntry[];
  challengeStats: ChallengeStats;
  nicheBreakdown: NicheBreakdownEntry[];
  longestStreak: number;
  totalDaysCompleted: number;
  badgeCount: number;
}

// ── Admin — client list (GET /api/admin/clients) ──────────────────────────────

export type ClientStatus = 'excellent' | 'on-track' | 'needs-support' | 'at-risk';

export interface EnrichedClient {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: string;
  is_banned: boolean;
  streak_current: number;
  streak_longest: number;
  points: number;
  total_points_earned: number;
  created_at: string;
  // Derived from most recent active challenge
  activeChallenge: {
    id: string;
    title: string;
    niche_id: string;
    current_day: number;
    duration_days: number;
    completionRate: number; // percentage
    streak: number;
  } | null;
  status: ClientStatus;
}

// ── Admin — single client detail (GET /api/admin/clients/:id) ─────────────────

export interface ClientDetail {
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    plan: string;
    plan_started_at: string | null;
    plan_expires_at: string | null;
    points: number;
    total_points_earned: number;
    streak_current: number;
    streak_longest: number;
    is_admin: boolean;
    is_banned: boolean;
    onboarding_completed: boolean;
    selected_language: string;
    created_at: string;
  };
  challenges: unknown[];
  recentTasks: unknown[];
  pointsHistory: unknown[];
  badges: unknown[];
}

// ── Admin — revenue (GET /api/admin/revenue) ──────────────────────────────────

export interface RevenueSummary {
  payments: unknown[];
  byPlan: Record<string, { count: number; total: number }>;
  totalRevenue: number;
  thisMonthRevenue: number;
}

// ── Admin — platform stats (GET /api/admin/stats) ─────────────────────────────

export interface PlatformStats {
  totalUsers: number;
  activeChallenges: number;
  postsToday: number;
  newUsersThisWeek: number;
  aiQueriesToday: number;
  averageCompletionRate: number; // percentage, rounded to 1 dp
}

// ── Admin — moderation queue (GET /api/admin/moderation) ─────────────────────

export interface ModerationQueue {
  posts: unknown[];
  comments: unknown[];
}
