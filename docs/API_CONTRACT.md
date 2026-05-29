# Lumio — API Contract
## Every backend endpoint with verified request + response types
### Auto-generated from Phase 29 integration audit

All responses conform to the **universal envelope**:
```typescript
// Success
{ data: T, error: null, message: string }
// Error
{ data: null, error: string, message: string }
```

Authentication: Bearer JWT in `Authorization` header on all routes except those marked `[PUBLIC]`.

---

## AUTH — `/api/auth`

### POST `/api/auth/register` `[PUBLIC]`
**Request body** (Zod: `registerSchema`)
```typescript
{
  email:    string;   // valid email
  password: string;   // min 8 chars
  name:     string;   // min 2 chars, max 50
}
```
**Response** `ApiResponse<AuthData>`
```typescript
data: {
  user: {
    id:          string;
    email:       string;
    name:        string;
    plan:        PlanKey;             // 'free'|'starter'|'pro'|'elite'|...
    is_admin:    boolean;
    onboarding_completed: boolean;
    selected_mood:    string;
    selected_language: string;
    streak_current:   number;
    points:           number;
  };
  token: string;   // JWT, 30d expiry
}
```
**Frontend call:** `POST ${API_URL}/api/auth/register`

---

### POST `/api/auth/login` `[PUBLIC]`
**Request body** (Zod: `loginSchema`)
```typescript
{ email: string; password: string; }
```
**Response** `ApiResponse<AuthData>` — same shape as register.

**Frontend call:** `POST ${API_URL}/api/auth/login`

---

### GET `/api/auth/me`
**Response** `ApiResponse<User>` — current user object (same fields as register response `.user`).

**Frontend call:** `GET ${API_URL}/api/auth/me`

---

### POST `/api/auth/refresh`
**Request body**
```typescript
{ refreshToken: string; }
```
**Response** `ApiResponse<{ token: string; refreshToken: string; }>`

---

### POST `/api/auth/logout`
**Response** `ApiResponse<null>` — invalidates server session.

---

### POST `/api/auth/forgot-password` `[PUBLIC]`
**Request body**
```typescript
{ email: string; }
```
**Response** `ApiResponse<null>` — always 200 (no email enumeration).

---

### POST `/api/auth/reset-password` `[PUBLIC]`
**Request body**
```typescript
{ token: string; password: string; }
```
**Response** `ApiResponse<null>`

---

## USERS — `/api/users`

### GET `/api/users/me`
**Response** `ApiResponse<User>` — full user profile including points, streaks, badges.

---

### PATCH `/api/users/me`
**Request body** (all fields optional)
```typescript
{
  name?:              string;
  selected_mood?:     string;
  selected_language?: string;
  notification_time?: string;   // "HH:MM" format
  device_token?:      string;   // for push notifications
  avatar_url?:        string;
}
```
**Response** `ApiResponse<User>`

**Frontend call:** `PATCH ${API_URL}/api/users/me`

---

### GET `/api/users/:id/profile` `[PUBLIC for own; auth for others]`
**Response** `ApiResponse<PublicProfile>`
```typescript
data: {
  id:            string;
  name:          string;
  avatar_url:    string | null;
  streak_current: number;
  streak_longest: number;
  total_points_earned: number;
  badges:        Badge[];
  challenges_completed: number;
  is_following?: boolean;   // only if authenticated
}
```

---

### POST `/api/users/me/complete-onboarding`
**Request body**
```typescript
{
  quizAnswers: {
    lifeArea:        string;
    goal:            string;
    timeAvailable:   string;
    experience:      string;
    motivationStyle: string;
  };
}
```
**Response** `ApiResponse<OnboardingResult>`
```typescript
data: {
  recommendation: {
    topNiches:           Array<{ niche: string; reason: string }>;
    recommendedDuration: { days: number; label: string; reason: string };
    bestCoachType:       string;
    whyThisMatters:      string;
  };
  pointsAwarded: number;   // +25 for completing onboarding
}
```

**Frontend call:** `POST ${API_URL}/api/users/me/complete-onboarding`

---

## CHALLENGES — `/api/challenges`

### GET `/api/challenges`
**Query params:** `status?: 'active'|'completed'|'abandoned'`
**Response** `ApiResponse<Challenge[]>`
```typescript
data: Challenge[]   // sorted by created_at DESC
```

