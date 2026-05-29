// Lumio — shared/types/persona.ts — UserPersona and daily mood check-in types

// ─── Daily mood states (used before every challenge task) ─────────────────────

export type DailyMoodState = 'fired_up' | 'okay' | 'tired' | 'rough_day';

export interface DailyMoodCheckIn {
  mood: DailyMoodState;
  checkedInAt: string; // ISO date string — today's date
  note?: string;       // Optional extra context the user types
}

// ─── Pet profile ──────────────────────────────────────────────────────────────

export interface Pet {
  name: string;
  type: string; // "dog", "cat", "bird", etc.
}

// ─── Full persona profile — stored in users.persona (JSONB) ──────────────────

export interface UserPersona {
  // Phase 1 — Name
  real_name: string;
  preferred_name: string;          // Always use this, never real_name

  // Phase 2 — Who they are
  profession?: string;
  life_situation?: string;         // e.g. "married, 2 kids, work from home"
  age_range?: string;              // e.g. "25-34"
  location?: string;               // city/country
  work_environment?: string;       // "home" | "office" | "hybrid"
  time_of_day?: string;            // "morning person" | "night owl"

  // Phase 3 — Inner world
  biggest_struggle?: string;
  goal?: string;                   // Their own words for their goal
  past_failure_reason?: string;    // Why they've quit before
  motivation_type?: 'fear' | 'excitement' | 'both';

  // Phase 4 — Daily life (collected day 2-4)
  daily_routine?: string;
  available_time?: string;         // "5 min" | "15 min" | "30 min" | "1 hour+"
  physical_limitations?: string;

  // Phase 5 — People and pets (collected day 3-5)
  family?: string;
  partner?: string;
  kids?: string;
  pets: Pet[];

  // Phase 6 — Habits and lifestyle (collected day 4-6)
  existing_habits: string[];
  hobbies: string[];
  phone_relationship?: 'healthy' | 'addicted' | 'trying to cut back';

  // Phase 7 — How they grow (collected day 5-7)
  learning_style?: string;         // "reading" | "listening" | "watching" | "doing"
  growth_mode?: 'competitive' | 'reflective' | 'both';
  coaching_tone?: 'tough' | 'gentle' | 'balanced';

  // Tracked automatically
  challenge_history: string[];     // Array of niche labels they've tried
  current_streak: number;
  emotional_state_today?: DailyMoodState;

  // Persona build progress
  persona_phase_completed: number; // 0–7, increments as phases complete
  last_updated: string;            // ISO timestamp
}

// ─── Persona build conversation turn ─────────────────────────────────────────

export interface PersonaTurn {
  phase: number;          // 1–7
  userMessage: string;
  extractedData: Partial<UserPersona>;
  nextQuestion: string;   // What the AI asks next
  phaseComplete: boolean; // True when this phase is fully gathered
}

// ─── Adaptive task variants (driven by daily mood) ───────────────────────────

export type TaskIntensity = 'full' | 'standard' | 'lighter' | 'recovery';

export interface AdaptiveTaskContext {
  mood: DailyMoodState;
  intensity: TaskIntensity;
  toneAdjustment: string; // injected into AI prompt
  timeAdjustment: string; // "cut time estimate by 30%" or "add intensity"
}

// ─── Mood → task intensity mapping ───────────────────────────────────────────

export const MOOD_TO_TASK_MAP: Record<DailyMoodState, AdaptiveTaskContext> = {
  fired_up: {
    mood: 'fired_up',
    intensity: 'full',
    toneAdjustment: 'User is highly energized and motivated today. Give the full-intensity version of the task. Add a bonus challenge at the end.',
    timeAdjustment: 'Can handle up to 20% more time than usual.',
  },
  okay: {
    mood: 'okay',
    intensity: 'standard',
    toneAdjustment: 'User is in a normal headspace. Serve the standard version of the task with warm encouragement.',
    timeAdjustment: 'Keep to the standard time estimate.',
  },
  tired: {
    mood: 'tired',
    intensity: 'lighter',
    toneAdjustment: 'User is tired today. Serve a lighter, simpler version of the task. Cut complexity by 30%. Lead with the easiest first step. Be extra encouraging.',
    timeAdjustment: 'Reduce time estimate by 25-30%. Make it feel achievable in a short burst.',
  },
  rough_day: {
    mood: 'rough_day',
    intensity: 'recovery',
    toneAdjustment: 'User is having a rough day. Skip the normal task entirely. Serve a reflection, gratitude, or recovery challenge instead. Be warm, human, and gentle. Acknowledge that rest is progress.',
    timeAdjustment: 'Maximum 10 minutes. Focus on emotional restoration, not task completion.',
  },
};

// ─── Persona completion check ─────────────────────────────────────────────────

export function isPersonaPhaseComplete(persona: UserPersona, phase: number): boolean {
  switch (phase) {
    case 1: return !!(persona.real_name && persona.preferred_name);
    case 2: return !!(persona.profession && persona.age_range);
    case 3: return !!(persona.biggest_struggle && persona.motivation_type);
    case 4: return !!(persona.available_time);
    case 5: return true; // Pets/family is optional, phase always "complete" once asked
    case 6: return !!(persona.existing_habits.length > 0 || persona.hobbies.length > 0);
    case 7: return !!(persona.coaching_tone);
    default: return false;
  }
}

export function getPersonaCompletionPct(persona: UserPersona): number {
  let completed = 0;
  for (let i = 1; i <= 7; i++) {
    if (isPersonaPhaseComplete(persona, i)) completed++;
  }
  return Math.round((completed / 7) * 100);
}

export function getNextPersonaPhase(persona: UserPersona): number | null {
  for (let i = 1; i <= 7; i++) {
    if (!isPersonaPhaseComplete(persona, i)) return i;
  }
  return null; // All phases complete
}
