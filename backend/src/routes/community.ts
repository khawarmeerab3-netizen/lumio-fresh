import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';
import { authenticate, optionalAuth } from '../middleware/auth';
import { aiRateLimit } from '../middleware/rate-limit';
import { checkCommunityPostAllowed, requirePlan } from '../middleware/plan-gate';
import { generateCommunityPost } from '../services/ai/lumio-coach';
import { awardPoints } from '../services/points-engine';
import { checkBadgeUnlocks } from '../services/badge-engine';
import { createNotification } from '../services/notifications';
import { validate } from '../utils/validate';
import { notFound, forbidden } from '../utils/errors';
import { z } from 'zod';
import { POINTS_EARN } from '../../../shared/constants/points';

const router = Router();

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreatePostSchema = z.object({
  content: z.string().min(1).max(500),
  challenge_id: z.string().uuid().optional(),
  niche_id: z.string().optional(),
  image_url: z.string().url().optional(),
});

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(300),
});

// ─── GET /api/posts — Paginated community feed ────────────────────────────────

router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const niche = req.query.niche as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const filter = (req.query.filter as string) || 'all';
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    let query = supabase
      .from('community_posts')
      .select(
        `
        id, content, image_url, niche_id, likes_count, comments_count,
        created_at, flag_count,
        users:user_id (id, name, avatar_url, plan),
        challenges:challenge_id (goal, current_day)
        `,
        { count: 'exact' },
      )
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (niche) {
      query = query.eq('niche_id', niche);
    }

    // ── Following filter ────────────────────────────────────────────────────
    if (filter === 'following' && userId) {
      const { data: following } = await supabase
        .from('user_followers')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = (following ?? []).map((f: { following_id: string }) => f.following_id);

      if (followingIds.length === 0) {
        return res.json({ data: { posts: [], total: 0, page, limit } });
      }

      query = query.in('user_id', followingIds);
    }

    const { data: posts, count, error } = await query;
    if (error) throw error;

    // ── Attach is_liked_by_me ───────────────────────────────────────────────
    let likedPostIds = new Set<string>();
    if (userId && posts && posts.length > 0) {
      const postIds = posts.map((p: { id: string }) => p.id);
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);

      likedPostIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
    }

    const enriched = (posts ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      is_liked_by_me: likedPostIds.has(p.id as string),
    }));

    return res.json({ data: { posts: enriched, total: count ?? 0, page, limit } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/posts — Create post ───────────────────────────────────────────

router.post('/', authenticate, checkCommunityPostAllowed, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = validate(CreatePostSchema, req.body);
    const userId = req.user.id;

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        user_id: userId,
        content: body.content,
        challenge_id: body.challenge_id ?? null,
        niche_id: body.niche_id ?? null,
        image_url: body.image_url ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Award points + check badges in parallel — failures are non-fatal
    await Promise.allSettled([
      awardPoints(userId, POINTS_EARN.POST_IN_COMMUNITY, 'community_post', post.id),
      checkBadgeUnlocks(userId, 'posts_created'),
    ]);

    return res.status(201).json({ data: post });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/posts/:id/like — Toggle like ───────────────────────────────────

router.post('/:id/like', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Fetch post (also verifies it exists and is not hidden)
    const { data: post, error: postErr } = await supabase
      .from('community_posts')
      .select('id, user_id, likes_count, is_hidden')
      .eq('id', postId)
      .single();

    if (postErr || !post) throw notFound('Post not found');
    if (post.is_hidden) throw notFound('Post not found');

    // Check existing like
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    let liked: boolean;
    let newCount: number;

    if (existing) {
      // ── Unlike ────────────────────────────────────────────────────────────
      await supabase.from('post_likes').delete().eq('id', existing.id);
      newCount = Math.max(0, (post.likes_count ?? 0) - 1);
      await supabase.from('community_posts').update({ likes_count: newCount }).eq('id', postId);
      liked = false;
    } else {
      // ── Like ──────────────────────────────────────────────────────────────
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      newCount = (post.likes_count ?? 0) + 1;
      await supabase.from('community_posts').update({ likes_count: newCount }).eq('id', postId);
      liked = true;

      // Award points to post owner + send notification (only on new like, not self-like)
      if (post.user_id !== userId) {
        await Promise.allSettled([
          awardPoints(post.user_id, POINTS_EARN.POST_GETS_LIKE, 'post_like', postId),
          createNotification(post.user_id, {
            type: 'like',
            title: 'Someone liked your post!',
            body: 'Your community post just got a like. 🎉',
            data: { post_id: postId },
          }),
        ]);
      }
    }

    return res.json({ data: { liked, count: newCount } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/posts/:id/flag — Flag post ────────────────────────────────────

router.post('/:id/flag', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.id;

    const { data: post, error } = await supabase
      .from('community_posts')
      .select('id, flag_count, is_flagged')
      .eq('id', postId)
      .single();

    if (error || !post) throw notFound('Post not found');

    const newFlagCount = (post.flag_count ?? 0) + 1;
    const shouldFlag = newFlagCount >= 3;

    const { error: updateErr } = await supabase
      .from('community_posts')
      .update({
        flag_count: newFlagCount,
        ...(shouldFlag ? { is_flagged: true } : {}),
      })
      .eq('id', postId);

    if (updateErr) throw updateErr;

    // Notify admins if newly flagged
    if (shouldFlag && !post.is_flagged) {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('is_admin', true);

      await Promise.allSettled(
        (admins ?? []).map((admin: { id: string }) =>
          createNotification(admin.id, {
            type: 'moderation',
            title: 'Post flagged for review',
            body: `A community post has been flagged ${newFlagCount} times.`,
            data: { post_id: postId },
          }),
        ),
      );
    }

    return res.json({ data: { flagged: shouldFlag } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/posts/:id — Delete own post ──────────────────────────────────

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { data: post, error } = await supabase
      .from('community_posts')
      .select('id, user_id')
      .eq('id', postId)
      .single();

    if (error || !post) throw notFound('Post not found');
    if (post.user_id !== userId) throw forbidden('You can only delete your own posts');

    // Cascade deletes likes + comments via FK
    await supabase.from('community_posts').delete().eq('id', postId);

    return res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/posts/:id/comments — Get comments ───────────────────────────────

router.get('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const postId = req.params.id;

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('id, content, created_at, users:user_id (id, name, avatar_url)')
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.json({ data: { comments: comments ?? [] } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/posts/:id/comments — Add comment ───────────────────────────────

router.post(
  '/:id/comments',
  authenticate,
  requirePlan('starter'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id;
      const userId = req.user.id;
      const body = validate(CreateCommentSchema, req.body);

      // Verify post exists and is visible
      const { data: post, error: postErr } = await supabase
        .from('community_posts')
        .select('id, user_id, comments_count, is_hidden')
        .eq('id', postId)
        .single();

      if (postErr || !post) throw notFound('Post not found');
      if (post.is_hidden) throw notFound('Post not found');

      const { data: comment, error } = await supabase
        .from('post_comments')
        .insert({ post_id: postId, user_id: userId, content: body.content })
        .select('id, content, created_at, users:user_id (id, name, avatar_url)')
        .single();

      if (error) throw error;

      // Increment comments_count and notify post owner
      await Promise.allSettled([
        supabase
          .from('community_posts')
          .update({ comments_count: (post.comments_count ?? 0) + 1 })
          .eq('id', postId),
        post.user_id !== userId
          ? createNotification(post.user_id, {
              type: 'comment',
              title: 'New comment on your post',
              body: 'Someone commented on your community post.',
              data: { post_id: postId, comment_id: comment.id },
            })
          : Promise.resolve(),
      ]);

      return res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  },
);

// ─── DELETE /api/posts/:id/comments/:commentId — Delete own comment ───────────

router.delete(
  '/:id/comments/:commentId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: postId, commentId } = req.params;
      const userId = req.user.id;

      const { data: comment, error } = await supabase
        .from('post_comments')
        .select('id, user_id')
        .eq('id', commentId)
        .eq('post_id', postId)
        .single();

      if (error || !comment) throw notFound('Comment not found');
      if (comment.user_id !== userId) throw forbidden('You can only delete your own comments');

      await Promise.allSettled([
        supabase.from('post_comments').delete().eq('id', commentId),
        supabase.rpc('decrement_comments_count', { post_id: postId }),
      ]);

      return res.json({ data: { success: true } });
    } catch (err) {
      next(err);
    }
  },
);

// ─── POST /api/ai/post-draft — AI-assisted post draft ────────────────────────
// Note: mounted under communityRouter for colocation; called as POST /api/posts/ai/draft

router.post('/ai/draft', authenticate, aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal, niche, day } = req.body as { goal: string; niche: string; day: number };
    const language = req.user.selected_language ?? 'en';

    const draft = await generateCommunityPost(
      String(goal ?? ''),
      String(niche ?? ''),
      Number(day ?? 1),
      language,
    );

    return res.json({ data: { draft } });
  } catch (err) {
    next(err);
  }
});

export default router;
