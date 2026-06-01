// Lumio — backend/src/utils/errors.ts — Custom error class and factory helpers

// ─── Error Codes ─────────────────────────────────────────────────────────────

export enum ErrorCode {
  AUTH_REQUIRED       = 'AUTH_REQUIRED',
  FORBIDDEN           = 'FORBIDDEN',
  NOT_FOUND           = 'NOT_FOUND',
  VALIDATION_ERROR    = 'VALIDATION_ERROR',
  PLAN_LIMIT_REACHED  = 'PLAN_LIMIT_REACHED',
  AI_ERROR            = 'AI_ERROR',
  PAYMENT_REQUIRED    = 'PAYMENT_REQUIRED',
  RATE_LIMITED        = 'RATE_LIMITED',
  BANNED              = 'BANNED',
  INTERNAL_ERROR      = 'INTERNAL_ERROR',
  DUPLICATE           = 'DUPLICATE',
}

// ─── LumioError Class ─────────────────────────────────────────────────────────

export class LumioError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: ErrorCode, statusCode: number) {
    super(message);
    this.name = 'LumioError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    // Maintain correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ─── Factory Helpers ──────────────────────────────────────────────────────────

export function authRequired(message = 'Authentication required'): LumioError {
  return new LumioError(message, ErrorCode.AUTH_REQUIRED, 401);
}

export function forbidden(message = 'You do not have permission to do this'): LumioError {
  return new LumioError(message, ErrorCode.FORBIDDEN, 403);
}

export function notFound(resource = 'Resource'): LumioError {
  return new LumioError(`${resource} not found`, ErrorCode.NOT_FOUND, 404);
}

export function planLimitReached(message = 'Upgrade your plan to access this feature'): LumioError {
  return new LumioError(message, ErrorCode.PLAN_LIMIT_REACHED, 402);
}

export function aiError(detail = 'AI service temporarily unavailable'): LumioError {
  return new LumioError(detail, ErrorCode.AI_ERROR, 503);
}

export function validationError(detail = 'Invalid input'): LumioError {
  return new LumioError(detail, ErrorCode.VALIDATION_ERROR, 400);
}

export function rateLimited(message = 'Too many requests — please slow down'): LumioError {
  return new LumioError(message, ErrorCode.RATE_LIMITED, 429);
}

export function banned(message = 'Your account has been suspended'): LumioError {
  return new LumioError(message, ErrorCode.BANNED, 403);
}

export function duplicate(resource = 'Resource'): LumioError {
  return new LumioError(`${resource} already exists`, ErrorCode.DUPLICATE, 409);
}

/** @alias duplicate */
export function conflict(message = 'Resource already exists'): LumioError {
  return new LumioError(message, ErrorCode.DUPLICATE, 409);
}

export function badRequest(message = 'Invalid request'): LumioError {
  return new LumioError(message, ErrorCode.VALIDATION_ERROR, 400);
}

export function toApiError(err: unknown): { message: string; statusCode: number } {
  if (err instanceof LumioError) {
    return { message: err.message, statusCode: err.statusCode };
  }
  if (err instanceof Error) {
    return { message: err.message, statusCode: 500 };
  }
  return { message: 'Internal server error', statusCode: 500 };
}

export function internalError(message = 'An unexpected error occurred'): LumioError {
  return new LumioError(message, ErrorCode.INTERNAL_ERROR, 500);
}

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isLumioError(err: unknown): err is LumioError {
  return err instanceof LumioError;
}
