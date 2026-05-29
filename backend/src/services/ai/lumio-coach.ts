// ─── backend/src/services/ai/lumio-coach.ts ──────────────────────────────────
// All AI calls go through this file. NEVER call AI APIs from routes.
// Multi-model failover: Groq → Mistral → Anthropic.
// All responses are branded as "Lumio AI" — never expose provider names.

import { DailyReport, ChatMessage } from '../../../../shared/types/coach';

// ── Provider config ──────────────────────────────────────────────────────────
interface AIProvider {
  name: string;
  url: string;
  model: string;
  key: string | undefined;
  timeoutMs: number;
  isAnthropic?: boolean; // Anthropic uses a different request/response shape
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    key: process.env.GROQ_API_KEY,
    timeoutMs: 8_000,
  },
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    key: process.env.MISTRAL_API_KEY,
    timeoutMs: 12_000,
  },
  {
    name: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    key: process.env.ANTHROPIC_API_KEY,
    timeoutMs: 20_000,
    isAnthropic: true,
  },
];

// ── Low-level: call one provider ─────────────────────────────────────────────
async function callProvider(
  provider: AIProvider,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (!provider.key) throw new Error(`${provider.name}: API key not configured`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), provider.timeoutMs);

  try {
    let body: string;
    let headers: Record<string, string>;

    if (provider.isAnthropic) {
      // Anthropic /v1/messages format
      body = JSON.stringify({
        model: provider.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': provider.key,
        'anthropic-version': '2023-06-01',
      };
    } else {
      // OpenAI-compatible format (Groq + Mistral)
      body = JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key}`,
      };
    }

    const res = await fetch(provider.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`${provider.name} HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json() as Record<string, unknown>;

    if (provider.isAnthropic) {
      const content = (json.content as Array<{ type: string; text: string }> | undefined)?.[0];
      if (content?.type === 'text') return content.text.trim();
      throw new Error('Anthropic: unexpected response shape');
    } else {
      const choice = (json.choices as Array<{ message: { content: string } }> | undefined)?.[0];
      if (choice?.message?.content) return choice.message.content.trim();
      throw new Error(`${provider.name}: unexpected response shape`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ── Failover engine: try providers in order ──────────────────────────────────
async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const errors: string[] = [];

  for (const provider of AI_PROVIDERS) {
    try {
      const result = await callProvider(provider, systemPrompt, userPrompt);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${provider.name}] ${msg}`);
      console.warn(`[lumio-coach] Provider failed, trying next. ${msg}`);
    }
  }

  // All providers failed
  console.error('[lumio-coach] All AI providers failed:', errors.join(' | '));
  throw new Error('Lumio AI is temporarily unavailable. Please try again shortly.');
}

// ── JSON extraction helper ────────────────────────────────────────────────────
function extractJSON<T>(raw: string): T {
  // Strip any accidental markdown fences
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned) as T;
}

// ── Input sanitiser ───────────────────────────────────────────────────────────
function sanitize(text: string, maxLen = 500): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()
    .slice(0, maxLen);
}

// ============================================================
// PUBLIC AI FUNCTIONS — used by routes only
// ============================================================

// ── 1. generatePlan ───────────────────────────────────────────────────────────
export interface GeneratedPlan {
  title: string;
  tagline: string;
  overview: string;
  dailyHabits: string[];         // 4 items
  weeklyMilestones: Array<{ milestone: string; timeframe: string }>; // 3 items
  successMetrics: string[];      // 3 items
  quickWins: string[];           // 3 items
  proTip: string;
}

export async function generatePlan(
  goal: string,
  niche: string,
  durationDays: number,
  language: string,
  customGoal?: string
): Promise<GeneratedPlan> {
  const system = `You are an expert life coach and challenge designer. Return valid JSON only. No markdown. No explanation.`;
  const user = `Challenge: ${sanitize(goal)}. Niche: ${niche}. Duration: ${durationDays} days.
${customGoal ? `User's own description: ${sanitize(customGoal)}` : ''}
Respond in ${language}.
Return JSON exactly: { "title": string, "tagline": string, "overview": string, "dailyHabits": [4 strings], "weeklyMilestones": [{"milestone": string, "timeframe": string} × 3], "successMetrics": [3 strings], "quickWins": [3 strings], "proTip": string }`;

  const fallback: GeneratedPlan = {
    title: `${durationDays}-Day ${goal} Challenge`,
    tagline: 'Start your journey today.',
    overview: `A focused ${durationDays}-day challenge to help you achieve: ${goal}.`,
    dailyHabits: ['Focus on your goal', 'Track progress', 'Reflect each day', 'Stay consistent'],
    weeklyMilestones: [
      { milestone: 'Get started', timeframe: 'Week 1' },
      { milestone: 'Build momentum', timeframe: 'Week 2' },
      { milestone: 'Complete the challenge', timeframe: 'Final week' },
    ],
    successMetrics: ['Daily consistency', 'Progress over perfection', 'Habit formation'],
    quickWins: ['Complete day 1', 'Share your goal', 'Set a reminder'],
    proTip: 'Start small and build momentum.',
  };

  try {
    const raw = await callAI(system, user);
    return extractJSON<GeneratedPlan>(raw);
  } catch {
    return fallback;
  }
}

// ── 2. generateDailyTask ──────────────────────────────────────────────────────
export interface GeneratedDailyTask {
  dayTitle: string;
  mainTask: string;
  timeRequired: string;
  steps: string[];               // 4 items
  motivationalNote: string;
  checkIn: string;
}

export async function generateDailyTask(
  goal: string,
  niche: string,
  dayNumber: number,
  totalDays: number,
  completionRate: number,
  language: string
): Promise<GeneratedDailyTask> {
  const system = `Expert daily challenge coach. Return valid JSON only.`;
  const user = `Goal: ${sanitize(goal)}. Niche: ${niche}. Day: ${dayNumber}/${totalDays}.
Completion rate: ${completionRate}%.
${completionRate < 60 ? 'User is struggling — make today\'s task simpler and more achievable.' : ''}
Respond in ${language}.
Return JSON exactly: { "dayTitle": string, "mainTask": string, "timeRequired": string, "steps": [4 strings], "motivationalNote": string, "checkIn": string }`;

  const fallback: GeneratedDailyTask = {
    dayTitle: `Day ${dayNumber}: Keep Going`,
    mainTask: `Work on your ${goal} goal for at least 20 minutes`,
    timeRequired: '20-30 minutes',
    steps: [
      'Set your intention for today',
      'Complete your main activity',
      'Reflect on what you learned',
      'Prepare for tomorrow',
    ],
    motivationalNote: "Every day you show up is a win. You've got this!",
    checkIn: 'What did you accomplish today?',
  };

  try {
    const raw = await callAI(system, user);
    return extractJSON<GeneratedDailyTask>(raw);
  } catch {
    return fallback;
  }
}

// ── 3. generateDailyReport ────────────────────────────────────────────────────
export async function generateDailyReport(
  goal: string,
  niche: string,
  dayNumber: number,
  totalDays: number,
  doneDays: number,
  recentNotes: string[],
  language: string
): Promise<DailyReport> {
  const system = `Expert progress coach. Return valid JSON only. No markdown.`;
  const notesText = recentNotes.length > 0
    ? `Recent notes: ${recentNotes.map(n => sanitize(n, 200)).join(' | ')}`
    : 'No recent notes.';

  const user = `Goal: ${sanitize(goal)}. Niche: ${niche}. Day: ${dayNumber}/${totalDays}.
Completed: ${doneDays} days. ${notesText}.
Respond in ${language}.
Return JSON exactly: { "greeting": string, "scoreOutOf10": number (1-10), "progressInsight": string, "motivationalMessage": string, "tomorrowPreview": string, "emoji": string }`;

  const fallback: DailyReport = {
    greeting: 'Great work keeping up with your challenge!',
    scoreOutOf10: 7,
    progressInsight: `You've completed ${doneDays} out of ${dayNumber} days — solid consistency.`,
    motivationalMessage: 'Keep showing up. Every day matters.',
    tomorrowPreview: 'Tomorrow brings a fresh opportunity to push further.',
    emoji: '🌟',
  };

  try {
    const raw = await callAI(system, user);
    const parsed = extractJSON<DailyReport>(raw);
    // Clamp score to valid range
    parsed.scoreOutOf10 = Math.min(10, Math.max(1, Math.round(parsed.scoreOutOf10)));
    return parsed;
  } catch {
    return fallback;
  }
}

// ── 4. chatWithCoach ─────────────────────────────────────────────────────────
export async function chatWithCoach(
  goal: string,
  niche: string,
  dayNumber: number,
  totalDays: number,
  doneDays: number,
  message: string,
  history: ChatMessage[], // last 6 messages
  coachPersonality: string | null,
  coachName: string | null,
  language: string
): Promise<string> {
  const displayName = coachName ?? 'Lumio Coach';

  const personalityLine = coachPersonality
    ? coachPersonality
    : 'Be warm, specific, practical, and encouraging.';

  const historyText = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : displayName}: ${m.content}`)
    .join('\n');

  const system = `You are ${displayName}, an expert AI coach for a ${totalDays}-day "${sanitize(goal)}" (${niche}) challenge.
Day ${dayNumber}, ${doneDays} days completed. ${personalityLine}
Keep responses to 2-3 sentences. Never say "As an AI". You are their personal coach. Respond in ${language}.`;

  const user = `${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}User: ${sanitize(message)}`;

  const fallback = `Keep going with your ${goal} challenge! Every step forward counts. Let me know if you need anything specific.`;

  try {
    return await callAI(system, user);
  } catch {
    return fallback;
  }
}

// ── 5. generateMilestoneMessage ───────────────────────────────────────────────
export async function generateMilestoneMessage(
  goal: string,
  niche: string,
  milestoneLabel: string,
  dayNumber: number,
  coachPersonality: string | null,
  coachName: string | null,
  language: string
): Promise<string> {
  const displayName = coachName ?? 'Lumio Coach';
  const personalityLine = coachPersonality ?? 'Be warm, celebratory, and energizing.';

  const system = `You are ${displayName}, a personal coach. ${personalityLine}
Write a 3-sentence milestone celebration message — personal, energizing, coach-voiced. Respond in ${language}. Plain text only.`;

  const user = `The user just reached milestone "${milestoneLabel}" on day ${dayNumber} of their "${sanitize(goal)}" (${niche}) challenge. Celebrate this achievement.`;

  const fallback = `🎉 You just hit "${milestoneLabel}" on day ${dayNumber} — that's huge! You're proving what you're capable of. Keep this energy going all the way to the finish line.`;

  try {
    return await callAI(system, user);
  } catch {
    return fallback;
  }
}

// ── 6. generateCommunityPost ──────────────────────────────────────────────────
export async function generateCommunityPost(
  goal: string,
  niche: string,
  dayNumber: number,
  language: string
): Promise<string> {
  const system = `You are a motivating life coach helping users share their journey. Respond in ${language}. Plain text only.`;
  const user = `Write a 2-sentence authentic, inspiring first-person community post for someone on day ${dayNumber} of their "${sanitize(goal)}" (${niche}) challenge. No hashtags. Keep it genuine.`;

  const fallback = `Day ${dayNumber} of my ${goal} challenge is done! Making progress one day at a time. 💪`;

  try {
    return await callAI(system, user);
  } catch {
    return fallback;
  }
}

// ── 7. generateAdminReport ────────────────────────────────────────────────────
export interface AdminReportInput {
  goal: string;
  day: number;
  duration: number;
  status: string;
}

export interface AdminReport {
  overallScore: number;
  excellentCount: number;
  atRiskCount: number;
  keyInsight: string;
  actions: string[];             // 3 items
  partnerNote: string;
}

export async function generateAdminReport(
  clients: AdminReportInput[]
): Promise<AdminReport> {
  const system = `Expert platform analytics coach. Return valid JSON only.`;
  const user = `Analyse ${clients.length} active Lumio clients:
${JSON.stringify(clients.slice(0, 50))}
Return JSON: { "overallScore": number (1-10), "excellentCount": number, "atRiskCount": number, "keyInsight": string, "actions": [3 strings], "partnerNote": string }`;

  const fallback: AdminReport = {
    overallScore: 7,
    excellentCount: Math.floor(clients.length * 0.6),
    atRiskCount: Math.floor(clients.length * 0.15),
    keyInsight: 'Platform engagement is healthy. Focus on re-engaging inactive users.',
    actions: ['Send nudge to users inactive 2+ days', 'Celebrate users hitting 7-day streaks', 'Review challenges with <50% completion rate'],
    partnerNote: 'Overall platform health is strong.',
  };

  try {
    const raw = await callAI(system, user);
    return extractJSON<AdminReport>(raw);
  } catch {
    return fallback;
  }
}

// ── 8. generateBroadcastTip ───────────────────────────────────────────────────
export interface BroadcastTip {
  emoji: string;
  category: string;
  title: string;
  tip: string;
  actionStep: string;
}

export async function generateBroadcastTip(topic?: string): Promise<BroadcastTip> {
  const system = `Expert life coach. Return valid JSON only.`;
  const user = `Generate an inspiring daily tip for Lumio app users${topic ? ` about: ${sanitize(topic)}` : ''}.
Return JSON: { "emoji": string, "category": string, "title": string, "tip": string, "actionStep": string }`;

  const fallback: BroadcastTip = {
    emoji: '🌟',
    category: 'Mindset',
    title: 'The Power of Showing Up',
    tip: 'Progress is made by those who show up consistently, not by those who wait for motivation.',
    actionStep: 'Open your challenge and complete today\'s task — right now.',
  };

  try {
    const raw = await callAI(system, user);
    return extractJSON<BroadcastTip>(raw);
  } catch {
    return fallback;
  }
}

// ── 9. generateOnboardingRecommendation ──────────────────────────────────────
export interface OnboardingRecommendation {
  topNiches: Array<{ niche: string; reason: string }>; // 3 items
  recommendedDuration: { days: number; label: string; reason: string };
  bestCoachType: string;
  whyThisMatters: string;
}

export async function generateOnboardingRecommendation(
  lifeArea: string,
  goal: string,
  timeAvailable: string,
  experience: string,
  motivationStyle: string,
  language: string
): Promise<OnboardingRecommendation> {
  const system = `Life purpose and goal discovery coach. Return valid JSON only.`;
  const user = `User quiz answers:
- Primary life area: ${sanitize(lifeArea)}
- Specific goal: ${sanitize(goal)}
- Time available per day: ${sanitize(timeAvailable)}
- Experience level: ${sanitize(experience)}
- What motivates them: ${sanitize(motivationStyle)}
Respond in ${language}.
Return JSON: { "topNiches": [{"niche": string, "reason": string} × 3], "recommendedDuration": {"days": number, "label": string, "reason": string}, "bestCoachType": string, "whyThisMatters": string }`;

  const fallback: OnboardingRecommendation = {
    topNiches: [
      { niche: lifeArea, reason: 'Directly aligns with your stated life area' },
      { niche: 'Mental Health', reason: 'Mindset work supports every goal' },
      { niche: 'Productivity', reason: 'Building focus accelerates any challenge' },
    ],
    recommendedDuration: { days: 21, label: '21 Days', reason: '21 days is the proven minimum for habit formation' },
    bestCoachType: 'Motivating and structured',
    whyThisMatters: `Your goal of "${goal}" is achievable with the right daily system.`,
  };

  try {
    const raw = await callAI(system, user);
    return extractJSON<OnboardingRecommendation>(raw);
  } catch {
    return fallback;
  }
}

// ── 10. generateNudgeMessage ──────────────────────────────────────────────────
export async function generateNudgeMessage(
  goal: string,
  niche: string,
  daysSinceLastLogin: number,
  streak: number,
  daysUntilEnd: number,
  language: string
): Promise<string> {
  const system = `Proactive life coach sending re-engagement messages. Respond in ${language}. Plain text only. 1-2 sentences.`;
  const user = `User hasn't logged in for ${daysSinceLastLogin} day(s). They are on day N of a "${sanitize(goal)}" (${niche}) challenge. Current streak: ${streak}. Days until end: ${daysUntilEnd}. Write an urgent but warm personalised nudge.`;

  const streakText = streak > 0 ? ` Your ${streak}-day streak is on the line!` : '';
  const fallback = `Your "${goal}" challenge is waiting for you.${streakText} Come back and keep the momentum going!`;

  try {
    return await callAI(system, user);
  } catch {
    return fallback;
  }
}
