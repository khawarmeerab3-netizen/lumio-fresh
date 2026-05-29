'use client';

import { useTodayTask } from '@/hooks/useTodayTask';
import { CacheLabel } from '@/components/lumio/CacheLabel';

interface TodayTaskCardProps {
  challengeId: string;
  authToken: string;
}

/**
 * Drop this card into the dashboard page.
 * It fetches today's task, caches it to localStorage,
 * and shows a "📱 Loaded from cache" badge when served offline.
 */
export function TodayTaskCard({ challengeId, authToken }: TodayTaskCardProps) {
  const { task, isLoading, isFromCache, isOffline, error, refetch } = useTodayTask(
    challengeId,
    authToken
  );

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: '#1c1917',
          border: '1px solid #292524',
          borderRadius: 16,
          padding: '1.5rem',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            height: 14,
            width: '40%',
            backgroundColor: '#292524',
            borderRadius: 6,
            marginBottom: '0.75rem',
          }}
        />
        <div
          style={{
            height: 20,
            width: '70%',
            backgroundColor: '#292524',
            borderRadius: 6,
            marginBottom: '0.5rem',
          }}
        />
        <div
          style={{ height: 14, width: '55%', backgroundColor: '#292524', borderRadius: 6 }}
        />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        style={{
          backgroundColor: '#1c1917',
          border: '1px solid #292524',
          borderRadius: 16,
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 32, marginBottom: '0.5rem' }}>⚠️</p>
        <p style={{ fontSize: 14, color: '#78716c', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={refetch}
          style={{
            background: 'none',
            border: '1px solid #44403c',
            borderRadius: 8,
            padding: '0.4rem 0.875rem',
            fontSize: 13,
            color: '#a8a29e',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!task) return null;

  // ── Task card ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        backgroundColor: '#1c1917',
        border: '1px solid #292524',
        borderRadius: 16,
        padding: '1.25rem',
      }}
    >
      {/* Header row: day + cache label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <span style={{ fontSize: 12, color: '#78716c' }}>
          Day {task.dayNumber} · {task.challengeTitle}
        </span>

        {/* Offline/cache badge */}
        {isFromCache && <CacheLabel cachedAt={task.cachedAt} />}
        {isOffline && !isFromCache && (
          <span
            style={{
              fontSize: 11,
              color: '#f87171',
              backgroundColor: '#2d1515',
              border: '1px solid #7f1d1d',
              borderRadius: 20,
              padding: '0.2rem 0.6rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            📡 Offline
          </span>
        )}
      </div>

      {/* Task title */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f59e0b',
          margin: '0 0 0.5rem',
        }}
      >
        {task.task.dayTitle}
      </h2>

      {/* Main task */}
      <p
        style={{
          fontSize: 15,
          color: '#e7e5e4',
          lineHeight: 1.6,
          margin: '0 0 1rem',
        }}
      >
        {task.task.mainTask}
      </p>

      {/* Time required */}
      <p style={{ fontSize: 12, color: '#78716c', margin: '0 0 1rem' }}>
        ⏱ {task.task.timeRequired}
      </p>

      {/* Steps */}
      {task.task.steps.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#78716c',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 0.5rem',
            }}
          >
            Steps
          </p>
          <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {task.task.steps.map((step, i) => (
              <li
                key={i}
                style={{ fontSize: 14, color: '#d6d3d1', lineHeight: 1.6, marginBottom: '0.375rem' }}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Motivational note */}
      <div
        style={{
          borderLeft: '3px solid #f59e0b',
          paddingLeft: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{ fontSize: 13, color: '#a8a29e', fontStyle: 'italic', margin: 0 }}>
          {task.task.motivationalNote}
        </p>
      </div>

      {/* Check-in */}
      <div
        style={{
          backgroundColor: '#0d0c0b',
          borderRadius: 10,
          padding: '0.875rem',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 0.25rem',
          }}
        >
          Today's check-in
        </p>
        <p style={{ fontSize: 14, color: '#d1d5db', margin: 0 }}>
          {task.task.checkIn}
        </p>
      </div>
    </div>
  );
}
