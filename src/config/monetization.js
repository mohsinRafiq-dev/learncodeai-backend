// Single source of truth for commercial configuration.
//
// Prices, limits and the revenue split live here rather than being scattered
// across controllers. Nothing about money is decided by the client: the server
// reads this file and the Course document, and computes everything itself.
//
// Spec: docs/BUSINESS_MODEL.md

// All money is integer minor units (cents). Never floats — 0.1 + 0.2 !== 0.3
// and rounding drift in a ledger is unrecoverable.
export const CURRENCY = "usd";

// ---------------------------------------------------------------------------
// Revenue split
// ---------------------------------------------------------------------------

// Platform's cut of each marketplace sale, in basis points (3000 = 30.00%).
// Basis points avoid float percentages entirely.
export const PLATFORM_FEE_BPS = parseInt(process.env.PLATFORM_FEE_BPS || "3000", 10);

// A creator may be given a bespoke rate by an admin; this is the ceiling and
// floor for that override, so a mistake cannot give away 100% or take it all.
export const MIN_PLATFORM_FEE_BPS = 500;  // 5%
export const MAX_PLATFORM_FEE_BPS = 5000; // 50%

/**
 * Split a gross sale into platform fee and creator earnings.
 *
 * Rounding favours the creator: the platform fee is floored, so a half-cent
 * always lands on the creator's side. Over many transactions this is a
 * rounding difference of pennies, and erring toward the creator is the
 * defensible direction.
 *
 * @param {number} grossCents  list price in cents
 * @param {number} [feeBps]    override for this creator
 * @returns {{grossCents:number, platformFeeCents:number, creatorEarningsCents:number, feeBps:number}}
 */
export const splitSale = (grossCents, feeBps = PLATFORM_FEE_BPS) => {
  if (!Number.isInteger(grossCents) || grossCents < 0) {
    throw new Error(`grossCents must be a non-negative integer, got ${grossCents}`);
  }
  const bps = Math.min(Math.max(feeBps, MIN_PLATFORM_FEE_BPS), MAX_PLATFORM_FEE_BPS);
  const platformFeeCents = Math.floor((grossCents * bps) / 10000);
  return {
    grossCents,
    platformFeeCents,
    creatorEarningsCents: grossCents - platformFeeCents,
    feeBps: bps,
  };
};

// ---------------------------------------------------------------------------
// Course pricing bounds
// ---------------------------------------------------------------------------

export const COURSE_PRICE = {
  FREE: 0,
  MIN_PAID_CENTS: 500,    // $5
  MAX_PAID_CENTS: 20000,  // $200
};

export const isValidCoursePrice = (cents) =>
  Number.isInteger(cents) &&
  (cents === COURSE_PRICE.FREE ||
    (cents >= COURSE_PRICE.MIN_PAID_CENTS && cents <= COURSE_PRICE.MAX_PAID_CENTS));

// ---------------------------------------------------------------------------
// Learner plans
// ---------------------------------------------------------------------------

export const PLAN = {
  FREE: "free",
  PRO: "pro",
  LIFETIME: "lifetime",
};

// AI is metered in credits because every call costs real money. An
// "unlimited" tier is how AI products lose money on their heaviest users.
export const AI_ACTION_COST = {
  chat: 1,
  code_help: 2,
  quiz_generation: 5,
  // Highest: runs retrieval, generation, sandbox execution per snippet, and up
  // to N repair round-trips.
  verified_generation: 10,
};

export const PLANS = {
  [PLAN.FREE]: {
    key: PLAN.FREE,
    name: "Free",
    priceCents: 0,
    interval: null,
    aiCreditsPerMonth: 50,
    codeExecutionsPerDay: 30,
    savedSnippets: 10,
    quizAttemptsPerQuiz: 3,
    tutorialDifficulties: ["beginner"],
    platformCoursesIncluded: false,
    proCatalogueIncluded: false,
    certificates: false,
    verifiedGeneration: false,
    prioritySupport: false,
  },
  [PLAN.PRO]: {
    key: PLAN.PRO,
    name: "Pro",
    priceCents: 900,          // $9/mo
    yearlyPriceCents: 7900,   // $79/yr
    interval: "month",
    aiCreditsPerMonth: 2000,
    // Fair-use ceiling rather than true unlimited, to protect the sandbox.
    codeExecutionsPerDay: 500,
    savedSnippets: Infinity,
    quizAttemptsPerQuiz: Infinity,
    tutorialDifficulties: ["beginner", "intermediate", "advanced"],
    platformCoursesIncluded: true,
    proCatalogueIncluded: true,
    certificates: true,
    verifiedGeneration: true,
    prioritySupport: true,
  },
  [PLAN.LIFETIME]: {
    key: PLAN.LIFETIME,
    name: "Lifetime",
    priceCents: 24900, // $249 once
    interval: null,
    aiCreditsPerMonth: 2000,
    codeExecutionsPerDay: 500,
    savedSnippets: Infinity,
    quizAttemptsPerQuiz: Infinity,
    tutorialDifficulties: ["beginner", "intermediate", "advanced"],
    platformCoursesIncluded: true,
    proCatalogueIncluded: true,
    certificates: true,
    verifiedGeneration: true,
    prioritySupport: true,
  },
};

export const getPlan = (key) => PLANS[key] ?? PLANS[PLAN.FREE];

// ---------------------------------------------------------------------------
// Pro revenue pool
// ---------------------------------------------------------------------------

// Share of net Pro subscription revenue distributed to creators whose courses
// are opted into the Pro catalogue.
export const PRO_POOL_SHARE_BPS = parseInt(process.env.PRO_POOL_SHARE_BPS || "2000", 10); // 20%

// Cap on minutes a single user can contribute to one course in a period.
// Without this, a creator could farm the pool with a handful of accounts.
export const POOL_MINUTES_CAP_PER_USER_PER_COURSE = 300; // 5 hours

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export const PAYOUT = {
  MINIMUM_CENTS: 5000, // $50 — keeps transfer fees proportionate
  HOLD_DAYS: 7,        // buffer against refunds before funds become available
};

// Days a learner may self-serve a refund; entitlement is revoked automatically.
export const REFUND_WINDOW_DAYS = parseInt(process.env.REFUND_WINDOW_DAYS || "14", 10);

export const formatMoney = (cents, currency = CURRENCY) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

export default {
  CURRENCY,
  PLATFORM_FEE_BPS,
  splitSale,
  COURSE_PRICE,
  isValidCoursePrice,
  PLAN,
  PLANS,
  getPlan,
  AI_ACTION_COST,
  PRO_POOL_SHARE_BPS,
  PAYOUT,
  REFUND_WINDOW_DAYS,
  formatMoney,
};
