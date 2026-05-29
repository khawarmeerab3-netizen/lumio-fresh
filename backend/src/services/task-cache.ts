// ─── backend/src/cache/task-cache.ts ─────────────────────────────────────────
// In-memory TTL cache for generated daily tasks.
//
// Why in-memory rather than Redis:
//   • Daily tasks are user-specific and regenerated at most once per day
//   • A cold Railway restart clears the cache — acceptable because TTL is 24h
//     and Supabase serves as the persistent source of truth
//   • Zero infra cost; Redis adds ~$15/month on Railway
//
// Key format : "{challengeId}-{dayNumber}"
// TTL        : 24 hours (matches "never regenerate same day" rule from AGENT.md)

import type { GeneratedDailyTask } from '../services/ai/lumio-coach';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CacheEntry {
  task: GeneratedDailyTask;
  cachedAt: number; // Date.now() ms
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Hard cap on entries to prevent unbounded growth on a long-running process.
// At ~500 bytes per entry (JSON task), 5 000 entries ≈ 2.5 MB — negligible.
const MAX_ENTRIES = 5_000;

// ── Cache store ───────────────────────────────────────────────────────────────

const store = new Map<string, CacheEntry>();
const metrics: CacheMetrics = { hits: 0, misses: 0, evictions: 0, size: 0 };

// ── Key builder ───────────────────────────────────────────────────────────────

export function buildTaskCacheKey(challengeId: string, dayNumber: number): string {
  return `${challengeId}-${dayNumber}`;
}

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Retrieve a cached task.
 * Returns null on cache miss OR if the entry is older than TTL_MS.
 */
export function getCachedTask(
  challengeId: string,
  dayNumber: number
): GeneratedDailyTask | null {
  const key = buildTaskCacheKey(challengeId, dayNumber);
  const entry = store.get(key);

  if (!entry) {
    metrics.misses++;
    return null;
  }

  const ageMs = Date.now() - entry.cachedAt;
  if (ageMs > TTL_MS) {
    store.delete(key);
    metrics.evictions++;
    metrics.misses++;
    metrics.size = store.size;
    return null;
  }

  metrics.hits++;
  return entry.task;
}

/**
 * Store a generated task in the cache.
 * If the store is at MAX_ENTRIES, evicts the oldest entry first (LRU-lite).
 */
export function setCachedTask(
  challengeId: string,
  dayNumber: number,
  task: GeneratedDailyTask
): void {
  const key = buildTaskCacheKey(challengeId, dayNumber);

  // Evict oldest entry when full
  if (store.size >= MAX_ENTRIES && !store.has(key)) {
    const oldestKey = store.keys().next().value;
    if (oldestKey !== undefined) {
      store.delete(oldestKey);
      metrics.evictions++;
    }
  }

  store.set(key, { task, cachedAt: Date.now() });
  metrics.size = store.size;
}

/**
 * Invalidate all cache entries for a specific challenge
 * (e.g. when a challenge is reset or the plan changes).
 */
export function invalidateChallengeCache(challengeId: string): void {
  const prefix = `${challengeId}-`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      metrics.evictions++;
    }
  }
  metrics.size = store.size;
}

/**
 * Purge all entries older than TTL_MS.
 * Called by the periodic sweep (see startCacheSweep below).
 */
export function sweepExpiredEntries(): number {
  const now = Date.now();
  let swept = 0;

  for (const [key, entry] of store.entries()) {
    if (now - entry.cachedAt > TTL_MS) {
      store.delete(key);
      swept++;
      metrics.evictions++;
    }
  }

  metrics.size = store.size;
  return swept;
}

/**
 * Return a snapshot of cache metrics — exposed via GET /api/admin/cache-stats.
 */
export function getCacheMetrics(): Readonly<CacheMetrics & { hitRate: string }> {
  const total = metrics.hits + metrics.misses;
  const hitRate = total === 0 ? 'N/A' : `${((metrics.hits / total) * 100).toFixed(1)}%`;
  return { ...metrics, hitRate };
}

// ── Background sweep ──────────────────────────────────────────────────────────
// Runs every 6 hours to evict expired entries and keep memory bounded.
// Returns the interval handle so callers can clearInterval on graceful shutdown.

export function startCacheSweep(): ReturnType<typeof setInterval> {
  const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

  return setInterval(() => {
    const swept = sweepExpiredEntries();
    if (swept > 0) {
      console.info(`[task-cache] Swept ${swept} expired entries. Size: ${store.size}`);
    }
  }, SWEEP_INTERVAL_MS);
}
