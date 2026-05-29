# Lumio — Merge Checklist
## Every file created across all 29 phases
### Use this to verify your repository is complete before going live

**Legend:**
- 🔑 = Needs real API key / secret value filled in
- 🗄️ = SQL file — must be run in Supabase SQL editor
- 📦 = npm/pnpm package that must be installed
- ✏️ = Contains a placeholder URL or ID that needs updating
- ✅ = Code only — no action needed beyond copying

---

## STEP 0 — Before anything else

### Install pnpm globally
```bash
npm install -g pnpm
```

### Clone and bootstrap
```bash
git clone https://github.com/your-org/lumio.git
cd lumio
pnpm install   # installs all workspaces
```

---

## STEP 1 — Environment Variables

### 📄 `.env.example` (root) → copy to `backend/.env` and fill in all values

```env
# ── Backend ────────────────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development

# Supabase 🔑
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...           # Service role key — never expose to frontend

# Auth 🔑
JWT_SECRET=minimum-32-character-random-string-here

# AI Providers 🔑
GROQ_API_KEY=gsk_...
MISTRAL_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...

# Payments 🔑
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STORE_ID=12345           # Your LemonSqueezy store numeric ID

# Push Notifications 🔑
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...

# URLs ✏️
FRONTEND_URL=https://lumio.app        # http://localhost:3000 for dev

# Monitoring 🔑
SENTRY_DSN=https://...@sentry.io/...
```

### 📄 `apps/web/.env.local` → create from this template

```env
# Frontend
NEXT_PUBLIC_API_URL=https://lumio-api.up.railway.app   # ✏️ http://localhost:3001 for dev
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co   # 🔑
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                        # 🔑 (anon key only — NOT service key)
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=12345                     # ✏️
NEXT_PUBLIC_POSTHOG_KEY=phc_...                             # 🔑
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...            # 🔑
NEXT_PUBLIC_ONESIGNAL_APP_ID=...                            # 🔑
```

---

## STEP 2 — Database Setup (Supabase)

Run these SQL files **in order** in your Supabase SQL editor:

| Order | File | Description |
|---|---|---|
| 1 | 🗄️ `docs/sql/01_schema.sql` | All 18 tables + constraints + indexes |
| 2 | 🗄️ `docs/sql/02_rls.sql` | Row Level Security policies for every table |
| 3 | 🗄️ `docs/sql/03_functions.sql` | Postgres functions (streak calc, points update) |
| 4 | 🗄️ `docs/sql/04_triggers.sql` | Auto-update `updated_at`, cascade operations |
| 5 | 🗄️ `docs/sql/05_seed_coaches.sql` | All 60 coaches (12 niches × 5 coaches) |
| 6 | 🗄️ `docs/sql/06_seed_badges.sql` | All 15 badge definitions |

### Tables created by `01_schema.sql`
- `users`
- `challenges`
- `daily_tasks`
- `milestones`
- `coaches`
- `coach_conversations`
- `community_posts`
- `post_likes`
- `post_comments`
- `notifications`
- `points_transactions`
- `badges` (definitions)
- `user_badges` (earned)
- `followers`
- `buddy_relationships`
- `buddy_invites`
- `memory_packs`
- `payment_events`

### Enable Realtime in Supabase dashboard
Navigate to: Database → Replication → enable for:
- `community_posts`
- `notifications`
- `post_likes`
- `post_comments`

### Enable Storage in Supabase dashboard
Create bucket: `avatars` (public read, authenticated write)

---

## STEP 3 — npm Packages to Install

### Root workspace
```bash
pnpm add -w typescript @types/node
```

### Backend (`cd backend && pnpm add ...`)

