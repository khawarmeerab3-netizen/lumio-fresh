# LUMIO — AGENT.md ADDITIONS
## Persona Builder + Mood-Adaptive Task System
### Appended to AGENT.md v2.0 | Based on Deep Personalization Engine document

---

## NEW FEATURE SET: DEEP PERSONALIZATION ENGINE

Two HIGH/VERY HIGH priority additions based on competitive analysis and the
Persona Builder design document. These go live alongside Phase 20 (Onboarding)
and Phase 6 (Daily Tasks) respectively.

---

## FEATURE 1 — PERSONA BUILDER (Very High Priority)

### What It Is

Instead of a static 5-question quiz at onboarding, Lumio now builds a living
personal profile of every user through **natural conversation** spread across
their first 7 days. The app learns their name, their dog's name, why they've
failed before, what motivates them, and how they want to be coached.

This profile is injected into EVERY AI call — coach chat, daily tasks, reports,
milestone messages — so every response feels like it was written specifically
for that person.

### The 7 Phases

| Phase | When | What Gets Learned |
|---|---|---|
| 1 | Day 0 (first open) | Real name + preferred name / nickname |
| 2 | Day 0 (continued) | Profession, life situation, age, location, work environment, morning/night |
| 3 | Day 0 (continued) | Biggest struggle, past failure reason, motivation type (fear/excitement/both) |
| 4 | Day 2 check-in | Daily routine, time available, physical limitations |
| 5 | Day 3 check-in | Family, partner, kids, pets (names + types) |
| 6 | Day 4 check-in | Existing habits, hobbies, phone relationship |
| 7 | Day 5 check-in | Learning style, competitive vs reflective, coaching tone (tough/gentle/balanced) |

**Phases 1-3 happen during first launch — BEFORE the user creates their first
challenge.** This replaces the existing onboarding quiz.

**Phases 4-7 are woven into the daily check-in** on Days 2-7. One casual
question per day, before the mood check-in. Never feels like a form.

### Database Changes

```sql
-- Add to users table (run persona-schema-additions.sql)
ALTER TABLE users ADD COLUMN persona jsonb DEFAULT '{}';

-- New tables
CREATE TABLE daily_mood_checkins (...)   -- One row per user per day
CREATE TABLE persona_conversations (...)  -- The conversation history
```

Full SQL in: `docs/persona-schema-additions.sql`

### New Files Added

```
shared/types/persona.ts                          ← UserPersona, DailyMoodState, all types
backend/src/services/persona-engine.ts           ← Core service (conversation, extraction, save)
backend/src/routes/persona.ts                    ← All persona + mood API routes
backend/src/utils/validate-persona-additions.ts  ← Zod schemas for persona endpoints
apps/web/src/components/lumio/PersonaChat.tsx    ← Conversational onboarding UI
apps/web/src/components/lumio/MoodCheckIn.tsx    ← Daily mood gateway component
apps/web/src/hooks/useMoodCheckIn.ts             ← Hook for Today tab check-in state
```

### API Endpoints

```
GET  /api/persona                 → Get user's current persona object
GET  /api/persona/conversation    → Get persona conversation history + current phase
POST /api/persona/message         → Send a message in persona conversation
GET  /api/persona/daily-question  → Get today's Phase 4-7 question (Days 2+)
POST /api/persona/mood            → Submit daily mood check-in
GET  /api/persona/mood/today      → Get today's check-in (has_checked_in?)
GET  /api/persona/task-context    → Get adaptive task context from today's mood
```

### How Persona Integrates with AI Calls

The `buildPersonaContext(persona)` function in `persona-engine.ts` generates a
formatted context string. This is injected into the system prompt of:

- **Coach chat** (`chatWithCoach`): Coach knows their name, dog, profession, struggles
- **Daily task** (`generateDailyTask`): Task references their specific situation
- **Progress report** (`generateDailyReport`): Report uses their preferred name
- **Milestone message** (`generateMilestoneMessage`): Celebration feels personal

**In lumio-coach.ts, add `personaContext` parameter to all 10 AI functions:**
```typescript
// Before (existing)
async function generateDailyTask(goal, niche, day, total, completionRate, language)

// After (updated)
async function generateDailyTask(goal, niche, day, total, completionRate, language, personaContext?)
```

Then prepend `personaContext` to the system prompt when it exists:
```typescript
const system = personaContext
  ? `${personaContext}\n\n${existingSystemPrompt}`
  : existingSystemPrompt;
```

### Emotional Safety Rule (Critical)

If the user reveals something deeply emotional during persona conversation
(grief, divorce, job loss, serious illness), the AI **must stop asking
persona questions** and respond with warmth and presence. This is handled
in the Phase system prompt via the rule:

