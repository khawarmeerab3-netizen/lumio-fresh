# LUMIO — AGENT.md
## Complete Master Document for Claude Code
### Version 2.0 | Synthesized from All Project Files | Build-Ready

---

## WHAT YOU ARE BUILDING

Lumio is the world's most advanced AI-powered life challenge platform. It covers every area of human life — fitness, finance, cooking, spirituality, parenting, creativity, relationships, learning, productivity, and more.

**Tagline:** "Illuminate Your Growth"

Users pick a challenge from 100+ niches across 12 life categories, choose a duration (1 day to 1 year), get a fully personalized AI-generated plan with title + milestones + habits + metrics, work with an AI coach that knows them personally and their exact challenge, complete AI-generated daily tasks with step-by-step breakdowns, track progress through an animated milestone map and progress ring, build streaks, earn Lumio Points, compete with friends, share wins in niche-filtered community feeds, and compile their journey into a shareable video reel.

The app changes its ENTIRE visual identity based on the user's current mood (8 mood themes). The admin dashboard lets the owner manage all clients, broadcast AI-generated tips, and view AI-powered platform health reports.

**This is not a habit tracker. This is not a fitness app. This is a complete life transformation platform powered by AI, available to everyone.**

---

## WHAT MAKES LUMIO UNBEATABLE (Competitive Differentiators)

Based on analysis vs Strava, Habitica, Duolingo, Nike Training Club, and GoJoe:

1. **Only platform covering all 12 life areas** — every competitor is single-niche
2. **AI coach knows YOUR specific challenge** — not a generic chatbot
3. **8 Mood Themes** — entire app visual identity changes; zero competitors have this
4. **AI daily task generation** — each day gets a unique task specific to YOUR goal and day number
5. **Niche visual worlds** — cooking feels like cooking, finance feels like finance
6. **AI Progress Reports with Score** — personalized score out of 10, not just raw stats
7. **AI milestone celebration messages** — personal from coach on every milestone
8. **Multi-AI failover engine** — Groq → Mistral → Anthropic; users never see downtime
9. **1-day to 1-year durations** — 9 options; most apps lock to fixed lengths
10. **Client-side video reel compilation** — FFmpeg.wasm on device, zero server cost, maximum viral potential

### HIGH PRIORITY FEATURES TO BUILD (from competitive analysis)
These are gaps vs competitors that must be implemented:

| # | Feature | Inspired By | Priority |
|---|---|---|---|
| 01 | **Streak system** with daily counter + consequences | Duolingo | HIGH |
| 02 | **Badge / Achievement system** | Habitica + Duolingo | HIGH |
| 03 | **Proactive AI nudges** (2-day inactivity → personalized message) | Duolingo Owl | HIGH |
| 04 | **Onboarding goal quiz** (5 questions → AI recommendation) | Duolingo placement test | HIGH |
| 05 | **AI difficulty adaptation** (miss 3+ days → easier plan) | Original | HIGH |
| 06 | **Friend / follow system** (same niche, see progress) | Strava | HIGH |
| 07 | **Challenge buddy / accountability partner** | GoJoe | HIGH |
| 08 | **Comments on community posts** | Strava | HIGH |
| 09 | **Shareable progress cards** (Instagram-ready milestone cards) | Duolingo share cards | HIGH |
| 10 | **Analytics dashboard** (completion heatmap, streak history) | Strava | HIGH |
| 11 | **Annual plan billing** (2 months free) | All competitors | HIGH |
| 12 | **Content moderation tools** (flag/report, admin queue) | All competitors | HIGH |
| 13 | **Notification customization** (user picks reminder time) | Duolingo | HIGH |
| 14 | **iOS / Android app** | All competitors | HIGH |

---

## TECH STACK — LOCKED. DO NOT CHANGE.

### Frontend (Web)
- **Framework:** Next.js 14 (App Router) — SEO + SSR + RSC advantage
- **Language:** TypeScript (strict mode, zero `any`)
- **Styling:** Tailwind CSS + Framer Motion
- **UI Components:** Shadcn/ui (base) + custom Lumio design system
- **PWA:** next-pwa (installable on iPhone and Android)
- **Internationalization:** i18next + next-i18next (8 languages from day one)
- **Video Compilation:** FFmpeg.wasm (client-side, zero server cost)
- **Local Storage:** IndexedDB via `idb` library (photos, videos, offline data)
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Fonts:** Syne (display, 700/800), Lora (body, italic), DM Mono (mono)

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Language:** TypeScript (strict mode)
- **Authentication:** Supabase Auth (JWT)
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage (profile pictures only)
- **Real-time:** Supabase Realtime (community feed, notifications)

### AI Engine (Multi-Model Failover)
- **Primary:** Groq API (`llama-3.3-70b-versatile`) — fast, generous free tier
- **Fallback 1:** Mistral API (`mistral-large-latest`)
- **Fallback 2:** Anthropic API (`claude-sonnet-4-20250514`) — final fallback
- **Switch conditions:** Error response OR response takes >8 seconds OR rate limit hit
- **NEVER expose provider names to users** — always brand as "Lumio AI" or "Lumio Coach"

### Payments
- **Processor:** LemonSqueezy (Pakistan-supported, global reach)
- **Model:** Subscriptions (monthly + annual) + Pay-per-pack (photo/video feature)

### Infrastructure
- **Frontend:** Vercel (auto-deploy from GitHub)
- **Backend:** Railway (starts on $5/month credit)
- **Database:** Supabase (free tier to 50,000 users)
- **Domain:** lumio.app (Cloudflare DNS)
- **Push Notifications:** OneSignal (free tier)
- **Error Monitoring:** Sentry (free tier)
- **Analytics:** PostHog (free tier)

### Development
- **IDE:** VS Code + Claude Code extension
- **Version Control:** GitHub
- **Package Manager:** pnpm (faster than npm)
- **Testing:** Vitest (unit) + Playwright (end-to-end)

---

## PROJECT STRUCTURE

