// ─── apps/web/src/lib/lazy-imports.ts ────────────────────────────────────────
// Central registry of all lazily-loaded page components.
//
// Why centralise:
//   • One place to audit what's code-split
//   • Consistent fallback pattern across all lazy boundaries
//   • Easy to add/remove splits without touching individual pages
//
// Pattern:
//   const LazyPage = dynamic(() => import('@/app/(app)/...'), {
//     loading: () => <SpecificSkeleton />,
//     ssr: false,   // client-only pages (auth-gated, uses browser APIs)
//   })
//
// Naming convention: Lazy{PageName} — always a React component

import dynamic from 'next/dynamic';
import {
  SkeletonChallengeList,
  SkeletonDailyTask,
  SkeletonChatHistory,
  SkeletonCommunityFeed,
  SkeletonAnalytics,
  SkeletonAdminTable,
  SkeletonPageLoader,
} from '@/components/ui/Skeleton';

// ── Challenge screen tabs ─────────────────────────────────────────────────────

/** Challenge detail overview tab */
export const LazyChallengeOverview = dynamic(
  () => import('@/components/challenge/ChallengeOverview'),
  { loading: () => <SkeletonDailyTask />, ssr: false }
);

/** Daily task tab */
export const LazyDailyTaskTab = dynamic(
  () => import('@/components/challenge/DailyTaskTab'),
  { loading: () => <SkeletonDailyTask />, ssr: false }
);

/** Coach chat tab */
export const LazyCoachChatTab = dynamic(
  () => import('@/components/challenge/CoachChatTab'),
  { loading: () => <SkeletonChatHistory />, ssr: false }
);

/** Challenge milestones tab */
export const LazyMilestonesTab = dynamic(
  () => import('@/components/challenge/MilestonesTab'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

/** Challenge progress report tab */
export const LazyProgressReportTab = dynamic(
  () => import('@/components/challenge/ProgressReportTab'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

// ── Community ─────────────────────────────────────────────────────────────────

/** Community feed page content */
export const LazyCommunityFeed = dynamic(
  () => import('@/components/community/CommunityFeed'),
  { loading: () => <SkeletonCommunityFeed count={4} />, ssr: false }
);

/** Create post modal */
export const LazyCreatePostModal = dynamic(
  () => import('@/components/community/CreatePostModal'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

// ── Analytics ─────────────────────────────────────────────────────────────────

/** Full analytics dashboard */
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/AnalyticsDashboard'),
  { loading: () => <SkeletonAnalytics />, ssr: false }
);

/** Heatmap chart (heavy — uses D3/recharts) */
export const LazyHeatmap = dynamic(
  () => import('@/components/analytics/Heatmap'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

// ── Memory system ─────────────────────────────────────────────────────────────

/**
 * Memory page active UI (photo/video capture).
 * SSR off — depends on browser APIs (MediaRecorder, IndexedDB).
 */
export const LazyActivePackUI = dynamic(
  () => import('@/components/memory/ActivePackUI'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

/**
 * Create Reel page.
 * SSR off — dynamically imports FFmpeg.wasm, requires browser.
 * FFmpeg itself is imported inside the component, NOT here, to keep
 * this module's bundle footprint near-zero.
 */
export const LazyCreateReelPage = dynamic(
  () => import('@/app/(app)/memory/[challengeId]/create-reel/page'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

// ── Admin pages ───────────────────────────────────────────────────────────────
// All admin components are lazy — never included in user-facing bundles.

/** Admin client list */
export const LazyAdminClientList = dynamic(
  () => import('@/components/admin/AdminClientList'),
  { loading: () => <SkeletonAdminTable rows={8} />, ssr: false }
);

/** Admin client detail */
export const LazyAdminClientDetail = dynamic(
  () => import('@/components/admin/AdminClientDetail'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

/** Admin moderation queue */
export const LazyAdminModeration = dynamic(
  () => import('@/components/admin/AdminModeration'),
  { loading: () => <SkeletonAdminTable rows={5} />, ssr: false }
);

/** Admin revenue dashboard */
export const LazyAdminRevenue = dynamic(
  () => import('@/components/admin/AdminRevenue'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

/** Admin broadcast composer */
export const LazyAdminBroadcast = dynamic(
  () => import('@/components/admin/AdminBroadcast'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

// ── Auth & onboarding ─────────────────────────────────────────────────────────

/** Onboarding quiz — large component with confetti, not needed at boot */
export const LazyOnboardingQuiz = dynamic(
  () => import('@/components/onboarding/OnboardingQuiz'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);

/** Coach selector — loads coach grid, only needed on challenge creation */
export const LazyCoachSelector = dynamic(
  () => import('@/components/challenge/CoachSelector'),
  { loading: () => <SkeletonPageLoader />, ssr: false }
);
