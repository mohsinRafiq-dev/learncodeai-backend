// Role gates for the creator surface.
//
// Deliberately separate from adminMiddleware: an admin is not automatically a
// creator (they have no CreatorProfile and no connected payout account), and a
// creator must never inherit admin powers. Conflating the two is how a review
// queue ends up approvable by the person who submitted to it.

import CreatorProfile from "../models/CreatorProfile.js";

/**
 * Requires an approved creator. Loads the profile onto req.creatorProfile so
 * handlers don't each re-query it.
 */
export const requireCreator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const profile = await CreatorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(403).json({
        success: false,
        code: "NOT_A_CREATOR",
        message: "You need an approved creator account to do this.",
        applyUrl: "/creator/apply",
      });
    }

    // Gate on the profile, not on User.role. An admin keeps role "admin" even
    // once approved as a creator — the role is additive and admin outranks it —
    // so checking the role here would lock admins out of their own Studio.

    if (profile.status !== "approved") {
      const messages = {
        pending: "Your creator application is still under review.",
        rejected: "Your creator application was not approved.",
        suspended: "Your creator account is suspended.",
      };
      return res.status(403).json({
        success: false,
        code: `CREATOR_${profile.status.toUpperCase()}`,
        message: messages[profile.status] ?? "Creator access unavailable.",
      });
    }

    req.creatorProfile = profile;
    next();
  } catch (error) {
    console.error("requireCreator failed:", error);
    res.status(500).json({ success: false, message: "Could not verify creator status." });
  }
};

/**
 * Requires a creator who can actually be paid.
 *
 * Publishing a paid course without working payout rails would take a learner's
 * money with no way to pass the creator's share on, so this is enforced at the
 * boundary rather than left to the UI.
 */
export const requirePayoutsEnabled = (req, res, next) => {
  const profile = req.creatorProfile;
  if (profile?.canSellPaidCourses()) return next();

  return res.status(403).json({
    success: false,
    code: "PAYOUTS_NOT_ENABLED",
    message: profile?.paidPublishBlocker() ?? "Payouts are not enabled on your account.",
    onboardingUrl: "/creator/payouts",
  });
};

/**
 * Ownership check for a course-scoped route. Admins pass through so they can
 * moderate; everyone else must own the resource.
 */
export const requireCourseOwnership = (getCourse) => async (req, res, next) => {
  try {
    const course = await getCourse(req);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    if (req.user.role === "admin" || String(course.instructor) === String(req.user._id)) {
      req.course = course;
      return next();
    }

    // 404 rather than 403: revealing that a course exists but belongs to
    // someone else leaks the catalogue of unpublished work.
    return res.status(404).json({ success: false, message: "Course not found." });
  } catch (error) {
    console.error("requireCourseOwnership failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { requireCreator, requirePayoutsEnabled, requireCourseOwnership };