```
lumio/
├── AGENT.md                          ← THIS FILE — never delete, never rename
├── CLAUDE.md                         ← Alias / symlink to this file for Claude Code
├── .gitignore
├── .env.example
├── pnpm-workspace.yaml
│
├── apps/
│   └── web/                          ← Next.js 14 frontend
│       ├── app/
│       │   ├── (auth)/               ← Login, register, forgot password
│       │   ├── (marketing)/          ← Landing page, pricing, about, blog
│       │   ├── (app)/                ← Protected app routes
│       │   │   ├── dashboard/        ← Main dashboard (active challenges list)
│       │   │   ├── onboarding/       ← 5-question goal quiz (NEW)
│       │   │   ├── challenges/       ← Challenge browser + creation flow
│       │   │   ├── challenge/[id]/   ← Active challenge (5 tabs)
│       │   │   │   ├── today/
│       │   │   │   ├── report/
│       │   │   │   ├── coach/
│       │   │   │   ├── community/
│       │   │   │   └── journey/
│       │   │   ├── community/        ← Global community feed
│       │   │   ├── profile/          ← Public user profile + badges
│       │   │   ├── points/           ← Points balance, history, redemption
│       │   │   ├── leaderboard/      ← Weekly niche leaderboards (NEW)
│       │   │   ├── buddies/          ← Challenge buddy system (NEW)
│       │   │   ├── analytics/        ← Personal analytics dashboard (NEW)
│       │   │   ├── memory/           ← Photo/video journal
│       │   │   └── settings/         ← Account, notifications, language, plan
│       │   └── (admin)/              ← Admin-only routes
│       │       ├── overview/
│       │       ├── clients/
│       │       ├── broadcast/
│       │       ├── moderation/       ← Content moderation queue (NEW)
│       │       └── revenue/
│       ├── components/
│       │   ├── ui/                   ← Shadcn base
│       │   ├── lumio/                ← Custom Lumio components
│       │   │   ├── Ring.tsx
│       │   │   ├── MoodPanel.tsx
│       │   │   ├── MoodFAB.tsx
│       │   │   ├── LoadingPulse.tsx
│       │   │   ├── MilestonePopup.tsx
│       │   │   ├── StreakBadge.tsx   ← NEW
│       │   │   ├── ProgressCard.tsx  ← NEW (shareable)
│       │   │   ├── BadgeGrid.tsx     ← NEW
│       │   │   └── HeatmapCalendar.tsx ← NEW
│       │   ├── community/
│       │   │   ├── Post.tsx
│       │   │   ├── PostComposer.tsx
│       │   │   └── CommentThread.tsx ← NEW
│       │   └── niche/
│       ├── lib/
│       │   ├── ai/                   ← AI engine with failover
│       │   ├── auth/
│       │   ├── db/                   ← Supabase client
│       │   ├── payments/             ← LemonSqueezy helpers
│       │   ├── video/                ← FFmpeg.wasm
│       │   ├── notifications/        ← OneSignal + proactive nudges
│       │   └── i18n/
│       ├── stores/                   ← Zustand stores
│       ├── hooks/
│       ├── types/
│       └── public/
│           ├── niches/               ← Niche background images (12 folders)
│           ├── badges/               ← Achievement badge SVGs
│           └── locales/              ← Translation JSON (8 languages)
│
├── backend/
│   └── src/
│       ├── index.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── challenges.ts
│       │   ├── ai.ts
│       │   ├── community.ts
│       │   ├── coaches.ts
│       │   ├── points.ts
│       │   ├── payments.ts
│       │   ├── streaks.ts            ← NEW
│       │   ├── buddies.ts            ← NEW
│       │   ├── followers.ts          ← NEW
│       │   ├── badges.ts             ← NEW
│       │   ├── notifications.ts
│       │   ├── memory.ts
│       │   └── admin.ts
│       ├── services/
│       │   ├── ai/
│       │   │   ├── provider.ts       ← Groq → Mistral → Anthropic failover
│       │   │   └── lumio-coach.ts    ← All AI functions
│       │   ├── supersonic.ts         ← Proactive coach engine (Elite)
│       │   ├── nudge-engine.ts       ← Proactive nudges for all users (NEW)
│       │   ├── streak-engine.ts      ← Streak calculation + penalties (NEW)
│       │   ├── points-engine.ts      ← Points economy
│       │   ├── badge-engine.ts       ← Badge unlock logic (NEW)
│       │   ├── notifications.ts
│       │   └── moderation.ts         ← Content moderation (NEW)
│       ├── middleware/
│       │   ├── auth.ts
│       │   ├── rate-limit.ts
│       │   ├── plan-gate.ts
│       │   └── error-handler.ts
│       ├── jobs/                     ← Cron jobs
│       │   ├── daily-nudge.ts        ← Runs every 24h
│       │   ├── streak-check.ts       ← Runs at 8pm per timezone
│       │   └── points-reset.ts
│       └── utils/
│           ├── supabase.ts
│           ├── errors.ts
│           ├── validate.ts
│           └── env.ts
│
├── shared/
│   ├── types/
│   │   ├── index.ts                  ← All interfaces
│   │   ├── user.ts
│   │   ├── challenge.ts
│   │   ├── ai.ts
│   │   ├── community.ts
│   │   ├── points.ts                 ← NEW
│   │   └── badges.ts                 ← NEW
│   └── constants/
│       ├── niches.ts
│       ├── durations.ts
│       ├── moods.ts
│       ├── plans.ts
│       ├── points.ts                 ← NEW: all earning/penalty rules
│       └── badges.ts                 ← NEW: all badge definitions
│
└── docs/
    ├── CURRENT_PHASE.md
    ├── DEPLOY.md
    ├── database-schema.sql
    └── phase-prompts/                ← All 32 phase prompts (this file)
```

---

## DATABASE SCHEMA — COMPLETE

