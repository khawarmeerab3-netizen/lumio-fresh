// ─── shared/types/coach.ts ────────────────────────────────────────────────────
// All types shared between frontend and backend for coach, chat, and reports.

export interface Coach {
  id: string;
  name: string;
  title: string;
  gender: 'male' | 'female' | 'neutral';
  niche_id: string;
  personality: string;
  speaking_style: string;
  specialty: string;
  catchphrase: string;
  avatar_url: string;
  is_supersonic: boolean;
  min_plan: 'starter' | 'pro' | 'elite';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

export interface CoachConversation {
  id: string;
  user_id: string;
  challenge_id: string;
  coach_id: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  greeting: string;
  scoreOutOf10: number;         // 1–10
  progressInsight: string;
  motivationalMessage: string;
  tomorrowPreview: string;
  emoji: string;
}

export interface MilestoneMessageResult {
  message: string;
}

// ─── Request body shapes ──────────────────────────────────────────────────────
export interface ChatRequestBody {
  message: string; // max 500 chars
}

export interface SetCoachRequestBody {
  coachId: string;
}

export interface MilestoneMessageRequestBody {
  milestoneLabel: string;
  dayNumber: number;
}
