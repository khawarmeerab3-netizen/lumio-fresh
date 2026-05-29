// Lumio — backend/src/routes/persona.ts — Persona builder and daily mood check-in routes

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  handlePersonaMessage,
  getPersona,
  getPersonaConversation,
  saveDailyMoodCheckIn,
  getTodaysMoodCheckIn,
  getAdaptiveTaskContext,
  getDailyPersonaQuestion,
} from '../services/persona-engine';
import { validate } from '../utils/validate';
import { z } from 'zod';
import { validationError } from '../utils/errors';

// ─── We import callAI lazily to avoid circular deps ──────────────────────────
// The actual AI provider is imported at route registration time in index.ts
// and passed in via app.locals

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PersonaMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

const MoodCheckInSchema = z.object({
  mood:        z.enum(['fired_up', 'okay', 'tired', 'rough_day']),
  challengeId: z.string().uuid().optional().nullable(),
  note:        z.string().max(300).optional(),
});

// ─── GET /api/persona — Get user's current persona ───────────────────────────

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const persona = await getPersona(req.user!.id);
    res.json({ data: { persona }, error: null, message: 'OK' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/persona/conversation — Get persona conversation history ─────────

router.get(
  '/conversation',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, currentPhase } = await getPersonaConversation(req.user!.id);
      res.json({ data: { messages, currentPhase }, error: null, message: 'OK' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/persona/message — Send a message in the persona conversation ───

router.post(
  '/message',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = validate(PersonaMessageSchema, req.body);
      const callAI = req.app.locals.callAI as (p: string, s: string) => Promise<string>;
      const language = req.user!.selected_language ?? 'en';

      const result = await handlePersonaMessage(
        req.user!.id,
        message,
        language,
        callAI
      );

      res.json({
        data: {
          reply:          result.reply,
          personaUpdated: result.personaUpdated,
          phaseComplete:  result.phaseComplete,
        },
        error:   null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/persona/daily-question — Get today's persona question (Days 2-7) ─

router.get(
  '/daily-question',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callAI  = req.app.locals.callAI as (p: string, s: string) => Promise<string>;
      const language = req.user!.selected_language ?? 'en';
      const question = await getDailyPersonaQuestion(req.user!.id, language, callAI);

      res.json({
        data:    { question },  // null if no question needed today
        error:   null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/persona/mood — Submit today's mood check-in ───────────────────

router.post(
  '/mood',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mood, challengeId, note } = validate(MoodCheckInSchema, req.body);
      const checkIn = await saveDailyMoodCheckIn(
        req.user!.id,
        challengeId ?? null,
        mood,
        note
      );

      res.json({ data: { checkIn }, error: null, message: 'Mood saved' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/persona/mood/today — Get today's mood check-in ─────────────────

router.get(
  '/mood/today',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checkIn = await getTodaysMoodCheckIn(req.user!.id);
      res.json({ data: { checkIn }, error: null, message: 'OK' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/persona/task-context — Get adaptive task context from mood ──────

router.get(
  '/task-context',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = await getAdaptiveTaskContext(req.user!.id);
      res.json({ data: { context }, error: null, message: 'OK' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