```sql
-- ─── USERS ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  name            text NOT NULL,
  avatar_url      text,
  plan            text NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free','starter','pro','elite','custom','enterprise')),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  points          integer NOT NULL DEFAULT 0,
  total_points_earned integer NOT NULL DEFAULT 0,
  selected_mood   text NOT NULL DEFAULT 'gold',
  selected_language text NOT NULL DEFAULT 'en',
  streak_current  integer NOT NULL DEFAULT 0,
  streak_longest  integer NOT NULL DEFAULT 0,
  streak_last_completed_date date,
  ai_queries_today integer NOT NULL DEFAULT 0,
  ai_queries_reset_at timestamptz,
  device_token    text,
  notification_time time DEFAULT '20:00',
  is_admin        boolean NOT NULL DEFAULT false,
  is_banned       boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── CHALLENGES ───────────────────────────────────────────────────────────
CREATE TABLE challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche_id        text NOT NULL,
  niche_category  text NOT NULL,
  niche_color     text NOT NULL,
  title           text NOT NULL,
  goal            text NOT NULL,
  custom_goal     text,
  duration_days   integer NOT NULL,
  coach_id        text,
  ai_plan         jsonb,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','abandoned','paused')),
  current_day     integer NOT NULL DEFAULT 1,
  completed_days  integer[] NOT NULL DEFAULT '{}',
  streak          integer NOT NULL DEFAULT 0,
  longest_streak  integer NOT NULL DEFAULT 0,
  last_completed_date date,
  start_date      date NOT NULL DEFAULT CURRENT_DATE,
  end_date        date,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── DAILY TASKS (cached per day, not regenerated) ───────────────────────
CREATE TABLE daily_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number      integer NOT NULL,
  task_data       jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','missed','justified')),
  note            text,
  justification   text,
  points_awarded  integer NOT NULL DEFAULT 0,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, day_number)
);

-- ─── MILESTONES ───────────────────────────────────────────────────────────
CREATE TABLE milestones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number      integer NOT NULL,
  label           text NOT NULL,
  ai_message      text,
  unlocked_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── COACHES ──────────────────────────────────────────────────────────────
CREATE TABLE coaches (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  title           text NOT NULL,
  gender          text NOT NULL CHECK (gender IN ('male','female','neutral')),
  niche_id        text NOT NULL,
  personality     text NOT NULL,
  speaking_style  text NOT NULL,
  specialty       text NOT NULL,
  catchphrase     text NOT NULL,
  avatar_url      text NOT NULL,
  is_supersonic   boolean NOT NULL DEFAULT false,
  min_plan        text NOT NULL DEFAULT 'starter'
                    CHECK (min_plan IN ('starter','pro','elite'))
);

-- ─── COACH CONVERSATIONS ──────────────────────────────────────────────────
CREATE TABLE coach_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  coach_id        text REFERENCES coaches(id),
  messages        jsonb NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── COMMUNITY POSTS ──────────────────────────────────────────────────────
CREATE TABLE community_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid REFERENCES challenges(id) ON DELETE SET NULL,
  content         text NOT NULL CHECK (char_length(content) <= 500),
  image_url       text,
  niche_id        text,
  likes_count     integer NOT NULL DEFAULT 0,
  comments_count  integer NOT NULL DEFAULT 0,
  is_flagged      boolean NOT NULL DEFAULT false,
  is_hidden       boolean NOT NULL DEFAULT false,
  flag_count      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── POST LIKES ───────────────────────────────────────────────────────────
CREATE TABLE post_likes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ─── POST COMMENTS ────────────────────────────────────────────────────────
CREATE TABLE post_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         text NOT NULL CHECK (char_length(content) <= 300),
  is_flagged      boolean NOT NULL DEFAULT false,
  is_hidden       boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── FOLLOWERS ────────────────────────────────────────────────────────────
CREATE TABLE user_followers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ─── CHALLENGE BUDDIES ────────────────────────────────────────────────────
CREATE TABLE challenge_buddies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buddy_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','declined')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, buddy_id)
);

-- ─── POINTS TRANSACTIONS ──────────────────────────────────────────────────
CREATE TABLE points_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action          text NOT NULL,
  points          integer NOT NULL,
  description     text,
  reference_id    uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── BADGES ───────────────────────────────────────────────────────────────
CREATE TABLE badges (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  description     text NOT NULL,
  image_url       text NOT NULL,
  condition_type  text NOT NULL,
  condition_value integer NOT NULL DEFAULT 0,
  points_cost     integer NOT NULL DEFAULT 0,
  is_purchasable  boolean NOT NULL DEFAULT false
);

CREATE TABLE user_badges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        text NOT NULL REFERENCES badges(id),
  earned_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title           text NOT NULL,
  message         text NOT NULL,
  data            jsonb,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── PHOTO/VIDEO MEMORY PACKS ─────────────────────────────────────────────
CREATE TABLE memory_packs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  duration_days   integer NOT NULL,
  price_paid      numeric(10,2) NOT NULL,
  payment_id      text,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','expired','cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lemonsqueezy_order_id        text,
  lemonsqueezy_subscription_id text,
  type            text NOT NULL CHECK (type IN ('subscription','memory_pack')),
  plan            text,
  amount          numeric(10,2) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  status          text NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── ADMIN BROADCASTS ─────────────────────────────────────────────────────
CREATE TABLE admin_broadcasts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        uuid NOT NULL REFERENCES users(id),
  title           text NOT NULL,
  message         text NOT NULL,
  tip_data        jsonb,
  target_plan     text NOT NULL DEFAULT 'all',
  sent_count      integer NOT NULL DEFAULT 0,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX idx_challenges_user_id     ON challenges(user_id);
CREATE INDEX idx_challenges_status      ON challenges(status);
CREATE INDEX idx_daily_tasks_challenge  ON daily_tasks(challenge_id, day_number);
CREATE INDEX idx_posts_niche            ON community_posts(niche_id, created_at DESC);
CREATE INDEX idx_posts_user             ON community_posts(user_id);
CREATE INDEX idx_notifications_user     ON notifications(user_id, is_read);
CREATE INDEX idx_points_user            ON points_transactions(user_id, created_at DESC);
CREATE INDEX idx_followers_following    ON user_followers(following_id);
CREATE INDEX idx_followers_follower     ON user_followers(follower_id);
```

---

## BUSINESS RULES — ENFORCED IN CODE

### Plan Gates

```typescript
export const PLAN_LIMITS = {
  free: {
    maxActiveChallenges: 1,
    allowedDurations: [1, 3, 7],      // days only
    aiQueriesPerDay: 0,                // no AI features
    coaches: 0,
    canPostCommunity: false,
    canViewCommunity: true,
    moodModes: 3,                      // gold, ocean, forest
    canUsePhotoVideo: false,
    canRedeemPoints: false,
    maxNichesPerMonth: null,
  },
  starter: {
    maxActiveChallenges: 3,
    allowedDurations: 'all',
    aiQueriesPerDay: 0,                // starter has no AI either
    coaches: 2,                        // 1 male + 1 female per niche
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 5,
    canUsePhotoVideo: true,            // pay-per-pack
    canRedeemPoints: true,
    maxNichesPerMonth: null,
  },
  pro: {
    maxActiveChallenges: 10,
    allowedDurations: 'all',
    aiQueriesPerDay: 5,
    coaches: 4,                        // 2 male + 2 female per niche
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 8,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    maxNichesPerMonth: null,
    streakFreezePerMonth: 1,
  },
  elite: {
    maxActiveChallenges: Infinity,
    allowedDurations: 'all',
    aiQueriesPerDay: Infinity,
    coaches: 5,                        // all 4 + SuperSonic
    canPostCommunity: true,
    canViewCommunity: true,
    moodModes: 10,
    canUsePhotoVideo: true,
    canRedeemPoints: true,
    pointsMultiplier: 2,               // 2x on ALL earnings
    streakFreezePerMonth: 2,
    justificationAllowed: false,       // Elite: no excuses accepted
    superSonicEnabled: true,
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
    pointsMultiplier: 2,
    apiAccess: true,
    whiteLabel: true,
    dedicatedManager: true,
  },
} as const;
```

### Pricing

| Plan | Setup | Monthly | Annual | Notes |
|---|---|---|---|---|
| Free | — | $0 | — | Forever free |
| Starter | — | $5/mo | $39/yr | Save 2 months |
| Pro | — | $9/mo | $69/yr | Save 2 months |
| Elite | — | $19/mo | $149/yr | Save 2 months |
| Custom | $29 one-time | Pay-as-you-go | — | Custom rate card |
| Enterprise | Contact | Custom | Custom | White-label option |

**Competitor comparison banner:** "Fabulous app: $100/year → Lumio Pro: $9/month · Save 70%+"

### Points Economy

