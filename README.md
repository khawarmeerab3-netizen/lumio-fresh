# Lumio — Illuminate Your Growth

Lumio is the world's most advanced AI-powered life challenge platform, covering all 12 areas of human life — fitness, finance, cooking, spirituality, parenting, creativity, relationships, learning, productivity, and more. Users pick a challenge, get a fully personalized AI-generated plan with milestones and daily tasks, work with an AI coach that knows their specific goal, and track progress through an animated journey map with streaks, points, leaderboards, and shareable reel compilations. The app transforms its entire visual identity based on the user's mood across 8 themes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         lumio.app                           │
│              Next.js 14 (Vercel) — App Router               │
│   TypeScript · Tailwind · Framer Motion · Zustand · PWA    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS (REST)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              lumio-api.up.railway.app                       │
│               Express.js (Railway) — Node 20               │
│          TypeScript · JWT Auth · Zod Validation            │
└──────┬────────────────┬──────────────────┬──────────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌──────────────┐ ┌─────────────┐ ┌────────────────────────────┐
│   Supabase   │ │  AI Engine  │ │       Third-Party APIs     │
│  PostgreSQL  │ │  (Failover) │ │  LemonSqueezy · OneSignal  │
│  Auth        │ │  Groq →     │ │  Sentry · PostHog          │
│  Storage     │ │  Mistral →  │ └────────────────────────────┘
│  Realtime    │ │  Anthropic  │
└──────────────┘ └─────────────┘
```

---

## Local Setup (from scratch)

### 1. Prerequisites

- Node.js 20+
- pnpm: `npm install -g pnpm`
- A Supabase project (free tier works)

### 2. Clone & Install

```bash
git clone https://github.com/your-org/lumio.git
cd lumio
pnpm install
```

### 3. Environment Variables

Copy the example files:

```bash
cp .env.example backend/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in the values — see the [Environment Variables](#environment-variables) table below.

### 4. Set Up Database

In your Supabase SQL Editor, run in order:

```bash
# 1. Create all tables + RLS policies
database-schema.sql

# 2. Seed coach data
coaches-seed.sql
```

### 5. Start Dev Servers

```bash
# Start both backend and frontend in parallel
pnpm dev

# Or individually:
pnpm --filter backend dev      # Backend on :3000
pnpm --filter web dev          # Frontend on :3001
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Where to Get |
|---|---|---|
| `PORT` | Server port (default `3000`) | Fixed: `3000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key (never expose) | Supabase → Settings → API |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) | `openssl rand -hex 32` |
| `GROQ_API_KEY` | Groq API key (primary AI) | [console.groq.com](https://console.groq.com) |
| `MISTRAL_API_KEY` | Mistral API key (AI fallback 1) | [console.mistral.ai](https://console.mistral.ai) |
| `ANTHROPIC_API_KEY` | Anthropic API key (AI fallback 2) | [console.anthropic.com](https://console.anthropic.com) |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key | LemonSqueezy → Settings → API |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signing secret | LemonSqueezy → Webhooks |
| `LEMONSQUEEZY_STORE_ID` | Your LemonSqueezy store ID | LemonSqueezy → Settings |
| `ONESIGNAL_APP_ID` | OneSignal App ID | OneSignal → App Settings |
| `ONESIGNAL_REST_API_KEY` | OneSignal REST API key | OneSignal → App Settings |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3001` (dev) |
| `SENTRY_DSN` | Sentry DSN for backend errors | Sentry → Project → Settings |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Where to Get |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000` (dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID` | LemonSqueezy store ID | LemonSqueezy → Settings |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key | PostHog → Project Settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend | Sentry → Project → Settings |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal App ID | OneSignal → App Settings |

---

## npm Scripts

### Root (monorepo)

| Script | Description |
|---|---|
| `pnpm dev` | Start all packages in development mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |

### Backend (`cd backend`)

| Script | Description |
|---|---|
| `pnpm dev` | Start with ts-node-dev (hot reload) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled output (`dist/index.js`) |
| `pnpm test` | Run Vitest unit tests |
| `pnpm lint` | ESLint + Prettier check |

### Frontend (`cd apps/web`)

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server on :3001 |
| `pnpm build` | Build Next.js for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run Vitest unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | ESLint + Prettier check |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | SSR, SEO, React Server Components |
| **Styling** | Tailwind CSS + Framer Motion | Utility-first styles + animations |
| **UI Components** | Shadcn/ui + custom | Base components + Lumio design system |
| **State** | Zustand | Client-side state management |
| **Forms** | React Hook Form + Zod | Form handling + validation |
| **PWA** | next-pwa | Installable on iOS + Android |
| **i18n** | i18next + next-i18next | 8 languages including Arabic/Urdu RTL |
| **Video** | FFmpeg.wasm | Client-side reel compilation (zero server cost) |
| **Offline** | IndexedDB via `idb` | Photos, videos, offline data |
| **Backend** | Node.js 20 + Express.js | REST API |
| **Auth** | Supabase Auth | JWT-based authentication |
| **Database** | Supabase (PostgreSQL) | Primary data store + RLS policies |
| **Realtime** | Supabase Realtime | Community feed, live notifications |
| **File Storage** | Supabase Storage | Profile pictures |
| **AI (Primary)** | Groq — `llama-3.3-70b-versatile` | Fast inference, generous free tier |
| **AI (Fallback 1)** | Mistral — `mistral-large-latest` | Secondary AI provider |
| **AI (Fallback 2)** | Anthropic — `claude-sonnet-4-20250514` | Final fallback, highest quality |
| **Payments** | LemonSqueezy | Subscriptions + one-time purchases (Pakistan-supported) |
| **Push** | OneSignal | Web push notifications |
| **Errors** | Sentry | Error monitoring (frontend + backend) |
| **Analytics** | PostHog | Product analytics + funnels |
| **Frontend Host** | Vercel | Auto-deploy from GitHub |
| **Backend Host** | Railway | Node.js hosting ($5/mo credit) |
| **Database Host** | Supabase | Free tier to 50,000 users |
| **Domain** | Cloudflare DNS → lumio.app | DNS + CDN |
| **Package Manager** | pnpm | Faster installs, workspace support |
| **Testing** | Vitest + Playwright | Unit + E2E tests |

---

## Production Deployment

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the complete step-by-step production deployment guide covering Railway, Vercel, Supabase, LemonSqueezy, OneSignal, and custom domain setup.

---

## Project Structure

```
lumio/
├── AGENT.md                    ← Master spec (never delete)
├── CLAUDE.md                   ← Alias for Claude Code
├── README.md                   ← This file
├── .env.example                ← Environment variable template
├── pnpm-workspace.yaml
│
├── apps/
│   └── web/                    ← Next.js 14 frontend
│       ├── app/                ← App Router pages
│       │   ├── (auth)/         ← Login, register
│       │   ├── (marketing)/    ← Landing, pricing
│       │   └── (app)/          ← Protected routes
│       ├── components/         ← React components
│       ├── lib/                ← AI, auth, DB, payments
│       ├── stores/             ← Zustand state
│       └── public/             ← Static assets, locales
│
├── backend/
│   └── src/
│       ├── index.ts            ← Express app entry
│       ├── routes/             ← API route handlers
│       ├── middleware/         ← Auth, rate limiting, errors
│       └── lib/                ← AI engine, Supabase, payments
│
└── docs/
    ├── DEPLOY.md               ← Production deployment guide
    └── CURRENT_PHASE.md        ← Build progress tracker
```

---

*Lumio v1.0 · Next.js 14 + Node.js + Supabase + LemonSqueezy + Groq/Mistral/Anthropic*
*32 Phases · 8 Languages · 12 Niches · 60 Coaches · 8 Mood Themes*
*Illuminate Your Growth*
