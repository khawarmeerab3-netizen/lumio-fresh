-- Lumio — docs/persona-schema-additions.sql
-- Run this in Supabase SQL Editor AFTER the main database-schema.sql
-- Adds persona system and daily mood check-in table

-- ─── 1. Add persona column to users table ─────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS persona jsonb DEFAULT '{
    "real_name": "",
    "preferred_name": "",
    "pets": [],
    "existing_habits": [],
    "hobbies": [],
    "challenge_history": [],
    "current_streak": 0,
    "persona_phase_completed": 0,
    "last_updated": ""
  }'::jsonb;

-- ─── 2. Daily mood check-ins table ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_mood_checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid REFERENCES challenges(id) ON DELETE CASCADE,
  mood            text NOT NULL CHECK (mood IN ('fired_up', 'okay', 'tired', 'rough_day')),
  note            text,                    -- Optional user-typed context
  checkin_date    date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)            -- One check-in per user per day
);

-- ─── 3. Persona conversation history table ────────────────────────────────────
-- Stores the persona-building conversation separately from coach chat

CREATE TABLE IF NOT EXISTS persona_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages        jsonb NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
  current_phase   integer NOT NULL DEFAULT 1,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)                              -- One persona conversation per user
);

-- ─── 4. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_date
  ON daily_mood_checkins(user_id, checkin_date DESC);

CREATE INDEX IF NOT EXISTS idx_mood_checkins_challenge
  ON daily_mood_checkins(challenge_id, checkin_date DESC);

-- ─── 5. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE daily_mood_checkins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_conversations  ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own check-ins
CREATE POLICY "users_own_mood_checkins"
  ON daily_mood_checkins
  FOR ALL
  USING (user_id = auth.uid());

-- Users can only read/write their own persona conversation
CREATE POLICY "users_own_persona_conversation"
  ON persona_conversations
  FOR ALL
  USING (user_id = auth.uid());

-- ─── 6. Verify ───────────────────────────────────────────────────────────────

-- Run these after executing above SQL:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'persona';
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('daily_mood_checkins', 'persona_conversations');
