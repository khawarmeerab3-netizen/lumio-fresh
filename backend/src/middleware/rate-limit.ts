import rateLimit from 'express-rate-limit';

/**
 * General rate limit: 100 requests per 15 minutes per IP.
 * Applied globally to all API routes in index.ts.
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,    // Disable `X-RateLimit-*` headers
  message: {
    data: null,
    error: 'Too many requests — please try again later.',
    message: 'RATE_LIMITED',
  },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});

/**
 * Strict rate limit for login: 5 attempts per 15 minutes per IP.
 * Prevents brute-force password attacks.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: 'Too many login attempts — please wait 15 minutes before trying again.',
    message: 'RATE_LIMITED',
  },
});

/**
 * Strict rate limit for register: 10 accounts per hour per IP.
 * Prevents account-farming abuse.
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: 'Too many registration attempts — please try again later.',
    message: 'RATE_LIMITED',
  },
});