**Frontend call:** `GET ${API_URL}/api/challenges?status=active`

---

### POST `/api/challenges`
**Request body** (Zod: `createChallengeSchema`)
```typescript
{
  niche_id:      string;
  niche_category: string;
  niche_color:   string;
  goal:          string;
  custom_goal?:  string;
  duration_days: number;   // must be in DURATIONS list
  coach_id?:     string;
  language?:     string;   // defaults to user.selected_language
}
```
**Response** `ApiResponse<Challenge>`
```typescript
data: Challenge   // with ai_plan populated
```

**Frontend call:** `POST ${API_URL}/api/challenges`

---

### GET `/api/challenges/:id`
**Response** `ApiResponse<Challenge>` — 404 if not owned by requesting user.

**Frontend call:** `GET ${API_URL}/api/challenges/${id}`

---

### DELETE `/api/challenges/:id`
Sets `status = 'abandoned'`.
**Response** `ApiResponse<null>`

---

### GET `/api/challenges/:id/task`
Returns today's task (creates + caches if not yet generated for this day).
**Response** `ApiResponse<DailyTask>`
```typescript
data: {
  id:         string;
  day_number: number;
  status:     'pending'|'completed'|'missed'|'justified';
  task_data: {
    dayTitle:         string;
    task:             string;
    timeRequired:     string;
    steps:            string[];   // 4 items
    motivationalNote: string;
    coachQuestion:    string;
  };
}
```

**Frontend call:** `GET ${API_URL}/api/challenges/${id}/task`

---

### POST `/api/challenges/:id/complete-day`
**Request body**
```typescript
{ note?: string; }   // reflection textarea content
```
**Response** `ApiResponse<CompleteDayResult>`
```typescript
data: {
  challenge:       Challenge;   // updated challenge in store
  pointsAwarded:   number;
  milestoneReached?: {
    label:     string;
    day:       number;
    aiMessage: string;
  } | null;
  badgesEarned:    Badge[];
  streakUpdated:   { current: number; longest: number };
}
```

**Frontend call:** `POST ${API_URL}/api/challenges/${id}/complete-day`

---

### POST `/api/challenges/:id/justify-miss`
**Plan gate:** Starter, Pro only (not Elite, not Free)
**Request body**
```typescript
{ justification: string; }   // min 10 chars
```
**Response** `ApiResponse<{ pointsAwarded: number; }>`

---

### GET `/api/challenges/:id/report`
**Plan gate:** Pro, Elite
**Query params:** `fresh?: boolean`
**Response** `ApiResponse<DailyReport>`
```typescript
data: {
  greeting:            string;
  scoreOutOf10:        number;
  progressInsight:     string;
  motivationalMessage: string;
  tomorrowPreview:     string;
  emoji:               string;
}
```

**Frontend call:** `GET ${API_URL}/api/challenges/${id}/report`

---

## AI / COACH — `/api/ai`

### POST `/api/ai/coach-chat`
**Plan gate:** Pro, Elite
**Request body** (Zod: `coachChatSchema`)
```typescript
{
  challengeId: string;
  message:     string;   // max 500 chars, trimmed, HTML-stripped
  coachId?:    string;
}
```
**Response** `ApiResponse<{ reply: string; }>`

**Frontend call:** `POST ${API_URL}/api/ai/coach-chat`

---

### GET `/api/ai/coaches`
**Query params:** `nicheId: string`
**Response** `ApiResponse<Coach[]>` — filtered to coaches accessible by user's plan.

**Frontend call:** `GET ${API_URL}/api/ai/coaches?nicheId=${nicheId}`

---

### POST `/api/ai/generate-post`
**Request body**
```typescript
{ challengeId: string; }
```
**Response** `ApiResponse<{ content: string; }>`

---

## COMMUNITY — `/api/community`

### GET `/api/community/posts`
**Query params:**
```typescript
{
  feed?:    'global'|'following'|'niche';
  nicheId?: string;
  cursor?:  string;   // ISO timestamp for pagination
  limit?:   number;   // default 20, max 50
}
```
**Response** `ApiResponse<CommunityFeedResult>`
```typescript
data: {
  posts:      CommunityPost[];
  nextCursor: string | null;
}
```

**Frontend call:** `GET ${API_URL}/api/community/posts?feed=global`

---

