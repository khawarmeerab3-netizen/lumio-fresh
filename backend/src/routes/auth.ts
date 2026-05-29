import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabaseAdmin } from '../utils/supabase';
import { validate } from '../utils/validate';
import { env } from '../utils/env';
import { auth } from '../middleware/auth';
import { conflict, notFound } from '../utils/errors';
import { loginRateLimit, registerRateLimit } from '../middleware/rate-limit';
import { sanitizeLabel } from '../utils/sanitize';

export const authRouter = Router();

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
  selected_mood: z.string().optional(),
  selected_language: z.string().optional(),
  notification_time: z.string().optional(),
  onboarding_completed: z.boolean().optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...rest } = user as Record<string, unknown>;
  return rest;
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────

authRouter.post(
  '/register',
  registerRateLimit,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(RegisterSchema, req.body);
      // Sanitize name: strip HTML tags, enforce max length
      body.name = sanitizeLabel(body.name);

      // Check email uniqueness
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', body.email)
        .maybeSingle();

      if (existing) {
        throw conflict('Email already in use');
      }

      // Hash password
      const password_hash = await bcrypt.hash(body.password, 10);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message ?? 'Failed to create auth user');
      }

      // Insert into public users table using the auth user's id
      const { data: user, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: body.email,
          name: body.name,
          password_hash,
        })
        .select()
        .single();

      if (insertError || !user) {
        // Rollback: delete the auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        throw new Error(insertError?.message ?? 'Failed to create user record');
      }

      const token = signToken(user.id);

      res.status(201).json({
        data: { user: sanitizeUser(user), token },
        error: null,
        message: 'Account created',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

authRouter.post(
  '/login',
  loginRateLimit,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(LoginSchema, req.body);

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', body.email)
        .maybeSingle();

      if (error || !user) {
        throw notFound('Invalid email or password');
      }

      const valid = await bcrypt.compare(body.password, user.password_hash as string);
      if (!valid) {
        throw notFound('Invalid email or password');
      }

      const token = signToken(user.id);

      res.status(200).json({
        data: { user: sanitizeUser(user), token },
        error: null,
        message: 'Welcome back',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

authRouter.post(
  '/refresh',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = signToken(req.user.id);
      res.status(200).json({
        data: { token },
        error: null,
        message: 'Token refreshed',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Users sub-router (mounted under /api/users by index.ts) ─────────────────

export const usersRouter = Router();

// GET /api/users/me
usersRouter.get(
  '/me',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        data: { user: sanitizeUser(req.user as unknown as Record<string, unknown>) },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/users/me
usersRouter.patch(
  '/me',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = validate(UpdateUserSchema, req.body);
      // Sanitize mutable string fields before writing to DB
      if (body.name !== undefined)           body.name = sanitizeLabel(body.name);
      if (body.selected_mood !== undefined)  body.selected_mood = sanitizeLabel(body.selected_mood, 50);
      if (body.selected_language !== undefined) body.selected_language = sanitizeLabel(body.selected_language, 20);

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error || !user) {
        throw new Error(error?.message ?? 'Failed to update user');
      }

      res.status(200).json({
        data: { user: sanitizeUser(user) },
        error: null,
        message: 'Profile updated',
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/users/me/device-token
usersRouter.patch(
  '/me/device-token',
  auth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceToken: rawToken } = req.body as { deviceToken?: unknown };
      if (typeof rawToken !== 'string' || !rawToken.trim()) {
        throw new Error('deviceToken must be a non-empty string');
      }
      const deviceToken = rawToken.trim().slice(0, 512); // device tokens max 512 chars

      const { error } = await supabaseAdmin
        .from('users')
        .update({ device_token: deviceToken, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({
        data: { success: true },
        error: null,
        message: 'Device token updated',
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/users/:id/public
usersRouter.get(
  '/:id/public',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(
          'id, name, avatar_url, plan, streak_current, streak_longest, total_points_earned'
        )
        .eq('id', id)
        .maybeSingle();

      if (error || !user) {
        throw notFound('User not found');
      }

      // Fetch badges via user_badges join
      const { data: userBadges } = await supabaseAdmin
        .from('user_badges')
        .select('badge_id, earned_at, badges(id, name, description, image_url)')
        .eq('user_id', id);

      // Count completed challenges
      const { count: completedChallengesCount } = await supabaseAdmin
        .from('challenges')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'completed');

      res.status(200).json({
        data: {
          user: {
            ...user,
            badges: userBadges ?? [],
            challenges_completed: completedChallengesCount ?? 0,
          },
        },
        error: null,
        message: 'OK',
      });
    } catch (err) {
      next(err);
    }
  }
);
