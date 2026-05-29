'use client';

import { useState, useEffect } from 'react';

interface CacheLabelProps {
  cachedAt: string;
  className?: string;
}

function formatAge(iso: string): string {
  try {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return `${Math.round(diff / 1440)}d ago`;
  } catch {
    return '';
  }
}

/**
 * Non-intrusive badge shown when a task is served from the local cache.
 * Displays "📱 Loaded from cache · Xm ago" and updates the timestamp every minute.
 */
export function CacheLabel({ cachedAt, className = '' }: CacheLabelProps) {
  const [age, setAge] = useState(() => formatAge(cachedAt));

  useEffect(() => {
    // Update every 60 seconds so the "Xm ago" stays accurate
    const interval = setInterval(() => setAge(formatAge(cachedAt)), 60_000);
    return () => clearInterval(interval);
  }, [cachedAt]);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: '#818cf8',
        backgroundColor: '#1e1b4b',
        border: '1px solid #3730a3',
        borderRadius: 20,
        padding: '0.2rem 0.6rem',
        whiteSpace: 'nowrap',
      }}
      title={`Cached at ${new Date(cachedAt).toLocaleString()}`}
    >
      📱 Loaded from cache · {age}
    </span>
  );
}