### POST `/api/community/posts`
**Plan gate:** Starter, Pro, Elite
**Request body** (Zod: `createPostSchema`)
```typescript
{
  content:      string;       // max 500 chars
  challengeId?: string;
  imageUrl?:    string;
  nicheId?:     string;
}
```
**Response** `ApiResponse<CommunityPost>`

**Frontend call:** `POST ${API_URL}/api/community/posts`

---

### DELETE `/api/community/posts/:id`
Sets `is_hidden = true` for own posts (hard delete for admin).
**Response** `ApiResponse<null>`

---

### POST `/api/community/posts/:id/like`
Toggle like. **Response** `ApiResponse<{ liked: boolean; likesCount: number; }>`

**Frontend call:** `POST ${API_URL}/api/community/posts/${id}/like`

---

### POST `/api/community/posts/:id/flag`
**Request body**
```typescript
{ reason?: string; }
```
**Response** `ApiResponse<null>`

---

### GET `/api/community/posts/:id/comments`
**Response** `ApiResponse<PostComment[]>`

**Frontend call:** `GET ${API_URL}/api/community/posts/${id}/comments`

---

### POST `/api/community/posts/:id/comments`
**Request body**
```typescript
{ content: string; }   // max 300 chars
```
**Response** `ApiResponse<PostComment>`

**Frontend call:** `POST ${API_URL}/api/community/posts/${id}/comments`

---

### DELETE `/api/community/comments/:id`
Own comment only.
**Response** `ApiResponse<null>`

---

### POST `/api/community/comments/:id/flag`
**Response** `ApiResponse<null>`

---

## POINTS — `/api/points`

### GET `/api/points`
**Response** `ApiResponse<PointsData>`
```typescript
data: {
  balance:    number;
  totalEarned: number;
  history:    PointsTransaction[];   // last 50, DESC
}
```

**Frontend call:** `GET ${API_URL}/api/points`

---

### POST `/api/points/redeem`
**Request body** (Zod: `redeemSchema`)
```typescript
{
  redeemType: 'one_month_starter'|'one_month_pro'|'one_month_elite'
            | 'unlock_mood_theme'|'unlock_coach'|'unlock_badge';
  targetId?:  string;   // for unlock_ types
}
```
**Response** `ApiResponse<{ newBalance: number; }>`

**Frontend call:** `POST ${API_URL}/api/points/redeem`

---

## STREAKS — `/api/streaks`

### GET `/api/streaks`
**Response** `ApiResponse<StreakData>`
```typescript
data: {
  current:           number;
  longest:           number;
  freezesAvailable:  number;
  freezesUsedThisMonth: number;
  lastCompletedDate: string | null;
  atRisk:            boolean;
}
```

---

### POST `/api/streaks/freeze`
Uses one streak freeze.
**Plan gate:** Pro, Elite
**Response** `ApiResponse<{ freezesRemaining: number; }>`

---

## BADGES — `/api/badges`

### GET `/api/badges`
**Response** `ApiResponse<BadgeCollection>`
```typescript
data: {
  earned:   UserBadge[];
  available: BadgeDefinition[];   // all badges not yet earned
}
```

**Frontend call:** `GET ${API_URL}/api/badges`

---

## FOLLOWERS — `/api/followers`

### GET `/api/followers/following`
**Response** `ApiResponse<PublicProfile[]>` — users the current user follows.

---

### GET `/api/followers/followers`
**Response** `ApiResponse<PublicProfile[]>` — users following current user.

---

### POST `/api/followers/:userId/follow`
Toggle follow/unfollow.
**Response** `ApiResponse<{ following: boolean; }>`

**Frontend call:** `POST ${API_URL}/api/followers/${userId}/follow`

---

## BUDDIES — `/api/buddies`

### GET `/api/buddies`
**Response** `ApiResponse<BuddyRelationship[]>`
```typescript
data: BuddyRelationship[]   // accepted pairs + pending invites
```

---

### POST `/api/buddies/invite`
**Request body**
```typescript
{ targetUserId: string; challengeId: string; }
```
**Response** `ApiResponse<BuddyInvite>`

---

### POST `/api/buddies/:inviteId/accept`
**Response** `ApiResponse<BuddyRelationship>`

---

### DELETE `/api/buddies/:buddyId`
**Response** `ApiResponse<null>`

