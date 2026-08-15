// The single authority on "can this user access this".
//
// No controller decides access on its own. Previously the logic was spread
// across tierMiddleware, controllers, and ad-hoc checks against
// User.purchasedCourses, which meant a paywall could be enforced in one place
// and forgotten in another.
//
// Resolution order (first match wins):
//   1. admin
//   2. the course's own creator
//   3. an active Entitlement
//   4. Pro/Lifetime, where the course is platform-owned or opted into Pro
//   5. free-tier allowance
//   otherwise: denied, with a machine-readable reason
//
// Spec: docs/BUSINESS_MODEL.md §7

import Entitlement from "../../models/Entitlement.js";
import Course from "../../models/Course.js";
import { PLAN, getPlan } from "../../config/monetization.js";

export const DENY = {
  NEEDS_SUBSCRIPTION: "NEEDS_SUBSCRIPTION",
  NEEDS_PURCHASE: "NEEDS_PURCHASE",
  NOT_PUBLISHED: "NOT_PUBLISHED",
  NOT_FOUND: "NOT_FOUND",
};

/** Is the user's paid subscription currently active? */
export const hasActiveSubscription = (user) => {
  if (!user) return false;
  if (user.subscriptionTier === PLAN.LIFETIME) return true;
  if (user.subscriptionTier !== PLAN.PRO) return false;

  const statusOk = ["active", "trialing"].includes(user.subscriptionStatus);
  const notExpired =
    !user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > new Date();
  return statusOk && notExpired;
};

/** The plan a user is effectively on right now. */
export const effectivePlanKey = (user) => {
  if (!user) return PLAN.FREE;
  if (user.subscriptionTier === PLAN.LIFETIME) return PLAN.LIFETIME;
  return hasActiveSubscription(user) ? PLAN.PRO : PLAN.FREE;
};

/** Plan limits and feature flags for a user. */
export const planFor = (user) => getPlan(effectivePlanKey(user));

/**
 * Summary used by middleware and returned to the client so the UI can render
 * locks without a round trip per item.
 */
export const accessSummary = (user) => {
  const planKey = effectivePlanKey(user);
  const plan = getPlan(planKey);
  return {
    planKey,
    plan: plan.name,
    isPro: planKey === PLAN.PRO || planKey === PLAN.LIFETIME,
    isLifetime: planKey === PLAN.LIFETIME,
    isCreator: user?.role === "creator" || user?.role === "admin",
    isAdmin: user?.role === "admin",
    limits: {
      aiCreditsPerMonth: plan.aiCreditsPerMonth,
      codeExecutionsPerDay: plan.codeExecutionsPerDay,
      savedSnippets: plan.savedSnippets,
      quizAttemptsPerQuiz: plan.quizAttemptsPerQuiz,
    },
    features: {
      certificates: plan.certificates,
      verifiedGeneration: plan.verifiedGeneration,
      allDifficulties: plan.tutorialDifficulties.length > 1,
    },
  };
};

/**
 * Can this user open this course?
 *
 * @returns {Promise<{allowed:boolean, reason:string|null, via:string|null}>}
 *   `via` explains *why* it was allowed, which the UI uses to label access
 *   ("Included with Pro" vs "Purchased").
 */
export const canAccessCourse = async (user, courseOrId) => {
  const course =
    typeof courseOrId === "object" && courseOrId?._id
      ? courseOrId
      : await Course.findById(courseOrId).select(
          "status ownership priceCents includedInPro instructor isArchived"
        );

  if (!course) return { allowed: false, reason: DENY.NOT_FOUND, via: null };

  if (user?.role === "admin") return { allowed: true, reason: null, via: "admin" };

  // Creators always see their own work, including while it is in review.
  if (user && String(course.instructor) === String(user._id)) {
    return { allowed: true, reason: null, via: "author" };
  }

  // Everyone else only sees published courses.
  if (course.status !== "published" || course.isArchived) {
    return { allowed: false, reason: DENY.NOT_PUBLISHED, via: null };
  }

  // Free courses are open to any signed-in learner.
  if ((course.priceCents ?? 0) === 0 && course.ownership === "marketplace") {
    return { allowed: true, reason: null, via: "free" };
  }

  if (!user) return { allowed: false, reason: DENY.NEEDS_SUBSCRIPTION, via: null };

  // A direct purchase beats everything below it.
  const owned = await Entitlement.findOne({
    user: user._id,
    resourceType: "course",
    resource: course._id,
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).lean();
  if (owned) return { allowed: true, reason: null, via: "purchase" };

  // Subscription covers platform courses and anything opted into the Pro
  // catalogue — but never a marketplace course the creator kept à la carte.
  if (hasActiveSubscription(user)) {
    if (course.ownership === "platform" || course.includedInPro) {
      return { allowed: true, reason: null, via: "subscription" };
    }
    return { allowed: false, reason: DENY.NEEDS_PURCHASE, via: null };
  }

  return {
    allowed: false,
    reason: course.ownership === "platform" ? DENY.NEEDS_SUBSCRIPTION : DENY.NEEDS_PURCHASE,
    via: null,
  };
};

/** Tutorials gate on difficulty rather than purchase. */
export const canAccessTutorialDifficulty = (user, difficulty) => {
  const allowed = planFor(user).tutorialDifficulties;
  return allowed.includes(String(difficulty || "beginner").toLowerCase());
};

/**
 * Course ids a user can open without paying again. Used to decorate catalogue
 * listings in one query instead of N.
 */
export const entitledCourseIds = async (userId) => {
  if (!userId) return [];
  const rows = await Entitlement.find({
    user: userId,
    resourceType: "course",
    status: "active",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .select("resource")
    .lean();
  return rows.map((r) => String(r.resource));
};

/** The 402 body for a denied resource. Consistent shape for the frontend. */
export const paywallResponse = (reason, extra = {}) => {
  const messages = {
    [DENY.NEEDS_SUBSCRIPTION]: "This content is included with a Pro subscription.",
    [DENY.NEEDS_PURCHASE]: "This course is a one-time purchase.",
    [DENY.NOT_PUBLISHED]: "This course is not available yet.",
    [DENY.NOT_FOUND]: "Course not found.",
  };
  return {
    success: false,
    code: reason,
    message: messages[reason] ?? "You do not have access to this content.",
    upgradeUrl: "/pricing",
    ...extra,
  };
};

export default {
  hasActiveSubscription,
  effectivePlanKey,
  planFor,
  accessSummary,
  canAccessCourse,
  canAccessTutorialDifficulty,
  entitledCourseIds,
  paywallResponse,
  DENY,
};
