// Course state machine.
//
//   draft ──submit──> pending_review ──approve──> approved ──publish──> published
//                           │                                              │
//                           └──reject──> rejected ──edit──> draft          └──unpublish──> approved
//
// Transitions live here rather than in the controllers so that "can this course
// move from X to Y" has one answer. Spread across handlers, a course ends up
// publishable directly from draft by whichever endpoint forgot to check.
//
// Spec: docs/BUSINESS_MODEL.md §4

import Course from "../../models/Course.js";
import CourseSection from "../../models/CourseSection.js";
import CourseLesson from "../../models/CourseLesson.js";
import CreatorProfile from "../../models/CreatorProfile.js";
import { isValidCoursePrice, COURSE_PRICE, formatMoney } from "../../config/monetization.js";

export const STATUS = {
  DRAFT: "draft",
  PENDING: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PUBLISHED: "published",
  SUSPENDED: "suspended",
};

// Who may perform each transition, and from where.
const TRANSITIONS = {
  submit:    { from: [STATUS.DRAFT, STATUS.REJECTED], to: STATUS.PENDING,   actor: "creator" },
  withdraw:  { from: [STATUS.PENDING],                to: STATUS.DRAFT,     actor: "creator" },
  approve:   { from: [STATUS.PENDING],                to: STATUS.APPROVED,  actor: "admin" },
  reject:    { from: [STATUS.PENDING],                to: STATUS.REJECTED,  actor: "admin" },
  publish:   { from: [STATUS.APPROVED],               to: STATUS.PUBLISHED, actor: "creator" },
  unpublish: { from: [STATUS.PUBLISHED],              to: STATUS.APPROVED,  actor: "creator" },
  suspend:   { from: [STATUS.PUBLISHED, STATUS.APPROVED], to: STATUS.SUSPENDED, actor: "admin" },
  reinstate: { from: [STATUS.SUSPENDED],              to: STATUS.APPROVED,  actor: "admin" },
};

export class TransitionError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

/** May `action` be applied to a course in this state, by this role? */
export const canTransition = (course, action, role) => {
  const rule = TRANSITIONS[action];
  if (!rule) return { ok: false, reason: `Unknown action: ${action}` };
  if (rule.actor === "admin" && role !== "admin") {
    return { ok: false, reason: "Only an administrator can do that." };
  }
  if (!rule.from.includes(course.status)) {
    return {
      ok: false,
      reason: `A ${course.status.replace("_", " ")} course cannot be ${action}ed.`,
    };
  }
  return { ok: true, to: rule.to };
};

/**
 * Is this course complete enough to go to review?
 *
 * Checked before submission rather than at approval, so the creator finds out
 * immediately instead of waiting for a reviewer to tell them the obvious.
 */
export const validateForSubmission = async (course) => {
  const problems = [];

  if (!course.title?.trim()) problems.push("Add a title.");
  if (!course.description?.trim() || course.description.length < 100) {
    problems.push("Write a description of at least 100 characters.");
  }
  if (!course.shortDescription?.trim()) problems.push("Add a short description.");
  if (!course.thumbnail) problems.push("Upload a thumbnail.");

  if (!isValidCoursePrice(course.priceCents)) {
    problems.push(
      `Set a price of ${formatMoney(COURSE_PRICE.FREE)} or between ` +
        `${formatMoney(COURSE_PRICE.MIN_PAID_CENTS)} and ${formatMoney(COURSE_PRICE.MAX_PAID_CENTS)}.`
    );
  }

  const sections = await CourseSection.find({ course: course._id }).select("_id title").lean();
  if (sections.length === 0) {
    problems.push("Add at least one section.");
  } else {
    const lessonCount = await CourseLesson.countDocuments({
      section: { $in: sections.map((s) => s._id) },
    });
    if (lessonCount < 3) {
      problems.push(`Add at least 3 lessons (currently ${lessonCount}).`);
    }
  }

  // A paid course whose creator cannot be paid would take a learner's money
  // with no way to pass on their share.
  if ((course.priceCents ?? 0) > 0) {
    const profile = await CreatorProfile.findOne({ user: course.instructor });
    if (!profile?.canSellPaidCourses()) {
      problems.push(
        profile?.paidPublishBlocker() ??
          "Complete payout onboarding before selling a paid course."
      );
    }
  }

  return { valid: problems.length === 0, problems };
};

/**
 * Apply a transition. Returns the saved course.
 *
 * @param {object} course   mongoose document
 * @param {string} action
 * @param {object} actor    the acting user
 * @param {object} [opts]   { reason } for reject/suspend
 */
export const transition = async (course, action, actor, { reason = null } = {}) => {
  const check = canTransition(course, action, actor.role);
  if (!check.ok) throw new TransitionError(check.reason);

  if (action === "submit") {
    const { valid, problems } = await validateForSubmission(course);
    if (!valid) {
      const err = new TransitionError("This course isn't ready for review yet.", 400);
      err.problems = problems;
      throw err;
    }
    course.submittedAt = new Date();
    course.reviewNotes = null;
  }

  if (action === "reject") {
    if (!reason?.trim()) {
      throw new TransitionError("A reason is required when rejecting a course.", 400);
    }
    course.reviewNotes = reason.trim();
  }

  if (action === "approve" || action === "reject") {
    course.reviewedBy = actor._id;
    course.reviewedAt = new Date();
  }

  if (action === "publish") {
    // Re-checked at publish time, not just at submission: onboarding could
    // have lapsed while the course sat in review.
    if ((course.priceCents ?? 0) > 0) {
      const profile = await CreatorProfile.findOne({ user: course.instructor });
      if (!profile?.canSellPaidCourses()) {
        throw new TransitionError(
          profile?.paidPublishBlocker() ?? "Payouts are not enabled on your account.",
          403
        );
      }
    }
    course.publishedAt = course.publishedAt ?? new Date();
  }

  if (action === "suspend") {
    course.reviewNotes = reason?.trim() ?? "Suspended by an administrator.";
  }

  course.status = check.to;
  // The pre-save hook keeps the legacy isPublished boolean in step.
  await course.save();
  return course;
};

/** Actions available to this actor right now — drives the Studio's buttons. */
export const availableActions = (course, role) =>
  Object.keys(TRANSITIONS).filter((a) => canTransition(course, a, role).ok);

/** Courses waiting on a reviewer, oldest first so nothing starves. */
export const reviewQueue = async ({ page = 1, limit = 20 } = {}) => {
  const query = { status: STATUS.PENDING };
  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate("instructor", "name email")
      .sort({ submittedAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(query),
  ]);
  return { courses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export default {
  STATUS,
  canTransition,
  validateForSubmission,
  transition,
  availableActions,
  reviewQueue,
  TransitionError,
};