---

## NOTIFICATIONS — `/api/notifications`

### GET `/api/notifications`
**Query params:** `unreadOnly?: boolean; limit?: number`
**Response** `ApiResponse<Notification[]>`

**Frontend call:** `GET ${API_URL}/api/notifications?unreadOnly=true`

---

### POST `/api/notifications/mark-read`
**Request body**
```typescript
{ ids: string[]; }   // notification IDs, or empty array = mark all
```
**Response** `ApiResponse<null>`

---

### PATCH `/api/notifications/preferences`
**Request body**
```typescript
{
  pushEnabled?:          boolean;
  streakAlerts?:         boolean;
  milestoneAlerts?:      boolean;
  communityAlerts?:      boolean;
  coachMessages?:        boolean;
  notificationTime?:     string;   // "HH:MM"
}
```
**Response** `ApiResponse<NotificationPreferences>`

---

## MEMORY — `/api/memory`

### GET `/api/memory/:challengeId`
**Response** `ApiResponse<MemoryPack>`
```typescript
data: {
  challengeId:   string;
  isPurchased:   boolean;
  packPrice:     number;
  daysWithMedia: number[];
}
```

---

### POST `/api/memory/:challengeId/purchase`
Initiates LemonSqueezy checkout for memory pack.
**Response** `ApiResponse<{ checkoutUrl: string; }>`

---

## PAYMENTS — `/api/payments`

### POST `/api/payments/subscribe`
**Request body**
```typescript
{
  planId:  'starter'|'pro'|'elite';
  billing: 'monthly'|'annual';
}
```
**Response** `ApiResponse<{ checkoutUrl: string; }>`

**Frontend call:** `POST ${API_URL}/api/payments/subscribe`

---

### POST `/api/payments/cancel`
**Response** `ApiResponse<null>`

---

### GET `/api/payments/portal`
Returns URL to LemonSqueezy customer portal.
**Response** `ApiResponse<{ portalUrl: string; }>`

---

### POST `/api/payments/webhook` `[PUBLIC — LemonSqueezy signature verified]`
**Headers:** `X-Signature: <HMAC-SHA256>`
**Body:** LemonSqueezy webhook payload
**Response:** HTTP 200 (no body) on success.

Internal effects:
- `subscription_created` → update `users.plan`, `plan_started_at`, `plan_expires_at`
- `subscription_cancelled` → schedule plan downgrade at period end
- `subscription_expired` → set plan back to `'free'`
- `order_created` → unlock memory pack if product matches

---

## ANALYTICS — `/api/analytics`

### GET `/api/analytics/heatmap`
**Query params:** `challengeId?: string; year?: number`
**Response** `ApiResponse<HeatmapData>`
```typescript
data: {
  completedDates: string[];   // ISO date strings "YYYY-MM-DD"
  streakHistory:  Array<{ date: string; streak: number }>;
}
```

**Frontend call:** `GET ${API_URL}/api/analytics/heatmap`

---

### GET `/api/analytics/points-history`
**Query params:** `period?: '7d'|'30d'|'90d'|'all'`
**Response** `ApiResponse<PointsChartData>`
```typescript
data: {
  chart: Array<{ date: string; earned: number; spent: number; balance: number }>;
  summary: { totalEarned: number; totalSpent: number; netChange: number };
}
```

---

## LEADERBOARD — `/api/leaderboard`

### GET `/api/leaderboard`
**Query params:**
```typescript
{
  nicheId?: string;
  period?:  'weekly'|'monthly'|'alltime';
  limit?:   number;   // default 20
}
```
**Response** `ApiResponse<LeaderboardEntry[]>`
```typescript
data: Array<{
  rank:         number;
  userId:       string;
  name:         string;
  avatar_url:   string | null;
  points:       number;
  streak:       number;
  isCurrentUser: boolean;
}>
```

**Frontend call:** `GET ${API_URL}/api/leaderboard?period=weekly`

---

## ADMIN — `/api/admin`
All routes: auth middleware **+** `req.user.is_admin === true` check.

### GET `/api/admin/report`
**Response** `ApiResponse<AdminReport>`
```typescript
data: {
  healthScore:    number;   // 0–100
  keyInsight:     string;
  actions:        string[];
  aiPartnerNote:  string;
  totalUsers:     number;
  excellentUsers: number;
  atRiskUsers:    number;
}
```

