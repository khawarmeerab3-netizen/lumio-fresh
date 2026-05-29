// Lumio — backend/src/services/persona-engine.ts — Persona builder service

import { supabaseAdmin } from '../utils/supabase';
import type {
  UserPersona,
  PersonaTurn,
  DailyMoodState,
  DailyMoodCheckIn,
} from '../../../shared/types/persona';
import {
  MOOD_TO_TASK_MAP,
  getNextPersonaPhase,
  isPersonaPhaseComplete,
} from '../../../shared/types/persona';

// ─── Default empty persona ────────────────────────────────────────────────────

export function createEmptyPersona(realName: string): UserPersona {
  return {
    real_name: realName,
    preferred_name: realName,
    pets: [],
    existing_habits: [],
    hobbies: [],
    challenge_history: [],
    current_streak: 0,
    persona_phase_completed: 0,
    last_updated: new Date().toISOString(),
  };
}

// ─── Fetch persona for a user ─────────────────────────────────────────────────

export async function getPersona(userId: string): Promise<UserPersona | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('persona, name')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  // If persona column is empty, bootstrap from user's name
  if (!data.persona || !data.persona.preferred_name) {
    return createEmptyPersona(data.name);
  }

  return data.persona as UserPersona;
}

// ─── Save persona back to user row ────────────────────────────────────────────

export async function savePersona(userId: string, persona: UserPersona): Promise<void> {
  const updated: UserPersona = {
    ...persona,
    last_updated: new Date().toISOString(),
  };

  await supabaseAdmin
    .from('users')
    .update({ persona: updated })
    .eq('id', userId);
}

// ─── Get or create persona conversation ──────────────────────────────────────

export async function getPersonaConversation(
  userId: string
): Promise<{ messages: { role: string; content: string; timestamp: string }[]; currentPhase: number }> {
  const { data } = await supabaseAdmin
    .from('persona_conversations')
    .select('messages, current_phase')
    .eq('user_id', userId)
    .single();

  if (!data) {
    // Create new conversation row
    await supabaseAdmin.from('persona_conversations').insert({
      user_id: userId,
      messages: [],
      current_phase: 1,
    });
    return { messages: [], currentPhase: 1 };
  }

  return {
    messages: data.messages ?? [],
    currentPhase: data.current_phase ?? 1,
  };
}

// ─── Save persona conversation ────────────────────────────────────────────────