| Package | Purpose | 📦 |
|---|---|---|
| `express` | HTTP server | 📦 |
| `@types/express` | TypeScript types | 📦 |
| `@supabase/supabase-js` | Database + auth client | 📦 |
| `jsonwebtoken` | JWT sign/verify | 📦 |
| `@types/jsonwebtoken` | TypeScript types | 📦 |
| `zod` | Request body validation | 📦 |
| `node-cron` | Cron jobs (nudges, streak check) | 📦 |
| `@types/node-cron` | TypeScript types | 📦 |
| `axios` | HTTP client for AI providers | 📦 |
| `cors` | CORS middleware | 📦 |
| `@types/cors` | TypeScript types | 📦 |
| `helmet` | Security headers | 📦 |
| `express-rate-limit` | Rate limiting | 📦 |
| `dotenv` | Environment variables | 📦 |
| `@sentry/node` | Error monitoring | 📦 |
| `winston` | Logging | 📦 |

```bash
cd backend
pnpm add express @supabase/supabase-js jsonwebtoken zod node-cron axios cors helmet express-rate-limit dotenv @sentry/node winston
pnpm add -D typescript @types/express @types/jsonwebtoken @types/node-cron @types/cors ts-node nodemon
```

### Frontend (`cd apps/web && pnpm add ...`)

| Package | Purpose | 📦 |
|---|---|---|
| `next` | Framework (v14) | 📦 |
| `react` / `react-dom` | UI runtime | 📦 |
| `typescript` | Language | 📦 |
| `tailwindcss` | Styling | 📦 |
| `framer-motion` | Animations | 📦 |
| `zustand` | State management | 📦 |
| `react-hook-form` | Form handling | 📦 |
| `zod` | Form + API validation | 📦 |
| `@hookform/resolvers` | Zod + RHF bridge | 📦 |
| `@supabase/supabase-js` | Realtime subscriptions | 📦 |
| `next-pwa` | PWA support | 📦 |
| `i18next` | Internationalization | 📦 |
| `next-i18next` | Next.js i18n integration | 📦 |
| `react-i18next` | React hooks for i18n | 📦 |
| `idb` | IndexedDB wrapper (memory system) | 📦 |
| `@ffmpeg/ffmpeg` | Video reel compilation | 📦 |
| `@ffmpeg/util` | FFmpeg utilities | 📦 |
| `@sentry/nextjs` | Frontend error monitoring | 📦 |
| `posthog-js` | Analytics | 📦 |
| `react-onesignal` | Push notifications | 📦 |
| `lucide-react` | Icons | 📦 |
| `@radix-ui/react-*` | Shadcn UI primitives | 📦 |
| `class-variance-authority` | Shadcn CVA | 📦 |
| `clsx` + `tailwind-merge` | Class utilities | 📦 |
| `next-themes` | Theme handling | 📦 |
| `date-fns` | Date formatting | 📦 |
| `recharts` | Analytics charts | 📦 |

```bash
cd apps/web
pnpm add next react react-dom framer-motion zustand react-hook-form zod @hookform/resolvers @supabase/supabase-js next-pwa i18next next-i18next react-i18next idb @ffmpeg/ffmpeg @ffmpeg/util @sentry/nextjs posthog-js react-onesignal lucide-react clsx tailwind-merge class-variance-authority next-themes date-fns recharts
pnpm add -D typescript tailwindcss postcss autoprefixer @types/react @types/react-dom @types/node
```

---

## STEP 4 — All Source Files by Folder

### Root
- ✅ `AGENT.md` — master spec document
- ✅ `CLAUDE.md` → symlink to `AGENT.md`
- ✅ `.gitignore`
- ✅ `.env.example` 🔑 (copy to `backend/.env` and `apps/web/.env.local`)
- ✅ `pnpm-workspace.yaml`
- ✅ `tsconfig.base.json`

---