```typescript
// EARNING (base rates — Elite earns 2x all of these)
export const POINTS_EARN = {
  COMPLETE_DAILY_TASK:          10,
  COMPLETE_FULL_CHALLENGE:      100,
  STREAK_7_DAY_BONUS:           50,
  STREAK_30_DAY_BONUS:          200,
  STREAK_100_DAY_BONUS:         500,
  POST_IN_COMMUNITY:            5,
  POST_GETS_LIKE:               2,
  REFER_FRIEND:                 150,
  JUSTIFY_MISSED_TASK:          3,     // Starter/Pro only
  COMPLETE_ONBOARDING:          25,    // NEW
  EARN_BADGE:                   20,    // NEW
  BUDDY_CHALLENGE_COMPLETE:     50,    // NEW — both buddies complete
} as const;

// PENALTIES
export const POINTS_PENALTY = {
  MISS_TASK_NO_JUSTIFICATION:   -20,   // Starter/Pro
  MISS_TASK_ELITE:              -40,   // Elite — no justification option
  BREAK_STREAK:                 -10,   // NEW — additional streak break penalty
} as const;

// REDEMPTION
export const POINTS_REDEEM = {
  ONE_MONTH_STARTER:  500,
  ONE_MONTH_PRO:      1500,
  ONE_MONTH_ELITE:    5000,
  UNLOCK_MOOD_THEME:  200,
  UNLOCK_COACH:       300,
  UNLOCK_BADGE:       100,
} as const;
```

### Streak Rules
```
- Streak increments: user completes today's task before midnight their timezone
- Streak resets to 0: user misses a day (no completion by midnight)
- Streak freeze: Pro gets 1/month, Elite gets 2/month — burns automatically if task missed
- Streak at risk: alert sent at 8pm if task not yet completed
- Elite no-excuse rule: justification button is HIDDEN for Elite users
- Streak badge thresholds: 3, 7, 14, 21, 30, 60, 90, 180, 365 days
```

### Badge Definitions (Seed Data)
```typescript
export const BADGE_DEFINITIONS = [
  // First-time badges
  { id: 'first_challenge',  name: 'Pioneer',        condition_type: 'challenges_created', condition_value: 1 },
  { id: 'first_complete',   name: 'Finisher',        condition_type: 'challenges_completed', condition_value: 1 },
  { id: 'first_post',       name: 'Voice',           condition_type: 'posts_created', condition_value: 1 },
  // Streak badges
  { id: 'streak_3',         name: 'Spark',           condition_type: 'streak_days', condition_value: 3 },
  { id: 'streak_7',         name: 'Flame',           condition_type: 'streak_days', condition_value: 7 },
  { id: 'streak_21',        name: 'Habit',           condition_type: 'streak_days', condition_value: 21 },
  { id: 'streak_30',        name: 'Iron Will',       condition_type: 'streak_days', condition_value: 30 },
  { id: 'streak_90',        name: 'Inferno',         condition_type: 'streak_days', condition_value: 90 },
  { id: 'streak_365',       name: 'Legend',          condition_type: 'streak_days', condition_value: 365 },
  // Niche diversity
  { id: 'niche_3',          name: 'Explorer',        condition_type: 'niches_tried', condition_value: 3 },
  { id: 'niche_6',          name: 'Polymath',        condition_type: 'niches_tried', condition_value: 6 },
  // Social
  { id: 'likes_50',         name: 'Inspiring',       condition_type: 'likes_received', condition_value: 50 },
  { id: 'buddy_complete',   name: 'Accountability',  condition_type: 'buddy_challenges', condition_value: 1 },
  // Points
  { id: 'points_1000',      name: 'Earner',          condition_type: 'total_points', condition_value: 1000 },
  { id: 'points_10000',     name: 'Luminary',        condition_type: 'total_points', condition_value: 10000 },
] as const;
```

---

## AI ENGINE — COMPLETE SPECIFICATION

### Multi-AI Failover
```typescript
// Priority order
const AI_PROVIDERS = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    key: process.env.GROQ_API_KEY,
    timeoutMs: 8000,
  },
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    key: process.env.MISTRAL_API_KEY,
    timeoutMs: 12000,
  },
  {
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    key: process.env.ANTHROPIC_API_KEY,
    timeoutMs: 20000,
  },
] as const;
```

### AI Functions — Complete List

**1. generatePlan** — Full AI challenge plan
```
Input:  goal, niche, durationDays, customGoal?, language
Output: { title, tagline, overview, dailyHabits[4], weeklyMilestones[3],
          successMetrics[3], quickWins[3], proTip }
Cache:  Store in challenges.ai_plan — never regenerate
```

**2. generateDailyTask** — Day-specific task
```
Input:  goal, niche, dayNumber, totalDays, completionRate
Output: { dayTitle, mainTask, timeRequired, steps[4], motivationalNote, checkIn }
Cache:  Store in daily_tasks.task_data for 24h — never regenerate same day
Adapt:  If completionRate < 60%, reduce task complexity automatically
```

**3. generateDailyReport** — Progress analysis
```
Input:  goal, niche, dayNumber, totalDays, doneDays, recentNotes
Output: { greeting, scoreOutOf10, progressInsight, motivationalMessage,
          tomorrowPreview, emoji }
Cache:  Never cache — always fresh
```

**4. chatWithCoach** — AI coach conversation
```
Input:  goal, niche, dayNumber, totalDays, doneDays, message, history[last 6]
Output: string (coach reply in user's language)
Context: Uses coach's personality system prompt if coach selected
Limit:  2-3 sentences max per response
```

**5. generateMilestoneMessage** — Celebration message
```
Input:  goal, niche, milestoneLabel, dayNumber, coachPersonality?
Output: string (3 sentences, personal, energizing, coach-voiced)
```

**6. generateCommunityPost** — AI post draft
```
Input:  goal, niche, dayNumber
Output: string (2 sentences, authentic, inspiring, 1st person)
```

**7. generateAdminReport** — Platform health
```
Input:  clients[] with goal/day/duration/status
Output: { overallScore, excellentCount, atRiskCount, keyInsight,
          actions[3], partnerNote }
```

**8. generateBroadcastTip** — Daily tip for all clients
```
Input:  topic? (optional)
Output: { emoji, category, title, tip, actionStep }
```

**9. generateOnboardingRecommendation** — NEW
```
Input:  quizAnswers (lifeArea, goal, timeAvailable, experience, motivationStyle)
Output: { topNiches[3], recommendedDuration, bestCoachType, reasoning }
```

**10. generateNudgeMessage** — NEW (proactive re-engagement)
```
Input:  goal, niche, daysSinceLastLogin, streak, daysUntilEnd
Output: string (1-2 sentences, urgent but warm, personalized)
```

### AI Prompt Templates

