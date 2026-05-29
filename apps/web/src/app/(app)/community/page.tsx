'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  user_plan: string;
  content: string;
  image_url?: string;
  niche_id?: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  created_at: string;
}

interface Niche {
  id: string;
  label: string;
  emoji: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const NICHES: Niche[] = [
  { id: 'all',          label: 'All',          emoji: '🌍' },
  { id: 'fitness',      label: 'Fitness',      emoji: '💪' },
  { id: 'finance',      label: 'Finance',      emoji: '💰' },
  { id: 'cooking',      label: 'Cooking',      emoji: '🍳' },
  { id: 'spirituality', label: 'Spirituality', emoji: '🧘' },
  { id: 'learning',     label: 'Learning',     emoji: '📚' },
  { id: 'creativity',   label: 'Creativity',   emoji: '🎨' },
  { id: 'productivity', label: 'Productivity', emoji: '⚡' },
  { id: 'relationships',label: 'Relationships',emoji: '❤️' },
  { id: 'parenting',    label: 'Parenting',    emoji: '👨‍👩‍👧' },
  { id: 'health',       label: 'Health',       emoji: '🌿' },
  { id: 'career',       label: 'Career',       emoji: '🚀' },
  { id: 'mindset',      label: 'Mindset',      emoji: '🧠' },
];

const PLAN_BADGE_COLOR: Record<string, string> = {
  free: '#64748b', starter: '#22c55e', pro: '#0ea5e9', elite: '#f59e0b', enterprise: '#a855f7',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Post Composer ───────────────────────────────────────────────────────────

function PostComposer({
  onPost,
  selectedNiche,
  canPost,
}: {
  onPost: (content: string, niche?: string) => Promise<void>;
  selectedNiche: string;
  canPost: boolean;
}) {
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || posting || !canPost) return;
    setPosting(true);
    try {
      await onPost(trimmed, selectedNiche !== 'all' ? selectedNiche : undefined);
      setText('');
    } finally {
      setPosting(false);
    }
  };

  if (!canPost) {
    return (
      <div
        className="rounded-2xl p-4 mb-4 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-2xl">🔒</span>
        <div>
          <p className="text-sm font-semibold text-white/70">Upgrade to post</p>
          <p className="text-xs text-white/30">Starter plan and above can post in the community</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, 500))}
        placeholder="Share your progress, wins, or thoughts…"
        rows={3}
        className="w-full bg-transparent text-sm text-white placeholder-white/25 resize-none outline-none"
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-white/20">{text.length}/500</span>
        <button
          onClick={submit}
          disabled={!text.trim() || posting}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
          style={{ background: '#f59e0b', color: '#000' }}
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}

// ─── Community Post ───────────────────────────────────────────────────────────