async function savePersonaConversation(
  userId: string,
  messages: { role: string; content: string; timestamp: string }[],
  currentPhase: number
): Promise<void> {
  await supabaseAdmin
    .from('persona_conversations')
    .upsert({
      user_id: userId,
      messages,
      current_phase: currentPhase,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
}

// ─── Phase question starters (what the AI is TRYING to learn per phase) ───────
// These are injected as context into the AI prompt — not shown to the user

const PHASE_OBJECTIVES: Record<number, string> = {
  1: `Your goal: Learn the user's real name and preferred name / nickname.
      Start with exactly: "Hey! Before we begin — what's your name?"
      After they answer, ask if they have a preferred nickname or alter ego name.`,

  2: `Your goal: Learn their profession, life situation (family/single/kids),
      age range, location, work environment (home/office/hybrid), and whether
      they are a morning person or night owl.
      Ask in 2-3 natural messages. Example opener:
      "So [preferred_name], what do you do? Could be your job, your role at home,
      your hustle — whatever takes up most of your day."`,

  3: `Your goal: Learn their biggest life struggle, why they've failed at habits
      before, and whether they are motivated more by fear or excitement.
      Ask in 2-3 messages. Example opener:
      "What's the one thing you keep wanting to fix about yourself or your life
      but haven't been able to crack yet?"`,

  4: `Your goal: Learn their daily routine (wake time, busy periods, wind down),
      how much time they can realistically give daily (5/15/30/60 min),
      and any physical limitations.
      Example opener: "Walk me through a typical day for you — roughly what
      time you wake up, when you get busy, when you wind down."`,

  5: `Your goal: Learn about the people in their life — family, partner, kids,
      and especially any pets (get pet names and types).
      Ask in ONE warm message. Example:
      "Now the fun part — who's in your world? Any family, partner, kids,
      close friends? And do you have any pets? 🐾"`,

  6: `Your goal: Learn existing habits (good and bad), hobbies and interests,
      and their relationship with their phone / social media.
      Ask in 2-3 messages. Example opener:
      "What habits do you already have — good or bad? Even small ones count."`,

  7: `Your goal: Learn how they learn best (reading/listening/watching/doing),
      whether they prefer competing or working quietly, and what coaching
      tone they prefer (tough / gentle / balanced).
      Ask in ONE message covering all three.`,
};

// ─── Build the system prompt for persona conversation AI ─────────────────────

function buildPersonaSystemPrompt(
  persona: UserPersona,
  currentPhase: number,
  language: string
): string {
  const preferredName = persona.preferred_name || persona.real_name || 'there';
  const phaseObjective = PHASE_OBJECTIVES[currentPhase] ?? '';

  return `You are the Lumio onboarding coach — warm, curious, genuinely interested in this person.
Your job right now is to build a deep personal profile through natural conversation.

CURRENT PHASE: ${currentPhase} of 7
PHASE OBJECTIVE:
${phaseObjective}

WHAT YOU ALREADY KNOW:
${JSON.stringify(persona, null, 2)}

GOLDEN RULES — NEVER BREAK THESE:
1. Never ask more than 2 questions in one message.
2. Always acknowledge what they said before asking the next thing.
3. If they reveal something emotional (grief, job loss, divorce, illness) —
   STOP the persona flow immediately. Say something human and warm. Do NOT
   continue asking questions. Just be present.
4. Use their preferred name often — it makes everything feel personal.
5. Keep messages SHORT and conversational. Max 3-4 sentences.
6. Never sound like a form or survey. Sound like a person who cares.
7. Respond in ${language}.

When you have gathered enough information for the current phase, end your
message with the exact token: [PHASE_${currentPhase}_COMPLETE]
This is invisible to the user — it tells the system to extract data and advance.`;
}

// ─── Extract persona data from AI conversation ────────────────────────────────
// Uses a separate AI call to parse what was learned from the conversation

function buildExtractionPrompt(
  messages: { role: string; content: string }[],
  currentPhase: number,
  existingPersona: UserPersona
): string {
  const conversation = messages
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n');

  return `You are a data extraction system. Read this conversation and extract
the user's personal information from Phase ${currentPhase}.

CONVERSATION:
${conversation}

EXISTING PERSONA (do not overwrite fields that already have values unless user corrected them):
${JSON.stringify(existingPersona, null, 2)}

Extract ONLY what was clearly stated in this conversation. Do not infer or assume.
If something was not mentioned, leave the field out of your response.

Return ONLY valid JSON with the extracted fields. No markdown, no explanation.
Example for Phase 1: {"real_name": "Ahmed", "preferred_name": "Ace"}
Example for Phase 5: {"pets": [{"name": "Bruno", "type": "dog"}], "kids": "2 kids, ages 5 and 8"}`;
}

// ─── Main persona conversation handler ───────────────────────────────────────

export async function handlePersonaMessage(
  userId: string,
  userMessage: string,
  language: string = 'en',
  callAI: (prompt: string, system: string) => Promise<string>
): Promise<{ reply: string; personaUpdated: boolean; phaseComplete: boolean }> {

  // 1. Load current state
  const [persona, { messages, currentPhase }] = await Promise.all([
    getPersona(userId),
    getPersonaConversation(userId),
  ]);

  const activePersona = persona ?? createEmptyPersona('');

  // 2. Append user message
  const updatedMessages = [
    ...messages,
    { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
  ];

  // 3. Build system prompt for current phase
  const systemPrompt = buildPersonaSystemPrompt(activePersona, currentPhase, language);

  // 4. Call AI
  const historyForAI = updatedMessages
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
    .join('\n');

  let reply = await callAI(historyForAI, systemPrompt);

  // 5. Check if phase is signalled complete
  const phaseCompleteToken = `[PHASE_${currentPhase}_COMPLETE]`;
  const phaseComplete = reply.includes(phaseCompleteToken);
  // Strip token from displayed reply
  reply = reply.replace(phaseCompleteToken, '').trim();

  // 6. Append coach reply
  const finalMessages = [
    ...updatedMessages,
    { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
  ];

  let nextPhase = currentPhase;
  let personaUpdated = false;

  // 7. If phase complete, extract data and advance
  if (phaseComplete) {
    try {
      const extractionPrompt = buildExtractionPrompt(
        finalMessages,
        currentPhase,
        activePersona
      );
      const extracted = await callAI(extractionPrompt, 'Return only valid JSON. No markdown.');
      const parsed = JSON.parse(extracted.replace(/```json|```/g, '').trim()) as Partial<UserPersona>;

      // Merge extracted fields into persona
      const mergedPersona: UserPersona = {
        ...activePersona,
        ...parsed,
        // Arrays need special merge (don't overwrite — merge)
        pets: parsed.pets ?? activePersona.pets,
        existing_habits: parsed.existing_habits ?? activePersona.existing_habits,
        hobbies: parsed.hobbies ?? activePersona.hobbies,
        persona_phase_completed: currentPhase,
      };

      await savePersona(userId, mergedPersona);
      personaUpdated = true;
      nextPhase = Math.min(currentPhase + 1, 7);
    } catch {
      // If extraction fails, just advance phase without data loss
      nextPhase = Math.min(currentPhase + 1, 7);
    }
  }

  // 8. Save conversation
  await savePersonaConversation(userId, finalMessages, nextPhase);

  return { reply, personaUpdated, phaseComplete };
}

// ─── Get today's first persona phase question ─────────────────────────────────
// Called on Day 2-7 to weave Phase 4-7 questions into daily check-in

export async function getDailyPersonaQuestion(
  userId: string,
  language: string = 'en',
  callAI: (prompt: string, system: string) => Promise<string>
): Promise<string | null> {

  const persona = await getPersona(userId);
  if (!persona) return null;

  const nextPhase = getNextPersonaPhase(persona);
  if (!nextPhase || nextPhase <= 3) return null; // Phases 1-3 done in onboarding
  if (nextPhase > 7) return null;                // All phases complete

  const objective = PHASE_OBJECTIVES[nextPhase];
  if (!objective) return null;

  // Generate a single natural question for today
  const prompt = `Generate ONE natural, warm conversation question to ask a user
as part of building their personal profile.

Phase to gather: ${nextPhase}
Objective: ${objective}
User's preferred name: ${persona.preferred_name}
What we already know: ${JSON.stringify(persona, null, 2)}

Rules:
- ONE question only, maximum 2 sentences
- Natural and warm, not clinical
- Reference their name
- Respond in ${language}
- Do NOT start with "I" or "As your coach"`;

  return callAI(prompt, 'You generate warm, natural one-question prompts for a life coaching app.');
}

// ─── Build persona context string for coach chat ──────────────────────────────
// Injected into coach chat system prompt so coach knows the user personally

export function buildPersonaContext(persona: UserPersona | null): string {
  if (!persona || !persona.preferred_name) return '';

  const lines: string[] = [
    `USER PERSONAL PROFILE (use this naturally — never robotically reference it):`,
    `- Preferred name: ${persona.preferred_name}`,
  ];

  if (persona.profession) lines.push(`- What they do: ${persona.profession}`);
  if (persona.life_situation) lines.push(`- Life situation: ${persona.life_situation}`);
  if (persona.location) lines.push(`- Location: ${persona.location}`);
  if (persona.age_range) lines.push(`- Age range: ${persona.age_range}`);
  if (persona.biggest_struggle) lines.push(`- Biggest struggle: ${persona.biggest_struggle}`);
  if (persona.past_failure_reason) lines.push(`- Why they've failed before: ${persona.past_failure_reason}`);
  if (persona.motivation_type) lines.push(`- Motivation type: ${persona.motivation_type}`);
  if (persona.available_time) lines.push(`- Daily time available: ${persona.available_time}`);
  if (persona.coaching_tone) lines.push(`- Preferred coaching tone: ${persona.coaching_tone}`);

  if (persona.pets.length > 0) {
    const petList = persona.pets.map((p) => `${p.name} the ${p.type}`).join(', ');
    lines.push(`- Pets: ${petList}`);
  }

  if (persona.partner) lines.push(`- Partner: ${persona.partner}`);
  if (persona.kids) lines.push(`- Kids: ${persona.kids}`);

  if (persona.existing_habits.length > 0) {
    lines.push(`- Existing habits: ${persona.existing_habits.join(', ')}`);
  }
  if (persona.hobbies.length > 0) {
    lines.push(`- Hobbies: ${persona.hobbies.join(', ')}`);
  }

  lines.push(`\nUSE THIS CONTEXT to make every response feel personal.`);
  lines.push(`Reference their pets, city, profession naturally when relevant.`);
  lines.push(`Always address them as "${persona.preferred_name}" — never their real name.`);

  return lines.join('\n');
}

// ─── Daily mood check-in ──────────────────────────────────────────────────────

export async function saveDailyMoodCheckIn(
  userId: string,
  challengeId: string | null,
  mood: DailyMoodState,
  note?: string
): Promise<DailyMoodCheckIn> {
  const today = new Date().toISOString().split('T')[0];

  // Upsert — one check-in per user per day
  await supabaseAdmin
    .from('daily_mood_checkins')
    .upsert(
      {
        user_id:      userId,
        challenge_id: challengeId,
        mood,
        note,
        checkin_date: today,
      },
      { onConflict: 'user_id,checkin_date' }
    );

  // Also update persona.emotional_state_today
  const persona = await getPersona(userId);
  if (persona) {
    await savePersona(userId, { ...persona, emotional_state_today: mood });
  }

  return { mood, checkedInAt: today, note };
}

export async function getTodaysMoodCheckIn(
  userId: string
): Promise<DailyMoodCheckIn | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabaseAdmin
    .from('daily_mood_checkins')
    .select('mood, note, checkin_date')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .single();

  if (!data) return null;

  return {
    mood: data.mood as DailyMoodState,
    note: data.note,
    checkedInAt: data.checkin_date,
  };
}

// ─── Get adaptive task context based on today's mood ─────────────────────────

export async function getAdaptiveTaskContext(userId: string) {
  const checkIn = await getTodaysMoodCheckIn(userId);
  if (!checkIn) {
    // Default to standard if no check-in
    return MOOD_TO_TASK_MAP['okay'];
  }
  return MOOD_TO_TASK_MAP[checkIn.mood];
}
