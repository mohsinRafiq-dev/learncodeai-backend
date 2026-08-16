// Public marketplace catalogue.
//
// Separate from courseController, which serves the platform's own curriculum.
// Creator-published courses have different concerns: a price, an author to
// attribute, and an ownership state that decides whether a Pro subscription
// already covers them.

import Course from "../models/Course.js";
import CourseSection from "../models/CourseSection.js";
import CourseLesson from "../models/CourseLesson.js";
import CreatorProfile from "../models/CreatorProfile.js";
import Order from "../models/Order.js";
import {
  canAccessCourse,
  entitledCourseIds,
  hasActiveSubscription,
} from "../services/billing/entitlementService.js";

const LIST_FIELDS =
  "title shortDescription language category difficulty thumbnail priceCents " +
  "includedInPro ownership estimatedHours totalLessons enrollmentCount " +
  "averageRating ratingCount salesCount publishedAt instructor tags";

// GET /api/marketplace — browse published courses
export const browse = async (req, res) => {
  try {
    const {
      language,
      category,
      difficulty,
      search = "",
      price, // "free" | "paid" | "included"
      sort = "popular",
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(48, parseInt(req.query.limit ?? "12", 10));

    // Only published, non-archived courses are ever visible here. A draft or
    // in-review course must not leak into a public listing.
    const query = { status: "published", isArchived: { $ne: true } };

    if (language) query.language = String(language).toLowerCase();
    if (category) query.category = String(category).toLowerCase();
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();

    if (price === "free") query.priceCents = 0;
    else if (price === "paid") query.priceCents = { $gt: 0 };
    else if (price === "included") query.includedInPro = true;

    if (search.trim()) {
      const rx = { $regex: search.trim(), $options: "i" };
      query.$or = [{ title: rx }, { shortDescription: rx }, { tags: rx }];
    }

    const sortBy = {
      popular: { enrollmentCount: -1, averageRating: -1 },
      newest: { publishedAt: -1 },
      rating: { averageRating: -1, ratingCount: -1 },
      price_low: { priceCents: 1 },
      price_high: { priceCents: -1 },
    }[sort] ?? { enrollmentCount: -1 };

    const [courses, total, owned] = await Promise.all([
      Course.find(query)
        .select(LIST_FIELDS)
        .populate("instructor", "name profilePicture")
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
      // One query for the viewer's entitlements rather than one per card.
      req.user ? entitledCourseIds(req.user._id) : Promise.resolve([]),
    ]);

    const ownedSet = new Set(owned);
    const isPro = hasActiveSubscription(req.user);

    const decorated = courses.map((c) => {
      const isOwned = ownedSet.has(String(c._id));
      const coveredByPro = isPro && (c.ownership === "platform" || c.includedInPro);
      const isFree = (c.priceCents ?? 0) === 0;

      return {
        ...c,
        // Precomputed so each card renders one unambiguous state rather than
        // the browser re-deriving access rules that live on the server.
        access: {
          owned: isOwned,
          coveredByPro,
          isFree,
          canOpen: isOwned || coveredByPro || isFree,
          requiresPurchase: !isOwned && !coveredByPro && !isFree,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: {
        courses: decorated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Marketplace browse failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marketplace/:courseId — public course detail / sales page
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("instructor", "name profilePicture bio")
      .lean();

    if (!course || course.status !== "published" || course.isArchived) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const sections = await CourseSection.find({ course: course._id })
      .select("title description order estimatedHours")
      .sort({ order: 1 })
      .lean();

    const lessons = await CourseLesson.find({
      section: { $in: sections.map((s) => s._id) },
    })
      .select("title duration order section isPreview")
      .sort({ order: 1 })
      .lean();

    const [access, creatorProfile, salesSummary] = await Promise.all([
      canAccessCourse(req.user, course),
      CreatorProfile.findOne({ user: course.instructor?._id })
        .select("application.displayName application.headline stats")
        .lean(),
      Order.revenueSummary({ course: course._id }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        course,
        // Curriculum is always listed — the outline is the sales pitch. Lesson
        // bodies stay behind the paywall; only titles and durations appear here.
        curriculum: sections.map((s) => ({
          ...s,
          lessons: lessons
            .filter((l) => String(l.section) === String(s._id))
            .map(({ title, duration, order, isPreview }) => ({
              title,
              duration,
              order,
              isPreview: Boolean(isPreview),
            })),
        })),
        creator: creatorProfile
          ? {
              displayName: creatorProfile.application?.displayName,
              headline: creatorProfile.application?.headline,
              publishedCourses: creatorProfile.stats?.publishedCourses ?? 0,
              totalStudents: creatorProfile.stats?.totalSales ?? 0,
            }
          : null,
        access: {
          canOpen: access.allowed,
          via: access.via,
          reason: access.reason,
          requiresPurchase:
            !access.allowed &&
            (course.priceCents ?? 0) > 0 &&
            course.ownership === "marketplace",
        },
        stats: {
          lessonCount: lessons.length,
          sectionCount: sections.length,
          students: salesSummary.orders ?? course.enrollmentCount ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("Marketplace course fetch failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marketplace/meta/filters — facets for the browse UI
export const getFilters = async (_req, res) => {
  try {
    const match = { status: "published", isArchived: { $ne: true } };
    const [languages, categories, priceRange] = await Promise.all([
      Course.aggregate([{ $match: match }, { $group: { _id: "$language", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
      Course.aggregate([{ $match: match }, { $group: { _id: "$category", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
      Course.aggregate([
        { $match: { ...match, priceCents: { $gt: 0 } } },
        { $group: { _id: null, min: { $min: "$priceCents" }, max: { $max: "$priceCents" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        languages: languages.map((l) => ({ value: l._id, count: l.n })),
        categories: categories.map((c) => ({ value: c._id, count: c.n })),
        priceRange: priceRange[0] ?? { min: 0, max: 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { browse, getCourse, getFilters };
