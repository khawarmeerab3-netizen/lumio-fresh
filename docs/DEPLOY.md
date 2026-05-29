# Lumio — Deployment Guide

> **Stack:** Railway (backend) · Vercel (frontend) · Supabase (database) · lumio.app (domain)

---

## Prerequisites

- Node.js 20+
- pnpm installed (`npm install -g pnpm`)
- GitHub account (repo connected to Vercel)
- Accounts created at: Railway, Vercel, Supabase, LemonSqueezy, OneSignal, Sentry

---

## 1. SUPABASE — Production Database

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `lumio-production`, choose a region close to your users
3. Save the database password somewhere secure
4. In the **SQL Editor**, run in order:
   ```
   database-schema.sql
   coaches-seed.sql
   ```
5. Go to **Authentication → Providers → Email** → Enable
6. Set **Site URL** to `https://lumio.app`
7. Add redirect URLs: `https://lumio.app/**` and `https://*.vercel.app/**`
8. Copy these values for later:
   - **Project URL** → `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (backend only, never expose)

---

## 2. BACKEND — Railway

### Install & Login

```bash
npm install -g @railway/cli
railway login
```

### Initialize Project

```bash
cd backend
railway init
# Select: Create new project → name it "lumio-api"
```

### Set Environment Variables

In the Railway dashboard → **Variables**, add each of the following:

| Variable | Description | Where to Get |
|---|---|---|
| `PORT` | `3000` | Fixed value |
| `NODE_ENV` | `production` | Fixed value |
| `SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key | Supabase → Settings → API |
| `JWT_SECRET` | Random string, min 32 chars | `openssl rand -hex 32` |
| `GROQ_API_KEY` | Groq API key | console.groq.com |
| `MISTRAL_API_KEY` | Mistral API key | console.mistral.ai |
| `ANTHROPIC_API_KEY` | Anthropic API key | console.anthropic.com |
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy API key | LemonSqueezy → Settings → API |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Webhook signing secret | Generated during webhook setup |
| `LEMONSQUEEZY_STORE_ID` | Your store ID | LemonSqueezy → Settings |
| `ONESIGNAL_APP_ID` | OneSignal App ID | OneSignal → Settings |
| `ONESIGNAL_REST_API_KEY` | OneSignal REST API key | OneSignal → Settings |
| `FRONTEND_URL` | `https://lumio.app` | Fixed value |
| `SENTRY_DSN` | Sentry DSN for backend | Sentry → Project → Settings |

### Deploy

```bash
railway up
```

Railway will build with Nixpacks using `pnpm build` and start with `pnpm start`.

### Verify

```bash
curl https://{your-project}.railway.app/health
# Expected: { "status": "ok", "timestamp": "..." }
```

Note your Railway URL — you'll need it for `NEXT_PUBLIC_API_URL` and LemonSqueezy webhook.

---

## 3. FRONTEND — Vercel

### Install & Deploy

```bash
npm install -g vercel
cd apps/web
vercel --prod
```

Follow the prompts: link to your GitHub repo, set root directory to `apps/web`.

### Set Environment Variables

In the Vercel dashboard → **Project → Settings → Environment Variables**, add:

| Variable | Description | Where to Get |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Railway backend URL | e.g. `https://lumio-api.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID` | LemonSqueezy store ID | LemonSqueezy → Settings |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key | PostHog → Project → Settings |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend | Sentry → Project → Settings |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal App ID | OneSignal → Settings |

### Connect Custom Domain

1. In Vercel → **Project → Settings → Domains**
2. Add `lumio.app` and `www.lumio.app`
3. In Cloudflare DNS, add the CNAME records Vercel provides
4. Wait for SSL propagation (usually under 5 minutes with Cloudflare)

---

## 4. LEMONSQUEEZY — Payments

### Create Products

1. Log in to [LemonSqueezy](https://app.lemonsqueezy.com)
2. Go to **Products → New Product** for each plan:
   - **Lumio Starter** — Monthly ($9/mo) + Annual ($90/yr)
   - **Lumio Pro** — Monthly ($19/mo) + Annual ($190/yr)
   - **Lumio Elite** — Monthly ($39/mo) + Annual ($390/yr)
   - **Memory Pack** — One-time ($4.99)
3. Copy each plan's **Variant ID** and update `backend/src/lib/payments.ts`

### Configure Webhook

1. In LemonSqueezy → **Settings → Webhooks → New Webhook**
2. Set URL: `https://{your-railway-url}.railway.app/api/webhooks/lemonsqueezy`
3. Enable these events:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
4. Copy the **Signing Secret** → add to Railway as `LEMONSQUEEZY_WEBHOOK_SECRET`

---

## 5. ONESIGNAL — Push Notifications

1. Go to [onesignal.com](https://onesignal.com) → **New App**
2. Name it `Lumio`, select **Web Push**
3. Set Site URL: `https://lumio.app`
4. Copy **App ID** → `NEXT_PUBLIC_ONESIGNAL_APP_ID` (Vercel) + `ONESIGNAL_APP_ID` (Railway)
5. Copy **REST API Key** → `ONESIGNAL_REST_API_KEY` (Railway only)
6. Download `OneSignalSDKWorker.js` from OneSignal dashboard
7. Place it at `apps/web/public/OneSignalSDKWorker.js`

---

## 6. SENTRY — Error Monitoring

1. Go to [sentry.io](https://sentry.io) → **New Project**
2. Create two projects: `lumio-frontend` (Next.js) and `lumio-backend` (Node.js)
3. Copy each DSN to the corresponding env vars
4. The Sentry SDK is already initialized in the codebase

---

## 7. POSTHOG — Analytics

1. Go to [posthog.com](https://posthog.com) → **New Project**
2. Copy the **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY` in Vercel

---

## POST-DEPLOYMENT CHECKLIST

Run through these after every production deploy:

```
□ Register a new user on prod → receives welcome token
□ Complete onboarding quiz → AI recommendation displays
□ Create a challenge → AI plan generates (title + milestones + habits)
□ Complete Day 1 task → +10 points awarded, streak increments to 1
□ Subscribe to Starter → LemonSqueezy checkout opens and completes
□ Subscribe confirmation → plan upgrades immediately in-app
□ Complete a day as Starter → community posting unlocked
□ Check Sentry dashboard → events flowing in correctly
□ Check PostHog → page views and events tracked
□ Test push notification → browser prompt shows, notification received
□ Verify /health endpoint returns 200
□ Check Railway logs → no unhandled errors
□ Run Lighthouse on lumio.app → 90+ performance score
```

---

## ROLLBACK PROCEDURE

**Backend (Railway):**
```bash
railway rollback  # Reverts to previous deployment
```

**Frontend (Vercel):**
In Vercel dashboard → **Deployments** → find previous deployment → **Promote to Production**

---

## ENVIRONMENT SUMMARY

| Service | URL Pattern | Purpose |
|---|---|---|
| Frontend | `https://lumio.app` | Next.js app on Vercel |
| Backend API | `https://lumio-api.up.railway.app` | Express API on Railway |
| Database | `https://{ref}.supabase.co` | Supabase PostgreSQL |
| Payments | `https://app.lemonsqueezy.com` | Subscription billing |
| Push | OneSignal dashboard | Push notifications |
| Errors | Sentry dashboard | Error monitoring |
| Analytics | PostHog dashboard | User analytics |