**Plan Generation:**
```
System: You are an expert life coach and challenge designer. Return valid JSON only. No markdown.

User: Challenge: {goal}. Niche: {niche}. Duration: {days} days.
{customGoal ? "User's own description: " + customGoal : ""}
Respond in {language}.

JSON: { title, tagline, overview, dailyHabits: [4 strings], 
weeklyMilestones: [{milestone, timeframe} × 3],
successMetrics: [3 strings], quickWins: [3 strings], proTip }
```

**Daily Task:**
```
System: Expert daily challenge coach. Return valid JSON only.

User: Goal: {goal}. Niche: {niche}. Day: {day}/{totalDays}.
Completion rate: {completionRate}%.
{completionRate < 60 ? "User is struggling — make today's task simpler and more achievable." : ""}
Respond in {language}.

JSON: { dayTitle, mainTask, timeRequired, steps: [4 strings], 
motivationalNote, checkIn }
```

**Coach Chat:**
```
System: You are {coachName || "Lumio Coach"}, an expert AI coach for a {totalDays}-day
"{goal}" ({niche}) challenge. Day {day}, {done} completed.
{coachPersonality ? coachPersonality : "Be warm, specific, practical."}
Keep responses to 2-3 sentences. Never say "As an AI".
You are their personal coach. Respond in {language}.

Previous conversation:
{history}

User: {message}
```

**Progress Report:**
```
System: Expert progress coach. Return valid JSON only.

User: Goal: {goal}. Niche: {niche}. Day: {day}/{totalDays}.
Completed: {done} days. Notes: {notes || "none"}.
Respond in {language}.

JSON: { greeting, scoreOutOf10: number, progressInsight, 
motivationalMessage, tomorrowPreview, emoji }
```

**Onboarding Quiz Recommendation:**
```
System: Life purpose and goal discovery coach. Return valid JSON only.

User: User answers:
- Primary life area they want to improve: {lifeArea}
- Their specific goal in one sentence: {goal}
- Time available per day: {timeAvailable}
- Current experience level: {experience}
- What motivates them: {motivationStyle}
Respond in {language}.

JSON: { topNiches: [{niche, reason} × 3], recommendedDuration: {days, label, reason},
bestCoachType: string, whyThisMatters: string }
```

---

## COACHES — COMPLETE SPECIFICATION

### Structure Per Niche (12 niches × 5 coaches = 60 coaches total)
- 2 female coaches (Starter+, Pro+)
- 2 male coaches (Starter+, Pro+)
- 1 SuperSonic AI coach (gender-neutral, Elite only)

### Coach Personas — Finance Niche (Example)
```
Coach 1 (Female, Starter+): "Sarah Chen"
  Title: CFO & Wealth Strategist
  Personality: Sharp, data-driven, no-nonsense
  Style: Formal, uses financial metaphors
  Specialty: Investment and wealth building
  Catchphrase: "Your money works harder when your mind works smarter."

Coach 2 (Male, Starter+): "Marcus Williams"
  Title: Serial Entrepreneur & Investor
  Personality: Bold, motivating, risk-taker
  Style: Casual, story-based, energetic
  Specialty: Business and entrepreneurship
  Catchphrase: "Every dollar is a soldier. Deploy them wisely."

Coach 3 (Female, Pro+): "Priya Sharma"
  Title: Financial Therapist & Mindset Coach
  Personality: Warm, empathetic, holistic
  Style: Conversational, psychology-based
  Specialty: Money mindset and debt freedom
  Catchphrase: "Financial freedom starts between your ears."

Coach 4 (Male, Pro+): "James O'Brien"
  Title: Retired Fund Manager & Mentor
  Personality: Wise, patient, methodical
  Style: Teaching-style, detailed explanations
  Specialty: Long-term investing and retirement
  Catchphrase: "Slow money beats fast money every time."

Coach 5 (SuperSonic AI, Elite only): "APEX"
  Title: Your Relentless Financial Accountability Engine
  Personality: Intense, uncompromising, hyper-personalized
  Style: Direct, urgent, data-backed — no excuses tolerated
  Specialty: Everything — adapts to user's specific situation
  Catchphrase: "Excuses don't compound. Money does."
  Proactive: Messages without being asked; daily check-ins
```

### SuperSonic Coach Engine (Elite Only)
```
Runs: Cron job every 24 hours
Triggers message if ANY of:
  - User has not logged in for 24+ hours
  - User missed a task yesterday (intervention message)
  - User completed a task today (celebration same day)
  - User is on milestone day (day 1, 7, 14, 21, 30)
  - User streak at risk (logged in but task not done by 8pm)
  - User on final week of challenge (urgency messages)

Message delivery: Push notification + in-app notification
Tone: Urgent, personal, impossible to ignore
Frequency cap: Max 2 messages per day per user
```

### Proactive Nudge Engine (ALL Users — not just Elite)
```
Triggers (softer than SuperSonic):
  - No login for 2 days → gentle personalized reminder
  - Streak at risk (8pm, task not done) → "Don't break your streak!" alert
  - New week starts → "Week X begins today" motivational message
  - Challenge 50% complete → milestone message

Delivery: Push notification only
Tone: Warm, encouraging (not urgent/demanding)
Frequency cap: Max 1 nudge per day per user
```

---

## MOOD SYSTEM — 8 THEMES

Each mood changes: background color, border colors, accent colors, gradient, text colors, orb colors for ambient effects, and animation style.

