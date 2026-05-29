// backend/src/middleware/error-handler.ts
// Phase 28: Error Monitoring with Sentry Integration

import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';

export interface LumioError extends Error {
  statusCode?: number;
  code?: string;
  userId?: string;
  endpoint?: string;
}

/**
 * Structured error logger
 * Logs errors as JSON for Railway/Vercel log parsing
 */
function logError(data: Record<string, any>) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    ...data,
  }));
}

/**
 * Express error handling middleware
 * Must be placed AFTER all other middleware and routes
 */
export const errorHandler = (
  err: LumioError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Extract error details
  const statusCode = err.statusCode || 500;
  const code = err.code || 'UNKNOWN_ERROR';
  const userId = err.userId || (req.user as any)?.id;
  const endpoint = `${req.method} ${req.path}`;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log structured error
  logError({
    event: 'error',
    code,
    message: err.message,
    statusCode,
    userId,
    endpoint,
    stack: isDevelopment ? err.stack : undefined,
  });

  // Only send 5xx errors to Sentry
  // Don't send 4xx errors (client errors) to reduce noise
  if (statusCode >= 500 || !isDevelopment) {
    Sentry.captureException(err, {
      level: statusCode >= 500 ? 'error' : 'warning',
      tags: {
        endpoint,
        statusCode: statusCode.toString(),
        errorCode: code,
      },
      contexts: {
        request: {
          method: req.method,
          path: req.path,
          query: JSON.stringify(req.query),
        },
      },
      extra: {
        userId,
        userAgent: req.get('user-agent'),
      },
    });
  }

  // Send error response to client
  const response: Record<string, any> = {
    error: isDevelopment ? err.message : 'Internal server error',
    code,
  };

  if (isDevelopment) {
    response.stack = err.stack;
    response.details = {
      statusCode,
      userId,
      endpoint,
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Async error wrapper for Express route handlers
 * Catches errors in async functions and passes to error handler
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for structured error throwing
 */
export class LumioErrorClass extends Error implements LumioError {
  statusCode: number;
  code: string;
  userId?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    userId?: string
  ) {
    super(message);
    this.name = 'LumioError';
    this.statusCode = statusCode;
    this.code = code;
    this.userId = userId;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Common error codes and status codes
 */
export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: { code: 'BAD_REQUEST', status: 400 },
  UNAUTHORIZED: { code: 'UNAUTHORIZED', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  CONFLICT: { code: 'CONFLICT', status: 409 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  PLAN_LIMIT: { code: 'PLAN_LIMIT', status: 402 },

  // 5xx Server Errors
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500 },
  AI_ERROR: { code: 'AI_ERROR', status: 500 },
  EXTERNAL_SERVICE_ERROR: { code: 'EXTERNAL_SERVICE_ERROR', status: 503 },
};

export default errorHandler;
