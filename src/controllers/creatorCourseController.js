// Creator-owned course management: create, price, submit, publish.
//
// Every state change goes through courseLifecycleService so the rules live in
// one place. This controller only decides who is asking and returns the result.

import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import Order from "../models/Order.js";
import lifecycle, { STATUS } from "../services/billing/courseLifecycleService.js";
import {
  isValidCoursePrice,
  COURSE_PRICE,
  splitSale,
  formatMoney,
} from "../config/monetization.js";

// GET /api/creator/courses
export const listMyCourses = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { instructor: req.user._id };
    if (status && status !== "all") query.status = status;

    const courses = await Course.find(query).sort({ updatedAt: -1 }).lean();

    const decorated = courses.map((c) => ({
      ...c,
      // The Studio renders buttons from this rather than reimplementing the
      // state machine in the browser, where it would drift.
      availableActions: lifecycle.availableActions(c, req.user.role),
      earningsPreview:
        c.priceCents > 0
          ? splitSale(c.priceCents, req.creatorProfile?.platformFeeBps)
          : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        courses: decorated,
        counts: courses.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] ?? 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/creator/courses
export const createCourse = async (req, res) => {
  try {
    const { title, description, shortDescription, language, category, difficulty } =
      req.body || {};

    if (!title?.trim() || !language || !category) {
      return res.status(400).json({
        success: false,
        message: "title, language and category are required.",
      });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description ?? "",
      shortDescription: shortDescription ?? "",
      language: String(language).toLowerCase(),
      category: String(category).toLowerCase(),
      difficulty: difficulty ?? "beginner",
      instructor: req.user._id,
      // Creator-authored courses are marketplace-owned: they earn a revenue
      // share, unlike the platform's own catalogue.
      ownership: "marketplace",
      status: STATUS.DRAFT,
      priceCents: 0,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error("Course creation failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/creator/courses/:courseId
export const updateCourse = async (req, res) => {
  try {
    const course = req.course;

    // A course under review is locked. Editing it mid-review would mean the
    // reviewer approves something other than what ends up published.
    if (course.status === STATUS.PENDING) {
      return res.status(409).json({
        success: false,
        message: "This course is under review. Withdraw it first to make changes.",
      });
    }

    const editable = [
      "title", "description", "shortDescription", "language", "category",
      "difficulty", "thumbnail", "estimatedHours", "tags",
    ];
    for (const field of editable) {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    }

    // A rejected course returns to draft as soon as it is edited, which is the
    // signal that the creator has acted on the feedback.
    if (course.status === STATUS.REJECTED) {
      course.status = STATUS.DRAFT;
    }

    await course.save();
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/creator/courses/:courseId/pricing  { priceCents, includedInPro }
export const setPricing = async (req, res) => {
  try {
    const course = req.course;
    const { priceCents, includedInPro } = req.body || {};

    if (priceCents !== undefined) {
      const cents = parseInt(priceCents, 10);
      if (!isValidCoursePrice(cents)) {
        return res.status(400).json({
          success: false,
          message:
            `Price must be ${formatMoney(COURSE_PRICE.FREE)}, or between ` +
            `${formatMoney(COURSE_PRICE.MIN_PAID_CENTS)} and ${formatMoney(COURSE_PRICE.MAX_PAID_CENTS)}.`,
        });
      }

      // Repricing never affects existing purchases — those are recorded on the
      // Order at the price the learner agreed to.
      course.priceCents = cents;
    }

    if (includedInPro !== undefined) {
      const optingOut = course.includedInPro && !includedInPro;
      if (optingOut) {
        // 30 days' notice, so a creator cannot accrue revenue-pool credit for a
        // period and then withdraw the content before it is distributed.
        course.proOptOutEffectiveAt = new Date(Date.now() + 30 * 86400000);
      } else {
        course.includedInPro = Boolean(includedInPro);
        course.proOptOutEffectiveAt = null;
      }
    }

    await course.save();

    res.status(200).json({
      success: true,
      data: {
        course,
        split: course.priceCents > 0
          ? splitSale(course.priceCents, req.creatorProfile?.platformFeeBps)
          : null,
        proOptOutEffectiveAt: course.proOptOutEffectiveAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/creator/courses/:courseId/:action  (submit|withdraw|publish|unpublish)
export const runTransition = async (req, res) => {
  try {
    const { action } = req.params;
    if (!["submit", "withdraw", "publish", "unpublish"].includes(action)) {
      return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    const course = await lifecycle.transition(req.course, action, req.user);
    res.status(200).json({
      success: true,
      message: `Course ${action}ed.`,
      data: { course, availableActions: lifecycle.availableActions(course, req.user.role) },
    });
  } catch (error) {
    const status = error.status ?? 500;
    if (status === 500) console.error("Course transition failed:", error);
    res.status(status).json({
      success: false,
      message: error.message,
      // Submission failures list exactly what is missing.
      ...(error.problems ? { problems: error.problems } : {}),
    });
  }
};

// GET /api/creator/courses/:courseId/readiness — what's blocking submission
export const getReadiness = async (req, res) => {
  try {
    const result = await lifecycle.validateForSubmission(req.course);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/creator/courses/:courseId/sales
export const getCourseSales = async (req, res) => {
  try {
    const [orders, summary] = await Promise.all([
      Order.find({ course: req.course._id, status: { $in: ["paid", "partially_refunded"] } })
        .populate("user", "name")
        .sort({ paidAt: -1 })
        .limit(50)
        .lean(),
      Order.revenueSummary({ course: req.course._id }),
    ]);
    res.status(200).json({ success: true, data: { orders, summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/creator/courses/:courseId
export const deleteCourse = async (req, res) => {
  try {
    const course = req.course;

    // Anything ever sold must remain resolvable, otherwise a buyer's
    // entitlement points at nothing and their receipt has no subject.
    const sales = await Order.countDocuments({ course: course._id, status: "paid" });
    if (sales > 0) {
      return res.status(409).json({
        success: false,
        message:
          `This course has ${sales} sale(s) and cannot be deleted. Unpublish it instead.`,
      });
    }
    if (course.status === STATUS.PUBLISHED) {
      return res.status(409).json({
        success: false,
        message: "Unpublish the course before deleting it.",
      });
    }

    const sections = await CourseSection.find({ course: course._id }).select("_id");
    await CourseLesson.deleteMany({ section: { $in: sections.map((s) => s._id) } });
    await CourseSection.deleteMany({ course: course._id });
    await course.deleteOne();

    res.status(200).json({ success: true, message: "Course deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  listMyCourses,
  createCourse,
  updateCourse,
  setPricing,
  runTransition,
  getReadiness,
  getCourseSales,
  deleteCourse,
};