```typescript
export const MOODS = [
  {
    id: "gold", emoji: "✨", name: "Gold", label: "Ambitious",
    bg: "#080706", bg2: "#100e0a", bg3: "#181510", bg4: "#201c14",
    border: "#2a2418", border2: "#362e1e",
    accent: "#f59e0b", accent2: "#fbbf24",
    soft: "rgba(245,158,11,0.12)",
    text: "#fdfaf3", text2: "#a09060", text3: "#504830",
    g: "linear-gradient(135deg,#f59e0b,#fbbf24)",
    o1: "#f59e0b", o2: "#f97316",
    animStyle: "sharp",
  },
  {
    id: "fire", emoji: "🔥", name: "Fire", label: "Intense",
    bg: "#0a0604", bg2: "#120a06", bg3: "#1c1008", bg4: "#26160a",
    border: "#2e1a0c", border2: "#3d2210",
    accent: "#f97316", accent2: "#fb923c",
    soft: "rgba(249,115,22,0.12)",
    text: "#fef3ec", text2: "#c08060", text3: "#6b4030",
    g: "linear-gradient(135deg,#f97316,#fb923c)",
    o1: "#f97316", o2: "#ef4444",
    animStyle: "explosive",
  },
  {
    id: "ocean", emoji: "🌊", name: "Ocean", label: "Focused",
    bg: "#03080f", bg2: "#050e18", bg3: "#081420", bg4: "#0b1c2e",
    border: "#0d2540", border2: "#0f3055",
    accent: "#0ea5e9", accent2: "#38bdf8",
    soft: "rgba(14,165,233,0.12)",
    text: "#ecf6ff", text2: "#6090b0", text3: "#2a4a60",
    g: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
    o1: "#0ea5e9", o2: "#6366f1",
    animStyle: "fluid",
  },
  {
    id: "forest", emoji: "🌿", name: "Forest", label: "Grounded",
    bg: "#030a05", bg2: "#060f08", bg3: "#0a160c", bg4: "#0e1e10",
    border: "#122514", border2: "#173018",
    accent: "#22c55e", accent2: "#4ade80",
    soft: "rgba(34,197,94,0.12)",
    text: "#edfbf2", text2: "#60a070", text3: "#2a5030",
    g: "linear-gradient(135deg,#22c55e,#4ade80)",
    o1: "#22c55e", o2: "#14b8a6",
    animStyle: "organic",
  },
  {
    id: "violet", emoji: "🔮", name: "Violet", label: "Creative",
    bg: "#070509", bg2: "#0d0812", bg3: "#140d1c", bg4: "#1a1126",
    border: "#211530", border2: "#2c1c40",
    accent: "#a855f7", accent2: "#c084fc",
    soft: "rgba(168,85,247,0.12)",
    text: "#f5f0ff", text2: "#9070c0", text3: "#4a3060",
    g: "linear-gradient(135deg,#a855f7,#c084fc)",
    o1: "#a855f7", o2: "#ec4899",
    animStyle: "expressive",
  },
  {
    id: "rose", emoji: "🌸", name: "Rose", label: "Nurturing",
    bg: "#090507", bg2: "#130810", bg3: "#1c0c18", bg4: "#261020",
    border: "#301428", border2: "#3e1a34",
    accent: "#f43f8e", accent2: "#fb7bb8",
    soft: "rgba(244,63,142,0.12)",
    text: "#fff0f8", text2: "#b06090", text3: "#603050",
    g: "linear-gradient(135deg,#f43f8e,#fb7bb8)",
    o1: "#f43f8e", o2: "#f97316",
    animStyle: "gentle",
  },
  {
    id: "ice", emoji: "❄️", name: "Ice", label: "Precise",
    bg: "#050708", bg2: "#080c0f", bg3: "#0c1218", bg4: "#101820",
    border: "#141e28", border2: "#1a2834",
    accent: "#67e8f9", accent2: "#a5f3fc",
    soft: "rgba(103,232,249,0.1)",
    text: "#f0fbff", text2: "#6090a0", text3: "#2a4050",
    g: "linear-gradient(135deg,#67e8f9,#a5f3fc)",
    o1: "#67e8f9", o2: "#818cf8",
    animStyle: "precise",
  },
  {
    id: "midnight", emoji: "🌙", name: "Midnight", label: "Mysterious",
    bg: "#020204", bg2: "#060608", bg3: "#0c0c12", bg4: "#101018",
    border: "#16161e", border2: "#1e1e2a",
    accent: "#818cf8", accent2: "#a5b4fc",
    soft: "rgba(129,140,248,0.12)",
    text: "#f0f0ff", text2: "#7070a0", text3: "#383850",
    g: "linear-gradient(135deg,#818cf8,#a5b4fc)",
    o1: "#818cf8", o2: "#c084fc",
    animStyle: "mysterious",
  },
] as const;
```

**Plan-gated mood access:**
- Free: gold, ocean, forest (3 moods)
- Starter: + fire, violet (5 moods)
- Pro: all 8 moods
- Elite: all 8 + future seasonal themes

---

## NICHE VISUAL SYSTEM

Each niche has its own complete visual identity applied to the challenge screen:

```
FINANCE:   Navy #0D1B2A + Gold #FFD700. Clean office / city skyline backgrounds.
COOKING:   Orange #FF6B35 + Cream #FFF8F0. Food photography inspired, warm.
FITNESS:   Electric #00D4FF + Black #0A0A0A + Neon #39FF14. Motion blur athletes.
LEARNING:  Deep Green #1B4332 + Leather Brown. Libraries, books, whiteboards.
BUSINESS:  Power Red #CC0000 + Slate #708090. Meeting rooms, pitch decks.
MENTAL:    Soft Pink #FFB5C8 + Sky Blue #87CEEB. Nature, meditation spaces.
PARENTING: Warm Yellow #FFE066 + Soft Pink. Children, family, playgrounds.
CREATIVE:  Shifting rainbow gradients. Paint splashes, studio lights.
ECO LIFE:  Forest Green #228B22 + Natural White. Nature, plants, outdoors.
PRODUCTIV: Pure White + Charcoal #2D3748. Minimal desk, clean lists.
SPIRITUAL: Indigo #4B0082 + Soft Gold #FFE5A0. Candles, lotus, mountains.
RELATIONS: Warm Rose #FF6B8A + Burgundy #722F37. Coffee shops, sunsets.
```

---

## NICHES — COMPLETE LIST

```typescript
export const NICHES = [
  { icon:"💰", label:"Finance",       color:"#fbbf24",
    items:["Save Money","Invest Smart","Debt Free","Budget Mastery","Financial Freedom","Side Income","Real Estate Basics","Crypto Basics"] },
  { icon:"🍳", label:"Cooking",       color:"#fb923c",
    items:["Learn Cooking","Meal Prep","Baking","Healthy Eating","Plant-Based","World Cuisines","Zero Waste Cooking","Home Brewing"] },
  { icon:"💪", label:"Fitness",       color:"#34d399",
    items:["Morning Workout","Weight Loss","Muscle Building","Yoga & Flexibility","Running Journey","Home Gym","Sports Training","Posture Fix"] },
  { icon:"📚", label:"Learning",      color:"#60a5fa",
    items:["Learn a Language","Speed Reading","Memory Training","Critical Thinking","Math Skills","Writing Mastery","Public Speaking","Research Skills"] },
  { icon:"💼", label:"Business",      color:"#a78bfa",
    items:["Start a Business","Personal Branding","Networking","Leadership Skills","Sales Mastery","Product Launch","Remote Work","Career Switch"] },
  { icon:"🧠", label:"Mental Health", color:"#f472b6",
    items:["Stress Management","Anxiety Relief","Mindfulness","Journaling","Sleep Optimization","Self-Compassion","Digital Detox","Emotional Balance"] },
  { icon:"👶", label:"Parenting",     color:"#4ade80",
    items:["Mindful Parenting","Read with Kids","Screen Time Balance","Positive Discipline","Family Bonding","Kids Nutrition","Homework Habits","Emotional IQ"] },
  { icon:"🎨", label:"Creative",      color:"#f87171",
    items:["Learn Drawing","Photography","Music Instrument","Creative Writing","Graphic Design","Pottery & Crafts","Digital Art","Filmmaking"] },
  { icon:"🌱", label:"Eco Life",      color:"#86efac",
    items:["Zero Waste Life","Go Vegan","Eco-Friendly Home","Gardening","Minimalism","Upcycling","Green Business","Carbon Footprint"] },
  { icon:"⚙️", label:"Productivity", color:"#fde047",
    items:["Deep Work","Morning Routine","Task Management","Focus Training","No Procrastination","Goal Setting","Time Blocking","Inbox Zero"] },
  { icon:"🧘", label:"Spirituality",  color:"#c4b5fd",
    items:["Meditation Practice","Gratitude Journal","Manifestation","Spiritual Reading","Prayer Routine","Vision Board","Inner Peace","Energy Work"] },
  { icon:"🤝", label:"Relationships", color:"#fdba74",
    items:["Better Communication","Date Night Ideas","Build Friendships","Family Reconnect","Conflict Resolution","Social Skills","Empathy Practice","Community Service"] },
] as const;
```

