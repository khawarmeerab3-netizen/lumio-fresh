// ─── backend/src/middleware/requireAdmin.ts ───────────────────────────────────
// Must be composed AFTER the `auth` middleware, which populates req.user.
// Returns HTTP 403 for any non-admin caller — never reveals that admin routes exist.

import { Request, Response, NextFunction } from 'express';
import { LumioError, toApiError } from '../utils/errors';

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user?.is_admin) {
      throw LumioError.forbidden('You do not have permission to access this resource');
    }
    next();
  } catch (err: unknown) {
    const { message, statusCode } = toApiError(err);
    res.status(statusCode).json({ data: null, error: message, message });
  }
}