### `shared/`
| File | Phase | Notes |
|---|---|---|
| ✅ `shared/types/index.ts` | 1 | Re-exports all types |
| ✅ `shared/types/user.ts` | 1 | `User`, `PublicProfile`, `AuthData` |
| ✅ `shared/types/challenge.ts` | 1 | `Challenge`, `DailyTask`, `AiPlan`, `Milestone` |
| ✅ `shared/types/ai.ts` | 1 | `DailyReport`, `OnboardingResult`, `BroadcastPreview` |
| ✅ `shared/types/community.ts` | 1 | `CommunityPost`, `PostComment`, `PostLike` |
| ✅ `shared/types/points.ts` | 1 | `PointsTransaction`, `PointsData`, `RedeemType` |
| ✅ `shared/types/badges.ts` | 1 | `Badge`, `BadgeDefinition`, `UserBadge` |
| ✅ `shared/constants/niches.ts` | 1 | `NICHES` array (12 niches) |
| ✅ `shared/constants/durations.ts` | 1 | `DURATIONS` + `MILESTONE_MAP` |
| ✅ `shared/constants/moods.ts` | 1 | `MOODS` array (8 themes) |
| ✅ `shared/constants/plans.ts` | 1 | `PLAN_LIMITS` per plan |
| ✅ `shared/constants/points.ts` | 1 | `POINTS_EARN`, `POINTS_PENALTY`, `POINTS_REDEEM` |
| ✅ `shared/constants/badges.ts` | 1 | `BADGE_DEFINITIONS` (15 badges) |

---

### `backend/src/`
| File | Phase | Notes |
|---|---|---|
| ✅ `backend/src/index.ts` | 1 | Express app entry, middleware setup, route mounting |
| ✅ `backend/tsconfig.json` | 1 | Strict mode enabled |
| ✅ `backend/package.json` | 1 | |

**Routes**
| File | Phase | Key endpoints |
|---|---|---|
| ✅ `backend/src/routes/auth.ts` | 3 | register, login, me, refresh, logout, forgot/reset password |
| ✅ `backend/src/routes/challenges.ts` | 5 | CRUD + complete-day + task + justify-miss + report |
| ✅ `backend/src/routes/ai.ts` | 4 | coach-chat, coaches list, generate-post |
| ✅ `backend/src/routes/community.ts` | 12 | posts CRUD + like + flag + comments |
| ✅ `backend/src/routes/coaches.ts` | 9 | list by niche (plan-gated) |
| ✅ `backend/src/routes/points.ts` | 7 | balance + history + redeem |
| ✅ `backend/src/routes/payments.ts` | 17 | subscribe + cancel + portal + webhook |
| ✅ `backend/src/routes/streaks.ts` | 6 | get + freeze |
| ✅ `backend/src/routes/buddies.ts` | 13 | list + invite + accept + delete |
| ✅ `backend/src/routes/followers.ts` | 13 | following + followers + toggle follow |
| ✅ `backend/src/routes/badges.ts` | 8 | earned + available |
| ✅ `backend/src/routes/notifications.ts` | 15 | list + mark-read + preferences |
| ✅ `backend/src/routes/memory.ts` | 16 | get pack + purchase |
| ✅ `backend/src/routes/analytics.ts` | 14 | heatmap + points-history |
| ✅ `backend/src/routes/leaderboard.ts` | 23 | get leaderboard |
| ✅ `backend/src/routes/admin.ts` | 19/24 | report + stats + clients + broadcast + moderation + revenue |
| ✅ `backend/src/routes/users.ts` | 3 | me + update + public profile + complete-onboarding |

**Services**
| File | Phase | Notes |
|---|---|---|
| ✅ `backend/src/services/ai/provider.ts` | 4 | Groq → Mistral → Anthropic failover engine |
| ✅ `backend/src/services/ai/lumio-coach.ts` | 4 | All 10 AI functions |
| ✅ `backend/src/services/supersonic.ts` | 10 | Elite proactive coach engine |
| ✅ `backend/src/services/nudge-engine.ts` | 10 | All-user proactive nudges |
| ✅ `backend/src/services/streak-engine.ts` | 6 | Streak calculation + penalties |
| ✅ `backend/src/services/points-engine.ts` | 7 | Points economy + Elite 2x multiplier |
| ✅ `backend/src/services/badge-engine.ts` | 8 | Badge unlock logic + notification trigger |
| ✅ `backend/src/services/notifications.ts` | 15 | OneSignal push + in-app notification creation |
| ✅ `backend/src/services/moderation.ts` | 12 | Flag processing + auto-hide threshold |