---

## DURATIONS + MILESTONE MAP

```typescript
export const DURATIONS = [
  { label:"1 Day",    days:1,   free:true,  emoji:"⚡", desc:"Quick win" },
  { label:"3 Days",   days:3,   free:true,  emoji:"🔥", desc:"Mini sprint" },
  { label:"7 Days",   days:7,   free:true,  emoji:"✨", desc:"One week" },
  { label:"15 Days",  days:15,  free:false, emoji:"🌙", desc:"Half month" },
  { label:"21 Days",  days:21,  free:false, emoji:"💎", desc:"Habit former" },
  { label:"30 Days",  days:30,  free:false, emoji:"🏆", desc:"Full month" },
  { label:"90 Days",  days:90,  free:false, emoji:"🚀", desc:"Life quarter" },
  { label:"6 Months", days:180, free:false, emoji:"🌟", desc:"Deep change" },
  { label:"1 Year",   days:365, free:false, emoji:"👑", desc:"Life changer" },
] as const;

export const MILESTONE_MAP: Record<number, { d: number; l: string }[]> = {
  1:   [{ d:1,   l:"Done! 🏆" }],
  3:   [{ d:1,   l:"Start" }, { d:2, l:"Day 2" }, { d:3, l:"Done! 🏆" }],
  7:   [{ d:1,   l:"Start" }, { d:3, l:"Day 3" }, { d:5, l:"Day 5" }, { d:7, l:"Week! 🏆" }],
  15:  [{ d:1,   l:"Start" }, { d:3, l:"3 Days" }, { d:7, l:"Week 1" }, { d:10, l:"Day 10" }, { d:15, l:"Done! 🏆" }],
  21:  [{ d:1,   l:"Start" }, { d:7, l:"Week 1" }, { d:14, l:"Week 2" }, { d:21, l:"Habit! 🏆" }],
  30:  [{ d:1,   l:"Start" }, { d:7, l:"Week 1" }, { d:14, l:"2 Wks" }, { d:21, l:"3 Wks" }, { d:30, l:"Month! 🏆" }],
  90:  [{ d:1,   l:"Start" }, { d:30, l:"Month 1" }, { d:60, l:"Month 2" }, { d:90, l:"Quarter! 🏆" }],
  180: [{ d:1,   l:"Start" }, { d:30, l:"M1" }, { d:60, l:"M2" }, { d:90, l:"M3" }, { d:120, l:"M4" }, { d:150, l:"M5" }, { d:180, l:"6mo! 🏆" }],
  365: [{ d:1,   l:"Start" }, { d:90, l:"Q1" }, { d:180, l:"Half" }, { d:270, l:"Q3" }, { d:365, l:"1yr! 👑" }],
} as const;
```

---

## LANGUAGES — 8 AT LAUNCH

```
1. English (en) — default
2. Arabic (ar) — RTL layout required (html dir="rtl")
3. Urdu (ur) — RTL layout required
4. Hindi (hi)
5. Spanish (es)
6. French (fr)
7. Turkish (tr)
8. Indonesian (id)
```

All AI responses generated in user's selected language. Coaches translated. Browser language auto-detected on first visit.

---

## PHOTO/VIDEO MEMORY SYSTEM

```
PACK PRICING:
  3-day:   FREE
  7-day:   $2
  15-day:  $3
  30-day:  $5
  90-day:  $10
  365-day: $25

HOW IT WORKS:
  1. User purchases pack for their challenge duration
  2. Each day: up to 3 photos + up to 3 videos (max 10s each)
  3. All media stored in IndexedDB on device — ZERO server cost
  4. User clicks "Create My Story Reel"
  5. FFmpeg.wasm compiles on-device → MP4 H.264 1080×1920 (story format)
  6. Lumio branded intro (3s) + outro (3s with "Challenge completed on Lumio")
  7. User selects background music (5 options)
  8. Lumio watermark bottom-right on every frame
  9. User downloads + shares → Lumio logo on every viral share

TECH:
  - @ffmpeg/ffmpeg (WebAssembly, browser-native)
  - idb (IndexedDB wrapper)
  - Storage warning at 1.5GB used
  - Option to delete older days' media
```

---

## API RESPONSE FORMAT — ENFORCED EVERYWHERE

```typescript
// Every single API response MUST use this exact shape:

// Success
{ data: T, error: null, message: string }

// Error
{ data: null, error: string, message: string }
```

---

## CODING STANDARDS

### TypeScript Rules
- Zero `any` — use `unknown` and narrow
- Every function has explicit return type
- Every interface in `shared/types/`
- Strict mode enabled in all tsconfigs
- No implicit `any` in function parameters

### AI Rules — CRITICAL
- ALL AI calls go through `backend/src/services/ai/lumio-coach.ts`
- NEVER call AI APIs directly from routes or controllers
- NEVER expose provider names (Groq, Mistral, Anthropic) to users
- ALWAYS brand as "Lumio Coach" or "Lumio AI"
- NEVER say "As an AI language model..."
- ALWAYS have a fallback if AI call fails — return graceful defaults
- Sanitize user input before sending to AI: trim, max 500 chars, strip HTML

### Security Rules — CRITICAL
- NEVER put API keys in code — always `process.env.VAR_NAME`
- NEVER commit `.env` — it's in `.gitignore`
- ALL routes except `/auth/*` and public GETs require auth middleware
- Admin routes MUST check `req.user.is_admin === true`
- Users can ONLY access their own data — check `userId` on every query
- Validate ALL request bodies with Zod before processing
- Sanitize ALL user text before sending to AI or storing

### Database Rules
- ALL database calls use Supabase client from `utils/supabase.ts`
- NEVER write raw SQL — use Supabase query builder
- ALWAYS verify resource belongs to requesting user before returning
- Row Level Security enabled on every table

### Error Handling
- EVERY async function wrapped in try/catch
- Caught errors use `LumioError` from `utils/errors.ts`
- Return user-friendly messages, never stack traces in production
- AI failures return graceful defaults, never hard errors

---

## ENVIRONMENT VARIABLES