> "If they reveal something emotional — STOP the persona flow immediately.
> Say something human and warm. Do NOT continue asking questions."

This is non-negotiable. Implement a keyword check as backup: if user message
contains grief/divorce/death/cancer/fired — override current phase objective
with an empathy-only response for that turn.

### Persona Golden Rules (Enforced in Code)

```typescript
// 1. Always use preferred_name — never real_name after Phase 1
const nameToUse = persona.preferred_name || persona.real_name;

// 2. Reference pets naturally when contextually relevant
if (persona.pets.length > 0 && isWalkOrExerciseChallenge) {
  // "How's Bruno doing? Did he join you today?"
}

// 3. Never ask more than 2 questions per message (enforced in system prompt)

// 4. The profile grows forever — never overwrite existing data unless user corrects
const merged = { ...existingPersona, ...newExtractedData };
```

---

## FEATURE 2 — MOOD-ADAPTIVE DAILY TASKS (Very High Priority)

### What It Is

Before Today's task loads, every user is asked one question:

> "Hey [name] — how are you feeling going into today?"

Four options: **Fired Up ⚡ / Doing Okay 😊 / Tired 😴 / Rough Day 🌧️**

Their answer directly changes the version of the task the AI generates.
A tired user gets a shorter, simpler task. A rough day user gets a recovery
challenge instead of the normal task. A fired-up user gets bonus intensity.

### Mood → Task Mapping

| Mood | Intensity | Task Change |
|---|---|---|
| Fired Up ⚡ | Full | Full task + bonus challenge at end. Time can be 20% more. |
| Doing Okay 😊 | Standard | Normal task, no changes. |
| Tired 😴 | Lighter | 30% less complex. Easiest first step leads. 25% shorter time. |
| Rough Day 🌧️ | Recovery | Skip normal task. Serve reflection/gratitude challenge. Max 10 min. |

### Database Changes

```sql
-- daily_mood_checkins table (in persona-schema-additions.sql)
-- One row per user per day — UNIQUE(user_id, checkin_date)
```

### How It Connects to generateDailyTask

```typescript
// In challenges route, before calling generateDailyTask:
const taskContext = await getAdaptiveTaskContext(userId);

// Pass to AI function:
const task = await generateDailyTask(
  goal, niche, day, total, completionRate, language,
  personaContext,
  taskContext.toneAdjustment,   // ← NEW: injected into system prompt
  taskContext.timeAdjustment    // ← NEW: modifies time estimate instruction
);
```

**Updated generateDailyTask system prompt template:**
```
System: Expert daily challenge coach. Respond with valid JSON only.
{personaContext}

MOOD CONTEXT (adjust task accordingly):
{toneAdjustment}
{timeAdjustment}

User: Goal: {goal}. Niche: {niche}. Day: {day}/{totalDays}.
Completion rate: {completionRate}%.
```

### UI Flow for Today Tab

```
User opens Today tab
        ↓
GET /api/persona/mood/today
        ↓
No check-in today?          Check-in exists?
        ↓                          ↓
Show MoodCheckIn           Skip straight to task
component                  (show today's mood as small badge)
        ↓
User selects mood
        ↓
POST /api/persona/mood
        ↓
GET /api/challenges/:id/task
(mood-aware version generated)
        ↓
Show adaptive task
```

### One Check-In Per Day Rule

The `daily_mood_checkins` table has `UNIQUE(user_id, checkin_date)`. Once
a user has checked in today, the MoodCheckIn screen is skipped. The task
for that day is already set by their morning mood — it does not change
mid-day even if mood changes.

---

## UPDATED DATABASE SCHEMA (Additions Only)

These additions go on TOP of the existing schema from AGENT.md.
Run `docs/persona-schema-additions.sql` AFTER `docs/database-schema.sql`.

```sql
-- 1. users table gets new column:
ALTER TABLE users ADD COLUMN persona jsonb DEFAULT '{}';

-- 2. New table: daily_mood_checkins
--    (one row per user per day, unique constraint)

-- 3. New table: persona_conversations
--    (one row per user — running conversation history)
```

---

## UPDATED AI FUNCTIONS (Changes to lumio-coach.ts)

All existing 10 AI functions get two new optional parameters:

```typescript
personaContext?: string   // From buildPersonaContext(persona) in persona-engine.ts
moodContext?: string      // From MOOD_TO_TASK_MAP[mood].toneAdjustment
```

Both are injected at the TOP of the system prompt when present.
When absent, behavior is identical to before — fully backward-compatible.

