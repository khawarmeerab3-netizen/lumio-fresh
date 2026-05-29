// backend/src/index.ts
// Phase 28: Complete Backend Setup with Sentry Integration

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Load environment variables
dotenv.config();

// ═══════════════════════════════════════════════════════════════════════════
// SENTRY INITIALIZATION - MUST BE FIRST
// ═══════════════════════════════════════════════════════════════════════════

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      // Don't send 404s to Sentry
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
    }
    return event;
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPRESS APP SETUP
// ═══════════════════════════════════════════════════════════════════════════

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════════════════
// SENTRY REQUEST HANDLER - MUST BE BEFORE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.use(Sentry.Handlers.requestHandler());

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  };

  try {
    // Quick database check
    // const { error } = await db.from('challenges').select('id').limit(1);
    // health.db = !error ? 'ok' : 'error';

    // Check AI providers
    // health.ai = await checkAIHealth();

    const statusCode = health.status === 'ok' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (err) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// YOUR ROUTES HERE
// ═══════════════════════════════════════════════════════════════════════════

// Import and mount your routers
// import challengesRouter from './routes/challenges';
// import authRouter from './routes/auth';
// import healthRouter from './routes/health';
// etc.

// app.use('/api/challenges', challengesRouter);
// app.use('/api/auth', authRouter);
// app.use('/health', healthRouter);

// ═══════════════════════════════════════════════════════════════════════════
// 404 HANDLER
// ═══════════════════════════════════════════════════════════════════════════

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SENTRY ERROR HANDLER - MUST BE AFTER ALL ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.use(Sentry.Handlers.errorHandler());

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM ERROR HANDLER (Optional, after Sentry)
// ═══════════════════════════════════════════════════════════════════════════

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;

  // Structured error log
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    event: 'error',
    code: err.code || 'UNKNOWN_ERROR',
    message: err.message,
    statusCode,
    userId: err.userId || req.user?.id,
    endpoint: `${req.method} ${req.path}`,
    stack: isDevelopment ? err.stack : undefined,
  }));

  // Send response
  const response: Record<string, any> = {
    error: isDevelopment ? err.message : 'Internal server error',
    code: err.code,
  };

  if (isDevelopment) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
});

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURED LOGGING EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════

function logEvent(event: string, data: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    ...data,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  // Log startup event
  logEvent('startup', {
    port: PORT,
    env: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  });

  console.log(`✅ Lumio API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Error tracking: ${process.env.SENTRY_DSN ? 'enabled' : 'disabled'}`);
  console.log(`📊 Structured logging: enabled`);
  console.log(`❤️  Health check: GET /health`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

process.on('SIGTERM', () => {
  logEvent('shutdown', {
    reason: 'SIGTERM',
  });

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logEvent('shutdown', {
    reason: 'SIGINT',
  });

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