### Backend (.env)
```
PORT=3000
NODE_ENV=production
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
JWT_SECRET=                    # min 32 chars
GROQ_API_KEY=
MISTRAL_API_KEY=
ANTHROPIC_API_KEY=
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_STORE_ID=
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
FRONTEND_URL=https://lumio.app
SENTRY_DSN=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://lumio-api.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_ONESIGNAL_APP_ID=
```

---

## 32 BUILD PHASES — OVERVIEW TABLE

| Phase | Name | Duration | Key Deliverable |
|---|---|---|---|
| 1 | Project Foundation | 2h | Monorepo, shared types, constants |
| 2 | Database Schema | 2h | All 18 tables + RLS + seed data |
| 3 | Auth System | 2h | Register/login/JWT/session |
| 4 | AI Engine Core | 3h | Multi-AI failover + all 10 AI functions |
| 5 | Challenge Creation Engine | 4h | Niche → duration → plan → database |
| 6 | Daily Task + Streak System | 3h | Tasks, completion, streaks, penalties |
| 7 | Points Engine | 2h | Full economy with Elite 2x |
| 8 | Badge + Achievement System | 2h | All badges, unlock logic, notifications |
| 9 | Coach Chat System | 3h | Personas, conversation, plan-gating |
| 10 | SuperSonic + Proactive Nudges | 3h | Elite proactive + all-user nudges |
| 11 | Progress Reports + Milestones | 2h | Reports, celebrations, shareable cards |
| 12 | Community Feed + Comments | 3h | Posts, likes, comments, moderation |
| 13 | Friend / Follow + Buddies | 3h | Follow system + accountability pairs |
| 14 | Analytics Dashboard | 2h | Heatmap, charts, streak history |
| 15 | Notification System | 2h | Push + in-app + preferences |
| 16 | Photo/Video Memory System | 4h | Capture, IndexedDB, FFmpeg reel |
| 17 | LemonSqueezy Payments | 3h | Subscriptions + annual + memory packs |
| 18 | Mood Theme System (Web) | 3h | All 8 moods, plan-gating, transitions |
| 19 | Niche Visual System (Web) | 2h | 12 niche themes on challenge screen |
| 20 | Onboarding Flow | 2h | 5-question quiz + AI recommendation |
| 21 | Web Challenge App (All Tabs) | 5h | 5-tab challenge experience |
| 22 | Web Dashboard + Community | 3h | Dashboard, global feed, profile |
| 23 | Web Leaderboards + Points UI | 2h | Leaderboards, points history, redemption |
| 24 | Admin Dashboard | 3h | Clients, broadcast, moderation, revenue |
| 25 | Landing Page + Marketing | 3h | SEO-optimized public site |
| 26 | PWA Configuration | 2h | Manifest, service worker, offline |
| 27 | i18n + RTL Support | 3h | All 8 languages, Arabic/Urdu RTL |
| 28 | Performance Optimization | 2h | Core Web Vitals, lazy loading, caching |
| 29 | Security Hardening | 2h | Full security audit + rate limiting |
| 30 | Error Monitoring + Logging | 1h | Sentry, error boundaries, logging |
| 31 | Testing Suite | 3h | Unit tests (Vitest) + E2E (Playwright) |
| 32 | Deployment + Go Live | 2h | Railway + Vercel + custom domain |

**Total: ~80 hours of focused build time**

---

## FINAL TESTING CHECKLIST

```
FREE USER FLOW:
□ Register → onboarding quiz → AI recommendation displayed
□ Create 1 challenge (free) → AI plan generated
□ Complete day 1 → +10 points, streak increments
□ Try to access day 4+ duration → upgrade prompt shown
□ Try to create 2nd challenge → upgrade prompt
□ View community → cannot post (upgrade prompt)
□ Access mood selector → only 3 moods available
□ Miss task → -20 points, streak resets

STARTER USER FLOW:
□ All free features +
□ 3 simultaneous challenges work
□ 30-day max duration confirmed
□ 2 coaches available per niche (1M + 1F)
□ Community posting works
□ Justify missed task → +3 points
□ 5 mood modes available
□ Photo/video pack purchasable

PRO USER FLOW:
□ All starter features +
□ 10 simultaneous challenges
□ 90-day max duration
□ 4 coaches available per niche
□ AI daily reports generate (5/day limit)
□ AI coach chat works (5/day limit)
□ 8 mood modes all available
□ Streak freeze (1/month) works
□ Friend follow works, buddy system works
□ Annual plan available at checkout

ELITE USER FLOW:
□ All pro features +
□ Unlimited challenges, 365-day duration
□ All 5 coaches including SuperSonic
□ All 10 mood modes
□ Miss task → justification button NOT visible → -40 points
□ SuperSonic sends message after 24h inactivity
□ 2x points confirmed on all earning actions
□ 2 streak freezes/month

SOCIAL FEATURES:
□ Follow a user → see their posts in following feed
□ Send buddy invite → accept → both see each other's progress
□ Post in community → shows in feed → like → count updates realtime
□ Comment on post → comment appears → other user notified
□ Share milestone card → card generates with niche theme + Lumio brand

ANALYTICS:
□ Completion heatmap shows all completed days (GitHub-style green dots)
□ Streak history chart accurate
□ Points history chart accurate
□ Badge collection shows earned badges

PAYMENT FLOWS:
□ Subscribe to each plan → features unlock immediately
□ Annual billing applied correctly (2 months discount)
□ Cancel → features remain until period end → then locked
□ Memory pack purchase → capture works → reel compiles
□ LemonSqueezy webhook fires and updates plan in database

ADMIN:
□ View all users, change plan, ban user
□ Flagged content queue shows flagged posts
□ Hide post → removed from feed for all users
□ Generate broadcast → preview → send → all users notified
□ AI platform health report generates

MULTILINGUAL:
□ Arabic: RTL layout correct, text right-aligned, AI responds in Arabic
□ Urdu: RTL layout correct, AI responds in Urdu
□ Spanish: all UI strings translated, AI coach responds in Spanish
□ All 8 languages verified with native text

PERFORMANCE:
□ Lighthouse 90+ on landing page
□ Lighthouse 85+ on app pages
□ PWA installs on iPhone (Add to Home Screen)
□ PWA installs on Android
□ Offline mode: today's task visible without internet
□ AI response under 8 seconds (including fallback)

SECURITY:
□ User A cannot access User B's challenges (verified with test accounts)
□ Admin routes return 403 for non-admin users
□ Rate limiting triggers at 100 req/min per IP
□ CORS blocks requests from non-lumio.app domains
□ No API keys visible in client-side code or network tab
□ All inputs validated and sanitized
```

---

*AGENT.md v2.0 — Complete, Synthesized, Build-Ready*
*Stack: Next.js 14 + Node.js + Supabase + LemonSqueezy + Groq/Mistral/Anthropic*
*32 Phases · 8 Languages · 12 Niches · 60 Coaches · 8 Mood Themes*
*Built by: You + Claude Code · Lumio — Illuminate Your Growth*