**Middleware**
| File | Phase | Notes |
|---|---|---|
| ✅ `backend/src/middleware/auth.ts` | 3 | JWT verify, attach `req.user` |
| ✅ `backend/src/middleware/rate-limit.ts` | 29 | 100 req/min per IP; stricter on `/ai/*` |
| ✅ `backend/src/middleware/plan-gate.ts` | 5 | Check plan allows the operation |
| ✅ `backend/src/middleware/error-handler.ts` | 1 | Global Express error handler |

**Cron Jobs**
| File | Phase | Schedule |
|---|---|---|
| ✅ `backend/src/jobs/daily-nudge.ts` | 10 | Every 24h — proactive nudge check |
| ✅ `backend/src/jobs/streak-check.ts` | 6 | 8pm per user timezone — streak-at-risk alert |
| ✅ `backend/src/jobs/points-reset.ts` | 7 | Daily midnight — reset `ai_queries_today` |

**Utils**
| File | Phase | Notes |
|---|---|---|
| ✅ `backend/src/utils/supabase.ts` | 1 | Supabase client (service role) |
| ✅ `backend/src/utils/errors.ts` | 1 | `LumioError` class + error codes |
| ✅ `backend/src/utils/validate.ts` | 1 | Zod schema helpers + sanitize function |
| ✅ `backend/src/utils/env.ts` | 1 | Typed env variable access — **all `process.env` goes through here** |

---

### `apps/web/` — Next.js Frontend

**Config files**
| File | Phase | Notes |
|---|---|---|
| ✅ `apps/web/next.config.js` | 1 | PWA config, image domains, i18n |
| ✅ `apps/web/tsconfig.json` | 1 | Strict mode, path aliases |
| ✅ `apps/web/tailwind.config.ts` | 1 | Custom fonts, colors, animations |
| ✅ `apps/web/middleware.ts` | 3 | Route protection + redirect logic |

**Auth routes — `apps/web/app/(auth)/`**
| File | Phase |
|---|---|
| ✅ `(auth)/layout.tsx` | 3 |
| ✅ `(auth)/login/page.tsx` | 3 |
| ✅ `(auth)/register/page.tsx` | 3 |
| ✅ `(auth)/forgot-password/page.tsx` | 3 |
| ✅ `(auth)/reset-password/page.tsx` | 3 |

**Marketing routes — `apps/web/app/(marketing)/`**
| File | Phase |
|---|---|
| ✅ `(marketing)/layout.tsx` | 25 |
| ✅ `(marketing)/page.tsx` | 25 | Landing page |
| ✅ `(marketing)/pricing/page.tsx` | 25 |
| ✅ `(marketing)/about/page.tsx` | 25 |
| ✅ `(marketing)/blog/page.tsx` | 25 |

**App routes — `apps/web/app/(app)/`**
| File | Phase |
|---|---|
| ✅ `(app)/layout.tsx` | 18 | Mood theme wrapper, auth check |
| ✅ `(app)/dashboard/page.tsx` | 22 | Active challenges list |
| ✅ `(app)/onboarding/page.tsx` | 20 | 5-question goal quiz |
| ✅ `(app)/challenges/page.tsx` | 21 | Challenge browser |
| ✅ `(app)/challenges/new/page.tsx` | 21 | Challenge creation flow |
| ✅ `(app)/challenges/[id]/layout.tsx` | 15 | Fixed header, 5-tab nav, MoodFAB |
| ✅ `(app)/challenges/[id]/today/page.tsx` | 15 | Today's task + complete button |
| ✅ `(app)/challenges/[id]/report/page.tsx` | 11 | AI progress report |
| ✅ `(app)/challenges/[id]/coach/page.tsx` | 9 | AI coach chat |
| ✅ `(app)/challenges/[id]/community/page.tsx` | 12 | Niche community feed |
| ✅ `(app)/challenges/[id]/journey/page.tsx` | 15 | Milestone map |
| ✅ `(app)/community/page.tsx` | 22 | Global community feed |
| ✅ `(app)/profile/page.tsx` | 22 | Own profile |
| ✅ `(app)/profile/[id]/page.tsx` | 22 | Public user profile |
| ✅ `(app)/points/page.tsx` | 23 | Points balance + history + redeem |
| ✅ `(app)/leaderboard/page.tsx` | 23 | Weekly niche leaderboards |
| ✅ `(app)/buddies/page.tsx` | 13 | Buddy system |
| ✅ `(app)/analytics/page.tsx` | 14 | Heatmap + charts + badges |
| ✅ `(app)/memory/page.tsx` | 16 | Photo/video journal + reel compiler |
| ✅ `(app)/settings/page.tsx` | 22 | Account, notifications, language, plan |

