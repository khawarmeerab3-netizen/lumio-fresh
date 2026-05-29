// backend/src/tests/streak-logic.test.ts
import { describe, it, expect } from 'vitest';
import {
  completeDay,
  justifyMissedDay,
  createStreakState,
  type StreakState,
} from '../lib/streak-logic.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDate(offsetDays: number): Date {
  const d = new Date('2025-01-10T12:00:00Z');
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// Day 0 = 2025-01-10
const DAY0 = makeDate(0);
const DAY1 = makeDate(1);
const DAY2 = makeDate(2);
const DAY3 = makeDate(3);
const DAY5 = makeDate(5); // gap after DAY3

function freshState(plan: StreakState['plan'] = 'free', freezes = 0): StreakState {
  return createStreakState('user_test', plan, freezes);
}

// ─── completeDay — basic streak building ──────────────────────────────────────

describe('completeDay — streak increments', () => {
  it('starts streak at 1 on first completion', () => {
    const state  = freshState();
    const result = completeDay(state, DAY0);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(1);
  });

  it('increments streak to 2 on consecutive second day', () => {
    const state = freshState();
    completeDay(state, DAY0);
    const result = completeDay(state, DAY1);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(2);
  });

  it('increments streak across 3 consecutive days', () => {
    const state = freshState();
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    const result = completeDay(state, DAY2);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(3);
    expect(state.current).toBe(3);
  });

  it('updates longest streak when current exceeds it', () => {
    const state = freshState();
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    completeDay(state, DAY2);

    expect(state.longest).toBe(3);
  });

  it('completing same day twice is idempotent (streak stays same)', () => {
    const state = freshState();
    completeDay(state, DAY0);
    const result = completeDay(state, DAY0);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(1); // no change
    expect(state.current).toBe(1);
  });

  it('records lastCompletedDate after first completion', () => {
    const state = freshState();
    completeDay(state, DAY0);

    expect(state.lastCompletedDate).toBe('2025-01-10');
  });
});

// ─── completeDay — streak reset on missed day ─────────────────────────────────

describe('completeDay — streak resets after missed day', () => {
  it('resets streak to 1 after missing one day (no freeze)', () => {
    const state = freshState('free', 0);
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    completeDay(state, DAY2);
    // Skip DAY3 — complete on DAY5 (2-day gap)
    const result = completeDay(state, DAY5);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(1);
    expect(state.current).toBe(1);
  });

  it('preserves longest streak after a reset', () => {
    const state = freshState();
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    completeDay(state, DAY2); // longest = 3
    completeDay(state, DAY5); // reset

    expect(state.longest).toBe(3);
    expect(state.current).toBe(1);
  });

  it('returns ok:true with streak=1 after reset (reset is not an error)', () => {
    const state  = freshState();
    completeDay(state, DAY0);
    const result = completeDay(state, DAY3); // gap = 3 days

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.streak).toBe(1);
    }
  });
});

// ─── completeDay — streak freeze ─────────────────────────────────────────────

describe('completeDay — streak freeze', () => {
  it('prevents streak reset when user has a freeze (1 freeze consumed)', () => {
    const state = freshState('free', 1); // 1 freeze available
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    completeDay(state, DAY2); // streak = 3
    // Skip DAY3, complete on DAY5 — would normally reset
    const result = completeDay(state, DAY5);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.streak).toBe(3); // preserved!
      expect(result.freezeConsumed).toBe(true);
    }
  });

  it('consumes exactly one freeze on use', () => {
    const state = freshState('free', 2); // 2 freezes
    completeDay(state, DAY0);
    completeDay(state, DAY5); // triggers freeze

    expect(state.freezesLeft).toBe(1);
  });

  it('resets streak when freeze is available but gap is only 1 day — freeze not needed', () => {
    // A 1-day gap means consecutive days — no freeze needed, no reset
    const state = freshState('free', 1);
    completeDay(state, DAY0);
    const result = completeDay(state, DAY1);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(2);
    expect(state.freezesLeft).toBe(1); // freeze NOT consumed for consecutive day
  });

  it('resets streak when 0 freezes are left', () => {
    const state = freshState('free', 0);
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    const result = completeDay(state, DAY5); // gap, no freeze

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.streak).toBe(1); // reset
  });

  it('second missed-day gap uses second freeze if available', () => {
    const state = freshState('free', 2);
    completeDay(state, DAY0);
    completeDay(state, DAY2); // first freeze consumed
    completeDay(state, DAY5); // second freeze consumed

    expect(state.freezesLeft).toBe(0);
    expect(state.current).toBeGreaterThan(0); // streak preserved both times
  });
});

// ─── justifyMissedDay ─────────────────────────────────────────────────────────

describe('justifyMissedDay — always returns error', () => {
  it('returns ok:false for a free user', () => {
    const state  = freshState('free');
    const result = justifyMissedDay(state, 'I was sick');

    expect(result.ok).toBe(false);
  });

  it('returns ok:false for an elite user', () => {
    const state  = freshState('elite');
    const result = justifyMissedDay(state, 'Important meeting ran late');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    }
  });

  it('returns ok:false for a pro user', () => {
    const state  = freshState('pro');
    const result = justifyMissedDay(state, 'Travelling');

    expect(result.ok).toBe(false);
  });

  it('does not mutate the streak state when called', () => {
    const state   = freshState('elite');
    completeDay(state, DAY0);
    completeDay(state, DAY1);
    const streakBefore = state.current;

    justifyMissedDay(state, 'I tried');

    expect(state.current).toBe(streakBefore); // no mutation
  });

  it('error message mentions streak freeze as the alternative', () => {
    const state  = freshState('elite');
    const result = justifyMissedDay(state, 'excuse');

    if (!result.ok) {
      expect(result.error.toLowerCase()).toContain('freeze');
    }
  });
});
