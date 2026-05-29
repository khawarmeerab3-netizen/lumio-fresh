// Lumio — backend/src/utils/validate-persona-additions.ts
// These schemas are ADDED to validate.ts — append them to the existing file.
// They are kept separate here so you can clearly see what's new.

import { z } from 'zod';

// ─── Persona schemas ──────────────────────────────────────────────────────────

export const PersonaMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
});

export const MoodCheckInSchema = z.object({
  mood:        z.enum(['fired_up', 'okay', 'tired', 'rough_day'], {
    errorMap: () => ({ message: 'Mood must be: fired_up, okay, tired, or rough_day' }),
  }),
  challengeId: z.string().uuid().optional().nullable(),
  note:        z.string().max(300, 'Note must be 300 characters or less').optional(),
});

export const UpdatePersonaFieldSchema = z.object({
  // Allows directly patching specific persona fields (admin use or corrections)
  preferred_name:     z.string().min(1).max(80).optional(),
  coaching_tone:      z.enum(['tough', 'gentle', 'balanced']).optional(),
  available_time:     z.string().optional(),
  physical_limitations: z.string().max(300).optional(),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type PersonaMessageInput      = z.infer<typeof PersonaMessageSchema>;
export type MoodCheckInInput         = z.infer<typeof MoodCheckInSchema>;
export type UpdatePersonaFieldInput  = z.infer<typeof UpdatePersonaFieldSchema>;
