// ─── backend/src/routes/coaches.ts ───────────────────────────────────────────
// Public coach directory endpoints.
// All routes in this file are unauthenticated (coaches are public reference data).

import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { toApiError } from '../utils/errors';
import type { Coach } from '../routes/coach';

const router = Router();

// Service-role client — coaches table is public read, but using service client
// here avoids depending on user auth for these public endpoints.
const publicSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // anon key is fine — coaches has public SELECT RLS policy
);

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/coaches — List all coaches (optional ?nicheId= filter)
// ══════════════════════════════════════════════════════════════════════════════
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { nicheId } = req.query;

    let query = publicSupabase
      .from('coaches')
      .select('id, name, title, gender, niche_id, specialty, catchphrase, avatar_url, is_supersonic, min_plan')
      .order('niche_id')
      .order('min_plan');

    if (nicheId && typeof nicheId === 'string') {
      query = query.eq('niche_id', nicheId);
    }

    const { data: coaches, error } = await query;

    if (error) {
      throw new Error('Failed to fetch coaches');
    }

    res.json({
      data: { coaches: (coaches ?? []) as Coach[] },
      error: null,
      message: `${(coaches ?? []).length} coaches`,
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/coaches/:id — Single coach by ID
// ══════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: coach, error } = await publicSupabase
      .from('coaches')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !coach) {
      res.status(404).json({
        data: null,
        error: 'Coach not found',
        message: 'Coach not found',
      });
      return;
    }

    res.json({
      data: { coach: coach as Coach },
      error: null,
      message: 'Coach found',
    });
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
});

export default router;
