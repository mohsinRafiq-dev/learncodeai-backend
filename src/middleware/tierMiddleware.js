// Subscription tier middleware — gates premium content.
//
// Usage:
//   router.get("/full", auth, requireProOrLifetime, controller);
//   router.get("/preview", auth, attachTier, controller);
//
// `attachTier` is a non-blocking middleware that sets req.tier so controllers
// can decide WHAT to send (e.g. trim body for free users, return list with
// `isLocked` flag, etc.) without rejecting the request.

import Course from "../models/Course.js";
import CourseLesson from "../models/CourseLesson.js";
import CourseSection from "../models/CourseSection.js";

const isProActive = (user) => {
  if (!user) return false;
  if (user.subscriptionTier === "lifetime") return true;
  if (user.subscriptionTier !== "pro") return false;
  // Pro is only "active" if status is good and the period hasn't expired.
  const okStatus = ["active", "trialing"].includes(user.subscriptionStatus);
  const notExpired =
    !user.subscriptionExpiresAt ||
    new Date(user.subscriptionExpiresAt) > new Date();
  return okStatus && notExpired;
};

// Compute the access summary for a user — pure function used by controllers.
export const userAccess = (user) => ({
  tier: user?.subscriptionTier || "free",
  isPro: isProActive(user),
  isLifetime: user?.subscriptionTier === "lifetime",
  purchasedCourses: (user?.purchasedCourses || []).map(String),
});

// Lightweight middleware that attaches access summary to the request.
// Use on `auth`-protected routes so controllers can branch by tier.
export const attachTier = (req, _res, next) => {
  req.access = userAccess(req.user);
  next();
};

// Hard gate: blocks anyone who isn't Pro or Lifetime. Returns 402 with payment
// hint — the frontend should redirect to /pricing on 402.
export const requireProOrLifetime = (req, res, next) => {
  const access = userAccess(req.user);
  if (access.isPro || access.isLifetime) {
    req.access = access;
    return next();
  }
  return res.status(402).json({
    success: false,
    message: "This content requires a Pro or Lifetime subscription.",
    code: "PAYMENT_REQUIRED",
    upgradeUrl: "/pricing",
  });
};

// Allow if user is Pro/Lifetime OR has bought the specific course.
// Looks up the course id from req.params.courseId (or req.params.id) or the
// section/lesson's parent course. Use for course-tied endpoints.
export const requireCourseAccess = async (req, res, next) => {
  const access = userAccess(req.user);
  if (access.isPro || access.isLifetime) {
    req.access = access;
    return next();
  }

  // Resolve the course id from whatever route params exist.
  let courseId =
    req.params.courseId || (req.params.id && req.baseUrl.endsWith("/courses") && req.params.id);

  if (!courseId && (req.params.lessonId || req.params.sectionId)) {
    if (req.params.lessonId) {
      const lesson = await CourseLesson.findById(req.params.lessonId).select("section");
      if (lesson?.section) {
        const section = await CourseSection.findById(lesson.section).select("course");
        courseId = section?.course?.toString();
      }
    } else if (req.params.sectionId) {
      const section = await CourseSection.findById(req.params.sectionId).select("course");
      courseId = section?.course?.toString();
    }
  }

  if (courseId && access.purchasedCourses.includes(String(courseId))) {
    req.access = access;
    return next();
  }

  // Also accept the course's id from req.body for create-checkout flows
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: "Could not resolve course context to check access.",
    });
  }
  return res.status(402).json({
    success: false,
    message:
      "This course requires a Pro subscription, Lifetime, or a one-time purchase.",
    code: "PAYMENT_REQUIRED",
    upgradeUrl: "/pricing",
    courseId,
  });
};

// For tutorial content: free tier gets beginner level, paid gets all.
// Use AFTER `auth` (or a lenient auth that allows anonymous) to enforce this.
export const requireTutorialAccess = (req, res, next) => {
  const access = userAccess(req.user);
  req.access = access;
  // Difficulty may come from query (?difficulty=advanced) or from the resolved
  // tutorial doc on req.locals. If we can't tell yet, defer to the controller
  // which will check `req.access.isPro` before returning the body.
  const difficulty = (req.query.difficulty || "").toLowerCase();
  if (!difficulty || difficulty === "beginner") return next();
  if (access.isPro || access.isLifetime) return next();
  return res.status(402).json({
    success: false,
    message: "Intermediate and advanced tutorials require Pro.",
    code: "PAYMENT_REQUIRED",
    upgradeUrl: "/pricing",
  });
};

export default {
  attachTier,
  requireProOrLifetime,
  requireCourseAccess,
  requireTutorialAccess,
  userAccess,
};
