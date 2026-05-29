import { Request, Response, NextFunction } from 'express';
import { forbidden } from '../utils/errors';

/**
 * Middleware: require the authenticated user to be an admin.
 * Must be used AFTER the `auth` middleware (which populates req.user).
 *
 * Usage:
 *   router.delete('/admin/users/:id', auth, requireAdmin, handler);
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.is_admin) {
    next(forbidden('Admin access required'));
    return;
  }
  next();
}
