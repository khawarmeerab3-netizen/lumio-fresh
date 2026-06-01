/// <reference path="./lumio.d.ts" />
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './utils/env';
import { isLumioError } from './utils/errors';
import { generalRateLimit } from './middleware/rate-limit';
import { authRouter, usersRouter } from './routes/auth';
import challengesRouter from './routes/challenges';
import coachesRouter from './routes/coaches';
import communityRouter from './routes/community';
import buddiesRouter from './routes/buddies';
import followersRouter from './routes/followers';
import personaRouter from './routes/persona';
import { pointsRouter } from './routes/points';
import { notificationsRouter } from './routes/notifications';
import { badgesRouter } from './routes/badges';
import analyticsRouter from './routes/analytics';
import adminRouter from './routes/admin';
import { paymentsRouter } from './routes/payments';
import { webhooksRouter } from './routes/webhooks';

const app: Express = express();
const PORT = env.PORT;

app.use(helmet());
const corsOrigins =
  env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001', env.FRONTEND_URL].filter(Boolean)
    : env.FRONTEND_URL || 'http://localhost:3000';

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// Webhooks need raw body — mount before JSON parser
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(generalRateLimit);

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/coaches', coachesRouter);
app.use('/api/community', communityRouter);
app.use('/api/buddies', buddiesRouter);
app.use('/api/followers', followersRouter);
app.use('/api/persona', personaRouter);
app.use('/api/points', pointsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    data: null,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isLumioError(err)) {
    console.error(`[${err.code}] ${err.message} — ${req.method} ${req.path}`);
    res.status(err.statusCode).json({
      data: null,
      error: err.message,
      message: err.code,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(message, isDevelopment && err instanceof Error ? err.stack : '');

  res.status(500).json({
    data: null,
    error: isDevelopment ? message : 'Internal server error',
    message: 'INTERNAL_ERROR',
  });
});

const server = app.listen(PORT, () => {
  console.log(`Lumio API running on http://localhost:${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`CORS origin: ${env.FRONTEND_URL}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

export default app;