**Admin routes — `apps/web/app/(admin)/`**
| File | Phase |
|---|---|
| ✅ `(admin)/layout.tsx` | 19 | Auth guard (`is_admin`), sidebar nav |
| ✅ `(admin)/overview/page.tsx` | 19 | Platform health + AI report |
| ✅ `(admin)/clients/page.tsx` | 19 | Client list + detail drawer |
| ✅ `(admin)/broadcast/page.tsx` | 19 | AI broadcast generation + send |
| ✅ `(admin)/moderation/page.tsx` | 19 | Flagged posts + comments queue |
| ✅ `(admin)/revenue/page.tsx` | 19 | Revenue stats + payments table |

**Components — `apps/web/components/`**

*Lumio custom components*
| File | Phase |
|---|---|
| ✅ `components/lumio/Ring.tsx` | 15 | Animated SVG progress ring |
| ✅ `components/lumio/MoodPanel.tsx` | 18 | Mood selector panel |
| ✅ `components/lumio/MoodFAB.tsx` | 18 | Floating mood button |
| ✅ `components/lumio/LoadingPulse.tsx` | 1 | Reusable skeleton loader |
| ✅ `components/lumio/MilestonePopup.tsx` | 15 | Spring-animated milestone celebration |
| ✅ `components/lumio/StreakBadge.tsx` | 6 | Streak counter display |
| ✅ `components/lumio/ProgressCard.tsx` | 11 | Shareable milestone card |
| ✅ `components/lumio/BadgeGrid.tsx` | 8 | Badge collection display |
| ✅ `components/lumio/HeatmapCalendar.tsx` | 14 | GitHub-style completion heatmap |

*Community components*
| File | Phase |
|---|---|
| ✅ `components/community/Post.tsx` | 12 | Post card with like/comment/flag |
| ✅ `components/community/PostComposer.tsx` | 12 | Create post textarea + AI draft |
| ✅ `components/community/CommentThread.tsx` | 12 | Threaded comments |

*Niche components*
| File | Phase |
|---|---|
| ✅ `components/niche/NicheCard.tsx` | 21 | Niche selection card |
| ✅ `components/niche/NicheBackground.tsx` | 19 | Dynamic niche visual |

**Stores — `apps/web/stores/`**
| File | Phase | State managed |
|---|---|---|
| ✅ `stores/authStore.ts` | 3 | `user`, `token`, `isLoading`, login/logout actions |
| ✅ `stores/challengeStore.ts` | 5 | `activeChallenge`, `challenges[]`, load/update actions |
| ✅ `stores/moodStore.ts` | 18 | `selectedMood`, setMood action |
| ✅ `stores/notificationStore.ts` | 15 | `notifications[]`, unread count |
| ✅ `stores/communityStore.ts` | 12 | Posts feed, pagination cursor |

**Hooks — `apps/web/hooks/`**
| File | Phase |
|---|---|
| ✅ `hooks/useAuth.ts` | 3 |
| ✅ `hooks/useChallenge.ts` | 5 |
| ✅ `hooks/useMood.ts` | 18 |
| ✅ `hooks/useRealtime.ts` | 12 | Supabase realtime subscriptions |
| ✅ `hooks/useNotifications.ts` | 15 |

