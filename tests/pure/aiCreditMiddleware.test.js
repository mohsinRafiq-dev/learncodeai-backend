// Tests for the AI credit middleware.
//
// The behaviours that matter commercially:
//   - an exhausted balance is refused with 402, not silently allowed
//   - a platform failure refunds the charge (we don't bill for our own outage)
//   - a user error does NOT refund (a bad request still consumed the call)
//   - if metering itself breaks, AI keeps working rather than going dark

import { jest } from "@jest/globals";

const mockConsume = jest.fn();
const mockRefund = jest.fn(async () => ({}));
const mockSummary = jest.fn(async () => ({ remaining: 10 }));

class FakeInsufficientCreditsError extends Error {
  constructor(needed, remaining, planKey) {
    super("insufficient");
    this.name = "InsufficientCreditsError";
    this.code = "INSUFFICIENT_AI_CREDITS";
    this.needed = needed;
    this.remaining = remaining;
    this.planKey = planKey;
  }
}

jest.unstable_mockModule("../../src/services/billing/aiCreditService.js", () => ({
  default: { consume: mockConsume, refund: mockRefund, summaryFor: mockSummary },
  InsufficientCreditsError: FakeInsufficientCreditsError,
  consume: mockConsume,
  refund: mockRefund,
  summaryFor: mockSummary,
}));

const { chargeAiCredits, requirePlanFeature } = await import(
  "../../src/middleware/aiCreditMiddleware.js"
);

/** Minimal express double that records what the handler did. */
const makeRes = () => {
  const listeners = {};
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    set(k, v) {
      this.headers[k] = v;
      return this;
    },
    on(event, cb) {
      (listeners[event] ??= []).push(cb);
      return this;
    },
    // Simulate the response completing with a given status.
    finishWith(code) {
      this.statusCode = code;
      (listeners.finish ?? []).forEach((cb) => cb());
    },
  };
  return res;
};

const user = { _id: "u1", role: "user", subscriptionTier: "free" };

beforeEach(() => {
  jest.clearAllMocks();
  mockConsume.mockResolvedValue({
    charged: 1,
    remaining: 9,
    allocated: 50,
    resetsAt: new Date("2026-09-01"),
  });
});

describe("successful charge", () => {
  it("charges and calls through to the handler", async () => {
    const req = { user };
    const res = makeRes();
    const next = jest.fn();

    await chargeAiCredits("chat")(req, res, next);

    expect(mockConsume).toHaveBeenCalledWith(user, "chat");
    expect(next).toHaveBeenCalled();
    expect(req.aiCredits.charged).toBe(1);
    expect(req.aiCredits.remaining).toBe(9);
  });

  it("advertises the remaining balance in response headers", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    expect(res.headers["X-AI-Credits-Remaining"]).toBe("9");
    expect(res.headers["X-AI-Credits-Charged"]).toBe("1");
  });
});

describe("exhausted balance", () => {
  beforeEach(() => {
    mockConsume.mockRejectedValue(new FakeInsufficientCreditsError(10, 3, "free"));
  });

  it("refuses with 402 and does not run the handler", async () => {
    const req = { user };
    const res = makeRes();
    const next = jest.fn();

    await chargeAiCredits("verified_generation")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe("INSUFFICIENT_AI_CREDITS");
  });

  it("points a free user at the upgrade path", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    expect(res.body.upgradeUrl).toBe("/pricing");
    expect(res.body.message).toMatch(/upgrade to pro/i);
  });

  it("does not dangle an upgrade link in front of a paying user", async () => {
    mockConsume.mockRejectedValue(new FakeInsufficientCreditsError(10, 0, "pro"));
    const req = { user: { ...user, subscriptionTier: "pro", subscriptionStatus: "active" } };
    const res = makeRes();

    await chargeAiCredits("chat")(req, res, jest.fn());

    expect(res.body.upgradeUrl).toBeNull();
    expect(res.body.message).toMatch(/reset/i);
  });

  it("reports how many credits were needed vs held", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("verified_generation")(req, res, jest.fn());

    expect(res.body.credits).toMatchObject({ needed: 10, remaining: 3 });
  });
});

describe("refund on platform failure", () => {
  it("refunds when the handler 500s", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    res.finishWith(500);

    expect(mockRefund).toHaveBeenCalledWith(user, "chat", "http_500");
  });

  it("refunds on a 503 from an upstream outage", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("verified_generation")(req, res, jest.fn());

    res.finishWith(503);

    expect(mockRefund).toHaveBeenCalledWith(user, "verified_generation", "http_503");
  });

  it("does NOT refund a successful response", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    res.finishWith(200);

    expect(mockRefund).not.toHaveBeenCalled();
  });

  it("does NOT refund a client error — the call still happened", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    res.finishWith(400);

    expect(mockRefund).not.toHaveBeenCalled();
  });

  it("refunds at most once even if finish fires twice", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat")(req, res, jest.fn());

    res.finishWith(500);
    res.finishWith(500);

    expect(mockRefund).toHaveBeenCalledTimes(1);
  });

  it("can be opted out of", async () => {
    const req = { user };
    const res = makeRes();
    await chargeAiCredits("chat", { refundOnFailure: false })(req, res, jest.fn());

    res.finishWith(500);

    expect(mockRefund).not.toHaveBeenCalled();
  });
});

describe("resilience", () => {
  it("fails open if metering itself breaks", async () => {
    // Losing a little revenue beats every AI feature going dark because the
    // usage collection had a hiccup.
    mockConsume.mockRejectedValue(new Error("mongo unavailable"));
    const req = { user };
    const res = makeRes();
    const next = jest.fn();

    await chargeAiCredits("chat")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.aiCredits.meteringFailed).toBe(true);
  });

  it("rejects an unauthenticated request before touching credits", async () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await chargeAiCredits("chat")(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(mockConsume).not.toHaveBeenCalled();
  });
});

describe("requirePlanFeature", () => {
  it("allows a Pro user through to a Pro-only feature", () => {
    const req = {
      user: { subscriptionTier: "pro", subscriptionStatus: "active", role: "user" },
    };
    const res = makeRes();
    const next = jest.fn();

    requirePlanFeature("verifiedGeneration")(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks a free user with 402 rather than a generic 403", () => {
    const req = { user: { subscriptionTier: "free", role: "user" } };
    const res = makeRes();
    const next = jest.fn();

    requirePlanFeature("verifiedGeneration")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe("FEATURE_NOT_IN_PLAN");
    expect(res.body.upgradeUrl).toBe("/pricing");
  });
});
