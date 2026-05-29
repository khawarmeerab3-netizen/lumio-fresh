import { supabaseAdmin } from '../utils/supabase';
import { POINTS_EARN } from '../../../shared/constants/points';
import type { Badge, UserBadge } from '../../../shared/types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BadgeRow {
  id: string;
  name: string;
  description: string;
  image_url: string;
  condition_type: string;
  condition_value: number;
  points_cost: number;
  is_purchasable: boolean;
}

// ─── checkBadgeUnlocks ────────────────────────────────────────────────────────

export async function checkBadgeUnlocks(userId: string): Promise<Badge[]> {
  // 1. All badges in the system
  const { data: allBadges, error: badgesError } = await supabaseAdmin
    .from('badges')
    .select('*');

  if (badgesError || !allBadges) return [];

  // 2. Badges the user already has
  const { data: ownedRows } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const ownedIds = new Set((ownedRows ?? []).map((r: { badge_id: string }) => r.badge_id));

  // 3. Fetch user stats needed for condition evaluation
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('streak_current, streak_longest, total_points_earned')
    .eq('id', userId)
    .single();

  // challenges_created
  const { count: challengesCreated } = await supabaseAdmin
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // challenges_completed
  const { count: challengesCompleted } = await supabaseAdmin
    .from('challenges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  // niches_tried (distinct niche_id)
  const { data: nicheRows } = await supabaseAdmin
    .from('challenges')
    .select('niche_id')
    .eq('user_id', userId);
  const nichesTried = new Set((nicheRows ?? []).map((r: { niche_id: string }) => r.niche_id)).size;

  // posts_created
  const { count: postsCreated } = await supabaseAdmin
    .from('community_posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  // likes_received (sum of likes_count on user's posts)
  const { data: postRows } = await supabaseAdmin
    .from('community_posts')
    .select('likes_count')
    .eq('user_id', userId);
  const likesReceived = (postRows ?? []).reduce(
    (sum: number, p: { likes_count: number }) => sum + (p.likes_count ?? 0),
    0
  );

  // buddy_challenges (accepted buddies where both completed)
  const { count: buddyChallenges } = await supabaseAdmin
    .from('challenge_buddies')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'accepted');

  const stats = {
    challenges_created: challengesCreated ?? 0,
    challenges_completed: challengesCompleted ?? 0,
    streak_days: Math.max(
      (user?.streak_current ?? 0) as number,
      (user?.streak_longest ?? 0) as number
    ),
    niches_tried: nichesTried,
    posts_created: postsCreated ?? 0,
    likes_received: likesReceived,
    total_points: (user?.total_points_earned ?? 0) as number,
    buddy_challenges: buddyChallenges ?? 0,
  };

  // 4. Evaluate each un-owned badge
  const newlyUnlocked: Badge[] = [];

  for (const badge of allBadges as BadgeRow[]) {
    if (ownedIds.has(badge.id)) continue;

    const conditionType = badge.condition_type as keyof typeof stats;
    const stat = stats[conditionType] ?? 0;

    if (stat >= badge.condition_value) {
      const awarded = await _insertBadge(userId, badge);
      if (awarded) newlyUnlocked.push(awarded);
    }
  }

  return newlyUnlocked;
}

// ─── awardBadge ───────────────────────────────────────────────────────────────

export async function awardBadge(userId: string, badgeId: string): Promise<Badge | null> {
  // Check badge exists
  const { data: badge, error: badgeError } = await supabaseAdmin
    .from('badges')
    .select('*')
    .eq('id', badgeId)
    .maybeSingle();

  if (badgeError || !badge) return null;

  // Check not already owned
  const { data: existing } = await supabaseAdmin
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .maybeSingle();

  if (existing) return null; // already has it

  return _insertBadge(userId, badge as BadgeRow);
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function _insertBadge(userId: string, badge: BadgeRow): Promise<Badge | null> {
  const { error: insertError } = await supabaseAdmin
    .from('user_badges')
    .insert({ user_id: userId, badge_id: badge.id });

  if (insertError) return null;

  // Award points for earning the badge (import lazily to avoid circular dep)
  try {
    const { awardPoints } = await import('./points-engine');
    await awardPoints(
      userId,
      'EARN_BADGE',
      POINTS_EARN.EARN_BADGE,
      `Badge unlocked: ${badge.name}`,
      badge.id
    );
  } catch {
    // Points award failure must not block badge award
  }

  // Insert notification
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type: 'badge_unlocked',
      title: '🏅 New Badge Unlocked!',
      message: `You earned the "${badge.name}" badge!`,
      data: { badgeId: badge.id, badgeName: badge.name },
    });
  } catch {
    // Notification failure is non-fatal
  }

  return {
    id: badge.id,
    name: badge.name,
    description: badge.description,
    image_url: badge.image_url,
    condition_type: badge.condition_type,
    condition_value: badge.condition_value,
    points_cost: badge.points_cost,
    is_purchasable: badge.is_purchasable,
  };
}

// ─── getUserBadges ────────────────────────────────────────────────────────────

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabaseAdmin
    .from('user_badges')
    .select('*, badges(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as UserBadge[];
}
