-- ============================================================
-- LUMIO — DATABASE SCHEMA
-- Phase 2: All 18 Tables + RLS + Indexes + Seed Data
-- ============================================================

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                    text        UNIQUE NOT NULL,
  name                     text        NOT NULL,
  avatar_url               text,
  plan                     text        NOT NULL DEFAULT 'free'
                                         CHECK (plan IN ('free','starter','pro','elite','custom','enterprise')),
  plan_started_at          timestamptz,
  plan_expires_at          timestamptz,
  points                   integer     NOT NULL DEFAULT 0,
  total_points_earned      integer     NOT NULL DEFAULT 0,
  selected_mood            text        NOT NULL DEFAULT 'gold',
  selected_language        text        NOT NULL DEFAULT 'en',
  streak_current           integer     NOT NULL DEFAULT 0,
  streak_longest           integer     NOT NULL DEFAULT 0,
  streak_last_completed_date date,
  ai_queries_today         integer     NOT NULL DEFAULT 0,
  ai_queries_reset_at      timestamptz,
  device_token             text,
  notification_time        time        DEFAULT '20:00',
  is_admin                 boolean     NOT NULL DEFAULT false,
  is_banned                boolean     NOT NULL DEFAULT false,
  onboarding_completed     boolean     NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ─── CHALLENGES ───────────────────────────────────────────────────────────────
CREATE TABLE challenges (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche_id            text        NOT NULL,
  niche_category      text        NOT NULL,
  niche_color         text        NOT NULL,
  title               text        NOT NULL,
  goal                text        NOT NULL,
  custom_goal         text,
  duration_days       integer     NOT NULL,
  coach_id            text,
  ai_plan             jsonb,
  status              text        NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active','completed','abandoned','paused')),
  current_day         integer     NOT NULL DEFAULT 1,
  completed_days      integer[]   NOT NULL DEFAULT '{}',
  streak              integer     NOT NULL DEFAULT 0,
  longest_streak      integer     NOT NULL DEFAULT 0,
  last_completed_date date,
  start_date          date        NOT NULL DEFAULT CURRENT_DATE,
  end_date            date,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── DAILY TASKS ──────────────────────────────────────────────────────────────
CREATE TABLE daily_tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number      integer     NOT NULL,
  task_data       jsonb       NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','completed','missed','justified')),
  note            text,
  justification   text,
  points_awarded  integer     NOT NULL DEFAULT 0,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, day_number)
);

