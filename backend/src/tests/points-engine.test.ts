// backend/src/tests/points-engine.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  awardPoints,
  deductPoints,
  checkStreakBonus,
  createLedger,
  STREAK_BONUS_POINTS,
  PLAN_MULTIPLIERS,
  type PointsLedger,
} from '../lib/points-engine.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function freeLedger(balance = 0): PointsLedger {
  return createLedger('user_free', 'free', balance);
}

function eliteLedger(balance = 0): PointsLedger {
  return createLedger('user_elite', 'elite', balance);
}

// ─── awardPoints ─────────────────────────────────────────────────────────────

describe('awardPoints', () => {
  it('increases balance by the awarded amount (free plan, 1× multiplier)', () => {
    const ledger = freeLedger(0);
    const tx     = awardPoints(ledger, 10, 'daily task');

    expect(tx.delta).toBe(10);
    expect(ledger.balance).toBe(10);
    expect(tx.newBalance).toBe(10);
  });

  it('accumulates multiple awards correctly', () => {
    const ledger = freeLedger(0);
    awardPoints(ledger, 10, 'task 1');
    awardPoints(ledger, 10, 'task 2');
    const tx = awardPoints(ledger, 10, 'task 3');

    expect(ledger.balance).toBe(30);
    expect(tx.newBalance).toBe(30);
  });

  it('awards from a non-zero starting balance', () => {
    const ledger = freeLedger(100);
    awardPoints(ledger, 10, 'bonus');

    expect(ledger.balance).toBe(110);
  });

  it('applies 2× multiplier for Elite plan', () => {
    const ledger = eliteLedger(0);
    const tx     = awardPoints(ledger, 10, 'daily task');

    expect(PLAN_MULTIPLIERS['elite']).toBe(2);
    expect(tx.delta).toBe(20);
    expect(ledger.balance).toBe(20);
  });

  it('applies 1.5× multiplier for Pro plan', () => {
    const ledger = createLedger('u', 'pro', 0);
    const tx     = awardPoints(ledger, 10, 'daily task');

    expect(tx.delta).toBe(15);
  });

  it('applies 1× multiplier for Starter plan', () => {
    const ledger = createLedger('u', 'starter', 0);
    const tx     = awardPoints(ledger, 10, 'task');

    expect(tx.delta).toBe(10);
  });

  it('increments totalEarned along with balance', () => {
    const ledger = freeLedger(0);
    awardPoints(ledger, 50, 'bonus');

    expect(ledger.totalEarned).toBe(50);
  });

  it('does not mutate other fields on the ledger', () => {
    const ledger = freeLedger(0);
    const originalUserId = ledger.userId;
    const originalPlan   = ledger.plan;
    awardPoints(ledger, 10, 'task');

    expect(ledger.userId).toBe(originalUserId);
    expect(ledger.plan).toBe(originalPlan);
  });
});

// ─── deductPoints ─────────────────────────────────────────────────────────────

describe('deductPoints', () => {
  it('reduces balance by deducted amount', () => {
    const ledger = freeLedger(100);
    const tx     = deductPoints(ledger, 30, 'penalty');

    expect(tx.delta).toBe(-30);
    expect(ledger.balance).toBe(70);
    expect(tx.newBalance).toBe(70);
  });

  it('never lets balance go below zero (partial deduction)', () => {
    const ledger = freeLedger(20);
    const tx     = deductPoints(ledger, 50, 'penalty');

    expect(ledger.balance).toBe(0);
    expect(tx.delta).toBe(-20); // only deducted what was available
  });

  it('balance stays at 0 when deducting from a zero balance', () => {
    const ledger = freeLedger(0);
    const tx     = deductPoints(ledger, 100, 'penalty');

    expect(ledger.balance).toBe(0);
    expect(tx.delta).toBe(0);
  });

  it('deducting exact balance results in zero', () => {
    const ledger = freeLedger(50);
    deductPoints(ledger, 50, 'exact');

    expect(ledger.balance).toBe(0);
  });

  it('does NOT reduce totalEarned — only balance', () => {
    const ledger = freeLedger(100);
    deductPoints(ledger, 40, 'penalty');

    // totalEarned is immutable history; only balance changes
    expect(ledger.totalEarned).toBe(100);
    expect(ledger.balance).toBe(60);
  });
});

// ─── checkStreakBonus ─────────────────────────────────────────────────────────

describe('checkStreakBonus', () => {
  it('awards a bonus when streak reaches 7-day threshold', () => {
    const ledger = freeLedger(0);
    const result = checkStreakBonus(ledger, 7);

    expect(result).not.toBeNull();
    expect(result!.delta).toBe(STREAK_BONUS_POINTS);
    expect(result!.bonusFired).toBe(7);
    expect(ledger.balance).toBe(STREAK_BONUS_POINTS);
  });

  it('fires exactly once at the 7-day threshold (idempotent)', () => {
    const ledger = freeLedger(0);

    const first  = checkStreakBonus(ledger, 7);
    const second = checkStreakBonus(ledger, 7);
    const third  = checkStreakBonus(ledger, 7);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(third).toBeNull();
    // Balance only increased once
    expect(ledger.balance).toBe(STREAK_BONUS_POINTS);
  });

  it('fires again at the 14-day threshold after already firing at 7', () => {
    const ledger = freeLedger(0);

    checkStreakBonus(ledger, 7);
    const result = checkStreakBonus(ledger, 14);

    expect(result).not.toBeNull();
    expect(result!.bonusFired).toBe(14);
    expect(ledger.balance).toBe(STREAK_BONUS_POINTS * 2);
  });

  it('returns null when streak has not reached any threshold', () => {
    const ledger = freeLedger(0);
    const result = checkStreakBonus(ledger, 5);

    expect(result).toBeNull();
    expect(ledger.balance).toBe(0);
  });

  it('awards bonus for streak above threshold (e.g. streak=8 still fires 7-day bonus)', () => {
    const ledger = freeLedger(0);
    const result = checkStreakBonus(ledger, 8);

    expect(result).not.toBeNull();
    expect(result!.bonusFired).toBe(7);
  });

  it('does not double-fire 7-day bonus when called with streak=8 then streak=9', () => {
    const ledger = freeLedger(0);

    checkStreakBonus(ledger, 8); // fires 7-day threshold
    const second = checkStreakBonus(ledger, 9); // 7 already fired, 14 not yet reached

    expect(second).toBeNull();
  });

  it('fires multiple thresholds over time as streak grows', () => {
    const ledger  = freeLedger(0);
    const thresholds = [7, 14, 21, 30];
    let totalBonus = 0;

    for (const t of thresholds) {
      const result = checkStreakBonus(ledger, t);
      if (result) totalBonus += result.delta;
    }

    expect(totalBonus).toBe(STREAK_BONUS_POINTS * thresholds.length);
  });

  it('streak bonus is added to totalEarned', () => {
    const ledger = freeLedger(0);
    checkStreakBonus(ledger, 7);

    expect(ledger.totalEarned).toBe(STREAK_BONUS_POINTS);
  });
});