**Frontend call:** `GET ${API_URL}/api/admin/report`

---

### POST `/api/admin/report`
Force-regenerates AI report.
**Response** `ApiResponse<AdminReport>` — same shape.

**Frontend call:** `POST ${API_URL}/api/admin/report`

---

### GET `/api/admin/stats`
**Response** `ApiResponse<AdminStats>`
```typescript
data: {
  activeChallengesToday:  number;
  tasksCompletedToday:    number;
  newUsersThisWeek:       number;
  avgStreakLength:        number;
  totalChallengesActive:  number;
  communityPostsToday:    number;
}
```

**Frontend call:** `GET ${API_URL}/api/admin/stats`

---

### GET `/api/admin/clients`
**Response** `ApiResponse<AdminClient[]>`
```typescript
data: Array<{
  id:            string;
  name:          string;
  email:         string;
  plan:          PlanKey;
  clientStatus:  'excellent'|'on-track'|'at-risk';
  streak_current: number;
  points:        number;
  last_active:   string | null;
  challenges:    Array<{
    id:           string;
    goal:         string;
    current_day:  number;
    duration_days: number;
    streak:       number;
    status:       string;
  }>;
}>
```

**Frontend call:** `GET ${API_URL}/api/admin/clients`

---

### GET `/api/admin/clients/:id`
**Response** `ApiResponse<AdminClientDetail>`
```typescript
data: {
  client:          AdminClient;
  pointsHistory:   Array<{ date: string; amount: number; reason: string }>;
  suggestedMessage?: string;
}
```

**Frontend call:** `GET ${API_URL}/api/admin/clients/${id}`

---

### POST `/api/admin/clients/:id/message`
**Request body**
```typescript
{ message: string; }
```
**Response** `ApiResponse<null>`

**Frontend call:** `POST ${API_URL}/api/admin/clients/${id}/message`

---

### GET `/api/admin/user-counts`
**Response** `ApiResponse<UserCounts>`
```typescript
data: {
  all:     number;
  free:    number;
  starter: number;
  pro:     number;
  elite:   number;
}
```

**Frontend call:** `GET ${API_URL}/api/admin/user-counts`

---

### POST `/api/admin/broadcast/generate`
**Request body**
```typescript
{ topic?: string; }
```
**Response** `ApiResponse<BroadcastPreview>`
```typescript
data: {
  emoji:      string;
  category:   string;
  title:      string;
  tip:        string;
  actionStep: string;
}
```

**Frontend call:** `POST ${API_URL}/api/admin/broadcast/generate`

---

### POST `/api/admin/broadcast/send`
**Request body**
```typescript
{
  preview:     BroadcastPreview;
  targetAll:   boolean;
  targetPlans: PlanKey[];   // used when targetAll = false
}
```
**Response** `ApiResponse<{ sentCount: number; }>`

**Frontend call:** `POST ${API_URL}/api/admin/broadcast/send`

---

### GET `/api/admin/moderation/posts`
**Response** `ApiResponse<FlaggedPost[]>`
```typescript
data: Array<{
  id:          string;
  content:     string;
  user_name:   string;
  user_id:     string;
  user_email:  string;
  flag_count:  number;
  flag_reason?: string;
  created_at:  string;
  is_hidden:   boolean;
}>
```

**Frontend call:** `GET ${API_URL}/api/admin/moderation/posts`

---

### POST `/api/admin/moderation/posts/:id/hide`
**Response** `ApiResponse<null>`

**Frontend call:** `POST ${API_URL}/api/admin/moderation/posts/${id}/hide`

---

### POST `/api/admin/moderation/posts/:id/clear-flags`
**Response** `ApiResponse<null>`

**Frontend call:** `POST ${API_URL}/api/admin/moderation/posts/${id}/clear-flags`

---

### GET `/api/admin/moderation/comments`
**Response** `ApiResponse<FlaggedComment[]>`
```typescript
data: Array<{
  id:         string;
  content:    string;
  user_name:  string;
  user_id:    string;
  user_email: string;
  post_id:    string;
  created_at: string;
  is_flagged: boolean;
}>
```

**Frontend call:** `GET ${API_URL}/api/admin/moderation/comments`

---

### POST `/api/admin/moderation/comments/:id/clear-flags`
**Response** `ApiResponse<null>`