-- ─── MILESTONES ───────────────────────────────────────────────────────────────
CREATE TABLE milestones (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_number      integer     NOT NULL,
  label           text        NOT NULL,
  ai_message      text,
  unlocked_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── COACHES ──────────────────────────────────────────────────────────────────
CREATE TABLE coaches (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  title           text        NOT NULL,
  gender          text        NOT NULL CHECK (gender IN ('male','female','neutral')),
  niche_id        text        NOT NULL,
  personality     text        NOT NULL,
  speaking_style  text        NOT NULL,
  specialty       text        NOT NULL,
  catchphrase     text        NOT NULL,
  avatar_url      text        NOT NULL,
  is_supersonic   boolean     NOT NULL DEFAULT false,
  min_plan        text        NOT NULL DEFAULT 'starter'
                                CHECK (min_plan IN ('starter','pro','elite'))
);

-- ─── COACH CONVERSATIONS ──────────────────────────────────────────────────────
CREATE TABLE coach_conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  coach_id        text        REFERENCES coaches(id),
  messages        jsonb       NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── COMMUNITY POSTS ──────────────────────────────────────────────────────────
CREATE TABLE community_posts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid        REFERENCES challenges(id) ON DELETE SET NULL,
  content         text        NOT NULL CHECK (char_length(content) <= 500),
  image_url       text,
  niche_id        text,
  likes_count     integer     NOT NULL DEFAULT 0,
  comments_count  integer     NOT NULL DEFAULT 0,
  is_flagged      boolean     NOT NULL DEFAULT false,
  is_hidden       boolean     NOT NULL DEFAULT false,
  flag_count      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── POST LIKES ───────────────────────────────────────────────────────────────
CREATE TABLE post_likes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

-- ─── POST COMMENTS ────────────────────────────────────────────────────────────
CREATE TABLE post_comments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         text        NOT NULL CHECK (char_length(content) <= 300),
  is_flagged      boolean     NOT NULL DEFAULT false,
  is_hidden       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── USER FOLLOWERS ───────────────────────────────────────────────────────────
CREATE TABLE user_followers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ─── CHALLENGE BUDDIES ────────────────────────────────────────────────────────
CREATE TABLE challenge_buddies (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buddy_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','accepted','declined')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id, buddy_id)
);

-- ─── POINTS TRANSACTIONS ──────────────────────────────────────────────────────
CREATE TABLE points_transactions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action          text        NOT NULL,
  points          integer     NOT NULL,
  description     text,
  reference_id    uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── BADGES ───────────────────────────────────────────────────────────────────
CREATE TABLE badges (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  description     text        NOT NULL,
  image_url       text        NOT NULL,
  condition_type  text        NOT NULL,
  condition_value integer     NOT NULL DEFAULT 0,
  points_cost     integer     NOT NULL DEFAULT 0,
  is_purchasable  boolean     NOT NULL DEFAULT false
);

-- ─── USER BADGES ──────────────────────────────────────────────────────────────
CREATE TABLE user_badges (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id        text        NOT NULL REFERENCES badges(id),
  earned_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text        NOT NULL,
  title           text        NOT NULL,
  message         text        NOT NULL,
  data            jsonb,
  is_read         boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── MEMORY PACKS ─────────────────────────────────────────────────────────────
CREATE TABLE memory_packs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id    uuid        NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  duration_days   integer     NOT NULL,
  price_paid      numeric(10,2) NOT NULL,
  payment_id      text,
  status          text        NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','expired','cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE payments (
  id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lemonsqueezy_order_id        text,
  lemonsqueezy_subscription_id text,
  type                         text        NOT NULL CHECK (type IN ('subscription','memory_pack')),
  plan                         text,
  amount                       numeric(10,2) NOT NULL,
  currency                     text        NOT NULL DEFAULT 'USD',
  status                       text        NOT NULL DEFAULT 'active',
  created_at                   timestamptz NOT NULL DEFAULT now()
);

-- ─── ADMIN BROADCASTS ─────────────────────────────────────────────────────────
CREATE TABLE admin_broadcasts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        uuid        NOT NULL REFERENCES users(id),
  title           text        NOT NULL,
  message         text        NOT NULL,
  tip_data        jsonb,
  target_plan     text        NOT NULL DEFAULT 'all',
  sent_count      integer     NOT NULL DEFAULT 0,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_challenges_user_id    ON challenges(user_id);
CREATE INDEX idx_challenges_status     ON challenges(status);
CREATE INDEX idx_daily_tasks_challenge ON daily_tasks(challenge_id, day_number);
CREATE INDEX idx_posts_niche           ON community_posts(niche_id, created_at DESC);
CREATE INDEX idx_posts_user            ON community_posts(user_id);
CREATE INDEX idx_notifications_user    ON notifications(user_id, is_read);
CREATE INDEX idx_points_user           ON points_transactions(user_id, created_at DESC);
CREATE INDEX idx_followers_following   ON user_followers(following_id);
CREATE INDEX idx_followers_follower    ON user_followers(follower_id);
CREATE INDEX idx_milestones_challenge  ON milestones(challenge_id);
CREATE INDEX idx_coach_convos_user     ON coach_conversations(user_id, challenge_id);
CREATE INDEX idx_post_likes_post       ON post_likes(post_id);
CREATE INDEX idx_post_comments_post    ON post_comments(post_id, created_at);
CREATE INDEX idx_challenge_buddies_user ON challenge_buddies(user_id);
CREATE INDEX idx_challenge_buddies_buddy ON challenge_buddies(buddy_id);
CREATE INDEX idx_user_badges_user      ON user_badges(user_id);
CREATE INDEX idx_payments_user         ON payments(user_id, created_at DESC);
CREATE INDEX idx_memory_packs_user     ON memory_packs(user_id, challenge_id);

-- ============================================================
-- ROW LEVEL SECURITY — ENABLE ON ALL 18 TABLES
-- ============================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_buddies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_packs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_broadcasts    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE POLICY "users: select own row"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: update own row"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ─── challenges ───────────────────────────────────────────────────────────────
CREATE POLICY "challenges: select own"
  ON challenges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "challenges: insert own"
  ON challenges FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "challenges: update own"
  ON challenges FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "challenges: delete own"
  ON challenges FOR DELETE
  USING (user_id = auth.uid());

-- ─── daily_tasks ──────────────────────────────────────────────────────────────
CREATE POLICY "daily_tasks: select own"
  ON daily_tasks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "daily_tasks: insert own"
  ON daily_tasks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_tasks: update own"
  ON daily_tasks FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "daily_tasks: delete own"
  ON daily_tasks FOR DELETE
  USING (user_id = auth.uid());

-- ─── milestones ───────────────────────────────────────────────────────────────
CREATE POLICY "milestones: select own"
  ON milestones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "milestones: insert own"
  ON milestones FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "milestones: update own"
  ON milestones FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "milestones: delete own"
  ON milestones FOR DELETE
  USING (user_id = auth.uid());

-- ─── coaches ──────────────────────────────────────────────────────────────────
CREATE POLICY "coaches: public read"
  ON coaches FOR SELECT
  USING (true);

-- ─── coach_conversations ──────────────────────────────────────────────────────
CREATE POLICY "coach_conversations: select own"
  ON coach_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "coach_conversations: insert own"
  ON coach_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "coach_conversations: update own"
  ON coach_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "coach_conversations: delete own"
  ON coach_conversations FOR DELETE
  USING (user_id = auth.uid());

-- ─── community_posts ──────────────────────────────────────────────────────────
CREATE POLICY "community_posts: select all non-hidden"
  ON community_posts FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "community_posts: insert own"
  ON community_posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "community_posts: update own"
  ON community_posts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "community_posts: delete own"
  ON community_posts FOR DELETE
  USING (user_id = auth.uid());

-- ─── post_likes ───────────────────────────────────────────────────────────────
CREATE POLICY "post_likes: select all"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "post_likes: insert own"
  ON post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_likes: delete own"
  ON post_likes FOR DELETE
  USING (user_id = auth.uid());

-- ─── post_comments ────────────────────────────────────────────────────────────
CREATE POLICY "post_comments: select non-hidden"
  ON post_comments FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "post_comments: insert own"
  ON post_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_comments: delete own"
  ON post_comments FOR DELETE
  USING (user_id = auth.uid());

-- ─── user_followers ───────────────────────────────────────────────────────────
CREATE POLICY "user_followers: select involving own id"
  ON user_followers FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "user_followers: insert own"
  ON user_followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "user_followers: delete own"
  ON user_followers FOR DELETE
  USING (follower_id = auth.uid());

-- ─── challenge_buddies ────────────────────────────────────────────────────────
CREATE POLICY "challenge_buddies: select involving own id"
  ON challenge_buddies FOR SELECT
  USING (user_id = auth.uid() OR buddy_id = auth.uid());

CREATE POLICY "challenge_buddies: insert own"
  ON challenge_buddies FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "challenge_buddies: update involving own id"
  ON challenge_buddies FOR UPDATE
  USING (user_id = auth.uid() OR buddy_id = auth.uid());

CREATE POLICY "challenge_buddies: delete own"
  ON challenge_buddies FOR DELETE
  USING (user_id = auth.uid());

-- ─── points_transactions ──────────────────────────────────────────────────────
-- INSERT is intentionally omitted — server-side only via service role key
CREATE POLICY "points_transactions: select own"
  ON points_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ─── badges ───────────────────────────────────────────────────────────────────
CREATE POLICY "badges: public read"
  ON badges FOR SELECT
  USING (true);

-- ─── user_badges ──────────────────────────────────────────────────────────────
CREATE POLICY "user_badges: select own"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_badges: insert own"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── notifications ────────────────────────────────────────────────────────────
CREATE POLICY "notifications: select own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: insert own"
  ON notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications: update own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications: delete own"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ─── memory_packs ─────────────────────────────────────────────────────────────
CREATE POLICY "memory_packs: select own"
  ON memory_packs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "memory_packs: insert own"
  ON memory_packs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "memory_packs: update own"
  ON memory_packs FOR UPDATE
  USING (user_id = auth.uid());

-- ─── payments ─────────────────────────────────────────────────────────────────
CREATE POLICY "payments: select own"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payments: insert own"
  ON payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── admin_broadcasts ─────────────────────────────────────────────────────────
CREATE POLICY "admin_broadcasts: select all"
  ON admin_broadcasts FOR SELECT
  USING (true);

CREATE POLICY "admin_broadcasts: insert admins only"
  ON admin_broadcasts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "admin_broadcasts: update admins only"
  ON admin_broadcasts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- SEED DATA — BADGES (15 definitions)
-- ============================================================

INSERT INTO badges (id, name, description, image_url, condition_type, condition_value, points_cost, is_purchasable) VALUES
  -- First-time badges
  ('first_challenge', 'Pioneer',        'Created your first challenge',                      '/badges/pioneer.svg',       'challenges_created',   1,     0,    false),
  ('first_complete',  'Finisher',        'Completed your first challenge end-to-end',         '/badges/finisher.svg',      'challenges_completed', 1,     0,    false),
  ('first_post',      'Voice',           'Made your first post in the community',             '/badges/voice.svg',         'posts_created',        1,     0,    false),
  -- Streak badges
  ('streak_3',        'Spark',           'Maintained a 3-day streak',                         '/badges/spark.svg',         'streak_days',          3,     0,    false),
  ('streak_7',        'Flame',           'Maintained a 7-day streak',                         '/badges/flame.svg',         'streak_days',          7,     0,    false),
  ('streak_21',       'Habit',           'Maintained a 21-day streak — a true habit formed',  '/badges/habit.svg',         'streak_days',          21,    0,    false),
  ('streak_30',       'Iron Will',       'Maintained a 30-day streak without breaking',       '/badges/iron-will.svg',     'streak_days',          30,    0,    false),
  ('streak_90',       'Inferno',         'Maintained an unstoppable 90-day streak',           '/badges/inferno.svg',       'streak_days',          90,    0,    false),
  ('streak_365',      'Legend',          'A full year streak — you are a Lumio Legend',       '/badges/legend.svg',        'streak_days',          365,   0,    false),
  -- Niche diversity badges
  ('niche_3',         'Explorer',        'Tried challenges in 3 different life niches',       '/badges/explorer.svg',      'niches_tried',         3,     0,    false),
  ('niche_6',         'Polymath',        'Tried challenges in 6 different life niches',       '/badges/polymath.svg',      'niches_tried',         6,     0,    false),
  -- Social badges
  ('likes_50',        'Inspiring',       'Received 50 likes on your community posts',         '/badges/inspiring.svg',     'likes_received',       50,    0,    false),
  ('buddy_complete',  'Accountability',  'Completed a challenge alongside a buddy',           '/badges/accountability.svg','buddy_challenges',     1,     0,    false),
  -- Points milestones
  ('points_1000',     'Earner',          'Accumulated 1,000 total Lumio Points',              '/badges/earner.svg',        'total_points',         1000,  0,    false),
  ('points_10000',    'Luminary',        'Accumulated 10,000 total Lumio Points — elite tier','/badges/luminary.svg',      'total_points',         10000, 0,    false)
;

-- ============================================================
-- SEED DATA — COACHES (5 Finance coaches — template for all 12 niches)
-- Phase 9 will add all 60 coaches across 12 niches
-- ============================================================

INSERT INTO coaches (id, name, title, gender, niche_id, personality, speaking_style, specialty, catchphrase, avatar_url, is_supersonic, min_plan) VALUES
  (
    'finance_sarah_chen',
    'Sarah Chen',
    'CFO & Wealth Strategist',
    'female',
    'finance',
    'Sharp, data-driven, no-nonsense. Cuts through financial noise with precision. Sets high expectations and demands accountability.',
    'Formal, uses financial metaphors and data references. Speaks in ROI, percentages, and compounding logic.',
    'Investment and wealth building',
    'Your money works harder when your mind works smarter.',
    '/coaches/finance/sarah-chen.webp',
    false,
    'starter'
  ),
  (
    'finance_marcus_williams',
    'Marcus Williams',
    'Serial Entrepreneur & Investor',
    'male',
    'finance',
    'Bold, motivating, risk-taker. Thrives on big moves and momentum. Pushes users to think bigger about their financial future.',
    'Casual, story-based, energetic. Uses real-world entrepreneur anecdotes and sports analogies.',
    'Business and entrepreneurship',
    'Every dollar is a soldier. Deploy them wisely.',
    '/coaches/finance/marcus-williams.webp',
    false,
    'starter'
  ),
  (
    'finance_priya_sharma',
    'Priya Sharma',
    'Financial Therapist & Mindset Coach',
    'female',
    'finance',
    'Warm, empathetic, holistic. Addresses the emotional roots of money habits. Patient and non-judgmental, celebrates every win.',
    'Conversational, psychology-based. Connects financial decisions to emotions, identity, and self-worth.',
    'Money mindset and debt freedom',
    'Financial freedom starts between your ears.',
    '/coaches/finance/priya-sharma.webp',
    false,
    'pro'
  ),
  (
    'finance_james_obrien',
    'James O''Brien',
    'Retired Fund Manager & Mentor',
    'male',
    'finance',
    'Wise, patient, methodical. 30+ years of market experience distilled into quiet confidence. Believes in the long game.',
    'Teaching-style, detailed explanations with historical context. Uses Socratic questions to guide discovery.',
    'Long-term investing and retirement planning',
    'Slow money beats fast money every time.',
    '/coaches/finance/james-obrien.webp',
    false,
    'pro'
  ),
  (
    'finance_apex',
    'APEX',
    'Your Relentless Financial Accountability Engine',
    'neutral',
    'finance',
    'Intense, uncompromising, hyper-personalized. Zero tolerance for excuses. Tracks every metric and calls out inconsistency instantly.',
    'Direct, urgent, data-backed. Short sentences. No pleasantries. Every message carries weight and consequence.',
    'Everything — adapts dynamically to the user''s exact financial situation and gaps',
    'Excuses don''t compound. Money does.',
    '/coaches/finance/apex.webp',
    true,
    'elite'
  )
;