**Lib — `apps/web/lib/`**
| File | Phase |
|---|---|
| ✅ `lib/auth/client.ts` | 3 | Auth helper functions |
| ✅ `lib/db/supabase.ts` | 1 | Supabase browser client (anon key) |
| ✅ `lib/payments/lemonsqueezy.ts` | 17 | LemonSqueezy checkout helpers |
| ✅ `lib/video/reel-compiler.ts` | 16 | FFmpeg.wasm reel compilation |
| ✅ `lib/notifications/onesignal.ts` | 15 | OneSignal init + push helpers |
| ✅ `lib/i18n/config.ts` | 27 | i18next configuration |
| ✅ `lib/i18n/rtl.ts` | 27 | RTL detection for Arabic/Urdu |

**Translations — `apps/web/public/locales/`**
| File | Phase |
|---|---|
| ✅ `public/locales/en/common.json` | 27 |
| ✅ `public/locales/ar/common.json` | 27 | RTL |
| ✅ `public/locales/ur/common.json` | 27 | RTL |
| ✅ `public/locales/hi/common.json` | 27 |
| ✅ `public/locales/es/common.json` | 27 |
| ✅ `public/locales/fr/common.json` | 27 |
| ✅ `public/locales/tr/common.json` | 27 |
| ✅ `public/locales/id/common.json` | 27 |

**PWA files — `apps/web/public/`**
| File | Phase |
|---|---|
| ✅ `public/manifest.json` | 26 | ✏️ Update `name`, `start_url`, `icons` paths |
| ✅ `public/sw.js` | 26 | Service worker (generated by next-pwa) |
| ✅ `public/icons/icon-192.png` | 26 | 🔑 Replace with actual Lumio icon |
| ✅ `public/icons/icon-512.png` | 26 | 🔑 Replace with actual Lumio icon |

---

### `docs/`
| File | Phase | Notes |
|---|---|---|
| ✅ `docs/CURRENT_PHASE.md` | all | Updated each phase |
| ✅ `docs/API_CONTRACT.md` | 29 | This file's companion |
| ✅ `docs/MERGE_CHECKLIST.md` | 29 | This file |
| ✅ `docs/DEPLOY.md` | 32 | Railway + Vercel deployment guide |
| ✅ `docs/sql/01_schema.sql` | 2 | 🗄️ Run first |
| ✅ `docs/sql/02_rls.sql` | 2 | 🗄️ Run second |
| ✅ `docs/sql/03_functions.sql` | 2 | 🗄️ Run third |
| ✅ `docs/sql/04_triggers.sql` | 2 | 🗄️ Run fourth |
| ✅ `docs/sql/05_seed_coaches.sql` | 2 | 🗄️ Run fifth |
| ✅ `docs/sql/06_seed_badges.sql` | 2 | 🗄️ Run sixth |

---

## STEP 5 — TypeScript Strict Compliance Checklist

Run these **after** installing packages and setting up env vars:

```bash
# Backend
cd backend
npx tsc --noEmit --strict

# Frontend
cd ../apps/web
npx tsc --noEmit --strict
```

### Known strict-mode patterns to verify across all files

| Pattern | Fix |
|---|---|
| `const x: any` | Replace with `unknown` + type guard |
| `req.user` without type | Extend `Express.Request` in `types/express.d.ts` |
| `process.env.X` directly | Route through `backend/src/utils/env.ts` |
| `json.data` without assertion | Use typed `ApiResponse<T>` + null check |
| Function params without type | Add explicit parameter types |
| `catch (e)` without narrowing | `catch (e: unknown) { if (e instanceof Error)... }` |
| Array methods without generics | `useState<Challenge[]>([])` not `useState([])` |
| Supabase query result | Use `.data` with type narrowing, check for null |

