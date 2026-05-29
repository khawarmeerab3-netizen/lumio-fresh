// Lumio — shared/types/index.ts — All TypeScript interfaces and types for the platform

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  plan: 'free' | 'starter' | 'pro' | 'elite' | 'custom' | 'enterprise';
  plan_started_at?: string;
  plan_expires_at?: string;
  points: number;
  total_points_earned: number;
  selected_mood: string;
  selected_language: string;
  streak_current: number;
  streak_longest: number;
  streak_last_completed_date?: string;
  ai_queries_today: number;
  ai_queries_reset_at?: string;
  device_token?: string;
  notification_time?: string;
  onboarding_completed: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  niche_id: string;
  niche_category: string;
  niche_color: string;
  title: string;
  goal: string;
  custom_goal?: string;
  duration_days: number;
  coach_id?: string;
  ai_plan?: ChallengePlan;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  current_day: number;
  completed_days: number[];
  streak: number;
  longest_streak: number;
  last_completed_date?: string;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface ChallengePlan {
  title: string;
  tagline: string;
  overview: string;
  dailyHabits: string[];
  weeklyMilestones: { milestone: string; timeframe: string }[];
  successMetrics: string[];
  quickWins: string[];
  proTip: string;
}

export interface DailyTask {
  dayTitle: string;
  mainTask: string;
  timeRequired: string;
  steps: string[];
  motivationalNote: string;
  checkIn: string;
}

export interface DailyReport {
  greeting: string;
  scoreOutOf10: number;
  progressInsight: string;
  motivationalMessage: string;
  tomorrowPreview: string;
  emoji: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  challenge_id?: string;
  content: string;
  image_url?: string;
  niche_id?: string;
  likes_count: number;
  comments_count: number;
  is_flagged: boolean;
  is_hidden: boolean;
  created_at: string;
  user?: { name: string; avatar_url?: string; plan: string };
  challenge?: { goal: string; current_day: number };
  is_liked_by_me?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  user?: { name: string; avatar_url?: string };
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  action: string;
  points: number;
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  condition_type: string;
  condition_value: number;
  points_cost: number;
  is_purchasable: boolean;
}

export interface UserBadge {
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export interface BroadcastTip {
  emoji: string;
  category: string;
  title: string;
  tip: string;
  actionStep: string;
}

export interface AdminReport {
  overallScore: number;
  excellentCount: number;
  atRiskCount: number;
  keyInsight: string;
  actions: string[];
  partnerNote: string;
}

export interface OnboardingRecommendation {
  topNiches: { niche: string; reason: string }[];
  recommendedDuration: { days: number; label: string; reason: string };
  bestCoachType: string;
  whyThisMatters: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message: string;
}

// ─── Niche & Coach types ────────────────────────────────────────────────────

export interface Niche {
  icon: string;
  label: string;
  color: string;
  items: string[];
}

export interface NicheVisual {
  primaryColor: string;
  gradientCss: string;
  accentColor: string;
  bgTint: string;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  gender: 'male' | 'female' | 'neutral';
  niche_id: string;
  personality: string;
  speaking_style: string;
  specialty: string;
  catchphrase: string;
  avatar_url: string;
  is_supersonic: boolean;
  min_plan: 'starter' | 'pro' | 'elite';
}

// ─── Duration & Milestone types ─────────────────────────────────────────────

export interface Duration {
  label: string;
  days: number;
  free: boolean;
  emoji: string;
  desc: string;
}

export interface Milestone {
  d: number;
  l: string;
}

// ─── Mood type ───────────────────────────────────────────────────────────────

export interface Mood {
  id: MoodId;
  emoji: string;
  name: string;
  label: string;
  bg: string;
  bg2: string;
  bg3: string;
  bg4: string;
  border: string;
  border2: string;
  accent: string;
  accent2: string;
  soft: string;
  text: string;
  text2: string;
  text3: string;
  g: string;
  o1: string;
  o2: string;
  animStyle: string;
}

// ─── Plan & Pricing types ────────────────────────────────────────────────────

export interface PlanLimits {
  maxActiveChallenges: number | typeof Infinity;
  allowedDurations: number[] | 'all';
  aiQueriesPerDay: number | typeof Infinity;
  coaches: number;
  canPostCommunity: boolean;
  canViewCommunity: boolean;
  moodModes: number;
  canUsePhotoVideo: boolean;
  canRedeemPoints: boolean;
  maxNichesPerMonth: number | null;
  pointsMultiplier?: number;
  streakFreezePerMonth?: number;
  justificationAllowed?: boolean;
  superSonicEnabled?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
  dedicatedManager?: boolean;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  setupFee?: string;
  monthlyFee?: string;
  annualPrice?: string;
  color: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

// ─── Notification type ───────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ─── Analytics types ─────────────────────────────────────────────────────────

export interface HeatmapEntry {
  date: string;
  count: number;
}

export interface PointsHistoryEntry {
  date: string;
  points: number;
  action: string;
}

export interface NicheBreakdownEntry {
  niche: string;
  count: number;
}

export interface UserAnalytics {
  completionHeatmap: HeatmapEntry[];
  pointsHistory: PointsHistoryEntry[];
  challengeStats: {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
  };
  nicheBreakdown: NicheBreakdownEntry[];
  longestStreak: number;
  totalDaysCompleted: number;
  badgeCount: number;
}

// ─── Memory Pack types ───────────────────────────────────────────────────────

export interface MemoryPack {
  id: string;
  user_id: string;
  challenge_id: string;
  duration_days: number;
  price_paid: number;
  payment_id?: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export interface DayMedia {
  photos: File[];
  videos: File[];
  date: string;
}

// ─── Buddy types ─────────────────────────────────────────────────────────────

export interface ChallengeBuddy {
  id: string;
  challenge_id: string;
  user_id: string;
  buddy_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

// ─── Leaderboard types ───────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  plan: PlanType;
  pointsThisWeek: number;
  rank: number;
  streak: number;
}

// ─── Admin Client type ───────────────────────────────────────────────────────

export interface AdminClient {
  user: User;
  activeChallenge?: Challenge;
  status: 'excellent' | 'on-track' | 'needs-support' | 'at-risk';
  completionRate: number;
}

// ─── Scalar type aliases ─────────────────────────────────────────────────────

export type PlanType = 'free' | 'starter' | 'pro' | 'elite' | 'custom' | 'enterprise';
export type MoodId = 'gold' | 'fire' | 'ocean' | 'forest' | 'violet' | 'rose' | 'ice' | 'midnight';
export type LanguageCode = 'en' | 'ar' | 'ur' | 'hi' | 'es' | 'fr' | 'tr' | 'id';
export type ChallengeStatus = 'active' | 'completed' | 'abandoned' | 'paused';
export type BuddyStatus = 'pending' | 'accepted' | 'declined';
export type AdminClientStatus = 'excellent' | 'on-track' | 'needs-support' | 'at-risk';