function CommunityPost({
  post,
  onLike,
  onFlag,
}: {
  post: Post;
  onLike: (id: string) => void;
  onFlag: (id: string) => void;
}) {
  const niche = NICHES.find(n => n.id === post.niche_id);
  const planColor = PLAN_BADGE_COLOR[post.user_plan] ?? PLAN_BADGE_COLOR.free;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 mb-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: `${planColor}33`, border: `1.5px solid ${planColor}66`, color: planColor }}
        >
          {post.user_avatar
            ? <img src={post.user_avatar} alt="" className="w-full h-full rounded-full object-cover" />
            : post.user_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{post.user_name}</span>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
              style={{ background: `${planColor}22`, color: planColor }}
            >
              {post.user_plan}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {niche && <span className="text-[10px] text-white/30">{niche.emoji} {niche.label}</span>}
            <span className="text-[10px] text-white/20">· {timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/80 leading-relaxed mb-3">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full rounded-xl mb-3 object-cover max-h-64"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-xs transition-all"
          style={{ color: post.is_liked_by_me ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}
        >
          <span>{post.is_liked_by_me ? '❤️' : '🤍'}</span>
          <span>{post.likes_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-white/30">
          <span>💬</span>
          <span>{post.comments_count}</span>
        </button>
        <button
          onClick={() => onFlag(post.id)}
          className="ml-auto text-xs text-white/15 hover:text-white/30 transition-colors"
        >
          ⚑
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [feedMode, setFeedMode] = useState<'all' | 'following'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [activeCount] = useState(Math.floor(Math.random() * 800) + 200);
  const loaderRef = useRef<HTMLDivElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('lumio_token')}`, 'Content-Type': 'application/json' });

  const fetchPosts = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams();
      if (selectedNiche !== 'all') params.set('niche', selectedNiche);
      if (feedMode === 'following') params.set('following', '1');
      if (!reset && cursor) params.set('cursor', cursor);

      const res = await fetch(`${apiUrl}/api/posts?${params}`, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();

      const newPosts: Post[] = data.posts ?? [];
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setCursor(data.nextCursor ?? null);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      console.error('Community fetch error:', err);
    }
  }, [apiUrl, selectedNiche, feedMode, cursor]);

  // Initial fetch + check user plan
  useEffect(() => {
    const token = localStorage.getItem('lumio_token');
    if (!token) { router.push('/login'); return; }

    (async () => {
      setLoading(true);
      setCursor(null);
      await fetchPosts(true);
      try {
        const meRes = await fetch(`${apiUrl}/api/users/me`, { headers: getHeaders() });
        const me = await meRes.json();
        const plan = (me.user ?? me)?.plan ?? 'free';
        setCanPost(plan !== 'free');
      } catch { /* noop */ }
      setLoading(false);
    })();
  }, [selectedNiche, feedMode]); // eslint-disable-line

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(async entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        await fetchPosts(false);
        setLoadingMore(false);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, fetchPosts]);

  const handlePost = async (content: string, niche?: string) => {
    try {
      const body = JSON.stringify({ content, niche_id: niche });
      const res = await fetch(`${apiUrl}/api/posts`, { method: 'POST', headers: getHeaders(), body });
      if (!res.ok) return;
      const data = await res.json();
      const newPost: Post = data.post ?? data;
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.error('Post error:', err);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, is_liked_by_me: !p.is_liked_by_me, likes_count: p.likes_count + (p.is_liked_by_me ? -1 : 1) }
        : p
    ));
    try {
      await fetch(`${apiUrl}/api/posts/${postId}/like`, { method: 'POST', headers: getHeaders() });
    } catch { /* optimistic — noop */ }
  };

  const handleFlag = async (postId: string) => {
    try {
      await fetch(`${apiUrl}/api/posts/${postId}/flag`, { method: 'POST', headers: getHeaders() });
    } catch { /* noop */ }
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#080706', fontFamily: 'Syne, sans-serif' }}>
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">COMMUNITY</h1>
            <p className="text-xs text-white/30 mt-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
              {activeCount.toLocaleString()} active now
            </p>
          </div>
          {/* All / Following toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all', 'following'] as const).map(m => (
              <button
                key={m}
                onClick={() => setFeedMode(m)}
                className="px-3 py-1.5 text-xs font-semibold capitalize transition-all"
                style={{
                  background: feedMode === m ? '#f59e0b' : 'transparent',
                  color: feedMode === m ? '#000' : 'rgba(255,255,255,0.4)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* ── Niche Filter Chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {NICHES.map(n => (
            <button
              key={n.id}
              onClick={() => setSelectedNiche(n.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: selectedNiche === n.id ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                color: selectedNiche === n.id ? '#000' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${selectedNiche === n.id ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <span>{n.emoji}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        {/* ── Post Composer ── */}
        <PostComposer onPost={handlePost} selectedNiche={selectedNiche} canPost={canPost} />

        {/* ── Feed ── */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', height: 120 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-4xl">🌱</span>
            <p className="text-sm text-white/50">
              {feedMode === 'following' ? 'No posts from people you follow yet' : 'No posts yet — be the first!'}
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {posts.map(post => (
                <CommunityPost key={post.id} post={post} onLike={handleLike} onFlag={handleFlag} />
              ))}
            </AnimatePresence>
            {/* Infinite scroll sentinel */}
            <div ref={loaderRef} className="h-8 flex items-center justify-center">
              {loadingMore && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-xs text-white/30"
                >
                  Loading more…
                </motion.div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