### `types/express.d.ts` — Required in backend
```typescript
// backend/src/types/express.d.ts
import { User } from '../../shared/types/user';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
```

### `ApiResponse` usage — Frontend pattern
```typescript
// Every fetch call must type the response:
const res = await fetch(`${API_URL}/api/challenges`);
const json: ApiResponse<Challenge[]> = await res.json();
if (json.error) throw new Error(json.error);
const challenges = json.data;  // typed as Challenge[]
```

---

## STEP 6 — External Services Setup

### Supabase
1. Create project at supabase.com
2. Copy `Project URL` → `SUPABASE_URL`
3. Copy `anon public` key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → `SUPABASE_SERVICE_KEY` (backend only, never frontend)
5. Run all 6 SQL files in order
6. Enable Realtime for `community_posts`, `notifications`, `post_likes`, `post_comments`
7. Create `avatars` storage bucket (public read)

### Groq (Primary AI)
1. Sign up at console.groq.com
2. Create API key → `GROQ_API_KEY`
3. Free tier: 100,000 tokens/day on `llama-3.3-70b-versatile`

### Mistral (Fallback AI 1)
1. Sign up at console.mistral.ai
2. Create API key → `MISTRAL_API_KEY`

### Anthropic (Fallback AI 2)
1. API key from console.anthropic.com → `ANTHROPIC_API_KEY`

### LemonSqueezy (Payments)
1. Sign up at lemonsqueezy.com
2. Create a store → copy Store ID → `LEMONSQUEEZY_STORE_ID`
3. Create API key → `LEMONSQUEEZY_API_KEY`
4. Create products for each plan (monthly + annual)
5. Create webhook → point to `https://your-backend.railway.app/api/payments/webhook`
6. Copy webhook signing secret → `LEMONSQUEEZY_WEBHOOK_SECRET`

### OneSignal (Push Notifications)
1. Create app at onesignal.com → `ONESIGNAL_APP_ID` + `ONESIGNAL_REST_API_KEY`
2. Configure Web Push with your domain
3. Configure iOS + Android credentials (for native push)

### Sentry (Error Monitoring)
1. Create project at sentry.io (two projects: Node.js + Next.js)
2. Backend DSN → `SENTRY_DSN`
3. Frontend DSN → `NEXT_PUBLIC_SENTRY_DSN`

### PostHog (Analytics)
1. Create project at posthog.com
2. Copy Project API key → `NEXT_PUBLIC_POSTHOG_KEY`

### Railway (Backend Hosting)
1. Connect GitHub repo
2. Set root directory to `backend`
3. Add all backend env vars in Railway dashboard
4. Auto-deploys on push to `main`

### Vercel (Frontend Hosting)
1. Import from GitHub
2. Set root directory to `apps/web`
3. Add all `NEXT_PUBLIC_*` env vars in Vercel dashboard
4. Auto-deploys on push to `main`

---

## STEP 7 — Final Verification

Before going live, run through the full test checklist in `AGENT.md`:

```
□ Free user flow (register → challenge → complete → upgrade wall)
□ Starter/Pro/Elite feature gates all working
□ AI failover: test by temporarily removing GROQ_API_KEY
□ Streak system: complete day, miss day, verify penalties
□ Payment webhook: test with LemonSqueezy test mode
□ Push notifications: test from OneSignal dashboard
□ Admin: verify non-admin returns 403 from all /admin/* routes
□ CORS: verify requests from non-lumio.app domains are blocked
□ Rate limiting: hit 100+ requests/min, verify 429 response
□ RTL layout: switch language to Arabic, verify layout flips
□ PWA: Install on iPhone + Android, verify offline mode
□ Lighthouse: 90+ on landing page, 85+ on app pages
```

---

*Lumio — MERGE_CHECKLIST.md — Phase 29 Complete*
*Total phases implemented: 29 of 32*
*Remaining: Phase 30 (Error Monitoring) · Phase 31 (Testing) · Phase 32 (Deployment)*
