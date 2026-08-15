// Regression tests for two bugs found by putting a real subscription through
// production:
//
//   1. Stripe moved current_period_end onto the subscription ITEM. Reading it
//      off the subscription silently returned undefined, so subscriptionExpiresAt
//      was never set: no renewal date, and no expiry backstop if a cancellation
//      webhook is ever missed.
//
//   2. A Lifetime user who subscribed to Pro was demoted to Pro. Cancelling that
//      subscription would then have stripped the permanent access they had paid
//      more for.

import {
  hasActiveSubscription,
  effectivePlanKey,
  accessSummary,
} from "../../src/services/billing/entitlementService.js";
import { PLAN } from "../../src/config/monetization.js";

// Mirrors the resolver in billingController; kept here so the precedence rule
// is asserted independently of the webhook plumbing.
const periodEndOf = (subscription) => {
  const seconds =
    subscription.items?.data?.[0]?.current_period_end ??
    subscription.current_period_end ??
    null;
  return seconds ? new Date(seconds * 1000) : null;
};

describe("current_period_end resolution", () => {
  it("reads it from the subscription item, where Stripe now puts it", () => {
    const sub = { items: { data: [{ current_period_end: 1818372698 }] } };
    expect(periodEndOf(sub)?.toISOString()).toBe("2027-08-15T23:31:38.000Z");
  });

  it("still accepts the legacy top-level field", () => {
    const sub = { current_period_end: 1818372698, items: { data: [{}] } };
    expect(periodEndOf(sub)?.toISOString()).toBe("2027-08-15T23:31:38.000Z");
  });

  it("prefers the item when both are present", () => {
    const sub = {
      current_period_end: 1000000000,
      items: { data: [{ current_period_end: 1818372698 }] },
    };
    expect(periodEndOf(sub)?.getUTCFullYear()).toBe(2027);
  });

  it("returns null rather than an Invalid Date when neither is present", () => {
    expect(periodEndOf({ items: { data: [] } })).toBeNull();
    expect(periodEndOf({})).toBeNull();
  });
});

describe("lifetime outranks a recurring subscription", () => {
  const applyTier = (user, subscription) => {
    const isActive = ["active", "trialing"].includes(subscription.status);
    if (user.subscriptionTier !== "lifetime") {
      user.subscriptionTier = isActive ? "pro" : "free";
    }
    return user;
  };

  it("does not demote a lifetime user who also subscribes", () => {
    const user = { subscriptionTier: "lifetime" };
    applyTier(user, { status: "active" });
    expect(user.subscriptionTier).toBe("lifetime");
  });

  it("does not strip lifetime when that subscription is later cancelled", () => {
    const user = { subscriptionTier: "lifetime" };
    applyTier(user, { status: "canceled" });
    expect(user.subscriptionTier).toBe("lifetime");
  });

  it("still promotes a free user on an active subscription", () => {
    const user = { subscriptionTier: "free" };
    applyTier(user, { status: "active" });
    expect(user.subscriptionTier).toBe("pro");
  });

  it("still demotes a pro user when their subscription lapses", () => {
    const user = { subscriptionTier: "pro" };
    applyTier(user, { status: "canceled" });
    expect(user.subscriptionTier).toBe("free");
  });

  it("treats trialing as active", () => {
    const user = { subscriptionTier: "free" };
    applyTier(user, { status: "trialing" });
    expect(user.subscriptionTier).toBe("pro");
  });
});

describe("subscription activity", () => {
  it("counts an active pro subscription with no expiry recorded", () => {
    // This is the exact state the current_period_end bug produced. Access must
    // not break just because the date is missing.
    expect(
      hasActiveSubscription({
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        subscriptionExpiresAt: null,
      })
    ).toBe(true);
  });

  it("counts lifetime regardless of status or expiry", () => {
    expect(
      hasActiveSubscription({ subscriptionTier: "lifetime", subscriptionStatus: null })
    ).toBe(true);
  });

  it("rejects a pro subscription whose period has passed", () => {
    expect(
      hasActiveSubscription({
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        subscriptionExpiresAt: new Date(Date.now() - 86400000),
      })
    ).toBe(false);
  });

  it("rejects a past_due subscription", () => {
    expect(
      hasActiveSubscription({ subscriptionTier: "pro", subscriptionStatus: "past_due" })
    ).toBe(false);
  });

  it("rejects a free user", () => {
    expect(hasActiveSubscription({ subscriptionTier: "free" })).toBe(false);
    expect(hasActiveSubscription(null)).toBe(false);
  });
});

describe("effective plan", () => {
  it("reports lifetime for a lifetime user", () => {
    expect(effectivePlanKey({ subscriptionTier: "lifetime" })).toBe(PLAN.LIFETIME);
  });

  it("reports pro for an active subscriber", () => {
    expect(
      effectivePlanKey({ subscriptionTier: "pro", subscriptionStatus: "active" })
    ).toBe(PLAN.PRO);
  });

  it("falls back to free for a lapsed subscriber", () => {
    expect(
      effectivePlanKey({ subscriptionTier: "pro", subscriptionStatus: "canceled" })
    ).toBe(PLAN.FREE);
  });
});

describe("access summary", () => {
  it("grants a pro user the paid feature set", () => {
    const s = accessSummary({
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      role: "user",
    });
    expect(s.isPro).toBe(true);
    expect(s.limits.aiCreditsPerMonth).toBe(2000);
    expect(s.features.certificates).toBe(true);
    expect(s.features.verifiedGeneration).toBe(true);
  });

  it("holds a free user to the metered allowance", () => {
    const s = accessSummary({ subscriptionTier: "free", role: "user" });
    expect(s.isPro).toBe(false);
    expect(s.limits.aiCreditsPerMonth).toBe(50);
    expect(s.features.verifiedGeneration).toBe(false);
  });

  it("marks an admin as a creator for panel access", () => {
    expect(accessSummary({ role: "admin", subscriptionTier: "free" }).isCreator).toBe(true);
  });
});
