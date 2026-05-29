'use client';

// ─── apps/web/src/components/ui/Skeleton.tsx ─────────────────────────────────
// Reusable skeleton loader system with shimmer animation.
// All loading states in the app use these primitives — never raw divs.

import { cn } from '@/lib/utils';

// ── Base shimmer primitive ────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  /** Round into a circle (for avatars) */
  circle?: boolean;
}

export function Skeleton({ className, circle = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/8',
        circle ? 'rounded-full' : 'rounded-xl',
        // Shimmer sweep animation
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer',
        'before:bg-gradient-to-r',
        'before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      aria-hidden="true"
    />
  );
}

// ── Composed skeletons ────────────────────────────────────────────────────────

/** Single-line text placeholder */
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn('h-4 w-full', className)} />;
}

/** Multi-line paragraph block */
export function SkeletonParagraph({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Challenge card skeleton */
export function SkeletonChallengeCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0" circle />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Challenge list — renders N card skeletons */
export function SkeletonChallengeList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonChallengeCard key={i} />
      ))}
    </div>
  );
}

/** Daily task card skeleton */
export function SkeletonDailyTask() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      {/* Main task */}
      <Skeleton className="h-14 w-full" />
      {/* Steps */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 shrink-0" circle />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      {/* CTA */}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/** Coach chat message skeleton */
export function SkeletonChatMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && <Skeleton className="h-8 w-8 shrink-0 mt-1" circle />}
      <div
        className={cn(
          'space-y-1.5 max-w-[72%]',
          isUser ? 'items-end flex flex-col' : ''
        )}
      >
        <Skeleton className={cn('h-10 rounded-2xl', isUser ? 'w-48' : 'w-64')} />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/** Coach chat history skeleton — alternating user/assistant bubbles */
export function SkeletonChatHistory() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonChatMessage isUser={false} />
      <SkeletonChatMessage isUser={true} />
      <SkeletonChatMessage isUser={false} />
      <SkeletonChatMessage isUser={true} />
      <SkeletonChatMessage isUser={false} />
    </div>
  );
}

/** Community post card skeleton */
export function SkeletonPostCard() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0" circle />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Content */}
      <SkeletonParagraph lines={2} />
      {/* Actions row */}
      <div className="flex gap-4 pt-1">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

/** Community feed skeleton */
export function SkeletonCommunityFeed({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPostCard key={i} />
      ))}
    </div>
  );
}

/** Analytics page skeleton */
export function SkeletonAnalytics() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl bg-white/5 p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      {/* Heatmap */}
      <div className="rounded-2xl bg-white/5 p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
      {/* Niche breakdown */}
      <div className="rounded-2xl bg-white/5 p-4 space-y-3">
        <Skeleton className="h-4 w-40" />
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4" circle />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin client table skeleton */
export function SkeletonAdminTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-5 gap-3 px-3 pb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-5 gap-3 rounded-xl bg-white/5 p-3 items-center"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 shrink-0" circle />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-6 w-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Full-page centred spinner for route-level suspense fallback */
export function SkeletonPageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        {/* Pulsing Lumio dot */}
        <div className="h-10 w-10 rounded-full bg-purple-500/30 animate-pulse" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
