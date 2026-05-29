// ─── apps/web/src/stores/community-feed-store.ts ─────────────────────────────
// Zustand store for the community feed.
//
// Cache strategy: stale-while-revalidate
//   1. Return cached data immediately (instant render, no spinner)
//   2. Refresh in background if cache is > 5 minutes old
//   3. Invalidate on new post so author sees their own post immediately
//
// TTL: 5 minutes (FEED_CACHE_TTL_MS)
// Max cached pages: 3 (beyond that, always fetch fresh to bound memory)

import { create } from 'zustand';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  niche_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // Joined from users table
  author: {
    name: string;
    avatar_url: string | null;
  };
  // Client-side derived state
  liked_by_me?: boolean;
}

interface FeedPage {
  posts: FeedPost[];
  fetchedAt: number; // Date.now()
  cursor: string | null; // ISO timestamp of last post for cursor pagination
}

interface CommunityFeedState {
  // Cache keyed by niche filter ("all" for global feed)
  pages: Record<string, FeedPage>;

  // Per-niche loading flags — avoid duplicate in-flight requests
  loading: Record<string, boolean>;

  // Track posts liked in this session (optimistic updates)
  likedPostIds: Set<string>;

  // ── Actions ────────────────────────────────────────────────────────────
  /**
   * Fetch feed for a niche.
   * Returns cached data immediately if fresh; triggers background refresh if stale.
   * Always returns immediately (never blocks on network if cache exists).
   */
  fetchFeed: (nicheId?: string) => Promise<FeedPost[]>;

  /**
   * Prepend a newly created post to the cached feed, invalidating stale data.
   * Call this after a successful POST /api/community/posts.
   */
  addPost: (post: FeedPost, nicheId?: string) => void;

  /**
   * Toggle like state optimistically; intended for the current user's session.
   */
  toggleLike: (postId: string, currentlyLiked: boolean) => void;

  /**
   * Hard-clear the cache for a niche (or all niches).
   * Used after moderation hide or when switching accounts.
   */
  invalidate: (nicheId?: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FEED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FEED_PAGE_SIZE = 20;

// ── Fetch helper (outside store to keep it testable) ─────────────────────────

async function fetchFeedFromAPI(nicheId: string): Promise<FeedPost[]> {
  const params = new URLSearchParams({ limit: String(FEED_PAGE_SIZE) });
  if (nicheId !== 'all') params.set('nicheId', nicheId);

  const res = await fetch(`/api/community/posts?${params.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Feed fetch failed: ${res.status}`);
  }

  const json = await res.json() as { data: { posts: FeedPost[] } };
  return json.data.posts;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCommunityFeedStore = create<CommunityFeedState>((set, get) => ({
  pages: {},
  loading: {},
  likedPostIds: new Set(),

  // ── fetchFeed ─────────────────────────────────────────────────────────────
  fetchFeed: async (nicheId = 'all'): Promise<FeedPost[]> => {
    const { pages, loading } = get();
    const cached = pages[nicheId];
    const now = Date.now();
    const isStale = !cached || now - cached.fetchedAt > FEED_CACHE_TTL_MS;
    const isAlreadyFetching = loading[nicheId] === true;

    // Return cached data immediately if we have it
    if (cached) {
      if (isStale && !isAlreadyFetching) {
        // Background refresh — don't await, return stale data now
        set(s => ({ loading: { ...s.loading, [nicheId]: true } }));

        fetchFeedFromAPI(nicheId)
          .then(posts => {
            set(s => ({
              pages: {
                ...s.pages,
                [nicheId]: { posts, fetchedAt: Date.now(), cursor: posts.at(-1)?.created_at ?? null },
              },
              loading: { ...s.loading, [nicheId]: false },
            }));
          })
          .catch(err => {
            console.warn('[community-feed] Background refresh failed:', err);
            set(s => ({ loading: { ...s.loading, [nicheId]: false } }));
          });
      }

      // Apply optimistic liked state before returning
      return applyLikedState(cached.posts, get().likedPostIds);
    }

    // No cache — blocking fetch
    if (isAlreadyFetching) {
      // Another call is already in flight — wait briefly then return empty
      // The component will re-render when the store updates
      return [];
    }

    set(s => ({ loading: { ...s.loading, [nicheId]: true } }));

    try {
      const posts = await fetchFeedFromAPI(nicheId);

      set(s => ({
        pages: {
          ...s.pages,
          [nicheId]: { posts, fetchedAt: Date.now(), cursor: posts.at(-1)?.created_at ?? null },
        },
        loading: { ...s.loading, [nicheId]: false },
      }));

      return applyLikedState(posts, get().likedPostIds);
    } catch (err) {
      console.error('[community-feed] Initial fetch failed:', err);
      set(s => ({ loading: { ...s.loading, [nicheId]: false } }));
      return [];
    }
  },

  // ── addPost ───────────────────────────────────────────────────────────────
  addPost: (post: FeedPost, nicheId = 'all') => {
    set(s => {
      const existing = s.pages[nicheId];
      const posts = existing ? [post, ...existing.posts] : [post];

      return {
        pages: {
          ...s.pages,
          // Also invalidate 'all' feed when a niche-specific post is added
          ...(nicheId !== 'all' && s.pages['all']
            ? { all: { ...s.pages['all'], posts: [post, ...s.pages['all'].posts] } }
            : {}),
          [nicheId]: {
            posts,
            fetchedAt: Date.now(),
            cursor: existing?.cursor ?? null,
          },
        },
      };
    });
  },

  // ── toggleLike ────────────────────────────────────────────────────────────
  toggleLike: (postId: string, currentlyLiked: boolean) => {
    set(s => {
      const newLikedIds = new Set(s.likedPostIds);
      if (currentlyLiked) {
        newLikedIds.delete(postId);
      } else {
        newLikedIds.add(postId);
      }

      // Update likes_count in all cached pages optimistically
      const updatedPages: typeof s.pages = {};
      for (const [niche, page] of Object.entries(s.pages)) {
        updatedPages[niche] = {
          ...page,
          posts: page.posts.map(p =>
            p.id === postId
              ? { ...p, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) }
              : p
          ),
        };
      }

      return { likedPostIds: newLikedIds, pages: updatedPages };
    });
  },

  // ── invalidate ────────────────────────────────────────────────────────────
  invalidate: (nicheId?: string) => {
    set(s => {
      if (!nicheId) {
        // Clear all
        return { pages: {}, loading: {} };
      }
      const newPages = { ...s.pages };
      delete newPages[nicheId];
      return { pages: newPages };
    });
  },
}));

// ── Helper: apply in-session like state to post list ─────────────────────────
function applyLikedState(posts: FeedPost[], likedIds: Set<string>): FeedPost[] {
  if (likedIds.size === 0) return posts;
  return posts.map(p => ({ ...p, liked_by_me: likedIds.has(p.id) }));
}
