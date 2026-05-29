'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export interface PostComment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface PostData {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  challenge_name?: string;
  day_number?: number;
  streak?: number;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me?: boolean;
  comments?: PostComment[];
  created_at: string;
}

interface CommunityPostProps {
  post: PostData;
  index?: number;
}

export default function CommunityPost({ post, index = 0 }: CommunityPostProps) {
  const [liked, setLiked] = useState(post.is_liked_by_me ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<PostComment[]>(post.comments ?? []);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const handleLike = async () => {
    // Optimistic update
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : c - 1));

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/like`,
        {
          method: nextLiked ? 'POST' : 'DELETE',
          credentials: 'include',
        }
      );
    } catch {
      // Revert on failure
      setLiked(liked);
      setLikesCount(post.likes_count);
    }
  };

  const handleToggleComments = async () => {
    setCommentsOpen((o) => !o);

    if (!commentsOpen && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/comments`,
          { credentials: 'include' }
        );
        const json = await res.json();
        if (json.data) setComments(json.data);
      } catch {
        // silently fail — comments list stays empty
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleAddComment = async () => {
    const content = commentInput.trim();
    if (!content || commentSubmitting) return;

    setCommentSubmitting(true);
    const optimistic: PostComment = {
      id: `temp-${Date.now()}`,
      user_id: 'me',
      user_name: 'You',
      content,
      created_at: new Date().toISOString(),
    };
    setComments((c) => [...c, optimistic]);
    setCommentInput('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${post.id}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content }),
        }
      );
      const json = await res.json();
      if (json.data) {
        setComments((c) => c.map((cm) => (cm.id === optimistic.id ? json.data : cm)));
      }
    } catch {
      setComments((c) => c.filter((cm) => cm.id !== optimistic.id));
      setCommentInput(content);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--color-bg3)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Post header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
          style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border2)' }}
        >
          {post.user_avatar ? (
            <img
              src={post.user_avatar}
              alt={post.user_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            '🧑'
          )}
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text)', fontFamily: 'Syne, sans-serif' }}
            >
              {post.user_name}
            </span>
            {post.streak != null && post.streak > 0 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-soft)', color: 'var(--color-accent)' }}
              >
                🔥 {post.streak}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.challenge_name && (
              <span
                className="text-xs truncate"
                style={{ color: 'var(--color-text3)' }}
              >
                {post.challenge_name}
              </span>
            )}
            {post.day_number != null && (
              <>
                <span style={{ color: 'var(--color-text3)' }} className="text-xs">·</span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-text3)' }}
                >
                  Day {post.day_number}
                </span>
              </>
            )}
            <span style={{ color: 'var(--color-text3)' }} className="text-xs">·</span>
            <span className="text-xs" style={{ color: 'var(--color-text3)' }}>
              {timeAgo}
            </span>
          </div>
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {post.content}
        </p>
      </div>

      {/* Optional image */}
      {post.image_url && (
        <div className="mx-4 mb-3 overflow-hidden rounded-xl">
          <img
            src={post.image_url}
            alt="Post image"
            className="w-full object-cover max-h-64"
          />
        </div>
      )}

      {/* Action row */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm transition-all hover:opacity-80 active:scale-95"
          style={{ color: liked ? 'var(--color-accent)' : 'var(--color-text3)' }}
        >
          <motion.span
            animate={{ scale: liked ? [1, 1.4, 1] : 1 }}
            transition={{ duration: 0.25 }}
            className="text-base"
          >
            {liked ? '❤️' : '🤍'}
          </motion.span>
          <span className="font-medium">{likesCount}</span>
        </button>

        {/* Comments */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm transition-all hover:opacity-80"
          style={{ color: commentsOpen ? 'var(--color-accent)' : 'var(--color-text3)' }}
        >
          <span className="text-base">💬</span>
          <span className="font-medium">{comments.length || post.comments_count}</span>
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.share?.({ text: post.content }).catch(() => {});
          }}
          className="flex items-center gap-1.5 text-sm transition-all hover:opacity-80 ml-auto"
          style={{ color: 'var(--color-text3)' }}
        >
          <span className="text-base">↗️</span>
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-3 flex flex-col gap-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {commentsLoading ? (
                <p className="text-xs text-center py-2" style={{ color: 'var(--color-text3)' }}>
                  Loading comments…
                </p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-center py-1" style={{ color: 'var(--color-text3)' }}>
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border)' }}
                    >
                      🧑
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-text2)' }}
                      >
                        {c.user_name}
                      </span>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text)' }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Add comment */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent outline-none rounded-lg px-3 py-2 text-xs border transition-colors"
                  style={{
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--color-border)';
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentInput.trim() || commentSubmitting}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
                  style={{ background: 'var(--color-g)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