**Frontend call:** `POST ${API_URL}/api/admin/moderation/comments/${id}/clear-flags`

---

### POST `/api/admin/users/:userId/ban`
Sets `users.is_banned = true`.
**Response** `ApiResponse<null>`

**Frontend call:** `POST ${API_URL}/api/admin/users/${userId}/ban`

---

### GET `/api/admin/revenue`
**Response** `ApiResponse<RevenueData>`
```typescript
data: {
  totalRevenue:  number;
  thisMonth:     number;
  lastMonth:     number;
  mrr:           number;
  planBreakdown: Array<{
    plan:  string;
    count: number;
    mrr:   number;
    color: string;
  }>;
  recentPayments: Array<{
    id:         string;
    user_name:  string;
    user_email: string;
    plan:       string;
    amount:     number;
    currency:   string;
    billing:    'monthly'|'annual';
    created_at: string;
    status:     'paid'|'failed'|'refunded';
  }>;
  subscriptionStatus: {
    active:    number;
    trialing:  number;
    cancelled: number;
    paused:    number;
  };
}
```

**Frontend call:** `GET ${API_URL}/api/admin/revenue`

---

## TYPE REFERENCE

### `PlanKey`
```typescript
type PlanKey = 'free' | 'starter' | 'pro' | 'elite' | 'custom' | 'enterprise';
```

### `ApiResponse<T>`
```typescript
interface ApiResponse<T> {
  data:    T | null;
  error:   string | null;
  message: string;
}
```

### `Challenge`
```typescript
interface Challenge {
  id:                 string;
  user_id:            string;
  niche_id:           string;
  niche_category:     string;
  niche_color:        string;
  title:              string;
  goal:               string;
  custom_goal:        string | null;
  duration_days:      number;
  coach_id:           string | null;
  ai_plan:            AiPlan | null;
  status:             'active' | 'completed' | 'abandoned' | 'paused';
  current_day:        number;
  completed_days:     number[];
  streak:             number;
  longest_streak:     number;
  last_completed_date: string | null;
  start_date:         string;
  end_date:           string | null;
  created_at:         string;
}
```

### `AiPlan`
```typescript
interface AiPlan {
  title:           string;
  tagline:         string;
  overview:        string;
  dailyHabits:     string[];          // 4 items
  weeklyMilestones: Array<{ milestone: string; timeframe: string }>;
  successMetrics:  string[];          // 3 items
  quickWins:       string[];          // 3 items
  proTip:          string;
}
```

### `DailyTask`
```typescript
interface DailyTask {
  id:             string;
  challenge_id:   string;
  user_id:        string;
  day_number:     number;
  task_data:      DailyTaskData;
  status:         'pending' | 'completed' | 'missed' | 'justified';
  note:           string | null;
  justification:  string | null;
  points_awarded: number;
  completed_at:   string | null;
  created_at:     string;
}

interface DailyTaskData {
  dayTitle:         string;
  task:             string;
  timeRequired:     string;
  steps:            string[];   // 4 items
  motivationalNote: string;
  coachQuestion:    string;
}
```

### `CommunityPost`
```typescript
interface CommunityPost {
  id:             string;
  user_id:        string;
  challenge_id:   string | null;
  content:        string;
  image_url:      string | null;
  niche_id:       string | null;
  likes_count:    number;
  comments_count: number;
  is_flagged:     boolean;
  is_hidden:      boolean;
  flag_count:     number;
  created_at:     string;
  user:           { name: string; avatar_url: string | null; };
  liked_by_me:    boolean;
}
```

### `User`
```typescript
interface User {
  id:                      string;
  email:                   string;
  name:                    string;
  avatar_url:              string | null;
  plan:                    PlanKey;
  plan_started_at:         string | null;
  plan_expires_at:         string | null;
  points:                  number;
  total_points_earned:     number;
  selected_mood:           string;
  selected_language:       string;
  streak_current:          number;
  streak_longest:          number;
  streak_last_completed_date: string | null;
  ai_queries_today:        number;
  device_token:            string | null;
  notification_time:       string;
  is_admin:                boolean;
  is_banned:               boolean;
  onboarding_completed:    boolean;
  created_at:              string;
  updated_at:              string;
}
```

---

*Last updated: Phase 29 — Final Integration Audit*