**New AI functions added (total goes from 10 to 12):**

```
Function 11: handlePersonaConversation
  Purpose: Powers the persona builder conversation
  Lives in: persona-engine.ts (not lumio-coach.ts — it has its own flow)
  Params: userId, userMessage, language, callAI
  Returns: { reply, personaUpdated, phaseComplete }

Function 12: extractPersonaData
  Purpose: Parse conversation and extract structured persona fields
  Lives in: persona-engine.ts (internal function)
  Params: conversationHistory, currentPhase, existingPersona
  Returns: Partial<UserPersona>
```

---

## UPDATED ONBOARDING FLOW (Replaces Phase 20 onboarding quiz)

**Before (5-question form → AI recommendation)**
Old: lifeArea, goal, timeAvailable, experience, motivationStyle → JSON response

**After (conversational persona builder → first challenge)**

```
Day 0 Flow:
  1. App opens → PersonaChat component loads
  2. Phases 1-3 complete (name, who they are, inner world)
  3. onOnboardingComplete() fires → navigate to challenge creation
  4. Challenge creation uses persona.biggest_struggle + persona.goal
     as context for AI plan generation

Days 2-7 Flow:
  1. Before daily check-in: GET /api/persona/daily-question
  2. If question returned: show it as a "By the way..." card
  3. User answers in PersonaChat (compact mode)
  4. Phase marks complete → persona grows
  5. After day 7: full persona complete, stop asking
```

---

## UPDATED PLAN GATES

Persona builder and mood check-in are available to **ALL PLANS including Free**.
This is intentional — personalization is a retention mechanic, not a premium
feature. The more personalized the free experience, the higher the conversion
to paid.

```typescript
// No plan gate on:
POST /api/persona/message
POST /api/persona/mood
GET  /api/persona/mood/today
GET  /api/persona/task-context
```

---

## UPDATED CHECKLIST (Add to Phase 20 and Phase 6)

### Phase 6 (Daily Tasks) — Add These Tests:
```
□ Open Today tab with no check-in → MoodCheckIn screen shows
□ Select "Fired Up" → task generates with full intensity version
□ Select "Tired" → task is noticeably shorter/simpler
□ Select "Rough Day" → task is a reflection/recovery task, not the normal one
□ Open Today tab same day after check-in → no check-in screen, goes straight to task
□ Mood badge shows in Today tab header (small, not intrusive)
```

### Phase 20 (Onboarding) — Replace Quiz With:
```
□ First launch → PersonaChat loads immediately (no quiz form)
□ Coach asks "Hey! Before we begin — what's your name?"
□ Phase 1 completes → asks about life/work (Phase 2)
□ Phase 2 completes → asks about struggles/motivation (Phase 3)
□ Phase 3 completes → onOnboardingComplete() fires → challenge creation
□ Day 2 daily check-in includes Phase 4 question (daily routine)
□ Day 3 includes Phase 5 question (pets/family) — pet name stored
□ Day 5 includes Phase 7 question (coaching tone)
□ Coach chat uses preferred_name throughout
□ Coach chat references pet name when contextually appropriate
□ Persona object in Supabase grows correctly after each phase
```

---

## FILES TO CREATE / MODIFY SUMMARY

### New Files (created — ready to use):
```
shared/types/persona.ts
docs/persona-schema-additions.sql
backend/src/services/persona-engine.ts
backend/src/routes/persona.ts
backend/src/utils/validate-persona-additions.ts
apps/web/src/components/lumio/MoodCheckIn.tsx
apps/web/src/components/lumio/PersonaChat.tsx
apps/web/src/hooks/useMoodCheckIn.ts
```

### Existing Files to Modify:
```
backend/src/index.ts
  → app.use('/api/persona', personaRouter)
  → app.locals.callAI = callAI  (make AI available to routes via locals)

backend/src/services/ai/lumio-coach.ts
  → Add personaContext? and moodContext? params to all 10 functions
  → Prepend both to system prompts when present

backend/src/routes/challenges.ts
  → Before GET /api/challenges/:id/task: fetch persona + mood context
  → Pass both to generateDailyTask()

shared/types/index.ts
  → Add: import type { UserPersona } from './persona'
  → Add persona?: UserPersona to User interface

backend/src/utils/validate.ts
  → Append contents of validate-persona-additions.ts
```

---

*AGENT.md Additions v1.0 — Persona Builder + Mood-Adaptive Tasks*
*Feature Priority: VERY HIGH (retention-critical)*
*Affects: Onboarding (Phase 20), Daily Tasks (Phase 6), Coach Chat (Phase 9)*
*All users — no plan gate — personalization drives conversion*
