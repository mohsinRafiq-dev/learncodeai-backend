// Tests for the commercial configuration and revenue split.
//
// This is money. Rounding drift here becomes an unreconcilable ledger, so the
// split is pinned by tests including the awkward cases: odd amounts, zero,
// bounds, and the invariant that the two halves always reconstruct the whole.

import {
  splitSale,
  PLATFORM_FEE_BPS,
  MIN_PLATFORM_FEE_BPS,
  MAX_PLATFORM_FEE_BPS,
  isValidCoursePrice,
  COURSE_PRICE,
  getPlan,
  PLAN,
  PLANS,
  AI_ACTION_COST,
  formatMoney,
} from "../../src/config/monetization.js";

describe("splitSale", () => {
  it("splits a round amount at the default 30%", () => {
    // $40.00 -> $12.00 platform, $28.00 creator
    expect(splitSale(4000)).toEqual({
      grossCents: 4000,
      platformFeeCents: 1200,
      creatorEarningsCents: 2800,
      feeBps: 3000,
    });
  });

  it("always reconstructs the gross from the two halves", () => {
    // The invariant that matters: no cent may be created or destroyed.
    for (const gross of [1, 7, 99, 100, 333, 999, 1234, 4999, 20000]) {
      const s = splitSale(gross);
      expect(s.platformFeeCents + s.creatorEarningsCents).toBe(gross);
    }
  });

  it("rounds the half-cent toward the creator, never the platform", () => {
    // 999 * 0.30 = 299.7 -> platform floored to 299, creator gets 700.
    const s = splitSale(999);
    expect(s.platformFeeCents).toBe(299);
    expect(s.creatorEarningsCents).toBe(700);
  });

  it("handles a free course without inventing a fee", () => {
    expect(splitSale(0)).toMatchObject({
      grossCents: 0,
      platformFeeCents: 0,
      creatorEarningsCents: 0,
    });
  });

  it("honours a per-creator override", () => {
    const s = splitSale(10000, 2000); // 20%
    expect(s.platformFeeCents).toBe(2000);
    expect(s.creatorEarningsCents).toBe(8000);
    expect(s.feeBps).toBe(2000);
  });

  it("clamps an override below the floor", () => {
    // A mistyped 0 must not hand over the platform's entire margin.
    const s = splitSale(10000, 0);
    expect(s.feeBps).toBe(MIN_PLATFORM_FEE_BPS);
    expect(s.platformFeeCents).toBe(500);
  });

  it("clamps an override above the ceiling", () => {
    // Nor may a fat-fingered 100% take everything from the creator.
    const s = splitSale(10000, 9900);
    expect(s.feeBps).toBe(MAX_PLATFORM_FEE_BPS);
    expect(s.creatorEarningsCents).toBe(5000);
  });

  it("rejects non-integer amounts, so floats never enter the ledger", () => {
    expect(() => splitSale(19.99)).toThrow(/non-negative integer/);
  });

  it("rejects negative amounts", () => {
    expect(() => splitSale(-100)).toThrow(/non-negative integer/);
  });

  it("uses 30% as the configured default", () => {
    expect(PLATFORM_FEE_BPS).toBe(3000);
  });
});

describe("course price validation", () => {
  it("accepts free", () => {
    expect(isValidCoursePrice(COURSE_PRICE.FREE)).toBe(true);
  });

  it("accepts the paid band inclusive of both ends", () => {
    expect(isValidCoursePrice(COURSE_PRICE.MIN_PAID_CENTS)).toBe(true);
    expect(isValidCoursePrice(COURSE_PRICE.MAX_PAID_CENTS)).toBe(true);
    expect(isValidCoursePrice(4000)).toBe(true);
  });

  it("rejects a price between free and the minimum", () => {
    // A $2 course costs more in Stripe fees than it earns.
    expect(isValidCoursePrice(200)).toBe(false);
  });

  it("rejects above the ceiling", () => {
    expect(isValidCoursePrice(COURSE_PRICE.MAX_PAID_CENTS + 1)).toBe(false);
  });

  it("rejects floats and negatives", () => {
    expect(isValidCoursePrice(19.99)).toBe(false);
    expect(isValidCoursePrice(-500)).toBe(false);
  });
});

describe("plan catalogue", () => {
  it("falls back to free for an unknown key", () => {
    expect(getPlan("enterprise").key).toBe(PLAN.FREE);
    expect(getPlan(undefined).key).toBe(PLAN.FREE);
  });

  it("gives free a real, finite AI allowance", () => {
    // The bug this whole phase exists to fix: free must be metered.
    const free = getPlan(PLAN.FREE);
    expect(free.aiCreditsPerMonth).toBeGreaterThan(0);
    expect(Number.isFinite(free.aiCreditsPerMonth)).toBe(true);
  });

  it("gives paid plans strictly more AI than free", () => {
    expect(getPlan(PLAN.PRO).aiCreditsPerMonth).toBeGreaterThan(
      getPlan(PLAN.FREE).aiCreditsPerMonth
    );
    expect(getPlan(PLAN.LIFETIME).aiCreditsPerMonth).toBeGreaterThan(
      getPlan(PLAN.FREE).aiCreditsPerMonth
    );
  });

  it("restricts free to beginner tutorials only", () => {
    expect(getPlan(PLAN.FREE).tutorialDifficulties).toEqual(["beginner"]);
    expect(getPlan(PLAN.PRO).tutorialDifficulties).toContain("advanced");
  });

  it("withholds certificates and verified generation from free", () => {
    const free = getPlan(PLAN.FREE);
    expect(free.certificates).toBe(false);
    expect(free.verifiedGeneration).toBe(false);
  });

  it("makes yearly cheaper per month than monthly", () => {
    const pro = PLANS[PLAN.PRO];
    expect(pro.yearlyPriceCents).toBeLessThan(pro.priceCents * 12);
  });

  it("prices lifetime above a year of Pro", () => {
    // Otherwise lifetime cannibalises the recurring revenue it should exceed.
    expect(PLANS[PLAN.LIFETIME].priceCents).toBeGreaterThan(
      PLANS[PLAN.PRO].yearlyPriceCents
    );
  });
});

describe("AI action costs", () => {
  it("charges most for verified generation", () => {
    // It runs retrieval, generation, sandbox execution and repair round-trips,
    // so it must not cost the same as a chat message.
    const costs = Object.values(AI_ACTION_COST);
    expect(AI_ACTION_COST.verified_generation).toBe(Math.max(...costs));
    expect(AI_ACTION_COST.verified_generation).toBeGreaterThan(AI_ACTION_COST.chat);
  });

  it("charges at least one credit for every action", () => {
    for (const [action, cost] of Object.entries(AI_ACTION_COST)) {
      expect(cost).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(cost)).toBe(true);
      expect(action).toBeTruthy();
    }
  });

  it("lets a free user do something useful before running out", () => {
    const free = getPlan(PLAN.FREE);
    const chats = free.aiCreditsPerMonth / AI_ACTION_COST.chat;
    expect(chats).toBeGreaterThanOrEqual(20);
  });
});

describe("formatMoney", () => {
  it("renders cents as currency", () => {
    expect(formatMoney(4000)).toBe("$40.00");
    expect(formatMoney(999)).toBe("$9.99");
    expect(formatMoney(0)).toBe("$0.00");
  });
});
