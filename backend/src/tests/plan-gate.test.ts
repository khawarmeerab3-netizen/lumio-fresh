// backend/src/tests/plan-gate.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkChallengeGate,
  PLAN_LIMITS,
  type GateContext,
  type PlanTier,
} from '../lib/plan-gate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ctx(plan: PlanTier, activeChallengeCount: number, requestedDuration: number): GateContext {
  return { plan, activeChallengeCount, requestedDuration };
}

// ─── Free plan ────────────────────────────────────────────────────────────────

describe('plan-gate — free plan', () => {
  it('allows a 1-day challenge when user has 0 active challenges', () => {
    const result = checkChallengeGate(ctx('free', 0, 1));
    expect(result.allowed).toBe(true);
  });

  it('allows a 3-day challenge when user has 0 active challenges', () => {
    const result = checkChallengeGate(ctx('free', 0, 3));
    expect(result.allowed).toBe(true);
  });

  it('allows a 7-day challenge when user has 0 active challenges', () => {
    const result = checkChallengeGate(ctx('free', 0, 7));
    expect(result.allowed).toBe(true);
  });

  it('blocks a 15-day duration for free plan → planLimitReached', () => {
    const result = checkChallengeGate(ctx('free', 0, 15));
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('planLimitReached');
  });

  it('blocks a 21-day duration for free plan → planLimitReached', () => {
    const result = checkChallengeGate(ctx('free', 0, 21));
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('planLimitReached');
  });

  it('blocks a 90-day duration for free plan → planLimitReached', () => {
    const result = checkChallengeGate(ctx('free', 0, 90));
    expect(result.allowed).toBe(false);
  });

  it('blocks a 365-day duration for free plan → planLimitReached', () => {
    const result = checkChallengeGate(ctx('free', 0, 365));
    expect(result.allowed).toBe(false);
  });

  it('blocks creating a 2nd challenge → planLimitReached (max 1)', () => {
    // User already has 1 active challenge
    const result = checkChallengeGate(ctx('free', 1, 7));
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('planLimitReached');
  });

  it('blocks a 1-day challenge when free user already has 1 active', () => {
    const result = checkChallengeGate(ctx('free', 1, 1));
    expect(result.allowed).toBe(false);
  });

  it('error message mentions upgrade', () => {
    const result = checkChallengeGate(ctx('free', 0, 30));
    if (!result.allowed) {
      expect(result.message.toLowerCase()).toContain('upgrade');
    }
  });
});

// ─── Starter plan ─────────────────────────────────────────────────────────────

describe('plan-gate — starter plan', () => {
  it('allows a 15-day challenge', () => {
    const result = checkChallengeGate(ctx('starter', 0, 15));
    expect(result.allowed).toBe(true);
  });

  it('allows a 30-day challenge', () => {
    const result = checkChallengeGate(ctx('starter', 0, 30));
    expect(result.allowed).toBe(true);
  });

  it('blocks a 90-day challenge', () => {
    const result = checkChallengeGate(ctx('starter', 0, 90));
    expect(result.allowed).toBe(false);
  });

  it('allows up to 3 active challenges', () => {
    const result = checkChallengeGate(ctx('starter', 2, 7));
    expect(result.allowed).toBe(true);
  });

  it('blocks 4th active challenge for starter', () => {
    const result = checkChallengeGate(ctx('starter', 3, 7));
    expect(result.allowed).toBe(false);
  });
});

// ─── Pro plan ─────────────────────────────────────────────────────────────────

describe('plan-gate — pro plan', () => {
  it('allows a 90-day challenge', () => {
    const result = checkChallengeGate(ctx('pro', 0, 90));
    expect(result.allowed).toBe(true);
  });

  it('blocks a 180-day challenge for pro', () => {
    const result = checkChallengeGate(ctx('pro', 0, 180));
    expect(result.allowed).toBe(false);
  });

  it('allows creating the 10th active challenge (at limit)', () => {
    expect(PLAN_LIMITS['pro'].maxActiveChallenges).toBe(10);
    const result = checkChallengeGate(ctx('pro', 9, 7));
    expect(result.allowed).toBe(true);
  });

  it('blocks creating the 11th active challenge → planLimitReached', () => {
    const result = checkChallengeGate(ctx('pro', 10, 7));
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('planLimitReached');
  });

  it('error message mentions the plan limit count', () => {
    const result = checkChallengeGate(ctx('pro', 10, 7));
    if (!result.allowed) {
      expect(result.message).toContain('10');
    }
  });
});

// ─── Elite plan ───────────────────────────────────────────────────────────────

describe('plan-gate — elite plan', () => {
  it('allows 365-day challenges', () => {
    const result = checkChallengeGate(ctx('elite', 0, 365));
    expect(result.allowed).toBe(true);
  });

  it('allows many concurrent active challenges', () => {
    const result = checkChallengeGate(ctx('elite', 49, 90));
    expect(result.allowed).toBe(true);
  });

  it('blocks at max active challenge limit', () => {
    const limit  = PLAN_LIMITS['elite'].maxActiveChallenges;
    const result = checkChallengeGate(ctx('elite', limit, 7));
    expect(result.allowed).toBe(false);
  });
});

// ─── Enterprise plan ──────────────────────────────────────────────────────────

describe('plan-gate — enterprise plan', () => {
  it('allows unlimited active challenges (Infinity limit)', () => {
    expect(PLAN_LIMITS['enterprise'].maxActiveChallenges).toBe(Infinity);
    // Even a huge number should pass
    const result = checkChallengeGate(ctx('enterprise', 999, 365));
    expect(result.allowed).toBe(true);
  });
});

// ─── Gate result shape ────────────────────────────────────────────────────────

describe('plan-gate — result shape', () => {
  it('allowed:true result has no reason or message fields', () => {
    const result = checkChallengeGate(ctx('pro', 0, 7));
    expect(result.allowed).toBe(true);
    expect('reason' in result).toBe(false);
    expect('message' in result).toBe(false);
  });

  it('allowed:false result always has reason and message', () => {
    const result = checkChallengeGate(ctx('free', 0, 90));
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBeTruthy();
      expect(result.message).toBeTruthy();
    }
  });
});
