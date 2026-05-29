# SETUP_DATABASE.md — Lumio Phase 2: Database Setup

## Prerequisites
- Supabase project created at [supabase.com](https://supabase.com)
- Project URL and API keys saved in `.env` / `.env.local`

---

## Step 1 — Open Supabase SQL Editor

1. Go to [https://app.supabase.com](https://app.supabase.com) and open your project
2. In the left sidebar, click **SQL Editor**
3. Click **New query** (top-left button)

---

## Step 2 — Run the Schema

1. Open `docs/database-schema.sql` from this repository
2. Select all content (`Ctrl+A` / `Cmd+A`) and copy it
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for the green **Success** confirmation at the bottom

> If you see any errors, check the error message. Common issues:
> - **"relation already exists"** — table already created; safe to drop and re-run or skip
> - **"permission denied"** — make sure you are using the `postgres` role (default in SQL Editor)

---

## Step 3 — Verify All 18 Tables Exist

Run this query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected output — all 18 tables:**

| table_name            |
|-----------------------|
| admin_broadcasts      |
| badges                |
| challenge_buddies     |
| challenges            |
| coach_conversations   |
| coaches               |
| community_posts       |
| daily_tasks           |
| memory_packs          |
| milestones            |
| notifications         |
| payments              |
| points_transactions   |
| post_comments         |
| post_likes            |
| user_badges           |
| user_followers        |
| users                 |

---

## Step 4 — Verify RLS Is Enabled on All 18 Tables

Run this query:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected output:** Every table should show `rowsecurity = true`.

If any table shows `false`, run manually:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
```

---

## Step 5 — Verify Seed Data

### Badges — should be 15

```sql
SELECT count(*) AS badge_count FROM badges;
-- Expected: 15
```

### List all badges to confirm:

```sql
SELECT id, name, condition_type, condition_value
FROM badges
ORDER BY condition_type, condition_value;
```

### Coaches — should be 5

```sql
SELECT count(*) AS coach_count FROM coaches;
-- Expected: 5
```

### List seed coaches:

```sql
SELECT id, name, gender, min_plan, is_supersonic
FROM coaches
ORDER BY min_plan, gender;
```

**Expected:** 2 starter coaches, 2 pro coaches, 1 elite (SuperSonic) coach — all finance niche.

---

## Phase 2 Completion Checklist

Run each verification query above and confirm:

- [ ] 18 tables created
- [ ] RLS enabled on all 18 tables (`rowsecurity = true` for all)
- [ ] `SELECT count(*) FROM badges;` → **15**
- [ ] `SELECT count(*) FROM coaches;` → **5**
- [ ] No errors in the SQL Editor output

---

## Troubleshooting

### Reset and re-run from scratch

If you need to wipe and re-run (development only):

```sql
-- Drop all Lumio tables (cascades handle dependencies)
DROP TABLE IF EXISTS
  admin_broadcasts, payments, memory_packs, notifications,
  user_badges, badges, points_transactions, challenge_buddies,
  user_followers, post_comments, post_likes, community_posts,
  coach_conversations, coaches, milestones, daily_tasks,
  challenges, users
CASCADE;
```

Then paste and re-run `database-schema.sql`.

### Service role key for server-side writes

The `points_transactions` table has **no INSERT policy** for regular users — this is intentional. Your backend must use the **Supabase service role key** (never the anon key) to write to this table. Set `SUPABASE_SERVICE_KEY` in your backend `.env`.

---

## Next Steps

Once all checks pass, update the phase tracker:

```bash
echo "PHASE 2 COMPLETE ✓" > docs/CURRENT_PHASE.md
echo "All 18 tables created, RLS enabled, 15 badges + 5 coaches seeded." >> docs/CURRENT_PHASE.md
echo "Next: Phase 3 — Auth System" >> docs/CURRENT_PHASE.md
```

Proceed to **Phase 3: Auth System**.
