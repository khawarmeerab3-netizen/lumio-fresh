// backend/src/routes/health.ts
// Phase 28: Health Monitoring & Dependency Checks

import { Router, Request, Response } from 'express';
import { db } from '../lib/database';

const router = Router();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  db?: 'ok' | 'error';
  ai?: 'ok' | 'degraded' | 'error';
  version?: string;
}

/**
 * Main health check endpoint
 * Returns overall system health and dependency status
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();

  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.APP_VERSION || '1.0.0',
  };

  try {
    // Check database
    const dbHealth = await checkDatabase();
    health.db = dbHealth;
    if (dbHealth === 'error') {
      health.status = 'error';
    }

    // Check AI providers
    const aiHealth = await checkAIProviders();
    health.ai = aiHealth;
    if (aiHealth === 'error') {
      health.status = 'error';
    } else if (aiHealth === 'degraded' && health.status === 'ok') {
      health.status = 'degraded';
    }

    // Determine response status code
    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;

    // Log health check
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'health_check',
      status: health.status,
      duration_ms: duration,
      db: health.db,
      ai: health.ai,
    }));

    return res.status(statusCode).json(health);
  } catch (err) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'health_check_error',
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    }));

    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
    });
  }
});

/**
 * Database health check
 * Tests connection to Supabase
 */
async function checkDatabase(): Promise<'ok' | 'error'> {
  try {
    // Option 1: Simple query
    const { error } = await db
      .from('challenges')
      .select('id')
      .limit(1);

    if (!error) {
      return 'ok';
    }

    console.warn('Database health check: query returned error', error);
    return 'error';
  } catch (err) {
    console.error('Database health check failed:', err);
    return 'error';
  }
}

/**
 * AI Provider health check
 * Tests availability of primary AI provider (Groq)
 */
async function checkAIProviders(): Promise<'ok' | 'degraded' | 'error'> {
  const providers = [
    {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/models',
      key: process.env.GROQ_API_KEY,
    },
    {
      name: 'mistral',
      url: 'https://api.mistral.ai/v1/models',
      key: process.env.MISTRAL_API_KEY,
    },
  ];

  let primaryAvailable = false;
  let fallbackAvailable = false;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    try {
      const response = await Promise.race([
        fetch(provider.url, {
          headers: {
            Authorization: `Bearer ${provider.key}`,
          },
        }),
        // Timeout after 5 seconds
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        ),
      ]);

      if (response && response.ok) {
        if (i === 0) primaryAvailable = true;
        if (i === 1) fallbackAvailable = true;
      }
    } catch (err) {
      console.warn(`${provider.name} health check failed:`, err);
    }
  }

  // Determine status based on availability
  if (primaryAvailable) return 'ok';
  if (fallbackAvailable) return 'degraded'; // Primary down, fallback available
  return 'error'; // No providers available
}

/**
 * Detailed health endpoint
 * GET /health/detailed
 * Returns more granular information
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Basic uptime
    const uptime = process.uptime();

    // Memory usage
    const memUsage = process.memoryUsage();
    const memMB = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    // Database info
    let dbLatency = 0;
    try {
      const start = Date.now();
      await db.from('challenges').select('id').limit(1);
      dbLatency = Date.now() - start;
    } catch (err) {
      // Already logged in basic check
    }

    // AI provider latency
    let aiLatency = 0;
    try {
      const start = Date.now();
      await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      });
      aiLatency = Date.now() - start;
    } catch (err) {
      // Already logged in basic check
    }

    return res.json({
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: memMB,
      latency: {
        db_ms: dbLatency,
        ai_ms: aiLatency,
      },
      environment: {
        node_env: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
      },
    });
  } catch (err) {
    console.error('Detailed health check error:', err);
    return res.status(500).json({
      error: 'Failed to get detailed health info',
    });
  }
});

/**
 * Liveness probe (Kubernetes)
 * GET /health/live
 * Returns 200 if app is running
 */
router.get('/live', (req: Request, res: Response) => {
  return res.json({ status: 'alive' });
});

/**
 * Readiness probe (Kubernetes)
 * GET /health/ready
 * Returns 200 only if app is ready to serve requests
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabase();
    const aiHealth = await checkAIProviders();

    const ready = dbHealth === 'ok' && aiHealth !== 'error';

    if (ready) {
      return res.json({ status: 'ready' });
    } else {
      return res.status(503).json({
        status: 'not_ready',
        reason: `db: ${dbHealth}, ai: ${aiHealth}`,
      });
    }
  } catch (err) {
    return res.status(503).json({
      status: 'not_ready',
      error: 'Health check failed',
    });
  }
});

export default router;
