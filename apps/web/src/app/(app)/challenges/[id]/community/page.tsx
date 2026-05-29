'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import CommunityPost, { PostData } from '@/components/community/CommunityPost';
import LoadingPulse from '@/components/lumio/LoadingPulse';

interface ChallengeInfo {
  niche_id: string;
  niche_label?: string;
  title?: string;
  current_day?: number;
  goal?: string;
}

export default function CommunityPage() {
  const params = useParams<{ id: string }>();
  const challengeId = params.id;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);

  // Composer state
  const [composerText, setComposerText] = useState('');
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canPost, setCanPost] = useState(true); // plan gate
  const [activeCount] = useState(247); // mock — replace with real API data

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch challenge info
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/challenges/${challengeId}`,
          { credentials: 'include' }
        );
        const json = await res.json();
        if (json.data) setChallenge(json.data);
      } catch {
        // silently fail
      }
    })();
  }, [challengeId]);

  // Fetch posts when challenge is ready
  useEffect(() => {
    if (!challenge?.niche_id) return;
    (async () => {
      setPostsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/posts?niche=${challenge.niche_id}`,
          { credentials: 'include' }
        );
        const json = await res.json();
        if (json.data) setPosts(json.data);
        if (json.error?.includes('plan') || json.error?.includes('free')) setCanPost(false);
      } catch {
        // silently fail
      } finally {
        setPostsLoading(false);
      }
    })();
  }, [challenge?.niche_id]);

  const handleAiDraft = async () => {
    if (!challenge || aiDraftLoading) return;
    setAiDraftLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/post-draft`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            goal: challenge.goal ?? challenge.title,
            niche: challenge.niche_id,
            dayNumber: challenge.current_day ?? 1,
          }),
        }
      );
      const json = await res.json();
      if (json.data) {
        setComposerText(typeof json.data === 'string' ? json.data : json.data.draft ?? '');
        textareaRef.current?.focus();
      }
    } catch {
      // silently fail
    } finally {
      setAiDraftLoading(false);
    }
  };

  const handleShare = async () => {
    const content = composerText.trim();
    if (!content || submitting || !challenge) return;

    setSubmitting(true);
    const optimistic: PostData = {
      id: `temp-${Date.now()}`,
      user_id: 'me',
      user_name: 'You',
      challenge_name: challenge.title,
      day_number: challenge.current_day,
      content,
      likes_count: 0,
      comments_count: 0,
      is_liked_by_me: false,
      created_at: new Date().toISOString(),
    };
    setPosts((p) => [optimistic, ...p]);
    setComposerText('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content,
            niche_id: challenge.niche_id,
            challenge_id: challengeId,
          }),
        }
      );
      const json = await res.json();
      if (json.data) {
        setPosts((p) =>
          p.map((post) => (post.id === optimistic.id ? { ...json.data } : post))
        );
      }
    } catch {
      // Remove optimistic post on failure
      setPosts((p) => p.filter((post) => post.id !== optimistic.id));
      setComposerText(content);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-28 max-w-lg mx-auto">
      {/* Active count header */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text3)' }}
        >
          {challenge?.niche_label ?? 'Community'}
        </p>
        <span
          className="text-xs flex items-center gap-1.5 font-medium"
          style={{ color: 'var(--color-text2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#22c55e' }}
          />
          {activeCount} active today
        </span>
      </div>

      {/* Post composer */}
      {canPost ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--color-bg3)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5"
              style={{ background: 'var(--color-bg4)', border: '1px solid var(--color-border2)' }}
            >
              🧑
            </div>
            <textarea
              ref={textareaRef}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              placeholder="Share your progress…"
              rows={composerText.length > 80 ? 3 : 2}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed"
              style={{ color: 'var(--color-text)' }}
            />
          </div>
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={handleAiDraft}
              disabled={aiDraftLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
              style={{
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
                background: 'var(--color-soft)',
              }}
            >
              {aiDraftLoading ? (
                <span className="animate-spin text-sm">✨</span>
              ) : (
                <span>✨</span>
              )}
              AI Draft
            </button>
            <button
              onClick={handleShare}
              disabled={!composerText.trim() || submitting}
              className="text-xs font-semibold px-4 py-1.5 rounded-full text-white transition-all hover:opacity-80 active:scale-95 disabled:opacity-30"
              style={{ background: 'var(--color-g)' }}
            >
              {submitting ? 'Sharing…' : 'Share'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl p-4 text-center"
          style={{
            background: 'var(--color-soft)',
            border: '1px solid var(--color-border)',
          }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--color-text2)' }}>
            🔒 Community posting requires a Starter plan or above.
          </p>
          <a
            href="/settings/plan"
            className="text-xs font-bold px-4 py-2 rounded-full text-white"
            style={{ background: 'var(--color-g)' }}
          >
            Upgrade Now
          </a>
        </motion.div>
      )}

      {/* Feed */}
      {postsLoading ? (
        <div className="flex justify-center py-10">
          <LoadingPulse />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-4xl">🌱</span>
          <p
            className="text-sm text-center"
            style={{ color: 'var(--color-text3)' }}
          >
            No posts yet. Be the first to share!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post, i) => (
            <CommunityPost key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
