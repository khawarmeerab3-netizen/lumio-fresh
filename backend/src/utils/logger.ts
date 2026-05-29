// backend/src/utils/logger.ts
// Phase 28: Structured Logging Utility

/**
 * Structured Logger
 * Outputs JSON logs for easy parsing by Railway/Vercel
 * All logs include timestamp and event name
 */

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  [key: string]: any;
}

/**
 * Format and log a structured event
 * Usage: log.info('event_name', { property: value })
 */
function formatLog(level: string, data: Record<string, any>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level: level as any,
    ...data,
  };
}

export const logger = {
  /**
   * Info level logging
   * Usage: logger.info('challenge_created', { userId, niche })
   */
  info: (event: string, data?: Record<string, any>) => {
    const log = formatLog('info', { event, ...data });
    console.log(JSON.stringify(log));
  },

  /**
   * Warning level logging
   * Usage: logger.warn('ai_fallback', { from: 'groq', to: 'mistral' })
   */
  warn: (event: string, data?: Record<string, any>) => {
    const log = formatLog('warn', { event, ...data });
    console.warn(JSON.stringify(log));
  },

  /**
   * Error level logging
   * Usage: logger.error('error', { code: 'DB_ERROR', message: err.message })
   */
  error: (event: string, data?: Record<string, any>) => {
    const log = formatLog('error', { event, ...data });
    console.error(JSON.stringify(log));
  },

  /**
   * Debug level logging (only in development)
   * Usage: logger.debug('request_received', { method, path })
   */
  debug: (event: string, data?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      const log = formatLog('debug', { event, ...data });
      console.debug(JSON.stringify(log));
    }
  },
};

/**
 * Timer utility for measuring operation duration
 * Usage:
 *   const timer = new Timer();
 *   // do work
 *   logger.info('operation', { duration_ms: timer.elapsed() });
 */
export class Timer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }

  log(message: string) {
    const elapsed = this.elapsed();
    logger.info(message, { duration_ms: elapsed });
    return elapsed;
  }
}

export default logger;
