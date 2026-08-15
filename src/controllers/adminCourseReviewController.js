// Admin review of submitted courses.
//
// The reviewer's job is to decide whether content is fit to sell. To make that
// decision cheap, the detail endpoint runs every code example in the course
// through the sandbox — the same verified-generation machinery used for AI
// content. A course whose examples do not run should not be approved, and a
// human should not have to discover that by hand.

import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import AuditLog from "../models/AuditLog.js";
import lifecycle from "../services/billing/courseLifecycleService.js";
import executionVerifier from "../services/ai/executionVerifier.js";
import { splitSale, formatMoney } from "../config/monetization.js";

// GET /api/admin/course-review
export const getQueue = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(50, parseInt(req.query.limit ?? "20", 10));
    const result = await lifecycle.reviewQueue({ page, limit });

    const counts = await Course.aggregate([
      { $match: { ownership: "marketplace" } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...result,
        counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/course-review/:courseId
export const getCourseForReview = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("instructor", "name email")
      .lean();
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const sections = await CourseSection.find({ course: course._id })
      .sort({ order: 1 })
      .lean();
    const lessons = await CourseLesson.find({
      section: { $in: sections.map((s) => s._id) },
    })
      .sort({ order: 1 })
      .lean();

    const split =
      course.priceCents > 0 ? splitSale(course.priceCents) : null;

    res.status(200).json({
      success: true,
      data: {
        course,
        sections: sections.map((s) => ({
          ...s,
          lessons: lessons.filter((l) => String(l.section) === String(s._id)),
        })),
        stats: {
          sectionCount: sections.length,
          lessonCount: lessons.length,
          codeExampleCount: lessons.reduce(
            (n, l) => n + (l.codeExamples?.length ?? 0),
            0
          ),
          priceLabel: course.priceCents > 0 ? formatMoney(course.priceCents) : "Free",
          split,
        },
        availableActions: lifecycle.availableActions(course, "admin"),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/course-review/:courseId/verify-code
// Executes every code example in the course and reports which fail.
export const verifyCourseCode = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).select("_id title language");
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const sections = await CourseSection.find({ course: course._id }).select("_id title order").lean();
    const lessons = await CourseLesson.find({ section: { $in: sections.map((s) => s._id) } })
      .select("title codeExamples section order")
      .lean();

    const results = [];
    let passed = 0;
    let failed = 0;
    let unjudged = 0;

    for (const lesson of lessons) {
      for (const [i, ex] of (lesson.codeExamples ?? []).entries()) {
        if (!ex?.code?.trim()) continue;

        const verdict = await executionVerifier.verify(ex.code, course.language, {
          input: ex.input ?? "",
          // Only compare output when the author declared one.
          expectedOutput: ex.expectedOutput || null,
        });

        // A sandbox outage is not the author's fault, so it is reported
        // separately rather than counted against the course.
        if (verdict.verdict === "executor_unavailable") unjudged += 1;
        else if (verdict.ok) passed += 1;
        else failed += 1;

        results.push({
          lesson: lesson.title,
          exampleIndex: i,
          title: ex.title ?? `Example ${i + 1}`,
          verdict: verdict.verdict,
          ok: verdict.ok,
          diagnostic: verdict.diagnostic?.slice(0, 400) ?? null,
        });
      }
    }

    const judged = passed + failed;
    res.status(200).json({
      success: true,
      data: {
        total: results.length,
        passed,
        failed,
        unjudged,
        passRate: judged ? Number(((passed / judged) * 100).toFixed(1)) : null,
        // The recommendation a reviewer acts on.
        recommendation:
          judged === 0
            ? "No runnable examples found."
            : failed === 0
            ? "All code examples run. Safe to approve on this criterion."
            : `${failed} example(s) fail to run. Reject with the diagnostics below.`,
        results,
      },
    });
  } catch (error) {
    console.error("Course code verification failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/course-review/:courseId/:action  (approve|reject|suspend|reinstate)
export const decide = async (req, res) => {
  try {
    const { action } = req.params;
    if (!["approve", "reject", "suspend", "reinstate"].includes(action)) {
      return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const updated = await lifecycle.transition(course, action, req.user, {
      reason: req.body?.reason,
    });

    await AuditLog.record(req, `course_${action}`, "Course", course._id, {
      reason: req.body?.reason ?? null,
      title: course.title,
    });

    res.status(200).json({
      success: true,
      message: `Course ${action}ed.`,
      data: updated,
    });
  } catch (error) {
    const status = error.status ?? 500;
    if (status === 500) console.error("Course review decision failed:", error);
    res.status(status).json({ success: false, message: error.message });
  }
};

export default { getQueue, getCourseForReview, verifyCourseCode, decide };
